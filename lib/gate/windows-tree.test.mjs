import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

const windows = { skip: process.platform === 'win32' ? false : 'requires live Windows process-tree semantics' };
const taskkill = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}
function cleanup(pid) {
  if (pid && alive(pid)) spawnSync(taskkill, ['/PID', String(pid), '/T', '/F'], { timeout: 5000, stdio: 'ignore' });
}

for (const mode of ['input-timeout', 'no-input-timeout', 'overflow']) {
  test(`Windows ${mode} removes the worker and descendant while preserving an unrelated process`, windows, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'afk tree '));
    const sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    const pidFile = join(dir, 'pids.json');
    let pids = [];
    try {
      const worker = join(dir, 'worker.mjs');
      const shim = join(dir, 'shim.cmd');
      writeFileSync(worker, `import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
writeFileSync(${JSON.stringify(pidFile)}, JSON.stringify([process.pid, child.pid]));
${mode === 'overflow' ? "setInterval(() => process.stdout.write(Buffer.alloc(65536, 120)), 20);" : 'setInterval(() => {}, 1000);'}
`);
      writeFileSync(shim, `@echo off\r\n"${process.execPath}" "${worker}"\r\n`);
      const probe = join(dir, 'probe.mjs');
      writeFileSync(probe, `import { spawnViaShell } from ${JSON.stringify(new URL('./spawn.mjs', import.meta.url).href)};
const result = spawnViaShell(${JSON.stringify(shim)}, [], {
  encoding: 'utf8', timeout: 2500, killSignal: 'SIGKILL', maxBuffer: 32768,
  ${mode === 'input-timeout' ? "input: 'synthetic prompt'," : ''}
});
process.stdout.write(JSON.stringify({ code: result.error?.code, signal: result.signal, status: result.status }));
`);
      const result = spawnSync(process.execPath, [probe], { encoding: 'utf8', timeout: 20000 });
      assert.ok(existsSync(pidFile), `worker readiness missing: ${result.stderr}`);
      pids = JSON.parse(readFileSync(pidFile, 'utf8'));
      assert.equal(pids.length, 2);
      assert.equal(result.error, undefined, `probe did not finish: ${result.error?.message}`);
      assert.equal(result.status, 0, result.stderr);
      const outcome = JSON.parse(result.stdout);
      assert.equal(outcome.code, mode === 'overflow' ? 'ENOBUFS' : 'ETIMEDOUT');
      const until = Date.now() + 2000;
      while (pids.some(alive) && Date.now() < until) await delay(50);
      const survivors = pids.filter(alive);
      assert.deepEqual(survivors, [], `surviving descendants: ${survivors.join(', ')}`);
      assert.equal(alive(sentinel.pid), true, 'unrelated sentinel was terminated');
    } finally {
      if (!pids.length && existsSync(pidFile)) pids = JSON.parse(readFileSync(pidFile, 'utf8'));
      for (const pid of pids) cleanup(pid);
      cleanup(sentinel.pid);
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('Windows supervisor preserves Unicode payload and transcript descriptors', windows, async () => {
  const { openSync, closeSync } = await import('node:fs');
  const { spawnViaShell } = await import('./spawn.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'afk unicode '));
  let fd;
  try {
    const worker = join(dir, 'echo.mjs');
    const shim = join(dir, 'echo.cmd');
    const log = join(dir, 'transcript.txt');
    writeFileSync(worker, "let data = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', x => data += x); process.stdin.on('end', () => { process.stdout.write(data); process.stderr.write('stderr'); });\n");
    writeFileSync(shim, `@echo off\r\n"${process.execPath}" "${worker}"\r\n`);
    const payload = 'hello 世界\n';
    const piped = spawnViaShell(shim, [], { input: payload, encoding: 'utf8', timeout: 2500 });
    assert.equal(piped.error, undefined);
    assert.equal(piped.status, 0);
    assert.equal(piped.stdout, payload);
    assert.equal(piped.stderr, 'stderr');
    fd = openSync(log, 'w');
    const logged = spawnViaShell(shim, [], { input: payload, stdio: ['pipe', fd, fd], timeout: 2500 });
    closeSync(fd); fd = undefined;
    assert.equal(logged.error, undefined);
    assert.equal(logged.status, 0);
    assert.equal(logged.stdout, null);
    assert.equal(logged.stderr, null);
    assert.equal(readFileSync(log, 'utf8'), payload + 'stderr');
  } finally {
    if (fd !== undefined) closeSync(fd);
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Windows exited shell with a pipe-holding child returns a bounded cleanup error', windows, () => {
  const dir = mkdtempSync(join(tmpdir(), 'afk drain '));
  const pidFile = join(dir, 'pid');
  try {
    const worker = join(dir, 'hold.mjs');
    const shim = join(dir, 'detach.cmd');
    const probe = join(dir, 'probe.mjs');
    writeFileSync(worker, `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); setInterval(() => {}, 1000);\n`);
    writeFileSync(shim, `@echo off\r\nstart "" /b "${process.execPath}" "${worker}"\r\n`);
    writeFileSync(probe, `import { spawnViaShell } from ${JSON.stringify(new URL('./spawn.mjs', import.meta.url).href)}; const r = spawnViaShell(${JSON.stringify(shim)}, [], { encoding: 'utf8', timeout: 2500 }); process.stdout.write(JSON.stringify({code: r.error?.code, status: r.status}));\n`);
    const result = spawnSync(process.execPath, [probe], { encoding: 'utf8', timeout: 15000 });
    assert.ok(existsSync(pidFile), result.stderr);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { code: 'ERR_AFK_TREE_CLEANUP', status: null });
  } finally {
    if (existsSync(pidFile)) cleanup(Number(readFileSync(pidFile, 'utf8')));
    rmSync(dir, { recursive: true, force: true });
  }
});
