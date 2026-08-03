import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { test } from 'node:test';

import { gateTestEnv, pathKey, spawnGate, stubPath } from './gate-test-env.mjs';

test('gate test environment removes ambient gate configuration', () => {
  const result = gateTestEnv({}, {
    KEEP: 'yes',
    AFK_REVIEW_TIMEOUT_MS: '1',
    CLAUDE_REVIEW_TIMEOUT_MS: '2',
    CODEX_REVIEW_TIMEOUT_MS: '3',
    DEEPSEEK_REVIEW_TIMEOUT_MS: '3',
    GLM_REVIEW_TIMEOUT_MS: '4',
    KIMI_REVIEW_TIMEOUT_MS: '5',
    MIMO_REVIEW_TIMEOUT_MS: '6',
    CODEX_REVIEW_MODEL: 'ambient-model',
    CODEX_REVIEW_GATE: 'off',
    CLAUDECODE: '1',
    DEEPSEEK_REVIEW_API_KEY: 'ambient-key',
    DEV_DEEPSEEK_API_KEY: 'ambient-key',
    DEV_MIMO_API_KEY: 'ambient-key',
    MIMO_REVIEW_API_KEY: 'ambient-key',
    ZAI_API_KEY: 'ambient-key',
  });
  assert.deepEqual(result, { KEEP: 'yes', AFK_GATE_NO_DOTENV: '1' });
});

test('explicit test overrides are applied after ambient cleanup', () => {
  const result = gateTestEnv(
    { KIMI_REVIEW_TIMEOUT_MS: '1234' },
    { KIMI_REVIEW_TIMEOUT_MS: '9999' },
  );
  assert.equal(result.KIMI_REVIEW_TIMEOUT_MS, '1234');
});

test('spawnGate names a gate that never exits instead of returning empty output', () => {
  // The failure this converts: a hung gate returned status null and stdout '',
  // every assertion then read as "the gate printed nothing", and the run itself
  // never finished so nothing was reported at all.
  assert.throws(
    () => spawnGate(['-e', 'setInterval(() => {}, 60000);'], { encoding: 'utf8', timeout: 300 }),
    /did not exit within 300ms/,
  );
});

test('spawnGate passes a normal gate result straight through', () => {
  const res = spawnGate(['-e', 'process.stdout.write("verdict");'], { encoding: 'utf8' });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'verdict');
});

test('stubPath removes any directory that could resolve the CLI ahead of the stub', () => {
  // The Windows shim tests are only meaningful if the stub is the ONLY way to
  // resolve the name: `resolveCliBin` is extension-major, so a real `kimi.exe`
  // anywhere later on PATH correctly returns the bare name and the gate spawns
  // the real, metered CLI instead of the stub. That is the reference machine
  // from issue #12 ("that machine had a kimi.exe"), i.e. exactly where these
  // tests run.
  const stub = mkdtempSync(join(tmpdir(), 'stubpath-stub-'));
  const real = mkdtempSync(join(tmpdir(), 'stubpath-real-'));
  const other = mkdtempSync(join(tmpdir(), 'stubpath-other-'));
  try {
    writeFileSync(join(stub, 'kimi.cmd'), '');
    writeFileSync(join(real, 'kimi.exe'), '');
    writeFileSync(join(other, 'git'), '');

    const key = pathKey({ PATH: '' });
    const built = stubPath(stub, 'kimi', { PATH: [real, other].join(delimiter) });
    const entries = built[key].split(delimiter);

    assert.equal(entries[0], stub, 'the stub directory must come first');
    assert.ok(!entries.includes(real), 'a directory holding kimi.exe must be dropped');
    assert.ok(entries.includes(other), 'unrelated entries stay — the gates still need git');
  } finally {
    for (const dir of [stub, real, other]) rmSync(dir, { recursive: true, force: true });
  }
});
