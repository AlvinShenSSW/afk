import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';

import { test } from 'node:test';

import { gateTestEnv } from './gate-test-env.mjs';

const repoRoot = new URL('..', import.meta.url);
const GATE = 'skills/afk-glm-review/glm-gate.mjs';

function runGate({ args = [], env = {} } = {}) {
  return spawnSync(process.execPath, [GATE, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: gateTestEnv(env),
  });
}

async function runGateAsync({ args = [], env = {} } = {}) {
  const child = spawn(process.execPath, [GATE, ...args], {
    cwd: repoRoot,
    env: gateTestEnv(env),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const [status] = await once(child, 'close');
  return { status, stdout, stderr };
}

function withDesignDoc(text, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'glm-gate-design-'));
  try {
    const path = join(dir, 'spec.md');
    writeFileSync(path, text);
    return fn(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('glm gate disabled flag emits a clean skipped review', () => {
  const result = runGate({ args: ['--base', 'main'], env: { GLM_REVIEW_GATE: 'off' } });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /===== GLM REVIEW \(final message\) =====/);
  assert.match(result.stdout, /SKIPPED: GLM gate disabled via GLM_REVIEW_GATE\./);
  assert.match(result.stdout, /===== END GLM REVIEW =====/);
});

test('a GLM response body that never finishes ends as a non-zero timeout error', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write('{"partial":');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const { port } = server.address();
    const result = await runGateAsync({
      args: ['--commit', 'HEAD'],
      env: {
        ZAI_API_KEY: 'test-only',
        GLM_REVIEW_BASE_URL: `http://127.0.0.1:${port}/anthropic`,
        GLM_REVIEW_TIMEOUT_MS: '30',
      },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /ERROR: GLM review timed out/);
    assert.doesNotMatch(result.stdout, /SKIPPED/);
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
});

// ── design mode ─────────────────────────────────────────────────────────────

test('glm design mode resolves the design kind, not a diff selector', () => {
  withDesignDoc('# Spec\n', (path) => {
    const result = runGate({ args: ['--design', path, '--print-args'] });
    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.kind, 'design');
    assert.equal(parsed.base, null);
    assert.equal(parsed.commit, null);
  });
});

test('glm design mode sends the doc text as the payload, not a diff+files snapshot', () => {
  const body = '# Title\n\nA DESIGN-ONLY claim GLM must review.\n';
  withDesignDoc(body, (path) => {
    const result = runGate({ args: ['--design', path, '--print-prompt'] });
    assert.equal(result.status, 0, result.stderr);
    const out = result.stdout;
    // The document text is the payload GLM receives...
    assert.match(out, /A DESIGN-ONLY claim GLM must review\./);
    // ...under a design system prompt, not a code-diff one.
    assert.match(out, /SOUND WITH CONCERNS/);
    assert.doesNotMatch(out, /file:line/);
    // The diff-mode payload sections must be absent.
    assert.doesNotMatch(out, /## Full diff/);
    assert.doesNotMatch(out, /## Full current contents of changed files/);
  });
});

test('glm design mode fails loudly on a missing doc, never a skip', () => {
  const missing = join(tmpdir(), 'glm-gate-no-such-design-xyz.md');
  const result = runGate({ args: ['--design', missing] });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /ERROR: cannot review/);
  assert.match(result.stdout, /--design/);
  assert.doesNotMatch(result.stdout, /SKIPPED/);
});

test('glm rejects an over-budget design doc loudly, not a masked skip', () => {
  // The design stage runs exactly one gate. Sending an oversized doc whole lets
  // Z.ai reject it and glm report that as SKIPPED — the design stage then
  // proceeds with no review. An over-budget doc is operator/config error: fail
  // loud (ERROR) so the operator scopes it or raises the budget.
  const big = `# Spec\n${'x'.repeat(5000)}\n`;
  withDesignDoc(big, (path) => {
    const result = runGate({ args: ['--design', path], env: { GLM_REVIEW_MAX_CTX_BYTES: '500' } });
    assert.notEqual(result.status, 0, 'an over-budget design doc must ERROR, not skip');
    assert.match(result.stdout, /ERROR/);
    assert.doesNotMatch(result.stdout, /SKIPPED/);
  });
});

test('glm design mode: an unavailable reviewer skips and proceeds (Decision 6 asymmetry)', () => {
  withDesignDoc('# Spec\n', (path) => {
    const result = runGate({ args: ['--design', path], env: { GLM_REVIEW_GATE: 'off' } });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SKIPPED: GLM gate disabled/);
    assert.doesNotMatch(result.stdout, /ERROR/);
  });
});

test('every external gate is listed on every plugin surface', () => {
  // A gate nobody can discover is a gate that never runs, so each surface that
  // advertises the set must advertise all of it.
  const afkSkill = readFileSync(new URL('../skills/afk/SKILL.md', import.meta.url), 'utf8');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const config = readFileSync(new URL('../templates/afk-config.example.md', import.meta.url), 'utf8');

  for (const gate of ['afk-codex-review', 'afk-claude-review', 'afk-kimi-review', 'afk-glm-review']) {
    assert.match(afkSkill, new RegExp(gate), `afk/SKILL.md must list ${gate}`);
    assert.match(readme, new RegExp(gate), `README must list ${gate}`);
  }
  assert.match(config, /priority: codex > claude > kimi > glm/);
});
