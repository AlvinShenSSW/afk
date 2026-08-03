#!/usr/bin/env node
// kimi-gate.mjs — cross-platform Kimi Code CLI external review wrapper.
//
// Drives the Kimi Code CLI (`kimi`) headlessly with the review prompt ON STDIN
// and prints ONLY Kimi's final review between markers (transcript -> log file).
// External review gate; run ONE gate per round, whose model differs from the
// implementer's.
//
// Kimi is a general agentic CLI with no built-in `review` subcommand, so this
// passes a review PROMPT and lets Kimi drive git itself. `--quiet` is the CLI's
// own alias for `--print --output-format text --final-message-only`, which is
// exactly this gate's contract: headless, and stdout carries the final message
// and nothing else. `--input-format text` is what makes it read stdin.
//
// The prompt goes on STDIN, never in argv (the rule this repo already applies to
// claude-gate and to codex-gate's design payload). Node concatenates argv
// UNESCAPED under `shell: true` — which is how every Windows spawn here has to
// launch a `.cmd` shim — so a multi-word, multi-line prompt was split by cmd.exe
// and Kimi parsed its second word as a subcommand ("No such command 'are'",
// exit 2). Argv also caps at ~8191 chars on Windows, which a long scope line
// could reach on its own.
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
// or not logged in. Bounded by KIMI_REVIEW_TIMEOUT_MS (default 30 min); a review
// that outlives it ends as a non-zero ERROR, not a skip.

import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  isGateDisabled, isSpawnTimeout, preflightTimeoutMs, reviewTimeoutMs,
} from '../../lib/gate/env.mjs';
import { guardFor } from '../../lib/gate/implementer.mjs';
import { buildDesignReviewPrompt, buildReviewPrompt } from '../../lib/gate/prompt.mjs';
import { createProtocol } from '../../lib/gate/protocol.mjs';
import { parseTarget, validateTarget } from '../../lib/gate/target.mjs';

const isWin = process.platform === 'win32';
const { emitSkip, emitReview, emitError } = createProtocol({ label: 'KIMI', slug: 'kimi-gate' });

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
if (isDesign) {
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

const kimi = (process.env.KIMI_GATE_BIN || 'kimi').trim();

// Kimi is a general agentic CLI: `-p` bounds neither the turn nor the tool
// calls inside it, so a review that stops converging blocks the driver for as
// long as the process lives. The 30-minute default is deliberately larger than
// the other gates because Kimi commonly takes longer while still progressing.
const timeoutMs = reviewTimeoutMs('kimi');

if (printPromptOnly) {
  process.stdout.write(`${reviewPrompt}\n`);
  process.exit(0);
}

// `--quiet` == `--print --output-format text --final-message-only`; the input
// format is what tells the CLI to take the prompt from stdin.
const KIMI_ARGS = ['--quiet', '--input-format', 'text'];

if (printArgsOnly) {
  process.stdout.write(`${JSON.stringify({
    bin: kimi,
    kind: target.kind,
    base: target.base ?? null,
    commit: target.commit ?? null,
    label: target.label,
    command: target.command ?? null,
    args: KIMI_ARGS,
    // Observable on purpose: a prompt that drifts back into argv is a silent
    // Windows-only breakage, so the invocation shape is asserted in the tests.
    promptOnStdin: true,
    promptBytes: reviewPrompt.length,
    timeoutMs,
  }, null, 2)}\n`);
  process.exit(0);
}

// Availability pre-check (local, no model call).
const ver = spawnSync(kimi, ['--version'], {
  encoding: 'utf8',
  shell: isWin,
  timeout: preflightTimeoutMs(timeoutMs),
  killSignal: 'SIGKILL',
});
if (isSpawnTimeout(ver)) {
  emitSkip('Kimi CLI preflight timed out; this reviewer is unavailable.');
}
if (ver.error && ver.error.code === 'ENOENT') {
  emitSkip('Kimi CLI not installed (run: npm i -g @moonshot-ai/kimi-code && kimi login).');
}

const work = mkdtempSync(join(tmpdir(), 'kimi-gate-'));
const logFile = join(work, 'kimi.log');

// No context-leaning for Kimi (intentional): thinking effort stays at its
// default (KIMI_MODEL_THINKING_EFFORT applies only when a synthesized provider
// is set), and project-doc injection is session-level, not per-turn.
process.stderr.write(
  `[kimi-gate] ${kimi} ${KIMI_ARGS.join(' ')} (${reviewPrompt.length}B structural review prompt via stdin)\n`,
);
process.stderr.write(`[kimi-gate] timeout -> ${timeoutMs}ms\n`);
process.stderr.write(`[kimi-gate] transcript -> ${logFile}\n`);

const spawnOpts = {
  input: reviewPrompt,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024, // reviews can be long
  timeout: timeoutMs,
  killSignal: 'SIGKILL',
};

// No shell: it concatenates argv unescaped and imposes the command-line limit.
// A native install (npm's .exe, an editor-bundled binary, homebrew) launches
// directly.
let res = spawnSync(kimi, KIMI_ARGS, spawnOpts);

// A Windows `.cmd`/`.bat` shim cannot be launched without a shell (EINVAL since
// Node 18.20/20.12). Retrying under one is safe HERE only because every argv
// element left is a short single-word flag — the prompt stays on stdin.
if (isWin && res.error && res.error.code === 'EINVAL') {
  process.stderr.write('[kimi-gate] script shim detected; retrying via shell (prompt stays on stdin)\n');
  res = spawnSync(kimi, KIMI_ARGS, { ...spawnOpts, shell: true });
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

const review = out.trim();

// Not authenticated -> clean skip. Requires an EMPTY review as well as the
// keyword, so a real review that merely mentions login/auth cannot be
// misread as an auth failure.
if (!review && /no model configured|use \/login|\bkimi login\b|not (logged in|authenticated)|unauthorized|please (log|sign) in/i.test(err)) {
  emitSkip('Kimi not authenticated — run `kimi login`, or set KIMI_REVIEW_GATE=off to disable this gate.');
}

if (!review) {
  // Previously this wrote to stderr and exited with NO marker block, leaving a
  // caller that parses stdout with silence to interpret. Every outcome is a
  // parseable block.
  emitError(`kimi produced no final message (exit ${res.status}). Transcript: ${logFile}`, res.status || 1);
}

emitReview(review);
// `?? 1`, never `?? 0`: a null status means kimi died on a signal, and a review
// that was killed must not exit clean.
process.exit(res.status ?? 1);
