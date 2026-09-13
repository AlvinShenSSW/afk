import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { prepare, probe, budgetRequest, inspectPrepared, inspectQualification } from './qualify-direction-transport.mjs';
import { completeResult, FIXTURE_ROOT } from './fixtures/direction-transport/setup.mjs';
import { canonicalBytes, digestBytes } from '../lib/gate/review-receipt.mjs';
import { contentDigest } from '../lib/direction/schema.mjs';
import { readDirectionState, appendDirectionRecord } from '../lib/direction/state.mjs';
import { LIMITS, checkAudit, validateModelResult, terminalRequest, qualificationEvidence, readJson,
  validateQualification, RUNTIME_FILES } from '../lib/direction/audit.mjs';
import { recordExchange, fixedExchange } from '../lib/direction/transport.mjs';

function fixture(t) {
  const temp = realpathSync(mkdtempSync(join(tmpdir(), 'afk-direction-final-'))); t.after(() => rmSync(temp, { recursive: true, force: true }));
  const prepared = join(temp, 'prepared'); const metadata = prepare({ fixtureRoot: FIXTURE_ROOT, out: prepared });
  const { input } = inspectPrepared(prepared); return { prepared, metadata, input, budget: budgetRequest(prepared, 'physical-final-call') };
}
function envelope(packet, mutate = () => {}) {
  const value = { model: 'deepseek-flash', choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(completeResult(packet)) } }] };
  mutate(value); return value;
}
const response = value => new Response(JSON.stringify(value), { status: 200 });
const env = { DEEPSEEK_API_KEY: 'fixture-key' };
async function success(f) {
  return probe({ prepared: f.prepared, budget: f.budget, env,
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body); assert.equal(body.messages.length, 2); assert.equal(Object.hasOwn(body, 'tools'), false);
      assert.equal(body.tool_choice, 'none'); assert.equal(body.thinking.type, 'disabled'); assert.equal(options.redirect, 'error');
      assert.equal(options.body, f.input.request); return response(envelope(f.input.packet));
    } });
}

test('final qualification traverses actual packet, wire, COMPLETE result and terminal with one physical-call cross-reference', async t => {
  const f = fixture(t); assert.equal(readDirectionState(f.metadata).accounting.charged, 0);
  const observed = await success(f); assert.equal(observed.classification, 'CANDIDATE-PASS'); assert.equal(observed.requests, 1);
  assert.equal(observed.physicalCallId, f.budget.physicalCallId); assert.equal(observed.qualification, 'NOT_QUALIFIED_BY_HELPER');
  assert.equal(observed.actualInvocation, 'DRIVER_JUDGMENT_REQUIRED');
  assert.equal(readDirectionState(f.metadata).accounting.charged, 1); assert.equal(readDirectionState(f.metadata).accounting.reserved, 0);
  assert.equal(inspectQualification(f.prepared).status, 'ARTIFACT_CANDIDATE_PASS');
  const checked = checkAudit({ ...f.metadata, stage: 'endpoint', endpointId: f.input.packet.endpoint.id });
  assert.equal(checked.protocolValid, true); assert.equal(checked.outcome, 'COMPLETE'); assert.equal(checked.directionSatisfied, false);
  assert.deepEqual(checked.reasons, ['qualification_pending']);
  await assert.rejects(probe({ prepared: f.prepared, budget: f.budget, env, fetchImpl: async () => assert.fail('repeat dispatch') }));
});

for (const kind of ['outcome', 'findings', 'coverage', 'malformed']) {
  test(`D111-1 ${kind} substitution rejected at result, endpoint and qualification consumers`, async t => {
    const f = fixture(t); await success(f);
    const original = readJson(f.input.directory, 'result.json'); const wire = readJson(f.input.directory, 'response.json');
    const terminalPath = join(f.metadata.cwd, '.afk', 'runs', f.metadata.runId,
      readDirectionState(f.metadata).attempts[0].terminal.path);
    const terminalRecord = JSON.parse(readFileSync(terminalPath, 'utf8'));
    const payload = completeResult(f.input.packet); const retained = structuredClone(payload);
    if (kind === 'outcome') retained.outcome = 'CORRECT-COURSE';
    if (kind === 'findings') { retained.outcome = 'CORRECT-COURSE'; retained.findings = [{ id: 'F1', requirementIds: ['O1'],
      evidence: [payload.coverage[0].source], explanation: 'A correction is needed.', recommendedAction: 'Recheck source coverage.' }]; }
    if (kind === 'coverage') retained.coverage[0].explanation = 'Another valid explanation.';
    validateModelResult(payload, f.input.packet); if (kind !== 'malformed') validateModelResult(retained, f.input.packet);
    wire.envelope.choices[0].message.content = kind === 'malformed' ? '{' : canonicalBytes(retained);
    original.observation.response.digest = contentDigest(wire);
    writeFileSync(join(f.input.directory, 'response.json'), canonicalBytes(wire));
    writeFileSync(join(f.input.directory, 'result.json'), canonicalBytes(original));
    terminalRecord.payload.terminal.result.digest = contentDigest(original);
    writeFileSync(terminalPath, canonicalBytes(terminalRecord));
    assert.equal(readDirectionState(f.metadata).status, 'valid');
    for (const stage of ['result', 'endpoint']) {
      const checked = checkAudit({ ...f.metadata, stage, endpointId: f.input.packet.endpoint.id });
      assert.equal(checked.protocolValid, false); assert.equal(checked.outcome, null); assert.equal(checked.directionSatisfied, false);
      assert.equal(checked.status, 'invalid'); assert.match(checked.reasons[0], /response_payload_mismatch|invalid_result_json/);
    }
    assert.throws(() => qualificationEvidence(f.metadata), /response_payload_mismatch|invalid_result_json/);
    assert.throws(() => inspectQualification(f.prepared), /response_payload_mismatch|invalid_result_json/);
  });
}

for (const [name, mutate, reason] of [
  ['identity', x => x.model = 'different', 'identity_mismatch'],
  ['missing identity', x => delete x.model, 'identity_mismatch'],
  ['length', x => x.choices[0].finish_reason = 'length', 'incomplete_finish'],
  ['tools', x => x.choices[0].message.tool_calls = [], 'unexpected_tool_call'],
  ['function', x => x.choices[0].message.function_call = {}, 'unexpected_tool_call'],
  ['delta function', x => x.choices[0].delta = { function_call: { name: 'unexpected', arguments: '{}' } }, 'unexpected_tool_call'],
  ['delta tools', x => x.choices[0].delta = { tool_calls: [] }, 'unexpected_tool_call'],
  ['extra choice', x => x.choices.push(x.choices[0]), 'invalid_choices'],
  ['empty', x => x.choices[0].message.content = '', 'empty'],
  ['malformed', x => x.choices[0].message.content = '{', 'invalid_result_json'],
  ['binding', x => { const p = JSON.parse(x.choices[0].message.content); p.targetDigest = 'a'.repeat(64); x.choices[0].message.content = JSON.stringify(p); }, 'result_binding'],
]) {
  test(`fixed exchange retains ${name} refusal and no semantic approval`, async t => {
    const f = fixture(t); const observed = await fixedExchange({ packet: f.input.packet, request: f.input.request, env,
      fetchImpl: async () => response(envelope(f.input.packet, mutate)) });
    assert.equal(observed.observation.reason, reason); assert.equal(observed.payload, null); assert.equal(observed.response.extraction, 'invalid');
    if (['tools', 'function', 'delta function', 'delta tools'].includes(name)) assert.equal(observed.observation.toolCallsPresent, true);
    assert.equal(observed.observation.usage.input, null);
  });
}

for (const name of ['dispatch.json', 'response.json', 'result.json', 'terminal-witness.txt']) {
  test(`every future output conflict (${name}) refuses before fetch and preserves bytes`, async t => {
    const f = fixture(t); writeFileSync(join(f.input.directory, name), 'original'); let calls = 0;
    await assert.rejects(probe({ prepared: f.prepared, budget: f.budget, env, fetchImpl: async () => { calls++; } }));
    assert.equal(calls, 0); assert.equal(readFileSync(join(f.input.directory, name), 'utf8'), 'original');
    assert.equal(readDirectionState(f.metadata).accounting.charged, 0);
  });
}

test('exclusive record arbitration allows one mocked dispatch from the same charged reservation', async t => {
  const f = fixture(t); const request = readJson(f.input.directory, 'reserve-request.json');
  assert.equal(appendDirectionRecord({ cwd: f.metadata.cwd, request }).status, 'published'); let calls = 0;
  const options = { ...f.metadata, env, fetchImpl: async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return response(envelope(f.input.packet)); } };
  const settled = await Promise.allSettled([recordExchange(options), recordExchange(options)]);
  assert.equal(calls, 1); assert.equal(settled.filter(x => x.status === 'fulfilled').length, 1);
});

test('a stalled response body is cancelled by the bounded HTTP abort', async t => {
  const f = fixture(t); let cancelled = false;
  const observed = await fixedExchange({ packet: f.input.packet, request: f.input.request, env, httpTimeoutMs: 20,
    fetchImpl: async () => new Response(new ReadableStream({ pull() { return new Promise(() => {}); }, cancel() { cancelled = true; } })) });
  assert.equal(observed.observation.classification, 'timeout'); assert.equal(cancelled, true); assert.equal(observed.payload, null);
});

test('response overflow is cancelled before parsing and never truncated into approval', async t => {
  const f = fixture(t); let cancelled = false;
  const observed = await fixedExchange({ packet: f.input.packet, request: f.input.request, env,
    fetchImpl: async () => new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(LIMITS.responseBytes + 1)); }, cancel() { cancelled = true; } })) });
  assert.equal(observed.observation.reason, 'response_limit'); assert.equal(cancelled, true); assert.equal(observed.response, null);
});

test('injectable redirect assertion retains its local classification', async t => {
  const f = fixture(t);
  const observed = await fixedExchange({ packet: f.input.packet, request: f.input.request, env,
    fetchImpl: async () => ({ status: 200, ok: true, redirected: true, url: 'https://other.invalid' }) });
  assert.equal(observed.observation.reason, 'unexpected_redirect'); assert.equal(observed.observation.classification, 'invalid');
});

test('missing credentials records a strict witness and consumed unavailable attempt without fetch', async t => {
  const f = fixture(t); let calls = 0;
  const result = await probe({ prepared: f.prepared, budget: f.budget, env: {}, fetchImpl: async () => { calls++; } });
  assert.equal(calls, 0); assert.equal(result.classification, 'INVALID');
  const state = readDirectionState(f.metadata); assert.equal(state.accounting.charged, 1);
  assert.equal(state.attempts[0].terminal.value.kind, 'unavailable'); assert.equal(state.attempts[0].terminal.value.result, null);
  const witness = readFileSync(join(f.input.directory, 'terminal-witness.txt'), 'utf8');
  assert.doesNotMatch(witness, /[a-f0-9]{64}/); assert.match(witness, /dispatch: not-started/);
});

test('qualification budget cannot reset prior consumption or claim a third slot', async t => {
  const f = fixture(t); let calls = 0;
  for (const mutation of [{ priorCalls: 0 }, { attemptOrdinal: 3 }, { priorElapsedMs: 0 }, { remainingMs: 300000 }]) {
    await assert.rejects(probe({ prepared: f.prepared, budget: { ...f.budget, ...mutation }, env, fetchImpl: async () => { calls++; } }), /qualification_budget/);
  }
  assert.equal(calls, 0);
});

test('terminal request remains independently repeatable without another dispatch', async t => {
  const f = fixture(t); const request = readJson(f.input.directory, 'reserve-request.json'); appendDirectionRecord({ cwd: f.metadata.cwd, request });
  await recordExchange({ ...f.metadata, env, fetchImpl: async () => response(envelope(f.input.packet)) });
  const a = terminalRequest({ ...f.metadata, operationId: 'terminal-first' });
  const b = terminalRequest({ ...f.metadata, operationId: 'terminal-rebuilt' });
  assert.deepEqual(a.payload, b.payload); assert.equal(readDirectionState(f.metadata).accounting.charged, 1);
});

test('S111-2 unknown accounting after reservation refuses dispatch but retains completed observations and terminals', async t => {
  const f = fixture(t); const request = readJson(f.input.directory, 'reserve-request.json');
  assert.equal(appendDirectionRecord({ cwd: f.metadata.cwd, request }).status, 'published');
  const reserveState = readDirectionState(f.metadata);
  assert.equal(reserveState.accounting.remaining, 0);
  const accountingRequest = (knowledge, operationId) => ({ version: 1, runId: f.metadata.runId, issueId: f.metadata.issueId, operationId,
    expectedHead: readDirectionState(f.metadata).head, operation: 'reconcile', payload: { accounting: { knowledge, priorAttempts: [],
      reason: 'Retained accounting evidence changed.', evidence: [f.input.packet.baseline.sources[0].evidence] } } });
  assert.equal(appendDirectionRecord({ cwd: f.metadata.cwd, request: accountingRequest('unknown', 'unknown-before') }).status, 'published');
  let calls = 0;
  await assert.rejects(recordExchange({ ...f.metadata, env, fetchImpl: async () => { calls++; } }), /accounting_unknown/);
  assert.equal(calls, 0);
  const before = checkAudit({ ...f.metadata, stage: 'pre-dispatch' }); assert.equal(before.status, 'unavailable');
  assert.deepEqual(before.reasons, ['accounting_unknown']);
  assert.equal(appendDirectionRecord({ cwd: f.metadata.cwd, request: accountingRequest('known', 'known-again') }).status, 'published');
  const completed = await recordExchange({ ...f.metadata, env, fetchImpl: async () => {
    calls++;
    assert.equal(appendDirectionRecord({ cwd: f.metadata.cwd, request: accountingRequest('unknown', 'unknown-during') }).status, 'published');
    return response(envelope(f.input.packet));
  } });
  assert.equal(calls, 1);
  assert.equal(completed.current, true);
  assert.equal(appendDirectionRecord({ cwd: f.metadata.cwd, request: terminalRequest({ ...f.metadata, operationId: 'terminal-after-unknown' }) }).status, 'published');
  for (const stage of ['result', 'endpoint']) {
    const checked = checkAudit({ ...f.metadata, stage, endpointId: f.input.packet.endpoint.id });
    assert.equal(checked.protocolValid, true); assert.equal(checked.outcome, 'COMPLETE'); assert.equal(checked.current, true);
    assert.ok(checked.reasons.includes('accounting_unknown')); assert.ok(checked.reasons.includes('qualification_pending'));
  }
  assert.equal(readDirectionState(f.metadata).accounting.charged, 1);
});

test('matching artifact compatibility permits only the current endpoint and invalid proof fails closed', async t => {
  const f = fixture(t); await success(f); const evidence = qualificationEvidence(f.metadata);
  const record = { version: 1, status: 'qualified', profileDigest: evidence.profileDigest,
    proof: { profile: evidence.profile, request: evidence.request, response: evidence.response, result: evidence.result,
      review: { reportPath: 'report.md', reportDigest: digestBytes('Synthetic test proof, not an actual call.'),
        executionRevision: f.input.packet.target.currentHead, evidenceSetDigest: evidence.evidenceSetDigest } } };
  validateQualification(record);
  for (const mutate of [x => x.proof.profile.runtimeFiles.pop(), x => x.proof.request.messageRoles.push('user'),
    x => x.proof.request.toolsPresent = true, x => x.proof.response.envelope.model = 'other',
    x => x.proof.result.phase = 'initial', x => x.proof.result.outcome = 'ON-TRACK', x => x.proof.review.reportDigest = null]) {
    const invalid = structuredClone(record); mutate(invalid); assert.throws(() => validateQualification(invalid));
  }
  const copy = join(dirname(f.prepared), 'production'); const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  for (const path of RUNTIME_FILES) { mkdirSync(dirname(join(copy, path)), { recursive: true }); copyFileSync(join(root, path), join(copy, path)); }
  writeFileSync(join(copy, 'lib/direction/qualification.json'), canonicalBytes(record));
  const audit = await import(pathToFileURL(join(copy, 'lib/direction/audit.mjs')));
  const valid = audit.checkAudit({ ...f.metadata, stage: 'endpoint', endpointId: f.input.packet.endpoint.id });
  assert.equal(valid.directionSatisfied, true); assert.equal(valid.status, 'valid');
  assert.equal(audit.checkAudit({ ...f.metadata, stage: 'result' }).directionSatisfied, false);
  assert.equal(audit.checkAudit({ ...f.metadata, stage: 'endpoint', endpointId: 'different' }).directionSatisfied, false);
  const state = readDirectionState(f.metadata);
  assert.equal(appendDirectionRecord({ cwd: f.metadata.cwd, request: { version: 1, runId: f.metadata.runId, issueId: f.metadata.issueId,
    operationId: 'accounting-unknown', expectedHead: state.head, operation: 'reconcile', payload: { accounting: {
      knowledge: 'unknown', priorAttempts: [], reason: 'Retained history needs reconciliation.', evidence: [f.input.packet.baseline.sources[0].evidence] } } } }).status, 'published');
  const stillObserved = audit.checkAudit({ ...f.metadata, stage: 'endpoint', endpointId: f.input.packet.endpoint.id });
  assert.equal(stillObserved.directionSatisfied, true); assert.equal(stillObserved.protocolValid, true);
  assert.equal(stillObserved.outcome, 'COMPLETE'); assert.ok(stillObserved.reasons.includes('accounting_unknown'));
  writeFileSync(join(f.metadata.cwd, 'artifact.mjs'), 'Changed candidate.\n');
  assert.equal(audit.checkAudit({ ...f.metadata, stage: 'endpoint', endpointId: f.input.packet.endpoint.id }).status, 'stale');
});

test('failed extraction cannot support a separately valid payload', async t => {
  const f = fixture(t); await success(f); const value = readJson(f.input.directory, 'result.json');
  const wire = readJson(f.input.directory, 'response.json'); wire.extraction = 'invalid'; wire.envelope.choices[0].message.content = 'diagnostic';
  value.observation.response.digest = contentDigest(wire);
  const state = readDirectionState(f.metadata); const path = join(f.metadata.cwd, '.afk', 'runs', f.metadata.runId, state.attempts[0].terminal.path);
  const terminal = JSON.parse(readFileSync(path, 'utf8')); terminal.payload.terminal.result.digest = contentDigest(value);
  writeFileSync(join(f.input.directory, 'response.json'), canonicalBytes(wire)); writeFileSync(join(f.input.directory, 'result.json'), canonicalBytes(value));
  writeFileSync(path, canonicalBytes(terminal));
  for (const stage of ['result', 'endpoint']) assert.deepEqual(checkAudit({ ...f.metadata, stage, endpointId: f.input.packet.endpoint.id }).reasons, ['response_extraction_invalid']);
  assert.throws(() => inspectQualification(f.prepared), /response_extraction_invalid/);
});

test('S111-1 retained delta function evidence cannot pass result, endpoint or qualification acceptance', async t => {
  const f = fixture(t); await success(f);
  const result = readJson(f.input.directory, 'result.json'); const wire = readJson(f.input.directory, 'response.json');
  wire.envelope.choices[0].delta = { function_call: { name: 'unexpected', arguments: '{}' } };
  result.observation.toolCallsPresent = true; result.observation.response.digest = contentDigest(wire);
  const path = join(f.metadata.cwd, '.afk', 'runs', f.metadata.runId, readDirectionState(f.metadata).attempts[0].terminal.path);
  const terminal = JSON.parse(readFileSync(path, 'utf8')); terminal.payload.terminal.result.digest = contentDigest(result);
  writeFileSync(join(f.input.directory, 'response.json'), canonicalBytes(wire)); writeFileSync(join(f.input.directory, 'result.json'), canonicalBytes(result));
  writeFileSync(path, canonicalBytes(terminal));
  assert.equal(readDirectionState(f.metadata).status, 'valid');
  for (const stage of ['result', 'endpoint']) {
    const checked = checkAudit({ ...f.metadata, stage, endpointId: f.input.packet.endpoint.id });
    assert.equal(checked.directionSatisfied, false); assert.deepEqual(checked.reasons, ['transport_invalid']);
  }
  assert.throws(() => inspectQualification(f.prepared), /transport_invalid/);
});
