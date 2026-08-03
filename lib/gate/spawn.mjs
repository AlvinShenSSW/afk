// spawn.mjs — the one safe way for a gate to launch a CLI.
//
// Node concatenates argv UNESCAPED when `shell: true` (it warns about it,
// DEP0190), and `shell: true` is unavoidable on Windows for a `.cmd`/`.bat`
// shim — which is how npm installs every one of these CLIs. Anything in argv
// that contains a space is therefore torn in half by cmd.exe, and every temp
// path a gate passes runs through the Windows profile directory, so an account
// named "First Last" splits all of them:
//
//   -o ...\First Last\AppData\Local\Temp\gate-x\review.txt
//     -> ['-o', '...\\First', 'Last\\AppData\\...\\review.txt']
//
// which is silent, environment-dependent, and reads like a broken CLI rather
// than a broken invocation. Three rules follow, and this module is where they
// live:
//
//   1. Prefer NO shell. Spawned directly, argv reaches the child verbatim.
//   2. When a shell is unavoidable, quote the command and every argument that
//      needs it. A PAYLOAD (a prompt, a diff, a doc) must never be there at
//      all — quoting cannot save a multi-line string from cmd.exe — so callers
//      put payloads on stdin and keep argv to flags, paths, and refs.
//   3. Under a shell, a payload goes on an INHERITED DESCRIPTOR, never Node's
//      `input`. `input` there is a deadlock: a shim is `cmd.exe -> node`, so a
//      timeout kills cmd.exe while the grandchild lives on holding the stdin
//      pipe, and spawnSync waits on that write forever. A review that overran
//      its timeout hung the gate outright instead of reporting a timeout, and
//      because spawnSync blocks the loop no test-level timeout can cut it.

import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const isWin = process.platform === 'win32';

/** cmd.exe splits on these; a bare `"` we cannot quote safely. */
const NEEDS_QUOTES = /[\s&|<>^()]/;

export function quoteForShell(value) {
  const text = String(value);
  if (text === '') {
    // An empty arg vanishes under a shell and the NEXT flag silently becomes the
    // value. Callers that cannot tolerate that drop the flag instead.
    return '""';
  }
  if (!NEEDS_QUOTES.test(text)) {
    return text;
  }
  if (text.includes('"')) {
    // Paths and refs never contain a quote; a value that does is a caller bug we
    // must not paper over by shipping something cmd.exe will re-parse.
    throw new Error(`cannot pass an argument containing a double quote through a shell: ${text}`);
  }
  return `"${text}"`;
}

/** Put `fd` on stdin, leaving the caller's stdout/stderr wiring alone. */
function withStdin(stdio, fd) {
  const shared = typeof stdio === 'string' ? stdio : 'pipe';
  const next = Array.isArray(stdio) ? [...stdio] : [shared, shared, shared];
  next[0] = fd;
  while (next.length < 3) next.push('pipe');
  return next;
}

/**
 * Spawn through a shell, with the command and every argument quoted, and any
 * stdin payload handed over as an inherited descriptor rather than Node's
 * `input` (rule 3 above).
 *
 * The payload is spilled to a private temp file, read by the child, and removed
 * before this returns. That file is the same class of secret the caller already
 * writes to its transcript, and it is scoped to the shell path because that is
 * the only path where `input` deadlocks.
 *
 * `spawnImpl` exists for the relay's injected fake; it defaults to spawnSync.
 */
export function spawnViaShell(bin, args, options = {}) {
  const { input, spawnImpl = spawnSync, ...rest } = options;
  const command = quoteForShell(bin);
  const argv = args.map((arg) => quoteForShell(arg));

  if (input === undefined || input === null) {
    return spawnImpl(command, argv, { ...rest, shell: true });
  }

  const dir = mkdtempSync(join(tmpdir(), 'afk-stdin-'));
  let fd;
  try {
    const payload = join(dir, 'stdin');
    // spawnSync encodes a string `input` with `options.encoding`; the bytes the
    // CLI reads must not change just because they arrived by a different route.
    // (`encoding: 'buffer'` describes the OUTPUT and says nothing about input.)
    writeFileSync(payload, input, typeof input === 'string'
      ? { encoding: rest.encoding && rest.encoding !== 'buffer' ? rest.encoding : 'utf8' }
      : undefined);
    fd = openSync(payload, 'r');
    return spawnImpl(command, argv, { ...rest, stdio: withStdin(rest.stdio, fd), shell: true });
  } finally {
    if (fd !== undefined) closeSync(fd);
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Spawn a CLI, preferring no shell and falling back to a quoted shell invocation
 * only when the platform forces it (a Windows script shim cannot start without
 * one — EINVAL since Node 18.20/20.12).
 *
 * Returns `{ ...spawnSyncResult, viaShell }` so a caller can report which path
 * ran without re-deriving it.
 */
export function spawnCli(bin, args, options = {}) {
  const { spawnImpl = spawnSync, ...rest } = options;
  const direct = spawnImpl(bin, args, { ...rest, shell: false });
  if (!(isWin && direct.error && direct.error.code === 'EINVAL')) {
    return { ...direct, viaShell: false };
  }
  return { ...spawnViaShell(bin, args, options), viaShell: true };
}
