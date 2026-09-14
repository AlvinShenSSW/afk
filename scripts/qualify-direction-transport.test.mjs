import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { prepare, probe, LIMITS, CANDIDATE } from './qualify-direction-transport.mjs';
import { canonicalBytes, digestBytes } from '../lib/gate/review-receipt.mjs';
import { supportVisible } from './evaluate-agent-behavior.mjs';

const fixture = fileURLToPath(new URL('./fixtures/direction-transport', import.meta.url));
const credential = 'synthetic-qualification-key';
function setup(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'afk-qualification-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fixtureRoot = join(root, 'fixture');
  cpSync(fixture, fixtureRoot, { recursive: true });
  return { root, fixtureRoot, out: join(root, 'attempt') };
}
const read = (dir, name) => JSON.parse(readFileSync(join(dir, name), 'utf8'));
const write = (dir, name, value) => writeFileSync(join(dir, name), canonicalBytes(value));
function completion(dir, edit = (x) => x) {
  const metadata = read(dir, 'prepared.json');
  const packet = read(dir, 'packet.json');
  const expected = read(dir, 'expected.json');
  return edit({
    packetDigest: metadata.packetDigest, phase: packet.phase, targetDigest: packet.targetDigest,
    outcome: expected.outcome, deliveryToken: expected.deliveryToken,
    findings: [{ id: 'D1', requirementId: expected.requirementId, source: expected.source,
      line: expected.line, excerpt: expected.excerpt, nextAction: 'Correct the operation before proceeding.' }],
    nextAction: 'Return the discrepancy to the author.',
  });
}
function envelope(dir, edit = (x) => x) {
  return edit({ model: CANDIDATE.model, choices: [{ finish_reason: 'stop',
    message: { role: 'assistant', content: JSON.stringify(completion(dir)) } }] });
}
const response = (value, status = 200) => new Response(JSON.stringify(value), { status });
async function run(out, fetchImpl, extra = {}) {
  return probe({ prepared: out, env: { DEEPSEEK_API_KEY: credential }, fetchImpl, ...extra });
}

test('preparation binds exact sources and excludes the oracle from the wire', (t) => {
  const args = setup(t); prepare(args);
  const packet = read(args.out, 'packet.json');
  const body = readFileSync(join(args.out, 'request.json'), 'utf8');
  const meta = read(args.out, 'prepared.json');
  assert.equal(digestBytes(body), meta.requestDigest);
  assert.equal(digestBytes(canonicalBytes(packet)), meta.packetDigest);
  for (const source of packet.sources) {
    assert.equal(source.content, readFileSync(join(args.fixtureRoot, source.path), 'utf8'));
    assert.equal(source.digest, digestBytes(source.content));
  }
  assert.equal(body.includes('expected.json'), false);
  assert.equal(body.includes('"oracle"'), false);
  assert.equal(Buffer.byteLength(body) <= LIMITS.requestBytes, true);
  assert.throws(() => prepare(args), /exists|directory/);
});

test('one tools-absent fresh request has exact prepared bytes and observed identity', async (t) => {
  const args = setup(t); prepare(args);
  let calls = 0;
  const terminal = await run(args.out, async (url, options) => {
    calls++;
    assert.equal(url, CANDIDATE.endpoint);
    assert.equal(options.redirect, 'error');
    assert.equal(options.body, readFileSync(join(args.out, 'request.json'), 'utf8'));
    assert.equal(options.headers.Authorization, `Bearer ${credential}`);
    const body = JSON.parse(options.body);
    assert.deepEqual(body.messages.map((x) => x.role), ['system', 'user']);
    assert.equal(Object.hasOwn(body, 'tools'), false);
    assert.equal(body.tool_choice, 'none');
    assert.deepEqual(body.thinking, { type: 'disabled' });
    assert.equal(body.model, CANDIDATE.model);
    assert.equal(body.max_tokens, LIMITS.outputTokens);
    return response(envelope(args.out));
  }, { env: { DEEPSEEK_API_KEY: credential, DEEPSEEK_BASE_URL: 'https://invalid.example', AGENT_RELAY_TOKEN_PARAM: 'unsafe' } });
  assert.equal(calls, 1);
  assert.equal(terminal.classification, 'CANDIDATE-PASS');
  assert.equal(terminal.exitCode, 0);
  assert.deepEqual(terminal.usage, { input: null, output: null, cacheRead: null });
  assert.equal(terminal.identity.source, 'provider-response.model');
  assert.equal(terminal.identity.observed, CANDIDATE.model);
  await assert.rejects(run(args.out, () => { throw Error('must not retry'); }), /exists|reuse/);
});

for (const [name, mutate, reason] of [
  ['missing identity', (x) => { delete x.model; }, 'identity'],
  ['mismatched identity', (x) => { x.model = 'different-model'; }, 'identity'],
  ['length finish', (x) => { x.choices[0].finish_reason = 'length'; }, 'finish'],
  ['empty result', (x) => { x.choices[0].message.content = ''; }, 'empty'],
  ['tool call', (x) => { x.choices[0].message.tool_calls = [{ function: { name: 'exec' } }]; }, 'tool'],
  ['function call', (x) => { x.choices[0].message.function_call = { name: 'exec' }; }, 'tool'],
  ['extra choice', (x) => { x.choices.push(x.choices[0]); }, 'choices'],
  ['non-string content', (x) => { x.choices[0].message.content = { model: CANDIDATE.model }; }, 'content'],
]) test(`invalid response: ${name} preserves observations without retry`, async (t) => {
  const args = setup(t); prepare(args);
  let calls = 0;
  const terminal = await run(args.out, async () => {
    calls++; return response(envelope(args.out, (x) => { mutate(x); return x; }));
  });
  assert.equal(calls, 1);
  assert.equal(terminal.classification, 'INVALID');
  assert.match(terminal.reason, new RegExp(reason));
  assert.ok(read(args.out, 'response.json').envelope);
});

for (const [name, change] of [
  ['stale binding', (x) => { x.packetDigest = 'a'.repeat(64); }],
  ['wrong challenge', (x) => { x.deliveryToken = 'incorrect'; }],
  ['wrong judgment', (x) => { x.outcome = 'ON-TRACK'; }],
  ['outside evidence', (x) => { x.findings[0].source = '../private.txt'; }],
  ['wrong excerpt', (x) => { x.findings[0].excerpt = 'absent'; }],
  ['duplicate finding', (x) => { x.findings.push({ ...x.findings[0] }); }],
  ['unknown field', (x) => { x.additional = true; }],
]) test(`result validation refuses ${name}`, async (t) => {
  const args = setup(t); prepare(args);
  const e = envelope(args.out);
  e.choices[0].message.content = JSON.stringify(completion(args.out, (x) => { change(x); return x; }));
  const terminal = await run(args.out, async () => response(e));
  assert.equal(terminal.classification, 'INVALID');
  assert.equal(terminal.exitCode, 1);
});

test('missing credential and quota are distinct unavailable evidence', async (t) => {
  const a = setup(t); prepare(a);
  const missing = await probe({ prepared: a.out, env: {}, fetchImpl: () => { throw Error('unexpected fetch'); } });
  assert.equal(missing.classification, 'ENVIRONMENT-BLOCKED');
  assert.equal(missing.reason, 'no_key');
  const b = setup(t); prepare(b);
  const quota = await run(b.out, async () => response({}, 429));
  assert.equal(quota.classification, 'ENVIRONMENT-BLOCKED');
  assert.equal(quota.reason, 'rate_limit');
});

test('transport errors do not persist credentials and malformed bodies remain invalid', async (t) => {
  const a = setup(t); prepare(a);
  const failure = await run(a.out, async () => { throw Error(credential); });
  assert.equal(failure.classification, 'ENVIRONMENT-BLOCKED');
  assert.equal(JSON.stringify(failure).includes(credential), false);
  const b = setup(t); prepare(b);
  const invalid = await run(b.out, async () => new Response('{broken'));
  assert.equal(invalid.classification, 'INVALID');
  assert.equal(invalid.reason, 'bad_json');
  assert.equal(read(b.out, 'response.json').unparsedText, '{broken');
});

for (const phase of ['fetch', 'body']) test(`abort remains active during ${phase}`, async (t) => {
  const args = setup(t); prepare(args);
  let aborted = false;
  const terminal = await run(args.out, async (_url, { signal }) => {
    if (phase === 'fetch') return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('abort', 'AbortError')); });
    });
    return new Response(new ReadableStream({ start(controller) {
      signal.addEventListener('abort', () => { aborted = true; controller.error(new DOMException('abort', 'AbortError')); });
    } }));
  }, { httpTimeoutMs: 15 });
  assert.equal(aborted, true);
  assert.equal(terminal.classification, 'TIMEOUT');
  assert.equal(terminal.exitCode, 3);
});

test('response byte overflow cancels its stream without truncating into success', async (t) => {
  const args = setup(t); prepare(args);
  let cancelled = false;
  const terminal = await run(args.out, async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(LIMITS.responseBytes + 1)); },
    cancel() { cancelled = true; },
  })));
  assert.equal(cancelled, true);
  assert.equal(terminal.classification, 'INVALID');
  assert.equal(terminal.reason, 'response_limit');
});

test('credential redaction preserves validated result binding hashes', async (t) => {
  const args = setup(t); prepare(args);
  const e = envelope(args.out);
  const result = completion(args.out); result.nextAction = `Never publish ${credential}`;
  e.choices[0].message.content = JSON.stringify(result);
  e.usage = { prompt_tokens: 50, completion_tokens: 20, prompt_cache_hit_tokens: 10 };
  const terminal = await run(args.out, async () => response(e));
  const saved = readFileSync(join(args.out, 'result.json'), 'utf8');
  assert.equal(saved.includes(credential), false);
  assert.equal(read(args.out, 'result.json').result.packetDigest, read(args.out, 'prepared.json').packetDigest);
  assert.deepEqual(terminal.usage, { input: 50, output: 20, cacheRead: 10 });
  assert.equal(read(args.out, 'response.json').redacted, true);
});

for (const kind of ['traversal', 'excluded', 'missing', 'symlink', 'oversized', 'utf8']) test(`preparation refuses ${kind} source`, (t) => {
  const args = setup(t);
  const packet = read(args.fixtureRoot, 'packet.json');
  if (kind === 'traversal') { packet.sourcePaths[0] = '../requirements.md'; write(args.fixtureRoot, 'packet.json', packet); }
  if (kind === 'excluded') { packet.sourcePaths[0] = '.env'; write(args.fixtureRoot, 'packet.json', packet); }
  if (kind === 'missing') rmSync(join(args.fixtureRoot, 'requirements.md'));
  if (kind === 'symlink') { rmSync(join(args.fixtureRoot, 'requirements.md')); symlinkSync(join(args.fixtureRoot, 'artifact.mjs'), join(args.fixtureRoot, 'requirements.md')); }
  if (kind === 'oversized') writeFileSync(join(args.fixtureRoot, 'requirements.md'), 'x'.repeat(LIMITS.requestBytes + 1));
  if (kind === 'utf8') writeFileSync(join(args.fixtureRoot, 'requirements.md'), Buffer.from([0xff]));
  assert.throws(() => prepare(args));
});

test('symlink output ancestors and changed prepared bytes are refused', async (t) => {
  const args = setup(t);
  symlinkSync(args.root, join(args.root, 'alias'));
  assert.throws(() => prepare({ ...args, out: join(args.root, 'alias', 'attempt') }), /directory|symlink/);
  prepare(args);
  writeFileSync(join(args.out, 'request.json'), '{}');
  await assert.rejects(run(args.out, () => { throw Error('must not fetch'); }), /digest|request|canonical/);
});

test('an interrupted dispatch marker cannot be reused or replaced', async (t) => {
  const args = setup(t); prepare(args);
  write(args.out, 'dispatch.json', { interrupted: true });
  await assert.rejects(run(args.out, () => { throw Error('must not fetch'); }), /exists|reuse/);
  assert.deepEqual(read(args.out, 'dispatch.json'), { interrupted: true });
});

test('total encoded request overflow is rejected even when individual sources fit', (t) => {
  const args = setup(t);
  writeFileSync(join(args.fixtureRoot, 'requirements.md'), readFileSync(join(args.fixtureRoot, 'requirements.md'), 'utf8') + '\t'.repeat(7000));
  assert.throws(() => prepare(args), /request_limit/);
});

test('a nonregular source and sensitive fixture data are rejected before preparation', (t) => {
  const a = setup(t);
  rmSync(join(a.fixtureRoot, 'requirements.md')); mkdirSync(join(a.fixtureRoot, 'requirements.md'));
  assert.throws(() => prepare(a), /non_regular/);
  const b = setup(t);
  writeFileSync(join(b.fixtureRoot, 'requirements.md'), `R1: api_key=sk-${'z'.repeat(25)}`);
  assert.throws(() => prepare(b), /sensitive_source/);
});

test('producer changes and unexpected redirects cannot become candidate passes', async (t) => {
  const a = setup(t); prepare(a);
  const meta = read(a.out, 'prepared.json'); meta.helperDigest = '0'.repeat(64); write(a.out, 'prepared.json', meta);
  await assert.rejects(run(a.out, () => { throw Error('must not fetch'); }), /producer_digest/);
  const b = setup(t); prepare(b);
  const terminal = await run(b.out, async () => ({ redirected: true, url: 'https://invalid.example', status: 200, ok: true }));
  assert.equal(terminal.classification, 'INVALID');
  assert.equal(terminal.reason, 'unexpected_redirect');
});

for (const name of ['dispatch.json', 'response.json', 'result.json', 'terminal.json']) test(`existing ${name} refuses dispatch before any fetch`, async (t) => {
  const args = setup(t); prepare(args);
  write(args.out, name, { previous: true });
  let calls = 0;
  await assert.rejects(run(args.out, async () => { calls++; return response(envelope(args.out)); }), /exists/);
  assert.equal(calls, 0);
  assert.deepEqual(read(args.out, name), { previous: true });
  assert.equal(existsSync(join(args.out, 'dispatch.json')), name === 'dispatch.json');
});

test('concurrent invocations retain exclusive dispatch arbitration', async (t) => {
  const args = setup(t); prepare(args);
  let finish;
  let calls = 0;
  const first = run(args.out, async () => {
    calls++;
    await new Promise((resolve) => { finish = resolve; });
    return response(envelope(args.out));
  });
  await assert.rejects(run(args.out, async () => { calls++; throw Error('duplicate request'); }), /exists/);
  finish();
  assert.equal((await first).classification, 'CANDIDATE-PASS');
  assert.equal(calls, 1);
});

test('invalid JSON content is retained as an envelope, not passed as a result', async (t) => {
  const args = setup(t); prepare(args);
  const e = envelope(args.out); e.choices[0].message.content = 'not JSON';
  const terminal = await run(args.out, async () => response(e));
  assert.equal(terminal.reason, 'bad_json');
  assert.equal(read(args.out, 'response.json').envelope.choices[0].message.content, 'not JSON');
});

test('qualification support never enters behavior author exports', () => {
  for (const path of ['scripts/qualify-direction-transport.mjs', 'scripts/fixtures/direction-transport/packet.json',
    'scripts/fixtures/direction-transport/expected.json', 'docs/evaluations/issue-110-transport.md']) {
    assert.equal(supportVisible(path), false, path);
  }
});
