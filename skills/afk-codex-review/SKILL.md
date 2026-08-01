---
name: afk-codex-review
description: Part of the afk pipeline. Runs Codex (OpenAI Codex CLI) as the default outer independent, read-only external review role, then triages and fixes findings before later ordered roles. Subject to .afk/config.md gates and fallback priority. Triggers include "/afk-codex-review", "run codex review", "codex gate".
---

# afk-codex-review

An independent second-opinion review by Codex (a *different* model), used as the
default **outer** role before later configured roles (Kimi is the default final).
Run the ordered `gates` profile from `.afk/config.md`, never use a reviewer whose
model matches the implementer or another role, and run `afk-internal-review`
before outer. Codex reviews the diff read-only; you triage and fix.

The helper `codex-gate.mjs` ships with this skill and travels with the plugin.

## Metering

Codex calls are metered — keep invocations to a minimum. Batch every finding into
one fix pass, self-review, then re-run once; defer documentation and minor items
to a single final pass. Never spend a round-trip on a small or doc-only edit.

## Run it

The bundled helper `codex-gate.mjs` sits beside this SKILL.md. Locate its
directory as `${CLAUDE_PLUGIN_ROOT}/skills/afk-codex-review` if the env var is
set, else `<pluginRoot>/skills/afk-codex-review` from `.afk/config.md`, else this
skill's own directory (the helper is its sibling). Resolve `.afk/` from the
repository's main working tree — the first `worktree` line of
`git worktree list --porcelain` — never the current directory, or a run from a
linked worktree reads a different `.afk/` than the one `afk-init` wrote. If
`.afk/` is absent, the `afk-init` bootstrap runs automatically first:

```text
node "<helper-dir>/codex-gate.mjs"
```

Run it in the **background** with a generous timeout (the review traces code
paths and may run tests); redirect stdout to a file and read it when it
completes. Pass through any target flag (`--base <branch>` / `--commit <sha>` /
`--uncommitted`; default = current branch vs the default branch). Do not poll in
a sleep loop — wait for completion.

**Design mode** (`--design <path>`) reviews a design document's reasoning instead
of a diff — the opt-in design-stage gate (see `../afk/SKILL.md`, "Design-stage
external gate"). Codex runs it with `exec -s read-only` and the brief + doc piped
on stdin — never the `review` subcommand or the sandbox bypass, so it stays
read-only on every OS. A missing or unreadable `--design` path fails loudly
(`ERROR`, non-zero), never a skip.

**The reviewer's model is pinned**, not inherited from `~/.codex/config.toml`: an
interactive session tuned for speed or cost would otherwise decide the gate's
model, and a downgraded reviewer reads exactly like a thorough one.
`CODEX_REVIEW_MODEL=<id>` pins a different one for the call;
`CODEX_REVIEW_MODEL=inherit` restores inheritance — the escape hatch when the
installed CLI is too old for the pinned id and rejects it outright. `--print-args`
reports the resolved model without spending a call.

Read the verdict between the `===== CODEX REVIEW (final message) =====` markers.
`SKIPPED: …` (Codex absent, logged out, or disabled via `CODEX_REVIEW_GATE=off`)
is not a failure — report it and continue. `ERROR: …` means the review itself
failed — read the transcript it names; never report an errored run as clean.

## Handle findings (batch — minimise calls)

1. **Sort by kind.** Structural (architecture, correctness, security, missed
   edge cases) — act on these. Minor (naming, cosmetics) — defer to one final
   pass.
2. **Verify before trusting.** Each finding is a hypothesis; the verification
   standard is below. Push back with evidence on anything you can disprove.
3. **Fix every confirmed structural finding in one batch**, and sweep for the
   same pattern elsewhere; keep specs in sync in the same change.
4. **Self-review once** over your fixes.
5. **Re-run the gate once.** Repeat until the stop rule holds.
6. **Deferred pass once, at the end** for the minor items — do not re-run the
   gate to confirm doc edits.

A structural finding claims both that the code is as described and that it goes
wrong; reading the cited `file:line` settles only the first. Demonstrate the
consequence before fixing, and account for every consumer of what you change
that lives outside the diff — `../afk/SKILL.md` ("External gate") holds both
rules.

Apply any invariant in `.afk/config.md` as an extra must-check lens.

## Stop rule

Stop when the loop-termination rule in `../afk/SKILL.md` ("External gate")
holds: a round with no new structural finding and every prior structural
finding closed by a recorded disposition — a driver-verified fix, a
refutation, or an accepted risk.

Report honestly: `CLEAN`, or `OUTSTANDING` with what remains. A clean pass is
not authority to merge — hand back to the operator.

## Setup (per machine, once)

Optional and self-skipping. `npm i -g @openai/codex && codex login`; needs Node +
git on PATH. Disable with `CODEX_REVIEW_GATE=off`.
