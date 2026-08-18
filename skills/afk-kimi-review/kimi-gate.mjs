#!/usr/bin/env node
// kimi-gate.mjs — cross-platform Kimi Code CLI external review wrapper.
//
// Drives the Kimi Code CLI (`kimi`) headlessly via
// `kimi -p "<prompt>" --output-format text`, spawned WITHOUT a shell, and prints
// ONLY Kimi's final review between markers (transcript -> log file). External
// review gate; run ONE gate per round, whose model differs from the
// implementer's.
//
// Kimi is a general agentic CLI with no built-in `review` subcommand, so this
// passes a review PROMPT and lets Kimi drive git itself.
//
// USE ONLY FLAGS `kimi --help` DOCUMENTS. This gate shipped `--quiet` and
// `--input-format` on the strength of a newer build's help text; CLI 0.29.1
// rejects both ("error: unknown option '--quiet'"), so every review exited 1
// with empty stdout and the gate reported "produced no final message" — a
// broken-reviewer story for what was a helper/CLI disagreement. The documented
// headless surface is `-p/--prompt` plus `--output-format <text|stream-json>`,
// and a rejection is now diagnosed as drift rather than as an empty review.
//
// Two Windows-only constraints shape the invocation; both are verified against
// the real CLI, and each one silently killed the gate before:
//
//   1. NEVER put the prompt in argv under a shell. Node concatenates argv
//      unescaped there (DEP0190), so cmd.exe split the multi-word, multi-line
//      prompt and Kimi read its second word as a subcommand — "No such command
//      'are'", exit 2, on every single review.
//   2. There is NO stdin transport. `--input-format` does not exist on this CLI,
//      and an earlier attempt to use one also hit a stdin decoder that dies on
//      non-ASCII ("UnicodeEncodeError: … surrogates not allowed").
//
// Spawning directly (no shell) with the prompt in argv satisfies both. A `.cmd`
// shim is the one install that cannot start without a shell; there, and only
// there, the brief goes to a private file and argv carries its quotable path.
//
// Read-only is asked for in the prompt, NOT enforced: kimi has no per-command
// permission surface here. That is weaker than afk-claude-review, whose reviewer
// loads no tool that can write. Prefer that gate where both qualify.
//
// Usage:
//   node kimi-gate.mjs                 # current branch vs default base
//   node kimi-gate.mjs --base master   # vs an explicit base
//   node kimi-gate.mjs --commit <sha>  # one commit
//   node kimi-gate.mjs --uncommitted   # staged/unstaged/untracked
//   node kimi-gate.mjs --design <path> # review a design doc (read the doc on disk, no argv payload)
//   node kimi-gate.mjs --print-args    # resolve and print the target; no model call
//
// Opt out with KIMI_REVIEW_GATE=off. Skips cleanly (exit 0) if kimi is missing
// or not logged in. Bounded by KIMI_REVIEW_TIMEOUT_MS (default 45 min); a review
// that outlives it ends as a non-zero ERROR, not a skip.

import { spawnSync } from 'node:child_process';
import {
  closeSync, openSync, unlinkSync, writeFileSync, writeSync,
} from 'node:fs';
import { join } from 'node:path';

import {
  isGateDisabled, isSpawnTimeout, positiveIntEnv, preflightTimeoutMs, reviewTimeoutMs,
} from '../../lib/gate/env.mjs';
import { guardFor } from '../../lib/gate/implementer.mjs';
import {
  buildDesignReviewPrompt, buildReviewPrompt,
} from '../../lib/gate/prompt.mjs';
import { createProtocol } from '../../lib/gate/protocol.mjs';
import { gateWorkDir } from '../../lib/gate/workdir.mjs';
import {
  resolveCliBin, spawnCli, spawnViaShell, UNSAFE_SHELL_ARG,
} from '../../lib/gate/spawn.mjs';
import { parseTarget, validateTarget } from '../../lib/gate/target.mjs';

const isWin = process.platform === 'win32';
const { emitSkip, emitError, emitVerifiedReview } = createProtocol({ label: 'KIMI', slug: 'kimi-gate' });

// A target that could not be parsed is a caller error, and it must surface even
// when the gate is switched off — placed after that exit, this check would be
// unreachable in exactly the configuration that most needs to say why. Reads
// argv directly: it runs before the shared `userArgs` binding exists.
{
  const early = parseTarget(process.argv.slice(2));
  // A design target names its document here, so a missing path is the same
  // class of caller error as an unparseable target and must surface with it.
  if (early.kind === 'error' || early.kind === 'design') {
    const valid = validateTarget(early);
    if (!valid.ok) emitError(`cannot review — ${valid.reason}`, 1);
  }
}

if (isGateDisabled('KIMI_REVIEW_GATE')) {
  emitSkip('Kimi gate disabled via KIMI_REVIEW_GATE.');
}

const userArgs = process.argv.slice(2);
const printArgsOnly = userArgs.includes('--print-args');
// Prints the exact review prompt kimi would receive, and calls no model — the
// only way to observe that design mode swapped the diff context clause.
const printPromptOnly = userArgs.includes('--print-prompt');
const target = parseTarget(userArgs);
const isDesign = target.kind === 'design';

// A malformed --design is operator error that must fail loud on EVERY gate, even
// one about to self-skip, so a design target validates BEFORE the independence
// guard. A diff target validates after it.
// A target that could not be parsed is the same class of operator error: it
// must surface, not become an exit-0 skip when the guard happens to decline.
if (isDesign || target.kind === 'error') {
  const valid = validateTarget(target);
  if (!valid.ok) {
    emitError(`cannot review — ${valid.reason}`, 1);
  }
}

const guard = guardFor('kimi', userArgs);
if (!guard.run) {
  emitSkip(`independence check — ${guard.reason}`);
}

if (!isDesign) {
  const valid = validateTarget(target);
  if (!valid.ok) {
    emitError(`cannot review — ${valid.reason}`, 1);
  }
}

// This gate's own context clause: kimi HAS tools, so it is told to go looking —
// the opposite of what glm must be told. See lib/gate/prompt.mjs.
//
// Design mode swaps the whole clause: the diff clause's `git show`/`git diff` is
// meaningless for a design, and pointing kimi at the doc ON DISK (rather than
// injecting its text) keeps a large doc out of the prompt entirely.
let reviewPrompt;
if (target.kind === 'design') {
  const context = `Review the design document at ${target.path} in this git repository. Read it in full first. Use git and read surrounding files to check any claim the design makes about the code. Do NOT modify, stage, commit, write, or delete ANY file — review only.`;
  reviewPrompt = buildDesignReviewPrompt({ scope: target.label, context });
} else {
  const context = `Inspect the target with ${target.inspect || `\`${target.command}\``} in this git repository. Use git and read surrounding files for context. Do NOT modify, stage, commit, write, or delete ANY file — review only.`;
  reviewPrompt = buildReviewPrompt({ scope: target.label, context });
}

// resolveCliBin, not the bare name: `npm i -g @moonshot-ai/kimi-code` — the
// install this gate's own skip message recommends — creates `kimi.cmd` with no
// `.exe`, and libuv's Windows PATH search appends only `.com`/`.exe`. Without
// this the preflight below ENOENTs and the gate reports a working CLI as "not
// installed". A no-op off Windows and whenever libuv can find the name itself.
const kimi = resolveCliBin((process.env.KIMI_GATE_BIN || 'kimi').trim());

// Kimi is a general agentic CLI: `-p` bounds neither the turn nor the tool
// calls inside it, so a review that stops converging blocks the driver for as
// long as the process lives. The 45-minute default is deliberately larger than
// the other gates: Kimi drives git itself rather than receiving a pre-injected
// diff, so it does real work before answering, and a bound that kills a review
// still making progress wastes the whole paid call and the role's sticky retry.
const timeoutMs = reviewTimeoutMs('kimi');

// KIMI_GATE_FORCE_SHIM exists because the shim branch is otherwise unreachable
// off Windows, and the last two Windows-only paths in this file shipped broken
// for exactly that reason. It forces the TRANSPORT, never the platform.
const forceShim = ['1', 'true', 'yes', 'on'].includes(
  (process.env.KIMI_GATE_FORCE_SHIM || '').trim().toLowerCase());

if (printPromptOnly) {
  process.stdout.write(`${reviewPrompt}\n`);
  process.exit(0);
}

// The documented headless surface, transcribed from `kimi --help` (0.29.1,
// 2026-08-04) — and nothing beyond it. `--output-format text` is passed rather
// than relied on as a default, so a changed default cannot silently turn a
// review into stream-json.
const OUTPUT_FORMAT = ['--output-format', 'text'];
// Primary transport: the prompt as one argv element, spawned WITHOUT a shell.
const promptArgs = ['-p', reviewPrompt, ...OUTPUT_FORMAT];

// The shim fallback's instruction (see below). It repeats the read-only
// prohibition rather than leaving it to the brief alone: on this path the
// prohibition is the one line guaranteed to reach the model even if the file is
// never read, and an agentic CLI with write tools must not receive "follow it
// exactly" with no constraint attached.
const briefInstruction = (path) => `Read the review brief at ${path} in full; it is your task. Follow it exactly. Do NOT modify, stage, commit, write, or delete ANY file - review only.`;
const shimArgs = (path) => ['-p', briefInstruction(path), ...OUTPUT_FORMAT];

if (printArgsOnly) {
  process.stdout.write(`${JSON.stringify({
    bin: kimi,
    kind: target.kind,
    base: target.base ?? null,
    commit: target.commit ?? null,
    label: target.label,
    command: target.command ?? null,
    // The invocation SHAPE is part of the contract, not an implementation
    // detail: each Windows failure below is silent, model-call-expensive to
    // discover, and looks like an unavailable reviewer. Keep it observable.
    transport: forceShim ? 'brief-file' : 'argv',
    shell: forceShim,
    args: forceShim ? shimArgs('<brief>') : promptArgs,
    // The shim path's argv, with the brief's path standing in for the temp file
    // that only exists during the call. This CLI has no stdin transport at all,
    // so a payload that cannot ride argv has nowhere else to go but disk.
    fallback: { transport: 'brief-file', shell: true, args: shimArgs('<brief>') },
    promptBytes: reviewPrompt.length,
    timeoutMs,
  }, null, 2)}\n`);
  process.exit(0);
}

// Availability pre-check (local, no model call). spawnCli, not a bare shell:
// KIMI_GATE_BIN is commonly an absolute path, and an account named "First Last"
// puts a space in it.
const ver = spawnCli(kimi, ['--version'], {
  encoding: 'utf8',
  timeout: preflightTimeoutMs(timeoutMs),
  killSignal: 'SIGKILL',
});
if (isSpawnTimeout(ver)) {
  emitSkip('Kimi CLI preflight timed out; this reviewer is unavailable.');
}
if (ver.error && ver.error.code === 'ENOENT') {
  emitSkip('Kimi CLI not installed (run: npm i -g @moonshot-ai/kimi-code && kimi login).');
}
// Kept for the drift diagnosis below: a helper and a CLI that disagree about a
// flag are only diagnosable if the error names which CLI answered.
const cliVersion = (ver.stdout || '').trim().split('\n')[0] || '';

const workDir = gateWorkDir('kimi-gate-');
if (workDir.error) emitError(workDir.error, 1);
const work = workDir.path;
const logFile = join(work, 'kimi.log');

// No context-leaning for Kimi (intentional): thinking effort stays at its
// default (KIMI_MODEL_THINKING_EFFORT applies only when a synthesized provider
// is set), and project-doc injection is session-level, not per-turn.
process.stderr.write(
  `[kimi-gate] ${kimi} -p <${reviewPrompt.length}B structural review prompt> --output-format text`
  + `${forceShim ? ' (brief on disk, via shell)' : ' (no shell)'}\n`,
);
process.stderr.write(`[kimi-gate] timeout -> ${timeoutMs}ms\n`);
process.stderr.write(`[kimi-gate] transcript -> ${logFile}\n`);

const maxBufferBytes = positiveIntEnv('KIMI_REVIEW_MAX_BUFFER_BYTES', 64 * 1024 * 1024);
const spawnOpts = {
  encoding: 'utf8',
  maxBuffer: maxBufferBytes, // reviews can be long
  timeout: timeoutMs,
  killSignal: 'SIGKILL',
};

// NO SHELL, and that is the whole point: Node concatenates argv UNESCAPED under
// a shell (it warns about this, DEP0190), so cmd.exe split the multi-word,
// multi-line prompt and Kimi parsed its second word as a subcommand
// ("No such command 'are'", exit 2) — every Windows review died there. Spawned
// directly, the prompt survives verbatim, non-ASCII included, and the ~8191-char
// Windows command-line limit is not in reach (this gate sends instructions, and
// lets Kimi fetch the diff itself).
let sentArgs = promptArgs;
// Forced, the seam SKIPS this spawn rather than running before it: leaving it in
// bought two complete paid reviews and twice the documented bound, and silently
// discarded the first one's outcome — including a verdict or a timeout.
let res = forceShim
  ? { error: { code: 'EINVAL' } }
  : spawnSync(kimi, promptArgs, { ...spawnOpts, shell: false });

// A Windows `.cmd`/`.bat` shim cannot be launched without a shell (EINVAL since
// Node 18.20/20.12) — the one install shape where the payload must leave argv,
// and the shape `npm i -g` produces, which resolveCliBin now makes reachable.
// This CLI has NO stdin transport (`--input-format` does not exist), so the
// brief goes to a private file and argv carries only flags and its quotable
// path. Same shape design mode already uses for a document.
//
let briefPath = null;
if (forceShim || (isWin && res.error && res.error.code === 'EINVAL')) {
  briefPath = join(work, 'review-brief.md');
  try {
    writeFileSync(briefPath, reviewPrompt, 'utf8');
  } catch (err) {
    // This CLI has no other transport under a shell, so a brief that cannot be
    // written is an unreviewable environment — reported, never a stack trace.
    emitError(`cannot hand the review brief to kimi: ${err.message}. This install is a Windows script shim, whose only transport is a file reference; point TMP at a writable directory or use a native executable.`, 1);
  }
  process.stderr.write(`[kimi-gate] ${forceShim ? 'shim transport forced (KIMI_GATE_FORCE_SHIM)' : 'script shim detected'}; brief on disk -> ${briefPath}\n`);
  sentArgs = shimArgs(briefPath);
  try {
    res = spawnViaShell(kimi, sentArgs, spawnOpts);
  } finally {
    // The brief carries the same content as the transcript beside it, but it
    // exists only to be read during the call.
    try { unlinkSync(briefPath); } catch { /* already gone */ }
  }
}

const out = res.stdout || '';
const err = res.stderr || '';
try {
  const fd = openSync(logFile, 'w');
  writeSync(fd, `${out}\n----- stderr -----\n${err}`);
  closeSync(fd);
} catch {
  // The transcript is a convenience; losing it must not fail the review.
}

if (res.error && res.error.code === UNSAFE_SHELL_ARG) {
  // Operator input this gate cannot carry, not a reviewer that is unavailable:
  // ERROR, so the round is unclean and the target gets fixed, rather than SKIP,
  // which would hand the review to the next family and hide the bad ref.
  emitError(
    `cannot review this target: ${res.error.message}. This CLI is installed as a Windows `
    + 'script shim, which forces a shell; rename the ref or path — or, if the refused value is '
    + "this gate's own brief path, point TMP at a directory whose name cmd.exe can carry — or "
    + 'install the CLI as a native binary so its arguments never pass through cmd.exe.',
    1,
  );
}

if (res.error && res.error.code === 'ENOENT') {
  emitSkip('Kimi CLI not installed (run: npm i -g @moonshot-ai/kimi-code && kimi login).');
}

// A timed-out review is an ERROR, never a SKIPPED: the driver reads a skip as
// "this reviewer is unavailable, fall back to another family", and a hang says
// nothing about availability. As a transient error it gets the role's one sticky
// retry first. This must also precede the emitReview path — stdout may hold a
// partial answer, and half a review presented as a verdict is worse than none.
if (isSpawnTimeout(res)) {
  emitError(
    `kimi review timed out after ${Math.round(timeoutMs / 1000)}s with no verdict. `
    + `Raise KIMI_REVIEW_TIMEOUT_MS or AFK_REVIEW_TIMEOUT_MS, or narrow the target. Transcript: ${logFile}`,
    1,
  );
}

// ENOBUFS, an external signal kill, or any other spawn-level failure the
// specific checks above did not claim: whatever stdout holds is a fragment of
// an aborted run, and half a review presented as a verdict is worse than none.
// Both fields are printed — ENOBUFS arrives with SIGKILL also set, and a
// signal-only message would mask the actionable class.
if (res.error || res.signal) {
  const code = res.error ? (res.error.code || res.error.message) : '';
  const shown = [code, res.signal].filter(Boolean).join(', ');
  const remedy = code === 'ENOBUFS'
    ? ` Output exceeded the ${maxBufferBytes}-byte buffer; raise KIMI_REVIEW_MAX_BUFFER_BYTES.`
    : '';
  emitError(
    `kimi did not exit normally (${shown}); any partial output is not a verdict.${remedy} Transcript: ${logFile}`,
    1,
  );
}

const review = out.trim();

// Not authenticated -> clean skip. Requires an EMPTY review as well as the
// keyword, so a real review that merely mentions login/auth cannot be
// misread as an auth failure.
if (!review && /no model configured|use \/login|\bkimi login\b|not (logged in|authenticated)|unauthorized|please (log|sign) in/i.test(err)) {
  emitSkip('Kimi not authenticated — run `kimi login`, or set KIMI_REVIEW_GATE=off to disable this gate.');
}

if (!review) {
  // A rejected flag is the failure this gate actually shipped: `--quiet` and
  // `--input-format`, asserted from a newer build's help text, do not exist in
  // 0.29.1, so every review exited 1 with empty stdout and reported "no final
  // message" — a broken-reviewer story for a helper/CLI disagreement. The
  // pattern below recognizes the dialects these CLIs use, but it is an
  // optimization, NOT the mechanism: the version and the exact argv go into
  // every no-output error, so a dialect nobody predicted is still diagnosable
  // from one transcript line.
  const argvShown = JSON.stringify(sentArgs.map(
    (a) => (a === reviewPrompt ? `<${reviewPrompt.length}B prompt>` : a)));
  const drifted = /unknown (option|command)|unrecognized (option|argument)|no such (option|command)|is not a recognized|invalid option/i.exec(err);
  if (drifted) {
    // Never transient: the same flags are rejected on every retry, so a retry
    // spends a paid call to relearn this. The round stops here.
    emitError(
      `kimi rejected an argument this gate sent (${drifted[0]}) — the helper and the installed `
      + `CLI disagree about the flag list. Installed version: ${cliVersion || 'unknown'}. Sent: ${argvShown}. `
      + `Update this gate's flags to what \`${kimi} --help\` documents. Transcript: ${logFile}`,
      res.status || 1,
    );
  }
  emitError(
    `kimi produced no final message (exit ${res.status}) with version ${cliVersion || 'unknown'} `
    + `and argv ${argvShown}. Transcript: ${logFile}`,
    res.status || 1,
  );
}

// The prompt mandates a verdict line on every transport; its absence means
// the review did not follow the brief. On the shim path — where the brief
// travels by file reference — it more specifically means the brief was most
// likely never read, so that path keeps its own diagnosis.
emitVerifiedReview(review, {
  requireVerdict: true,
  missingVerdictMessage: briefPath
    ? ('kimi answered without the verdict line its brief requires, so the brief handed to it '
      + `(written to ${work} for the duration of the call, then removed) was most likely never read. `
      + 'This install is a Windows script shim, whose only '
      + 'transport is a file reference. Point KIMI_GATE_BIN at a native executable. '
      + `Transcript: ${logFile}`)
    : undefined,
});
// `?? 1`, never `?? 0`: a null status means kimi died on a signal, and a review
// that was killed must not exit clean.
process.exit(res.status ?? 1);
