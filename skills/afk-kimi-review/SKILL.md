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

Metered like any external gate — keep invocations to a minimum. Batch admitted
P1 and eligible lower-severity fixes into one content pass, self-review, then
re-run once. Record every other disposition together at the end without editing
a clean revision.

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

**The review is bounded** by `KIMI_REVIEW_TIMEOUT_MS` (default 30 min), with
`AFK_REVIEW_TIMEOUT_MS` as the shared fallback. Kimi is a general agentic CLI,
so nothing else ends a turn that stops converging. A review that outlives the
bound is reported as a non-zero `ERROR`, never a `SKIPPED`: a hang says nothing
about whether this reviewer is available, so it takes the role's transient retry
rather than an immediate fallback to another family.

Read the verdict between the `===== KIMI REVIEW (final message) =====` markers.
`SKIPPED: …` (Kimi absent, logged out, or disabled via `KIMI_REVIEW_GATE=off`)
is not a failure — report it and continue. `ERROR: …` means the review itself
failed or timed out — read the transcript it names; never report an errored run
as clean.

One `ERROR` is **not** transient and must not be retried: `kimi rejected an
argument this gate sent …`. The helper and the installed CLI disagree about the
flag list, so every retry rejects the same flags and every fallback hides the
defect — the failure mode that kept this gate reporting "produced no final
message" on every review. Stop the round, report it, and fix the flag list
against `kimi --help`.

## Handle findings (batch — minimise calls)

Identical discipline to `afk-codex-review`: map every hypothesis to the frozen
contract; admit P1 only on demonstrated evidence; batch-fix admitted P1 findings
and only eligible lower-severity work; self-review once; re-run after content
fixes; then record every other disposition without editing the clean revision or
spending another paid round.

Treat every reported finding as `UNTRIAGED`. Admit P1 only after mapping it to
the frozen issue contract or an invariant, demonstrating a reachable trigger
and wrong consequence, explaining why the current artifact cannot safely
advance, and naming the minimal causal fix. Do not edit for an untriaged claim;
record structural P2 for the operator-owned merge boundary, and defer minor or
out-of-scope items without expanding the PR.

When an admitted P1 already requires a content pass, batch-fix a verified
lower-severity item only when it is in scope, shares that root cause or touched
surface, adds no dependency, migration, public contract, or product choice, and
needs no gate round beyond the P1 re-review. Otherwise record its disposition
without editing; a lower-severity-only verdict never reopens a clean revision.

Apply any invariant in `.afk/config.md` as an extra lens.

## Stop rule

Stop when the loop-termination rule in `../afk/SKILL.md` ("External gate")
holds: triage leaves no `UNTRIAGED`, `Contested`, or open admitted P1, and every
lower-severity item has a recorded disposition that does not block the role stamp (a
structural P2 may still bar auto-merge). That same verdict
earns the role stamp only if it requires no content change; a content fix
invalidates it and the role re-reviews the fixed revision.

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
