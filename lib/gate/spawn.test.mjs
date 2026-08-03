// The invocation layer every gate launches through. These assertions exist
// because the failure they prevent is silent, environment-dependent, and reads
// like a broken CLI: cmd.exe tears an unquoted argument at its first space, and
// a Windows account named "First Last" puts a space in every temp path a gate
// passes with `-o`.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

import { quoteForShell, spawnCli, spawnViaShell, UNSAFE_SHELL_ARG } from './spawn.mjs';

// A CLI that outlives the shell launched for it: every npm install of these
// tools is a script shim, so the real process tree is `cmd.exe -> node` and a
// kill aimed at the shim leaves the worker running.
function sleepingShim(dir) {
  return shim(dir, `process.on('SIGTERM', () => {}); setInterval(() => {}, 60000);\n`);
}

function echoingShim(dir) {
  return shim(dir, "let b = '';\n"
    + "process.stdin.setEncoding('utf8');\n"
    + "process.stdin.on('data', (c) => { b += c; });\n"
    + "process.stdin.on('end', () => process.stdout.write(b));\n");
}

function shim(dir, body) {
  const js = join(dir, 'worker.mjs');
  writeFileSync(js, body);
  const isWin = process.platform === 'win32';
  const path = join(dir, isWin ? 'shim.cmd' : 'shim.sh');
  // No `exec` on the POSIX side, deliberately: the worker must be a GRANDCHILD
  // on both platforms, which is the shape that strands the stdin pipe.
  writeFileSync(path, isWin
    ? `@echo off\r\n"${process.execPath}" "${js}" %*\r\n`
    : `#!/bin/sh\n"${process.execPath}" "${js}" "$@"\n`);
  if (!isWin) chmodSync(path, 0o755);
  return path;
}

test('quoteForShell wraps exactly what a shell would split', () => {
  assert.equal(quoteForShell('--base'), '--base');
  assert.equal(quoteForShell('origin/main'), 'origin/main');
  assert.equal(quoteForShell('model=gpt-5.6-terra'), 'model=gpt-5.6-terra');
  assert.equal(
    quoteForShell('C:\\Users\\First Last\\AppData\\Local\\Temp\\g\\review.txt'),
    '"C:\\Users\\First Last\\AppData\\Local\\Temp\\g\\review.txt"',
  );
  // An empty value would vanish under a shell and let the NEXT flag become the
  // value — the flag silently changes meaning.
  assert.equal(quoteForShell(''), '""');
  for (const meta of ['a&b', 'a|b', 'a>b', 'a<b', 'a^b', 'a(b)']) {
    assert.equal(quoteForShell(meta), `"${meta}"`, meta);
  }
});

test('quoteForShell refuses a value it cannot quote safely', () => {
  // Paths and refs never contain a quote. One that does would be re-parsed by
  // cmd.exe, so fail loudly instead of shipping something that half-works.
  assert.throws(() => quoteForShell('say "hi" now'), /double quote/);

  // And a quote WITHOUT whitespace is the dangerous one, because it is the one
  // that looks safe: nothing else in it needs quoting, so an ordering that
  // checked NEEDS_QUOTES first returned it untouched and cmd.exe read the quote
  // as syntax — swallowing the arguments after it and silently changing which
  // target the gate reviewed.
  assert.throws(() => quoteForShell('feature/"test'), /double quote/);
  assert.throws(() => quoteForShell('a"b'), /double quote/);
  assert.throws(() => quoteForShell('"'), /double quote/);
});

test('quoteForShell refuses cmd variable expansion, which no quoting can stop', () => {
  // Quoting is the wrong tool: cmd.exe expands %NAME% inside double quotes too.
  assert.throws(() => quoteForShell('%PATH%'), /variable expansion/);
  assert.throws(() => quoteForShell('feature/%USERNAME%-x'), /variable expansion/);
  assert.throws(() => quoteForShell('%%PATH%%'), /variable expansion/);

  // A `%` that cannot name anything is left alone — refusing these would turn
  // ordinary refs and paths into errors for nothing.
  assert.equal(quoteForShell('a%b'), 'a%b');
  assert.equal(quoteForShell('50%'), '50%');
  assert.equal(quoteForShell('%%'), '%%');
});

test('cmd.exe really does expand a quoted %NAME% — the rule is not cargo-culted', {
  skip: process.platform === 'win32' ? false : 'cmd.exe-specific',
}, () => {
  // Pin the behaviour the refusal exists for, against the real shell. %USERNAME%
  // is defined on every Windows box, so this cannot silently become a no-op.
  const dir = mkdtempSync(join(tmpdir(), 'gate-pct-'));
  try {
    const echo = join(dir, 'echo-argv.mjs');
    writeFileSync(echo, 'console.log(JSON.stringify(process.argv.slice(2)));\n');
    const stub = join(dir, 'stub.cmd');
    writeFileSync(stub, `@echo off\r\n"${process.execPath}" "${echo}" %*\r\n`);

    // Quoted exactly as quoteForShell would have quoted a spaced value.
    const res = spawnSync(`"${stub}"`, ['"feature/%USERNAME%-x"'], {
      encoding: 'utf8', shell: true, timeout: 30000,
    });
    const seen = JSON.parse(res.stdout.trim())[0];

    assert.notEqual(seen, 'feature/%USERNAME%-x', 'quoting does NOT prevent expansion');
    assert.doesNotMatch(seen, /%USERNAME%/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('spawnCli delivers a spaced path verbatim, shim or not', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gate spawn '));  // a space, on purpose
  try {
    const echo = join(dir, 'echo-argv.mjs');
    writeFileSync(echo, 'console.log(JSON.stringify(process.argv.slice(2)));\n');
    const outFile = resolve(dir, 'sub dir', 'review.txt');

    let bin;
    let args;
    if (process.platform === 'win32') {
      // A `.cmd` shim is the install shape that forces the shell path — the one
      // Node cannot spawn directly (EINVAL).
      bin = join(dir, 'stub.cmd');
      writeFileSync(bin, `@echo off\r\n"${process.execPath}" "${echo}" %*\r\n`);
      args = ['exec', 'review', '-o', outFile, '--base', 'origin/main'];
    } else {
      bin = process.execPath;
      args = [echo, 'exec', 'review', '-o', outFile, '--base', 'origin/main'];
    }

    const res = spawnCli(bin, args, { encoding: 'utf8', timeout: 30000 });

    assert.equal(res.status, 0, `${res.error?.code ?? ''} ${res.stderr ?? ''}`);
    const seen = JSON.parse(res.stdout.trim());
    assert.equal(seen[seen.indexOf('-o') + 1], outFile, 'the spaced path must arrive in one piece');
    assert.equal(seen.at(-1), 'origin/main', 'nothing after the spaced path may shift');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a bare shelled spawn is what breaks — the regression this guards', {
  skip: process.platform === 'win32' ? false : 'cmd.exe-specific',
}, () => {
  // Pin the actual Node behaviour the module exists for, so a future "simplify"
  // back to `shell: true` fails here instead of in a customer's gate run.
  const dir = mkdtempSync(join(tmpdir(), 'gate-spawn-'));
  try {
    const echo = join(dir, 'echo-argv.mjs');
    writeFileSync(echo, 'console.log(JSON.stringify(process.argv.slice(2)));\n');
    const stub = join(dir, 'stub.cmd');
    writeFileSync(stub, `@echo off\r\n"${process.execPath}" "${echo}" %*\r\n`);
    const spaced = resolve(dir, 'sub dir', 'review.txt');

    const naive = spawnSync(stub, ['-o', spaced], { encoding: 'utf8', shell: true, timeout: 30000 });
    const seen = JSON.parse(naive.stdout.trim());

    assert.ok(seen.length > 2, 'unquoted, cmd.exe splits the spaced path into two argv elements');
    assert.notEqual(seen[1], spaced);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── rule 3: a payload under a shell must not be Node's `input` ──────────────

test('a shelled payload reaches the CLI verbatim, non-ASCII and newlines included', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gate-stdin-'));
  try {
    const payload = '审查这个 diff\nline two\tand a tab\n'.repeat(50);
    const res = spawnViaShell(echoingShim(dir), [], {
      encoding: 'utf8',
      input: payload,
      timeout: 30000,
      killSignal: 'SIGKILL',
    });

    assert.equal(res.status, 0, `${res.error?.code ?? ''} ${res.stderr ?? ''}`);
    // A gate that loses its prompt gets a review of nothing and cannot tell.
    assert.equal(res.stdout, payload);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the payload file does not outlive the call', () => {
  // The prompt carries the diff under review. It reaches disk only to get onto
  // an inherited descriptor, and must not still be there afterwards — including
  // on the path where the CLI failed.
  const dir = mkdtempSync(join(tmpdir(), 'gate-stdin-life-'));
  const before = new Set(readdirSync(tmpdir()).filter((e) => e.startsWith('afk-stdin-')));
  try {
    spawnViaShell(echoingShim(dir), [], {
      encoding: 'utf8', input: 'a prompt', timeout: 30000, killSignal: 'SIGKILL',
    });
    // And when the shim itself is not there to read it.
    spawnViaShell(join(dir, 'no-such-shim'), [], {
      encoding: 'utf8', input: 'a prompt', timeout: 30000, killSignal: 'SIGKILL',
    });

    const strays = readdirSync(tmpdir())
      .filter((e) => e.startsWith('afk-stdin-') && !before.has(e));
    assert.deepEqual(strays, [], `payload directories left behind: ${strays.join(', ')}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a shelled CLI that ignores its kill reports a timeout instead of hanging forever', () => {
  // THE regression this rule exists for. `input` under a shell strands the
  // stdin pipe in the surviving grandchild and spawnSync waits on that write
  // with no bound — the gate never reports the timeout it already detected.
  //
  // The bound has to come from OUTSIDE the process doing the spawn: a hang sits
  // inside a synchronous spawnSync, which blocks the event loop, so no
  // test-runner timeout can ever fire. The probe runs in a child, and this
  // test's own spawnSync is what cuts it off.
  const dir = mkdtempSync(join(tmpdir(), 'gate-stdin-hang-'));
  try {
    const probe = join(dir, 'probe.mjs');
    writeFileSync(probe, `import { spawnViaShell } from ${JSON.stringify(new URL('./spawn.mjs', import.meta.url).href)};\n`
      + `const r = spawnViaShell(${JSON.stringify(sleepingShim(dir))}, [], {\n`
      + `  encoding: 'utf8', input: 'a prompt', timeout: 500, killSignal: 'SIGKILL',\n`
      + `});\n`
      + `process.stdout.write(JSON.stringify({ code: r.error && r.error.code, signal: r.signal }));\n`);

    const res = spawnSync(process.execPath, [probe], { encoding: 'utf8', timeout: 30000 });

    assert.notEqual(res.error?.code, 'ETIMEDOUT',
      'spawnViaShell never returned — the stdin payload is deadlocking the shell path again');
    assert.equal(res.status, 0, `${res.error?.code ?? ''} ${res.stderr ?? ''}`);
    // And it must be reported as a timeout, not as a clean empty run.
    assert.deepEqual(JSON.parse(res.stdout), { code: 'ETIMEDOUT', signal: 'SIGKILL' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a refused argument comes back as a launch error, never as a throw', () => {
  // A gate's contract is that EVERY outcome is a parseable protocol block. An
  // exception escaping the spawn call exits with a stack trace instead, and the
  // driver cannot classify a review that never announced itself — so the refusal
  // rides the same channel ENOENT and ETIMEDOUT already use.
  for (const bad of ['%PATH%', 'a"b']) {
    let res;
    assert.doesNotThrow(() => {
      res = spawnViaShell('some-cli', ['--base', bad], { encoding: 'utf8' });
    }, `spawnViaShell must not throw for ${bad}`);
    assert.equal(res.error.code, UNSAFE_SHELL_ARG);
    assert.equal(res.status, null);
    assert.equal(res.stdout, '');
  }

  // Including when the refused value is the binary itself.
  const res = spawnViaShell('C:\tools\%TOOLDIR%\cli.cmd', [], { encoding: 'utf8' });
  assert.equal(res.error.code, UNSAFE_SHELL_ARG);
});
