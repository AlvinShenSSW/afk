// Characterization tests: pin kimi-gate's observable contract BEFORE the shared
// lib extraction, so the migration is verified behaviour-preserving rather than
// believed to be. Assertions here must survive the refactor unchanged.
//
// Every test terminates at a local check; none may reach the real `kimi` binary.

import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

import { test } from 'node:test';

import { gateTestEnv, pathKey, spawnGate } from './gate-test-env.mjs';

const repoRoot = new URL('..', import.meta.url);
const GATE = 'skills/afk-kimi-review/kimi-gate.mjs';

function runGate({ args = [], env = {} } = {}) {
  return spawnGate([GATE, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: gateTestEnv(env),
  });
}

function withDesignDoc(text, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-design-'));
  try {
    const path = join(dir, 'spec.md');
    writeFileSync(path, text);
    return fn(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('kimi gate disabled flag emits a clean skipped review', () => {
  const result = runGate({ args: ['--base', 'main'], env: { KIMI_REVIEW_GATE: 'off' } });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /===== KIMI REVIEW \(final message\) =====/);
  assert.match(result.stdout, /SKIPPED: Kimi gate disabled via KIMI_REVIEW_GATE\./);
  assert.match(result.stdout, /===== END KIMI REVIEW =====/);
});

test('kimi gate honours every documented opt-out spelling', () => {
  for (const value of ['off', '0', 'false', 'no', 'disabled', 'OFF', ' Off ']) {
    const result = runGate({ args: ['--base', 'main'], env: { KIMI_REVIEW_GATE: value } });
    assert.equal(result.status, 0, `${value}: ${result.stderr}`);
    assert.match(result.stdout, /SKIPPED: Kimi gate disabled/, `value ${JSON.stringify(value)}`);
  }
});

// The tests above pin early-exit paths only and could not catch a regression in
// the extracted target/base code. --print-args makes that surface observable.

test('kimi gate resolves the default base to its promoted remote ref', () => {
  const result = runGate({ args: ['--print-args'] });

  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.kind, 'branch');
  // Previously kimi diffed the bare local ref, so a stale local main made it
  // review the wrong commit range. This PR promotes it.
  assert.equal(parsed.base, 'origin/main');
  assert.equal(parsed.command, 'git diff origin/main...HEAD');
});

test('kimi gate tells its reviewer to go looking, unlike the tool-less gate', () => {
  // kimi HAS tools; glm does not. The context clause is per-gate for exactly
  // this reason, so a shared prompt must never flatten the difference.
  const result = runGate({ args: ['--commit', 'HEAD', '--print-args'] });
  const { promptBytes, command } = JSON.parse(result.stdout);
  assert.ok(promptBytes > 0);
  assert.equal(command, 'git show HEAD');
});

test('kimi gate never exits clean on a status it could not read', () => {
  // A null status means kimi died on a signal. `?? 0` there would report a
  // killed review as a clean one; the exit expression must fail closed.
  const src = readFileSync(new URL('../skills/afk-kimi-review/kimi-gate.mjs', import.meta.url), 'utf8');
  assert.match(src, /process\.exit\(res\.status \?\? 1\)/);
  assert.doesNotMatch(src, /process\.exit\(res\.status \?\? 0\)/);
});

// ── design mode ─────────────────────────────────────────────────────────────

test('kimi design mode resolves the design kind, not a diff selector', () => {
  withDesignDoc('# Spec\n', (path) => {
    const result = runGate({ args: ['--design', path, '--print-args'] });
    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.kind, 'design');
    assert.equal(parsed.base, null);
    assert.equal(parsed.commit, null);
  });
});

test('kimi design mode swaps the diff "Inspect the target" clause for a design one', () => {
  withDesignDoc('# Spec\n', (path) => {
    const result = runGate({ args: ['--design', path, '--print-prompt'] });
    assert.equal(result.status, 0, result.stderr);
    const prompt = result.stdout;
    // A design brief: design verdicts and no file:line locator.
    assert.match(prompt, /SOUND WITH CONCERNS/);
    assert.doesNotMatch(prompt, /file:line/);
    // kimi HAS tools, so it is pointed at the doc on disk (reading it itself
    // keeps the large doc off the argv, unlike the diff clause's `git show`).
    assert.match(prompt, new RegExp(path.replace(/[.\\/]/g, '\\$&')));
    assert.doesNotMatch(prompt, /Inspect the target with/);
  });
});

test('kimi design mode fails loudly on a missing doc, never a skip', () => {
  const missing = join(tmpdir(), 'kimi-gate-no-such-design-xyz.md');
  const result = runGate({ args: ['--design', missing] });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /ERROR: cannot review/);
  assert.match(result.stdout, /--design/);
  assert.doesNotMatch(result.stdout, /SKIPPED/);
});

test('kimi design mode: an unavailable reviewer skips and proceeds (Decision 6 asymmetry)', () => {
  withDesignDoc('# Spec\n', (path) => {
    const result = runGate({ args: ['--design', path], env: { KIMI_REVIEW_GATE: 'off' } });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SKIPPED: Kimi gate disabled/);
    assert.doesNotMatch(result.stdout, /ERROR/);
  });
});

// ── review timeout ──────────────────────────────────────────────────────────
// Kimi is a general agentic CLI with no built-in bound on a turn, so a review
// that stops making progress hangs the whole run. The helper timeout is the
// only boundedness control this gate has.

test('kimi gate bounds a review by default', () => {
  const result = runGate({ args: ['--print-args'] });

  const { timeoutMs } = JSON.parse(result.stdout);
  assert.equal(timeoutMs, 30 * 60 * 1000);
});

test('kimi gate honours KIMI_REVIEW_TIMEOUT_MS', () => {
  const result = runGate({ args: ['--print-args'], env: { KIMI_REVIEW_TIMEOUT_MS: '1000' } });

  const { timeoutMs } = JSON.parse(result.stdout);
  assert.equal(timeoutMs, 1000);
});

test('kimi gate inherits AFK_REVIEW_TIMEOUT_MS when no gate override exists', () => {
  const result = runGate({ args: ['--print-args'], env: { AFK_REVIEW_TIMEOUT_MS: '1234' } });
  const { timeoutMs } = JSON.parse(result.stdout);
  assert.equal(timeoutMs, 1234);
});

test('kimi gate keeps the default bound when the override is unusable', () => {
  // `0` is the dangerous one: Node reads it as "no timeout", so a typo would
  // silently restore the unbounded hang this bound exists to prevent.
  for (const value of ['0', '-1', 'abc']) {
    const result = runGate({ args: ['--print-args'], env: { KIMI_REVIEW_TIMEOUT_MS: value } });
    const { timeoutMs } = JSON.parse(result.stdout);
    assert.equal(timeoutMs, 30 * 60 * 1000, JSON.stringify(value));
    assert.match(result.stderr, /KIMI_REVIEW_TIMEOUT_MS/, JSON.stringify(value));
  }
});

test('a kimi review that never returns ends as a non-zero ERROR, not silence', {
  // A POSIX shebang stub; the Windows launcher path cannot run one.
  skip: process.platform === 'win32' ? 'needs a POSIX executable stub' : false,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-hang-'));
  try {
    const stub = join(dir, 'kimi-stub');
    writeFileSync(stub, `#!${process.execPath}\nif (process.argv.includes('--version')) { process.stdout.write('stub'); } else { process.on('SIGTERM', () => {}); setInterval(() => {}, 60000); }\n`);
    chmodSync(stub, 0o755);

    const result = runGate({
      args: ['--commit', 'HEAD'],
      env: { KIMI_GATE_BIN: stub, KIMI_REVIEW_TIMEOUT_MS: '2000' },
    });

    // A hang is transient, not a reviewer that is unavailable: it must not exit
    // 0 as a SKIPPED, which the driver reads as "fall back to another family"
    // rather than "retry this role once".
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stdout, /===== KIMI REVIEW \(final message\) =====/);
    assert.match(result.stdout, /ERROR: .*timed out after 2s/);
    assert.match(result.stdout, /KIMI_REVIEW_TIMEOUT_MS/);
    assert.doesNotMatch(result.stdout, /SKIPPED/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the prompt never rides in argv under a shell', () => {
  // The invariant behind two Windows-only deaths, both verified against the real
  // CLI: (1) Node concatenates argv UNESCAPED under a shell (DEP0190), so cmd.exe
  // split the multi-word prompt and Kimi read its second word as a subcommand
  // (`No such command 'are'`, exit 2); (2) the CLI cannot read non-ASCII from
  // stdin at all (`UnicodeEncodeError: … surrogates not allowed`). Spawning
  // directly with the prompt in argv is the one shape that satisfies both, so the
  // shape is contract, not detail.
  const result = runGate({ args: ['--print-args'] });

  const { transport, shell, fallback, promptBytes } = JSON.parse(result.stdout);
  assert.equal(transport, 'argv');
  assert.equal(shell, false, 'a shell with a payload in argv is the bug itself');
  assert.ok(promptBytes > 100);

  // The shim fallback is the only shelled path, so its argv must carry flags only.
  assert.equal(fallback.transport, 'stdin');
  assert.deepEqual(fallback.args, ['--quiet', '--input-format', 'text']);
  for (const arg of fallback.args) {
    assert.doesNotMatch(arg, /\s/, `shelled argv element ${JSON.stringify(arg)} must stay shell-safe`);
  }
});

test('the stub reviewer receives the whole prompt, verbatim', () => {
  // The behavioural half of the test above, against a recording stub. On Windows
  // the stub is a `.cmd`, so it also drives the EINVAL shim retry — the one path
  // where a shell is unavoidable and the prompt has to move to stdin.
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-transport-'));
  try {
    const record = join(dir, 'record.json');
    const impl = join(dir, 'stub.mjs');
    writeFileSync(impl, [
      "import { readFileSync, writeFileSync } from 'node:fs';",
      "const argv = process.argv.slice(2);",
      "if (argv.includes('--version')) { process.stdout.write('stub 1.0'); process.exit(0); }",
      "let stdin = '';",
      "try { stdin = readFileSync(0, 'utf8'); } catch {}",
      `writeFileSync(${JSON.stringify(record)}, JSON.stringify({ argv, stdin }));`,
      "process.stdout.write('STUB REVIEW: no findings');",
      '',
    ].join('\n'));

    let bin;
    let shimmed;
    if (process.platform === 'win32') {
      // Node refuses to spawn a .cmd without a shell (EINVAL), which is exactly
      // the install shape the fallback exists for.
      bin = join(dir, 'kimi-stub.cmd');
      writeFileSync(bin, `@echo off\r\n"${process.execPath}" "${impl}" %*\r\n`);
      shimmed = true;
    } else {
      bin = join(dir, 'kimi-stub');
      writeFileSync(bin, `#!${process.execPath}\nprocess.argv.splice(1, 1, ${JSON.stringify(impl)});\nawait import(${JSON.stringify(impl)});\n`);
      chmodSync(bin, 0o755);
      shimmed = false;
    }

    const result = runGate({ args: ['--commit', 'HEAD'], env: { KIMI_GATE_BIN: bin } });

    assert.match(result.stdout, /STUB REVIEW: no findings/, result.stderr);
    const seen = JSON.parse(readFileSync(record, 'utf8'));
    const payload = shimmed ? seen.stdin : seen.argv.at(-1);

    assert.match(payload, /review/i);
    assert.ok(payload.length > 100, 'the whole prompt arrived, not its first word');
    if (shimmed) {
      assert.deepEqual(seen.argv, ['--quiet', '--input-format', 'text']);
      // eslint-disable-next-line no-control-regex
      assert.doesNotMatch(payload, /[^\x20-\x7E\t\r\n]/, 'the stdin fallback must be ASCII-folded');
    } else {
      assert.deepEqual(seen.argv.slice(0, 2), ['--quiet', '-p']);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('kimi gate opt-out short-circuits before any target resolution', () => {
  // An unresolvable target must not turn a disabled gate into an error: the
  // opt-out is checked first, so the operator pays nothing.
  const result = runGate({
    args: ['--base', 'no-such-branch-xyz'],
    env: { KIMI_REVIEW_GATE: 'off' },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SKIPPED: Kimi gate disabled/);
});

test('a bare-name .cmd shim on PATH is resolved and drives a completed review', {
  skip: process.platform === 'win32' ? false : 'the bare-name PATHEXT gap is Windows-only',
}, () => {
  // The end-to-end proof for issue #12, and the only test that exercises the
  // whole chain the gap broke: PATH resolution -> a concrete `.cmd` path ->
  // EINVAL -> spawnViaShell -> a review on stdout. Deliberately does NOT set
  // KIMI_GATE_BIN: an absolute override skips resolution entirely, which is
  // exactly how #10 shipped a gate that reported "not installed" on every
  // npm-installed Windows box.
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-path-'));
  try {
    const impl = join(dir, 'stub.mjs');
    writeFileSync(impl, [
      "const argv = process.argv.slice(2);",
      "if (argv.includes('--version')) { process.stdout.write('stub 1.0'); process.exit(0); }",
      "process.stdout.write('STUB REVIEW: resolved via PATH');",
      '',
    ].join('\n'));
    writeFileSync(join(dir, 'kimi.cmd'), `@echo off\r\n"${process.execPath}" "${impl}" %*\r\n`);

    const inherited = pathKey();
    const result = runGate({
      args: ['--commit', 'HEAD'],
      env: { [inherited]: `${dir}${delimiter}${process.env[inherited] || ''}` },
    });

    assert.match(result.stdout, /STUB REVIEW: resolved via PATH/, result.stderr);
    assert.doesNotMatch(result.stdout, /SKIPPED/, 'a resolvable shim is not "not installed"');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
