// Characterization tests: pin kimi-gate's observable contract BEFORE the shared
// lib extraction, so the migration is verified behaviour-preserving rather than
// believed to be. Assertions here must survive the refactor unchanged.
//
// Every test terminates at a local check; none may reach the real `kimi` binary.

import assert from 'node:assert/strict';
import {
  chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { test } from 'node:test';

import { gateTestEnv, nonMergeHead, spawnGate, stubPath } from './gate-test-env.mjs';

const TEST_COMMIT = nonMergeHead();

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
  const result = runGate({ args: ['--commit', TEST_COMMIT, '--print-args'] });
  const { promptBytes, command } = JSON.parse(result.stdout);
  assert.ok(promptBytes > 0);
  assert.equal(command, `git show ${TEST_COMMIT}`);
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
  assert.equal(timeoutMs, 45 * 60 * 1000);
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
    assert.equal(timeoutMs, 45 * 60 * 1000, JSON.stringify(value));
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
      args: ['--commit', TEST_COMMIT],
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
  // The invariant behind three deaths, all verified against the real CLI:
  // (1) Node concatenates argv UNESCAPED under a shell (DEP0190), so cmd.exe
  // split the multi-word prompt and Kimi read its second word as a subcommand
  // (`No such command 'are'`, exit 2); (2) there is no stdin transport to move
  // it to (`--input-format` does not exist); (3) flags invented from a newer
  // build's help text are rejected outright. So: prompt in argv, no shell — and
  // under a shell, a file reference instead of the payload.
  const result = runGate({ args: ['--print-args'] });

  const { transport, shell, args, fallback, promptBytes } = JSON.parse(result.stdout);
  assert.equal(transport, 'argv');
  assert.equal(shell, false, 'a shell with a payload in argv is the bug itself');
  assert.ok(promptBytes > 100);
  assert.deepEqual(args.filter((a) => a.length < 40), ['-p', '--output-format', 'text']);

  // The shim fallback is the only shelled path. Its argv may carry a quotable
  // one-line instruction, but never the brief: cmd.exe cannot carry a multi-line
  // value even quoted, and this CLI has nowhere else to put it.
  assert.equal(fallback.transport, 'brief-file');
  assert.deepEqual(fallback.args.filter((a) => a.length < 40), ['-p', '--output-format', 'text']);
  const instruction = fallback.args[fallback.args.indexOf('-p') + 1];
  assert.doesNotMatch(instruction, /\n/, 'a multi-line argv element cannot survive cmd.exe');
  assert.ok(instruction.length < promptBytes / 2, 'the brief must not be in argv');
  assert.match(instruction, /review only/i, 'the read-only clause must not depend on the file being read');
});

test('the stub reviewer receives the whole prompt, verbatim', {
  skip: process.platform === 'win32' ? 'the POSIX stub needs a shebang' : false,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-transport-'));
  try {
    const record = join(dir, 'record.json');
    const bin = posixStub(dir, strictStub(dir, { record }));

    const result = runGate({ args: ['--commit', TEST_COMMIT], env: { KIMI_GATE_BIN: bin } });

    assert.match(result.stdout, /STUB REVIEW: APPROVE — no findings/, result.stderr);
    const { argv } = JSON.parse(readFileSync(record, 'utf8'));
    const payload = argv[argv.indexOf('-p') + 1];
    assert.match(payload, /review/i);
    assert.ok(payload.length > 100, 'the whole prompt arrived, not its first word');
    assert.deepEqual(argv.slice(-2), ['--output-format', 'text']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the shim fallback hands over a brief on disk and takes it back', {
  skip: process.platform === 'win32' ? 'the POSIX stub needs a shebang' : false,
}, () => {
  // The path a Windows `.cmd` shim forces — and the reason it is forceable at
  // all: the last two Windows-only paths in this gate shipped having never
  // executed anywhere, because EINVAL cannot be produced off Windows. The
  // transport is forced here; the platform is not.
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-brief-'));
  try {
    const record = join(dir, 'record.json');
    const impl = strictStub(dir, { record });
    // The stub reads whatever file the instruction names, exactly as the real
    // CLI is asked to, so the assertion covers the file's existence AT SPAWN
    // TIME rather than after the gate has cleaned it up.
    writeFileSync(impl, readFileSync(impl, 'utf8').replace(
      "let stdin = '';",
      "const named = /brief at (\\S+) in full/.exec(argv.join(' '));\n"
      + "const brief = named ? readFileSync(named[1], 'utf8') : '';\n"
      + "let stdin = '';",
    ).replace('JSON.stringify({ argv, stdin })', 'JSON.stringify({ argv, stdin, brief })')
      .replace("process.stdout.write('STUB REVIEW: APPROVE — no findings');",
        "process.stdout.write('APPROVE WITH COMMENTS\\nSTUB REVIEW: APPROVE — no findings');"));
    const bin = posixStub(dir, impl);

    const result = runGate({
      args: ['--commit', TEST_COMMIT],
      env: { KIMI_GATE_BIN: bin, KIMI_GATE_FORCE_SHIM: '1' },
    });

    assert.match(result.stdout, /STUB REVIEW: APPROVE — no findings/, `${result.stdout}\n${result.stderr}`);
    const { argv, brief } = JSON.parse(readFileSync(record, 'utf8'));
    assert.deepEqual(argv.filter((a) => a.length < 40), ['-p', '--output-format', 'text']);
    assert.ok(brief.length > 100, 'the brief must exist and be complete while the CLI runs');
    assert.match(brief, /review/i);

    // And it must not outlive the call: the brief holds the same content as the
    // transcript, but it exists only to be read during the spawn.
    const named = /brief at (\S+) in full/.exec(argv.join(' '));
    assert.ok(named, `no brief path in ${JSON.stringify(argv)}`);
    assert.equal(existsSync(named[1]), false, 'the brief must be removed after the call');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a shim answer with no verdict line is an error, never a review', {
  skip: process.platform === 'win32' ? 'the POSIX stub needs a shebang' : false,
}, () => {
  // On the shim path the brief travels by reference, so a CLI that never read
  // it still exits 0 with fluent text — and that text would otherwise be
  // emitted as a verdict. The prompt mandates a verdict line; its absence means
  // the brief did not arrive.
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-unread-'));
  try {
    const bin = posixStub(dir, strictStub(dir, {
      body: "process.stdout.write('I could not find that file. What would you like me to review?');",
    }));

    const result = runGate({
      args: ['--commit', TEST_COMMIT],
      env: { KIMI_GATE_BIN: bin, KIMI_GATE_FORCE_SHIM: '1' },
    });

    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stdout, /ERROR: /);
    assert.match(result.stdout, /never read/i);
    assert.doesNotMatch(result.stdout, /What would you like me to review/, 'a non-review must not be emitted as a verdict');
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
      "process.stdout.write('STUB REVIEW: APPROVE — resolved via PATH');",
      '',
    ].join('\n'));
    writeFileSync(join(dir, 'kimi.cmd'), `@echo off\r\n"${process.execPath}" "${impl}" %*\r\n`);

    // stubPath, not a prepend: a real `kimi.exe` later on PATH would make
    // pass 1 return the bare name, and this gate would then spawn the REAL,
    // metered CLI instead of the stub.
    const result = runGate({ args: ['--commit', TEST_COMMIT], env: stubPath(dir, 'kimi') });

    assert.match(result.stdout, /STUB REVIEW: APPROVE — resolved via PATH/, result.stderr);
    assert.doesNotMatch(result.stdout, /SKIPPED/, 'a resolvable shim is not "not installed"');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── the argv the CLI actually accepts ───────────────────────────────────────
// Every stub above ignores its argv, which is exactly why a flag list the real
// CLI rejects rode a fully green suite: `--quiet` and `--input-format` are not
// in `kimi --help` for 0.29.1, so every review exited 1 with empty stdout and
// the gate reported "produced no final message" forever. A stub that accepts
// anything cannot catch a flag the CLI refuses, so this one refuses too.

/** The documented headless surface: `-p <prompt>` and `--output-format <fmt>`. */
function strictStub(dir, { record, body = "process.stdout.write('STUB REVIEW: APPROVE — no findings');" } = {}) {
  const impl = join(dir, 'strict-stub.mjs');
  writeFileSync(impl, [
    "import { readFileSync, writeFileSync } from 'node:fs';",
    "const argv = process.argv.slice(2);",
    "if (argv.includes('--version')) { process.stdout.write('0.29.1'); process.exit(0); }",
    "const TAKES_VALUE = new Set(['-p', '--prompt', '--output-format']);",
    "for (let i = 0; i < argv.length; i += 1) {",
    "  const arg = argv[i];",
    "  if (!arg.startsWith('-')) continue;",
    "  if (TAKES_VALUE.has(arg)) { i += 1; continue; }",
    // Commander's own wording, so the gate's drift diagnosis is matched against
    // the string the real CLI emits rather than one invented here.
    "  process.stderr.write(`error: unknown option '${arg}'\\n`);",
    "  process.exit(1);",
    "}",
    "let stdin = '';",
    "try { stdin = readFileSync(0, 'utf8'); } catch {}",
    record ? `writeFileSync(${JSON.stringify(record)}, JSON.stringify({ argv, stdin }));` : '',
    body,
    '',
  ].join('\n'));
  return impl;
}

function posixStub(dir, impl) {
  const bin = join(dir, 'kimi-strict');
  writeFileSync(bin, `#!${process.execPath}\nprocess.argv.splice(1, 1, ${JSON.stringify(impl)});\nawait import(${JSON.stringify(impl)});\n`);
  chmodSync(bin, 0o755);
  return bin;
}

test('the gate passes only flags this CLI documents', {
  skip: process.platform === 'win32' ? 'the POSIX stub needs a shebang' : false,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-flags-'));
  try {
    const record = join(dir, 'record.json');
    const bin = posixStub(dir, strictStub(dir, { record }));

    const result = runGate({ args: ['--commit', TEST_COMMIT], env: { KIMI_GATE_BIN: bin } });

    assert.match(result.stdout, /STUB REVIEW: APPROVE — no findings/, `${result.stdout}\n${result.stderr}`);
    const { argv } = JSON.parse(readFileSync(record, 'utf8'));
    assert.ok(argv.includes('-p'), `no -p in ${JSON.stringify(argv)}`);
    assert.equal(argv[argv.indexOf('--output-format') + 1], 'text');
    for (const gone of ['--quiet', '--input-format', '--print', '--final-message-only']) {
      assert.ok(!argv.includes(gone), `${gone} is not a flag this CLI accepts`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a rejected flag is reported as CLI drift, not as an empty review', {
  skip: process.platform === 'win32' ? 'the POSIX stub needs a shebang' : false,
}, () => {
  // The failure this whole change exists for: the gate said "kimi produced no
  // final message (exit 1)" on every single review, which reads as a broken
  // reviewer rather than a helper and a CLI that disagree about a flag name.
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-drift-'));
  try {
    const impl = strictStub(dir, {});
    // A stub that refuses the very flag the gate is expected to send.
    writeFileSync(impl, readFileSync(impl, 'utf8').replace(
      "const TAKES_VALUE = new Set(['-p', '--prompt', '--output-format']);",
      "const TAKES_VALUE = new Set(['-p', '--prompt', '-m', '--model']);",
    ));
    const bin = posixStub(dir, impl);

    const result = runGate({ args: ['--commit', TEST_COMMIT], env: { KIMI_GATE_BIN: bin } });

    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /ERROR: /);
    assert.match(result.stdout, /--output-format/, 'the rejected flag must be named');
    assert.match(result.stdout, /0\.29\.1/, 'the CLI version must be named');
    assert.doesNotMatch(result.stdout, /produced no final message/);
    assert.doesNotMatch(result.stdout, /SKIPPED/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the forced shim transport replaces the primary spawn, never doubles it', {
  skip: process.platform === 'win32' ? 'the POSIX stub needs a shebang' : false,
}, () => {
  // A seam that ran the primary spawn first and the shim second bought TWO
  // complete paid reviews and twice the documented bound, and discarded the
  // first outcome — a verdict, or a timeout — with no trace. Stubs made it
  // invisible: both spawns "succeed".
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-count-'));
  try {
    const counter = join(dir, 'spawns.log');
    const bin = posixStub(dir, strictStub(dir, {
      body: `import { appendFileSync } from 'node:fs';\n`
        + `appendFileSync(${JSON.stringify(counter)}, 'spawn\\n');\n`
        + "process.stdout.write('APPROVE\\nSTUB REVIEW: APPROVE — no findings');",
    }));

    const result = runGate({
      args: ['--commit', TEST_COMMIT],
      env: { KIMI_GATE_BIN: bin, KIMI_GATE_FORCE_SHIM: '1' },
    });

    // Assert the review happened too: counting alone cannot tell one spawn from
    // none, and a gate that skipped would satisfy the count.
    assert.match(result.stdout, /STUB REVIEW: APPROVE — no findings/, `${result.stdout}\n${result.stderr}`);
    assert.equal(readFileSync(counter, 'utf8').split('\n').filter(Boolean).length, 1,
      'the forced transport must REPLACE the primary spawn, not follow it');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a no-output failure names the version and the argv, whatever the CLI said', {
  skip: process.platform === 'win32' ? 'the POSIX stub needs a shebang' : false,
}, () => {
  // The mechanism behind the drift diagnosis, and the part that must not depend
  // on recognizing a dialect: this CLI has already emitted wording the pattern
  // would miss ("No such command 'are'"), so every empty-stdout failure carries
  // the version and the exact argv rather than only the ones a regex knows.
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-mystery-'));
  try {
    const bin = posixStub(dir, strictStub(dir, {
      body: "process.stderr.write('Segmentation fault: 11'); process.exit(139);",
    }));

    const result = runGate({ args: ['--commit', TEST_COMMIT], env: { KIMI_GATE_BIN: bin } });

    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /produced no final message/);
    assert.match(result.stdout, /0\.29\.1/, 'the CLI that answered must be named');
    assert.match(result.stdout, /--output-format/, 'the argv sent must be named');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the forced transport is observable, not silent', () => {
  // The gate's own comment calls the invocation shape "part of the contract":
  // a seam that reported the primary shape while running the indirect one would
  // make every diagnosis of that path a guess.
  const result = runGate({ args: ['--print-args'], env: { KIMI_GATE_FORCE_SHIM: '1' } });

  const { transport, shell, args } = JSON.parse(result.stdout);
  assert.equal(transport, 'brief-file');
  assert.equal(shell, true);
  const instruction = args[args.indexOf('-p') + 1];
  assert.match(instruction, /review only/i);
  assert.doesNotMatch(instruction, /[^\x00-\x7F]/, 'a shelled argv element stays ASCII');
});

test('a signal-killed kimi is an ERROR, never a partial verdict', {
  skip: process.platform === 'win32' ? 'needs a POSIX executable stub' : false,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-sigkill-'));
  try {
    const stub = join(dir, 'kimi-stub');
    writeFileSync(stub, `#!${process.execPath}\nif (process.argv.includes('--version')) { process.stdout.write('stub'); } else { process.stdout.write('PARTIAL: the diff looks f'); process.kill(process.pid, 'SIGKILL'); }\n`);
    chmodSync(stub, 0o755);

    const result = runGate({
      args: ['--commit', TEST_COMMIT],
      env: { KIMI_GATE_BIN: stub },
    });

    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stdout, /ERROR: kimi did not exit normally/);
    assert.match(result.stdout, /SIGKILL/);
    // The truncated transcript must not surface inside the marker block.
    assert.doesNotMatch(result.stdout, /PARTIAL: the diff/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('output past the buffer bound is an ERROR naming the knob, not a verdict', {
  skip: process.platform === 'win32' ? 'needs a POSIX executable stub' : false,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-enobufs-'));
  try {
    const stub = join(dir, 'kimi-stub');
    writeFileSync(stub, `#!${process.execPath}\nif (process.argv.includes('--version')) { process.stdout.write('stub'); } else { process.stdout.write('x'.repeat(8192)); }\n`);
    chmodSync(stub, 0o755);

    const result = runGate({
      args: ['--commit', TEST_COMMIT],
      env: { KIMI_GATE_BIN: stub, KIMI_REVIEW_MAX_BUFFER_BYTES: '1024' },
    });

    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stdout, /ERROR: kimi did not exit normally/);
    assert.match(result.stdout, /ENOBUFS/);
    assert.match(result.stdout, /KIMI_REVIEW_MAX_BUFFER_BYTES/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a direct-path kimi review without a verdict line is an error, not a verdict', {
  skip: process.platform === 'win32' ? 'needs a POSIX executable stub' : false,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'kimi-gate-no-verdict-'));
  try {
    const stub = join(dir, 'kimi-stub');
    writeFileSync(stub, `#!${process.execPath}\nif (process.argv.includes('--version')) { process.stdout.write('stub'); } else { process.stdout.write('fluent text with no verdict line'); }\n`);
    chmodSync(stub, 0o755);
    const result = runGate({ args: ['--commit', TEST_COMMIT], env: { KIMI_GATE_BIN: stub } });
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stdout, /ERROR: .*verdict/);
    assert.doesNotMatch(result.stdout, /fluent text/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
