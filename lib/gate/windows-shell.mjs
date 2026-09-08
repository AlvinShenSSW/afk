import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CLEANUP_TIMEOUT_MS = 5000;
const DEFAULT_MAX_BUFFER = 1024 * 1024;
const helper = fileURLToPath(import.meta.url);
const cleanupCode = 'ERR_AFK_TREE_CLEANUP';

function failed(message, code) {
  return { error: Object.assign(new Error(message), { code }), status: null, signal: null,
    pid: 0, stdout: null, stderr: null, output: [null, null, null] };
}

export function spawnWindowsShell(command, args, options) {
  const shared = typeof options.stdio === 'string' ? options.stdio : 'pipe';
  const requested = Array.isArray(options.stdio) ? options.stdio : [shared, shared, shared];
  const outer = [];
  const inner = [];
  for (let index = 0; index < 3; index++) {
    const value = requested[index] ?? 'pipe';
    if (value === 'pipe') {
      outer.push('ignore');
      inner.push(index === 0 ? 'ignore' : 'pipe');
    } else if (value === 'ignore') {
      outer.push('ignore'); inner.push('ignore');
    } else if (value === 'inherit' || Number.isInteger(value)) {
      outer.push(value === 'inherit' ? index : value); inner.push(index);
    } else {
      return failed('unsupported Windows shell stdio; expected pipe, ignore, inherit or a descriptor', 'EINVAL');
    }
  }
  const dir = mkdtempSync(join(tmpdir(), 'afk-shell-'));
  try {
    writeFileSync(join(dir, 'request.json'), JSON.stringify({ command, args, stdio: inner,
      timeout: options.timeout ?? 0, killSignal: options.killSignal ?? 'SIGTERM',
      maxBuffer: options.maxBuffer ?? DEFAULT_MAX_BUFFER,
      windowsHide: options.windowsHide ?? true,
    }));
    // The supervisor owns every bound; killing it first would strand its tree.
    const supervisor = spawnSync(process.execPath, [helper, dir], {
      cwd: options.cwd, env: options.env, stdio: outer, windowsHide: true,
    });
    if (supervisor.error || supervisor.status !== 0) {
      return failed(`Windows shell supervisor failed: ${supervisor.error?.message ?? supervisor.signal ?? supervisor.status}`, cleanupCode);
    }
    let result;
    try { result = JSON.parse(readFileSync(join(dir, 'result.json'), 'utf8')); } catch (error) {
      return failed(`Windows shell supervisor result unavailable: ${error.message}`, cleanupCode);
    }
    if (!result || !Array.isArray(result.output) || result.output.length !== 3
      || !result.output.every((value) => value === null || typeof value === 'string')) {
      return failed('Windows shell supervisor returned an invalid result', cleanupCode);
    }
    result.output = result.output.map((value) => {
      if (value === null) return null;
      const bytes = Buffer.from(value, 'base64');
      return options.encoding && options.encoding !== 'buffer' ? bytes.toString(options.encoding) : bytes;
    });
    result.stdout = result.output[1]; result.stderr = result.output[2];
    if (result.error) result.error = Object.assign(new Error(result.error.message), { code: result.error.code });
    return result;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function supervise(request, { spawnImpl = spawn, killImpl = spawnSync } = {}) {
  return new Promise((resolve) => {
    const buffers = [null, request.stdio[1] === 'pipe' ? [] : null, request.stdio[2] === 'pipe' ? [] : null];
    let size = 0;
    let error;
    let status = null;
    let signal = null;
    let exited = false;
    let settled = false;
    let terminating = false;
    let reviewTimer;
    let drainTimer;
    let cleanupDeadline;
    let child;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(reviewTimer); clearTimeout(drainTimer);
      child?.stdout?.destroy(); child?.stderr?.destroy();
      resolve({ pid: child?.pid ?? 0, status, signal, ...(error ? { error } : {}),
        output: buffers.map((parts) => parts === null ? null : Buffer.concat(parts).toString('base64')) });
    };
    const cleanupFailure = (message) => {
      error = { code: cleanupCode, message: `${message}${error ? `; initial cause: ${error.code}` : ''}` };
      status = null;
      finish();
    };
    const boundDrain = () => {
      cleanupDeadline ??= Date.now() + CLEANUP_TIMEOUT_MS;
      clearTimeout(drainTimer);
      drainTimer = setTimeout(() => cleanupFailure('Windows shell output did not close within the cleanup deadline'),
        Math.max(1, cleanupDeadline - Date.now()));
    };
    const terminate = (code) => {
      if (settled || terminating) return;
      terminating = true;
      clearTimeout(reviewTimer);
      error = { code, message: `Windows shell ${code === 'ETIMEDOUT' ? 'timed out' : 'exceeded maxBuffer'}` };
      signal = request.killSignal;
      status = null;
      cleanupDeadline = Date.now() + CLEANUP_TIMEOUT_MS;
      if (exited) {
        cleanupFailure('Windows shell exited before process-tree termination');
        return;
      }
      // A separate synchronous loop keeps the shell's process handle retained.
      const killed = killImpl(join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe'),
        ['/PID', String(child.pid), '/T', '/F'], {
          timeout: Math.max(1, cleanupDeadline - Date.now()), stdio: 'ignore', windowsHide: true,
        });
      if (killed.error || killed.status !== 0) {
        cleanupFailure(`Windows process-tree termination failed (${killed.error?.code ?? killed.status})`);
        return;
      }
      boundDrain();
    };
    try {
      child = spawnImpl(request.command, request.args, { shell: true, stdio: request.stdio, windowsHide: request.windowsHide });
    } catch (launchError) {
      error = { code: launchError.code || 'EINVAL', message: launchError.message };
      finish(); return;
    }
    for (const index of [1, 2]) {
      const stream = index === 1 ? child.stdout : child.stderr;
      stream?.on('data', (chunk) => {
        if (settled || terminating) return;
        const bytes = Buffer.from(chunk);
        const remaining = request.maxBuffer === null ? bytes.length : Math.max(0, request.maxBuffer - size);
        if (remaining) buffers[index].push(bytes.subarray(0, remaining));
        size += bytes.length;
        if (request.maxBuffer !== null && size > request.maxBuffer) terminate('ENOBUFS');
      });
    }
    child.on('error', (launchError) => {
      if (!error) error = { code: launchError.code || 'EIO', message: launchError.message };
    });
    child.on('exit', (code, reason) => {
      exited = true;
      clearTimeout(reviewTimer);
      if (!terminating) { status = code; signal = reason; }
      boundDrain();
    });
    child.on('close', (code, reason) => {
      if (!terminating) { status = code; signal = reason; }
      finish();
    });
    if (request.timeout > 0) reviewTimer = setTimeout(() => terminate('ETIMEDOUT'), request.timeout);
  });
}

if (process.argv[1] === helper) {
  const dir = process.argv[2];
  const result = await supervise(JSON.parse(readFileSync(join(dir, 'request.json'), 'utf8')));
  writeFileSync(join(dir, 'result.json'), JSON.stringify(result));
  // A failed cleanup may leave a child handle live; its result must still return.
  process.exit(0);
}
