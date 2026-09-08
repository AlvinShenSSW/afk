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
