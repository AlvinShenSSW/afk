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

// cmd.exe expands `%NAME%` BEFORE the child sees argv, and double quotes do not
// stop it — quoting is the wrong tool here, and there is no right one: `%%` is
// an escape inside a .bat FILE, not on a command line (pinned by experiment; it
// arrives as a literal `%%`). A lone `%`, and a pair naming nothing, are left
// alone, so only a `%NAME%` shape is refused. Whether NAME happens to be defined
// in the child's environment is not knowable here, and "undefined today" is not
// a property to build on.
const CMD_EXPANSION = /%[^%]+%/;

/**
 * `res.error.code` when an argument cannot be carried through a shell at all.
 * Gates map this to their protocol's ERROR — it is operator input the reviewer
 * cannot be asked about, not an unavailable reviewer to skip past.
 */
export const UNSAFE_SHELL_ARG = 'ERR_AFK_UNSAFE_SHELL_ARG';

export function quoteForShell(value) {
  const text = String(value);
  // FIRST, before any fast path: a quote is what we cannot quote around. A value
  // holding one is a caller bug we must not paper over by shipping something
  // cmd.exe will re-parse. Checking this after the NEEDS_QUOTES early return
  // covered only quotes that arrived WITH a space — `feature/"test` has no
  // whitespace, so it went out untouched and cmd.exe read the quote as syntax,
  // swallowing the arguments after it. The gate then reviews the wrong target.
  if (text.includes('"')) {
    throw new Error(`cannot pass an argument containing a double quote through a shell: ${text}`);
  }
  if (CMD_EXPANSION.test(text)) {
    // Worse than a mutation: the expansion happens after quoting, so a value
    // holding a space (%PATH% does) is then re-split, and the argument is
    // TRUNCATED at that space rather than merely rewritten.
    throw new Error(`cannot pass an argument containing cmd.exe variable expansion through a shell: ${text}`);
  }
  if (text === '') {
    // An empty arg vanishes under a shell and the NEXT flag silently becomes the
    // value. Callers that cannot tolerate that drop the flag instead.
    return '""';
  }
  if (!NEEDS_QUOTES.test(text)) {
    return text;
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

  // A refusal is reported on the SAME channel as any other launch failure, not
  // thrown. A gate's contract is that every outcome is a parseable protocol
  // block; an exception escaping the spawn call exits with a stack trace
  // instead, and the driver cannot classify a review that never announced
  // itself. Callers already branch on `res.error.code`, so this lands where
  // ENOENT and ETIMEDOUT already do.
  let command;
  let argv;
  try {
    command = quoteForShell(bin);
    argv = args.map((arg) => quoteForShell(arg));
  } catch (err) {
    return {
      error: Object.assign(new Error(err.message), { code: UNSAFE_SHELL_ARG }),
      status: null,
      signal: null,
      stdout: '',
      stderr: '',
      pid: 0,
      output: [null, '', ''],
    };
  }

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
