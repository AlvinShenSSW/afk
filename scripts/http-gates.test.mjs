import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  mkdtempSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test } from 'node:test';

import { gateTestEnv, spawnGate } from './gate-test-env.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const CASES = {
  deepseek: {
    gate: join(repoRoot, 'skills/afk-deepseek-review/deepseek-gate.mjs'),
    keyEnv: 'DEEPSEEK_REVIEW_API_KEY',
    baseEnv: 'DEEPSEEK_REVIEW_BASE_URL',
    model: 'deepseek-v4-pro',
    marker: 'DEEPSEEK',
  },
  mimo: {
    gate: join(repoRoot, 'skills/afk-mimo-review/mimo-gate.mjs'),
    keyEnv: 'MIMO_REVIEW_API_KEY',
    baseEnv: 'MIMO_REVIEW_BASE_URL',
    model: 'mimo-v2.5-pro',
    marker: 'MIMO',
  },
};

function runGate(family, { args = ['--commit', 'HEAD'], env = {}, cwd = repoRoot } = {}) {
  return spawnGate([CASES[family].gate, ...args], {
    cwd,
    encoding: 'utf8',
    env: gateTestEnv(env),
  });
}

async function runGateAsync(family, { args = ['--commit', 'HEAD'], env = {}, cwd = repoRoot } = {}) {
  const child = spawn(process.execPath, [CASES[family].gate, ...args], {
    cwd,
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

async function withServer(handler, fn) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    return await fn(server.address().port);
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
}

async function withRepo(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'http-gate-'));
  const outside = mkdtempSync(join(tmpdir(), 'http-gate-outside-'));
  try {
    execFileSync('git', ['init', '-b', 'main'], { cwd: dir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
    writeFileSync(join(dir, 'safe.txt'), 'initial\n');
    writeFileSync(join(dir, '.env'), 'SECRET=initial\n');
    execFileSync('git', ['add', '-f', 'safe.txt', '.env'], { cwd: dir });
    execFileSync('git', ['commit', '-m', 'base'], { cwd: dir });
    return await fn({ dir, outside });
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
}

test('a missing credential skips before non-design snapshot assembly', async () => {
  await withRepo(async ({ dir }) => {
    writeFileSync(join(dir, 'safe.txt'), 'changed\n');
    const result = runGate('deepseek', {
      args: ['--uncommitted'],
      cwd: dir,
      env: { DEEPSEEK_REVIEW_MAX_CTX_BYTES: '1' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SKIPPED: No API key/);
    assert.doesNotMatch(result.stdout, /budget/i);
  });
});

for (const [family, config] of Object.entries(CASES)) {
  test(`${family} missing credential emits a distinct skip`, () => {
    const result = runGate(family);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`===== ${config.marker} REVIEW`));
    assert.match(result.stdout, /SKIPPED: No API key/);
  });

  test(`${family} sends the provider-specific request and emits only final content`, async () => {
    const captured = {};
    const key = `${family}-review-test-key`;
    await withServer(async (request, response) => {
      let raw = '';
      for await (const chunk of request) raw += chunk;
      captured.url = request.url;
      captured.headers = request.headers;
      captured.body = JSON.parse(raw);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        model: config.model,
        choices: [{
          finish_reason: 'stop',
          message: { reasoning_content: 'private reasoning', content: `APPROVE ${key}` },
        }],
        usage: {},
      }));
    }, async (port) => {
      const result = await runGateAsync(family, {
        env: {
          [config.keyEnv]: key,
          [config.baseEnv]: `http://127.0.0.1:${port}${family === 'mimo' ? '/v1' : ''}`,
        },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /APPROVE/);
      assert.doesNotMatch(result.stdout, /private reasoning/);
      assert.doesNotMatch(result.stdout, new RegExp(key));
      assert.equal(captured.body.model, config.model);
      if (family === 'deepseek') {
        assert.equal(captured.headers.authorization, `Bearer ${key}`);
        assert.equal(captured.body.max_tokens, 8192);
        assert.deepEqual(captured.body.thinking, { type: 'enabled' });
      } else {
        assert.equal(captured.headers['api-key'], key);
        assert.equal(captured.headers.authorization, undefined);
        assert.equal(captured.body.max_completion_tokens, 8192);
      }
    });
  });

  test(`${family} accepts a bounded output-token override`, async () => {
    let body;
    await withServer(async (request, response) => {
      let raw = '';
      for await (const chunk of request) raw += chunk;
      body = JSON.parse(raw);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        model: config.model,
        choices: [{ finish_reason: 'stop', message: { content: 'APPROVE' } }],
        usage: {},
      }));
    }, async (port) => {
      const result = await runGateAsync(family, {
        env: {
          [config.keyEnv]: 'test-only',
          [config.baseEnv]: `http://127.0.0.1:${port}`,
          [`${config.marker}_REVIEW_MAX_OUTPUT_TOKENS`]: '1234',
        },
      });
      assert.equal(result.status, 0, result.stderr);
    });
    const field = family === 'deepseek' ? 'max_tokens' : 'max_completion_tokens';
    assert.equal(body[field], 1234);
  });

  test(`${family} rejects an unversioned model alias before any request`, () => {
    const result = runGate(family, {
      env: {
        [config.keyEnv]: 'test-only',
        [`${config.marker}_REVIEW_MODEL`]: family,
      },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /pinned model ID/i);
  });

  test(`${family} rejects nonterminal content and never echoes an upstream body`, async () => {
    const key = `${family}-key-must-not-echo`;
    const token = `tp-${'Q7x'.repeat(12)}`;
    await withServer((_request, response) => {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: `echo ${key} ${token}` }));
    }, async (port) => {
      const result = await runGateAsync(family, {
        env: {
          [config.keyEnv]: key,
          [config.baseEnv]: `http://127.0.0.1:${port}`,
        },
      });
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /ERROR:/);
      assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(key));
      assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /tp-/);
    });

    await withServer((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        model: config.model,
        choices: [{ finish_reason: 'length', message: { content: 'partial approval' } }],
        usage: {},
      }));
    }, async (port) => {
      const result = await runGateAsync(family, {
        env: {
          [config.keyEnv]: 'test-only',
          [config.baseEnv]: `http://127.0.0.1:${port}`,
        },
      });
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /finish_reason "length"/);
      assert.doesNotMatch(result.stdout, /partial approval/);
    });
  });

  test(`${family} authentication rejection is a bounded skip`, async () => {
    const key = `${family}-auth-key-must-not-echo`;
    await withServer((_request, response) => {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: `echo ${key}` }));
    }, async (port) => {
      const result = await runGateAsync(family, {
        env: {
          [config.keyEnv]: key,
          [config.baseEnv]: `http://127.0.0.1:${port}`,
        },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /SKIPPED: .*authentication failed/i);
      assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(key));
    });
  });

  test(`${family} validates design targets before a disabled skip`, () => {
    const result = runGate(family, {
      args: ['--design'],
      env: { [`${config.marker}_REVIEW_GATE`]: 'off' },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /ERROR: cannot review/);
    assert.doesNotMatch(result.stdout, /SKIPPED/);
  });
}

test('reviewer model mismatch discards the verdict', async () => {
  await withServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      model: 'deepseek-v3-old',
      choices: [{ finish_reason: 'stop', message: { content: 'APPROVE' } }],
      usage: {},
    }));
  }, async (port) => {
    const result = await runGateAsync('deepseek', {
      env: {
        DEEPSEEK_REVIEW_API_KEY: 'test-only',
        DEEPSEEK_REVIEW_BASE_URL: `http://127.0.0.1:${port}`,
      },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /reviewer identity unverified/);
    assert.doesNotMatch(result.stdout, /APPROVE/);
  });
});

test('target validation errors redact secret-shaped path and ref text', () => {
  const token = `tp-${'V8q'.repeat(12)}`;
  for (const args of [
    ['--design', join(tmpdir(), `missing-${token}.md`)],
    ['--base', token],
  ]) {
    const result = runGate('deepseek', { args });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /ERROR:/);
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /tp-/);
  }
});

test('the request log cannot echo a credential reused as the configured model', async () => {
  const key = 'credential-reused-as-model-id-5';
  await withServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      model: key,
      choices: [{ finish_reason: 'stop', message: { content: 'APPROVE' } }],
      usage: {},
    }));
  }, async (port) => {
    const result = await runGateAsync('deepseek', {
      env: {
        DEEPSEEK_REVIEW_API_KEY: key,
        DEEPSEEK_REVIEW_MODEL: key,
        DEEPSEEK_REVIEW_BASE_URL: `http://127.0.0.1:${port}`,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(key));
  });
});

test('a response body that stalls after headers is classified as a timeout', async () => {
  await withServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write('{"partial":');
  }, async (port) => {
    const result = await runGateAsync('deepseek', {
      env: {
        DEEPSEEK_REVIEW_API_KEY: 'test-only',
        DEEPSEEK_REVIEW_BASE_URL: `http://127.0.0.1:${port}`,
        DEEPSEEK_REVIEW_TIMEOUT_MS: '30',
      },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /timed out/i);
    assert.doesNotMatch(result.stdout, /bad_json/);
  });
});

test('started reviews reject rate limits, malformed bodies, empty content, and unsafe finish reasons', async () => {
  const cases = [
    {
      response: (res) => {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end('{"error":"limited"}');
      },
      expected: /rate_limit/,
    },
    {
      response: (res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('not-json');
      },
      expected: /bad_json/,
    },
    {
      json: { choices: [{ finish_reason: 'stop', message: { content: '' } }] },
      expected: /empty/,
    },
    {
      json: { choices: [{ message: { content: 'partial' } }] },
      expected: /finish_reason missing/,
    },
    {
      json: { choices: [{ finish_reason: 'content_filter', message: { content: 'partial' } }] },
      expected: /finish_reason "content_filter"/,
    },
  ];

  for (const fixture of cases) {
    await withServer((_request, response) => {
      if (fixture.response) return fixture.response(response);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ model: CASES.deepseek.model, usage: {}, ...fixture.json }));
    }, async (port) => {
      const result = await runGateAsync('deepseek', {
        env: {
          DEEPSEEK_REVIEW_API_KEY: 'test-only',
          DEEPSEEK_REVIEW_BASE_URL: `http://127.0.0.1:${port}`,
        },
      });
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /ERROR:/);
      assert.match(result.stdout, fixture.expected);
      assert.doesNotMatch(result.stdout, /\npartial\n/);
    });
  }
});

test('the gate request excludes secret files, symlinks, and secret-shaped values', async () => {
  await withRepo(async ({ dir, outside }) => {
    const dotenvSecret = 'tracked-dotenv-secret';
    const outsideSecret = 'outside-symlink-secret';
    const token = `tp-${'T9z'.repeat(12)}`;
    const configuredKey = 'mimo-configured-key-with-arbitrary-shape';
    const excludedName = `omit-${configuredKey}.fixture`;
    writeFileSync(join(dir, '.env'), `SECRET=${dotenvSecret}\n`);
    writeFileSync(join(dir, 'safe.txt'), `review this ${token} ${configuredKey}\n`);
    writeFileSync(join(dir, excludedName), 'operator-excluded-content\n');
    writeFileSync(join(outside, 'secret.txt'), `${outsideSecret}\n`);
    symlinkSync(join(outside, 'secret.txt'), join(dir, 'leak-link'));

    let requestBody = '';
    await withServer(async (request, response) => {
      for await (const chunk of request) requestBody += chunk;
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        model: CASES.mimo.model,
        choices: [{ finish_reason: 'stop', message: { content: 'APPROVE' } }],
        usage: {},
      }));
    }, async (port) => {
      const result = await runGateAsync('mimo', {
        args: ['--uncommitted'],
        cwd: dir,
        env: {
          MIMO_REVIEW_API_KEY: configuredKey,
          MIMO_REVIEW_BASE_URL: `http://127.0.0.1:${port}/v1`,
          MIMO_REVIEW_EXCLUDE_GLOBS: '*.fixture',
        },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /APPROVE/);
      assert.match(result.stderr, /configured credential/);
      assert.match(result.stdout, /SNAPSHOT_NOTE excluded_entries=3/);
      assert.match(result.stderr, /omit-\[REDACTED\]\.fixture/);
      assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(configuredKey));
    });

    assert.doesNotMatch(requestBody, new RegExp(dotenvSecret));
    assert.doesNotMatch(requestBody, new RegExp(outsideSecret));
    assert.doesNotMatch(requestBody, new RegExp(token));
    assert.doesNotMatch(requestBody, new RegExp(configuredKey));
    assert.doesNotMatch(requestBody, /\.env/);
    assert.doesNotMatch(requestBody, /leak-link/);
    assert.doesNotMatch(requestBody, /operator-excluded-content|omit-/);
    assert.match(requestBody, /\[REDACTED/);
  });
});

test('a secret-only change is reported as excluded and never starts a request', async () => {
  await withRepo(async ({ dir }) => {
    writeFileSync(join(dir, '.env'), 'SECRET=changed\n');
    const result = runGate('mimo', {
      args: ['--uncommitted'],
      cwd: dir,
      env: { MIMO_REVIEW_API_KEY: 'test-only' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SKIPPED: No reviewable changes found/);
    assert.match(result.stderr, /secret-bearing or unsafe entry was omitted/);
    assert.doesNotMatch(result.stderr, /POST/);
  });
});

test('both gate entry points support branch, commit, uncommitted, and design targets', async () => {
  await withRepo(async ({ dir }) => {
    const design = join(dir, 'design.md');
    writeFileSync(design, '# Design\n');
    writeFileSync(join(dir, 'safe.txt'), 'changed\n');
    for (const family of Object.keys(CASES)) {
      for (const [kind, args] of [
        ['branch', ['--base', 'main', '--print-args']],
        ['commit', ['--commit', 'HEAD', '--print-args']],
        ['uncommitted', ['--uncommitted', '--print-args']],
        ['design', ['--design', design, '--print-args']],
      ]) {
        const result = runGate(family, { args, cwd: dir });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(JSON.parse(result.stdout).kind, kind);
      }
    }
  });
});
