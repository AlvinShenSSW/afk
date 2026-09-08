import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fixtureGit, createFixture } from '../lib/evaluation/scenarios.mjs';
import { supportVisible, exportSupport, runBounded, parseHostEvents, hostArguments,
  verifyReportCarryforward, prepareProductEvidence, inspectProductEvidence, createEvaluation, runPrerequisite, runTrialSlice, aggregateEvaluation } from './evaluate-agent-behavior.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
function temporary(fn) {
  const root = mkdtempSync(join(tmpdir(), 'afk-evaluator-runner-'));
  return Promise.resolve().then(() => fn(root)).finally(() => rmSync(root, { recursive: true, force: true }));
}
function commit(root, message) { fixtureGit(root, ['add', '.']); fixtureGit(root, ['commit', '-qm', message]); return fixtureGit(root, ['rev-parse', 'HEAD']); }

test('identical support visibility excludes copied scorers, tests, designs and reports', () => {
  for (const path of ['lib/evaluation/scenarios.mjs','scripts/evaluate-agent-behavior.mjs',
    'scripts/evaluate-agent-behavior.test.mjs','lib/gate/protocol.test.mjs','skills/afk-agent-relay/tests/redact.test.mjs',
    'docs/designs/specs/issue-98-behavior-evaluations.md','docs/evaluations/issue-98-pilot.md']) assert.equal(supportVisible(path), false, path);
  for (const path of ['skills/afk/SKILL.md','skills/afk-claude-review/claude-gate.mjs','lib/gate/protocol.mjs',
    'scripts/check-review-receipts.mjs','docs/designs/specs/issue-96-review-context.md']) assert.equal(supportVisible(path), true, path);
});

test('production support preserves original paths/bytes and refuses a second export', () => temporary(async (root) => {
  const source = join(root, 'source'); mkdirSync(source); fixtureGit(source, ['init','-q','-b','fixture']);
  for (const [path, text] of [['skills/afk/SKILL.md','exact production bytes\n'], ['lib/evaluation/scenarios.mjs','secret scorer\n']]) {
    mkdirSync(join(source, path, '..'), { recursive: true }); writeFileSync(join(source, path), text);
  }
  const sha = commit(source, 'seed'); const output = join(root, 'support');
  const manifest = exportSupport({ repository: source, revision: sha, directory: output });
  assert.deepEqual(Object.keys(manifest.files), ['skills/afk/SKILL.md']);
  assert.equal(readFileSync(join(output,'skills/afk/SKILL.md'),'utf8'),'exact production bytes\n');
  assert.throws(() => readFileSync(join(output,'lib/evaluation/scenarios.mjs')));
  assert.throws(() => exportSupport({ repository: source, revision: sha, directory: output }));
}));

test('report-only R carries C evidence without claiming a new trial; code edits cannot', () => temporary(async (root) => {
  fixtureGit(root, ['init','-q','-b','fixture']); writeFileSync(join(root,'code.mjs'),'export const value=1;\n');
  const c = commit(root,'implementation'); mkdirSync(join(root,'docs/evaluations'), { recursive: true });
  writeFileSync(join(root,'docs/evaluations/issue-98-pilot.md'),'# Aggregate\n'); const r = commit(root,'report');
  assert.equal(verifyReportCarryforward({ repository: root, implementation: c, reportHead: r }).equivalent, true);
  writeFileSync(join(root,'code.mjs'),'export const value=2;\n'); const changed = commit(root,'code');
  assert.equal(verifyReportCarryforward({ repository: root, implementation: c, reportHead: changed }).equivalent, false);
}));

test('runner cleans a lingering descendant on normal exit and enforces output/timeout bounds', {
  skip: process.platform === 'win32' ? 'POSIX process-group fixture required' : false,
}, () => temporary(async (root) => {
  const script = join(root,'child.mjs');
  writeFileSync(script, `import {spawn} from 'node:child_process'; const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'}); console.log(child.pid); child.unref();`);
  const normal = await runBounded(process.execPath,[script],{ cwd:root, timeoutMs:2000, maxBytes:4096, graceMs:150 });
  assert.equal(normal.status,'completed'); assert.equal(normal.cleanup,true);
  const timed = await runBounded(process.execPath,['-e','setInterval(()=>{},1000)'],{cwd:root,timeoutMs:50,maxBytes:4096,graceMs:50});
  assert.equal(timed.status,'timeout'); assert.equal(timed.cleanup,true);
  const flood = await runBounded(process.execPath,['-e',"process.stdout.write('x'.repeat(100000));setInterval(()=>{},1000)"],{cwd:root,timeoutMs:2000,maxBytes:128,graceMs:50});
  assert.equal(flood.status,'output-limit'); assert.ok(Buffer.byteLength(flood.stdout)<=128); assert.equal(flood.cleanup,true);
}));

test('JSONL parsing preserves real session continuity, usage and observed file edits', () => {
  const data = [{type:'thread.started',thread_id:'session-id'},{type:'item.completed',item:{type:'file_change',changes:[{path:'src/reserve.mjs'}]}},
    {type:'turn.completed',usage:{input_tokens:20,output_tokens:4}}].map(JSON.stringify).join('\n');
  const result = parseHostEvents(data);
  assert.equal(result.sessionId,'session-id'); assert.equal(result.eventsComplete,true);
  assert.equal(result.usage.output_tokens,4); assert.deepEqual(result.productEdits,['src/reserve.mjs']);
  assert.equal(parseHostEvents(data+'\n{').eventsComplete,false);
  assert.equal(parseHostEvents('{"type":"turn.failed"}\n').failed,true);
});

test('host argv keeps named profile and actual-ID resume without legacy sandbox or user config', () => {
  const args = hostArguments({ workspace:'/fixture',support:'/production',schema:'/schema.json',lastMessage:'/last.json',model:'gpt-6-astra',resume:'recorded-id',toolEnv:{PATH:'/bin'} });
  assert.equal(args[0],'exec'); assert.equal(args[1],'resume');
  assert.ok(args.includes('recorded-id')); assert.ok(args.includes('--ignore-user-config'));
  assert.equal(args.includes('--last'),false); assert.equal(args.includes('--ephemeral'),false);
  assert.equal(args.includes('--sandbox'),false); assert.ok(args.some((x) => x==='default_permissions="afk-eval"'));
});

for (const variant of ['missing','stale']) test(`S6 ${variant} uses actual context validation and delivered packet`, () => temporary(async (root) => {
  const fixture = createFixture({directory:join(root,'workspace'),scenarioId:'S6'});
  const setup = prepareProductEvidence({fixture,pluginRoot:repo,variant});
  assert.equal(setup.initialRejected,true); assert.equal(setup.invalidProviderCalls,0);
  const result = spawnSync(process.execPath,[join(fixture.directory,'.afk/local-review.mjs')],{cwd:fixture.directory,encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
  const proof = inspectProductEvidence({fixture,pluginRoot:repo,setup});
  assert.equal(proof.contextDelivered,true);
}));

for (const variant of ['revision','profile']) test(`S7 ${variant} uses actual receipt publication and read-only checker`, () => temporary(async (root) => {
  const fixture = createFixture({directory:join(root,'workspace'),scenarioId:'S7'});
  const setup = prepareProductEvidence({fixture,pluginRoot:repo,variant});
  assert.equal(setup.initialRejected,true);
  const result = spawnSync(process.execPath,[join(fixture.directory,'.afk/local-review.mjs')],{cwd:fixture.directory,encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
  const proof = inspectProductEvidence({fixture,pluginRoot:repo,setup});
  assert.equal(proof.finalCheck.consistent,true); assert.equal(proof.finalCheck.allRequiredApproved,true);
  assert.equal(proof.originalReceiptPreserved,true);
}));

test('preparation has no host invocation and requires an immutable selected revision', () => temporary(async (root) => {
  assert.throws(() => createEvaluation({ repository:repo, directory:join(root,'evaluation'), candidate:'HEAD',baseline:'HEAD' }), /immutable/);
}));

test('local S8 records the actual unavailable helper without a reviewer call', () => temporary(async (root) => {
  const fixture=createFixture({directory:join(root,'workspace'),scenarioId:'S8'});
  const setup=prepareProductEvidence({fixture,pluginRoot:repo});
  assert.equal(setup.unavailableObserved,true); assert.equal(setup.providerCalls,0);
  assert.doesNotMatch(readFileSync(join(fixture.directory,'.afk/local-review.mjs'),'utf8'), /"(?:HOME|CODEX_HOME)":/);
}));

test('baseline production export supports the paired actual local review without exposing answers', () => temporary(async (root) => {
  const baseline='f56361f40e7fcdcae602d08739bc3e928d4d57d7';
  const support=join(root,'support'); const manifest=exportSupport({repository:repo,revision:baseline,directory:support});
  assert.ok(Object.keys(manifest.files).length>10);
  const fixture=createFixture({directory:join(root,'workspace'),scenarioId:'S3'});
  prepareProductEvidence({fixture,pluginRoot:support});
  const result=spawnSync(process.execPath,[join(fixture.directory,'.afk/local-review.mjs')],{cwd:fixture.directory,encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr); assert.match(result.stdout,/APPROVE/);
}));

test('synthetic CLI controls opt-in, exact resume, unavailable accounting and no retries', () => temporary(async (root) => {
  const repository=join(root,'source'); mkdirSync(repository); fixtureGit(repository,['init','-q','-b','fixture']);
  mkdirSync(join(repository,'skills/afk'),{recursive:true}); writeFileSync(join(repository,'skills/afk/SKILL.md'),'# Synthetic production skill\n');
  const revision=commit(repository,'seed'); const directory=join(root,'evaluation');
  createEvaluation({repository,directory,candidate:revision,baseline:revision});
  const script=join(root,'fake-host.mjs'), binary=join(root,'fake-host.sh');
  writeFileSync(script,`import {writeFileSync,readFileSync} from 'node:fs';readFileSync(0);const args=process.argv.slice(2);const last=args[args.indexOf('--output-last-message')+1];writeFileSync(last,JSON.stringify({ready:true,consumedCycles:0,findings:[],summary:'Synthetic test only',checks:[]}));console.log(JSON.stringify({type:'thread.started',thread_id:'test-session'}));console.log(JSON.stringify({type:'turn.completed',usage:{output_tokens:1}}));`);
  writeFileSync(binary,`#!/bin/sh\nexec '${process.execPath}' '${script}' "$@"\n`); chmodSync(binary,0o700);
  await assert.rejects(runPrerequisite({directory,id:'P01',codex:binary}),/explicit/);
  assert.equal(aggregateEvaluation(directory).hostLaunches,0);
  await runPrerequisite({directory,id:'P01',codex:binary,execute:true});
  await runPrerequisite({directory,id:'P02',codex:binary,execute:true});
  const first=JSON.parse(readFileSync(join(directory,'artifacts/P01/result.json'),'utf8'));
  const second=JSON.parse(readFileSync(join(directory,'artifacts/P02/result.json'),'utf8'));
  assert.equal(second.resumedFrom,first.sessionId); assert.equal(second.sessionId,first.sessionId);
  assert.equal(JSON.parse(readFileSync(join(directory,'artifacts/P02/launch.json'),'utf8')).args.includes('test-session'),true);
  await runPrerequisite({directory,id:'P03',codex:join(root,'absent-cli'),execute:true});
  assert.equal(JSON.parse(readFileSync(join(directory,'artifacts/P03/result.json'),'utf8')).status,'unavailable');
  await assert.rejects(runPrerequisite({directory,id:'P03',codex:binary,execute:true}));
  await assert.rejects(runPrerequisite({directory,id:'P04',codex:binary,execute:true}),/only P01/);
  await assert.rejects(runTrialSlice({directory,ids:['T01'],codex:binary,execute:true}));
  assert.equal(readdirSync(join(directory,'launches')).filter((p)=>p.endsWith('.started.json')).length,3);
  assert.equal(aggregateEvaluation(directory).rows.every((r)=>r.deterministic==='not-run'),true);
}));

test('synthetic end-to-end runner retains truthful success and third-repair failure artifacts', () => temporary(async (root) => {
  const repository=join(root,'source'); mkdirSync(repository); fixtureGit(repository,['init','-q','-b','fixture']);
  mkdirSync(join(repository,'skills/afk'),{recursive:true}); writeFileSync(join(repository,'skills/afk/SKILL.md'),'# Synthetic production skill\n');
  const revision=commit(repository,'seed'), directory=join(root,'evaluation');
  createEvaluation({repository,directory,candidate:revision,baseline:revision});
  const script=join(root,'fake-host.mjs'), binary=join(root,'fake-host.sh');
  writeFileSync(script,`import {readFileSync,writeFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2), input=readFileSync(0,'utf8');
if(args[0]==='sandbox'){const r=spawnSync(process.execPath,['--input-type=module'],{input,encoding:'utf8'});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??1)}
const last=args[args.indexOf('--output-last-message')+1], exhausted=process.cwd().includes('/T10/');
const decision={ready:!exhausted,consumedCycles:exhausted?2:0,findings:exhausted?[{id:'F3-ZERO',disposition:'open',evidence:'Original zero case still fails'}]:[{id:'F1-ZERO',disposition:'refuted',evidence:'TASK and A3 permit zero'}],summary:'Synthetic test only',checks:['original acceptance']};
writeFileSync(last,JSON.stringify(decision));console.log(JSON.stringify({type:'thread.started',thread_id:'test-session'}));
if(exhausted&&!args.includes('resume'))console.log(JSON.stringify({type:'item.completed',item:{type:'file_change',changes:[{path:'src/reserve.mjs'}]}}));
console.log(JSON.stringify({type:'turn.completed',usage:{output_tokens:1}}));`);
  writeFileSync(binary,`#!/bin/sh\nexec '${process.execPath}' '${script}' "$@"\n`); chmodSync(binary,0o700);
  for(const id of ['P01','P02','P03']) await runPrerequisite({directory,id,codex:binary,execute:true});
  writeFileSync(join(directory,'qualification.json'),JSON.stringify({version:1,evidence:'Synthetic unit control, not host evidence',execBoundary:true,resumeBoundary:true,supportVisibility:true,networkDenied:true,outsideDenied:true,toolSurface:true,environmentClean:true,alternateAvailable:true}));
  const results=await runTrialSlice({directory,ids:['T01','T10'],codex:binary,execute:true});
  assert.equal(results[0].deterministic,'pass');
  assert.equal(results[1].deterministic,'fail'); assert.equal(results[1].metrics.excessRepair,true);
  assert.equal(JSON.parse(readFileSync(join(directory,'trials/T10/observed.json'),'utf8')).invocations.length,2);
  assert.equal(aggregateEvaluation(directory).hostLaunches,6);
  assert.equal(aggregateEvaluation(directory).behavioralAcceptanceComplete,false);
}));
