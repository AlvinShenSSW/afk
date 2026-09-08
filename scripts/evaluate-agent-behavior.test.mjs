import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fixtureGit, createFixture } from '../lib/evaluation/scenarios.mjs';
import { supportVisible, exportSupport, runBounded, parseHostEvents, hostArguments,
  verifyReportCarryforward, prepareProductEvidence, inspectProductEvidence, createEvaluation } from './evaluate-agent-behavior.mjs';

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
