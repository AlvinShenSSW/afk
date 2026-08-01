---
name: afk-kimi-review
description: Part of the afk pipeline. Runs Kimi (Kimi CLI) as the default final independent, read-only external review role after outer findings are resolved. Subject to ordered .afk/config.md gates and fallback priority. Triggers include "/afk-kimi-review", "run kimi review", "kimi gate".
---

# afk-kimi-review

An independent second-opinion review by Kimi (a *different* model), used as the
default **final** role after internal review and all outer findings are resolved.
Run the ordered `gates` profile from `.afk/config.md`, and never use a reviewer
whose model matches the implementer or another role. Kimi reviews the diff
read-only; you triage and fix.

The helper `kimi-gate.mjs` ships with this skill and travels with the plugin.

## Metering

Metered like any external gate — keep invocations to a minimum. Batch findings
into one fix pass, self-review, then re-run once; defer minor items to a single
final pass.

## Run it

The bundled helper `kimi-gate.mjs` sits beside this SKILL.md. Locate its
directory as `${CLAUDE_PLUGIN_ROOT}/skills/afk-kimi-review` if the env var is set,
else `<pluginRoot>/skills/afk-kimi-review` from `.afk/config.md`, else this
skill's own directory (the helper is its sibling). Resolve `.afk/` from the
repository's main working tree — the first `worktree` line of
`git worktree list --porcelain` — never the current directory, or a run from a
linked worktree reads a different `.afk/` than the one `afk-init` wrote. If
`.afk/` is absent, the `afk-init` bootstrap runs automatically first:

```text
node "<helper-dir>/kimi-gate.mjs"
```

Run it in the **background** with a generous timeout; redirect stdout to a file
and read it when it completes. Pass through any target flag (`--base <branch>` /
`--commit <sha>` / `--uncommitted`). Do not poll in a sleep loop.

**Design mode** (`--design <path>`) reviews a design document's reasoning instead
of a diff — the opt-in design-stage gate (see `../afk/SKILL.md`, "Design-stage
external gate"). Kimi is pointed at the document on disk and reads it with its own
tools (keeping a large doc off the argv). A missing or unreadable `--design` path
fails loudly (`ERROR`, non-zero), never a skip.

Read the verdict between the `===== KIMI REVIEW (final message) =====` markers.
`SKIPPED: …` (Kimi absent, logged out, or disabled via `KIMI_REVIEW_GATE=off`)
is not a failure — report it and continue.

## Handle findings (batch — minimise calls)

Identical discipline to `afk-codex-review`: sort structural vs minor; verify each
finding to the standard below before trusting it; fix confirmed structural
findings in one batch and sweep for the pattern; self-review once; re-run once;
resolve minor items in a single final pass.

A structural finding claims both that the code is as described and that it goes
wrong; reading the cited `file:line` settles only the first. Demonstrate the
consequence before fixing, and account for every consumer of what you change
that lives outside the diff — `../afk/SKILL.md` ("External gate") holds both
rules.

Apply any invariant in `.afk/config.md` as an extra lens.

## Stop rule

Stop when the loop-termination rule in `../afk/SKILL.md` ("External gate")
holds: a round with no new structural finding and every prior structural
finding closed by a recorded disposition — a driver-verified fix, a
refutation, or an accepted risk.

Report `CLEAN`, or `OUTSTANDING` with what remains. A clean pass is not
authority to merge.

## Selection

Kimi is the default final role, not a generic second pass. The operator's
explicit ordered profile wins; otherwise the `afk` skill's role/fallback rule
applies (skip the implementer's and already-used models). The provider is locked
to final for later sequences; a substitution is recorded and resets only its
provider-specific finding baseline.

## Setup (per machine, once)

Optional and self-skipping. Install the Kimi CLI and log in; needs Node + git on
PATH. Disable with `KIMI_REVIEW_GATE=off`.
