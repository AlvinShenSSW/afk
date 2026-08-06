---
name: afk-deepseek-review
description: afk-deepseek-review: Part of the afk pipeline. Runs DeepSeek V4 Pro as an optional independent, read-only external review role for an ordered .afk/config.md gate profile. Triggers include "/afk-deepseek-review", "run deepseek review", and "DeepSeek external gate".
---

# afk-deepseek-review

An optional independent review by `deepseek-v4-pro`. Run it only when an
explicit `.afk/config.md` `gates:` or `priority:` profile selects DeepSeek, or
when the operator invokes this skill directly. Never use it when DeepSeek wrote
the change or already occupies another ordered role.

DeepSeek receives a bounded, redacted snapshot through its REST API. It has no
repository tools, so verify findings that require material outside the snapshot.
Kilo Code may use the same provider, but this gate neither reads Kilo Code state
nor depends on that extension.

## Run it

Locate `deepseek-gate.mjs` beside this file through
`${CLAUDE_PLUGIN_ROOT}/skills/afk-deepseek-review`, then the `pluginRoot` in
`.afk/config.md`, then this skill's directory. Resolve `.afk/` from the main
working tree. Run `afk-init` automatically first when `.afk/` is absent.

```text
node "<helper-dir>/deepseek-gate.mjs"
```

Run it in the background with a generous timeout and save stdout for the run
record. Pass through `--base <branch>`, `--commit <sha>`, `--uncommitted`, or
`--design <path>`. Use `--print-args` for resolved metadata or `--print-prompt`
for the redacted prompt without a provider call. Do not poll in a sleep loop.

Pass `--implementer <family>` when another model wrote the change. In design
mode (`--design`) the flag instead names the design's **author**, never the
eventual code implementer — see `../afk/SKILL.md` ("Design-stage external
gate"): declaring the code implementer there can hand a driver-authored design
to the driver's own model for review. A persistent `implementer:` line in
`.afk/config.md` also names the code implementer, and in design mode it can
wrongly block that family's independent review of a driver-authored design —
declare the design's author explicitly then: the per-run flag outranks the
config line.

The bounded snapshot excludes secret-bearing paths, redacts secret-shaped
values, and rejects unsafe design inputs before the request. A missing or
invalid `--design` target is `ERROR`, not a skip. A timeout, unsafe finish
reason, or unverified response model also yields a non-zero `ERROR` with no
partial verdict. A successful review that omitted entries carries a bounded
`SNAPSHOT_NOTE` count; redacted excluded paths stay in local stderr only.

Read the verdict between the
`===== DEEPSEEK REVIEW (final message) =====` markers. A `SKIPPED` result is not
a verdict; record it and follow the fallback rule in `../afk/SKILL.md`.

## Handle findings

1. Map every hypothesis to the frozen contract and apply the P1 admission rule.
2. Verify its trigger and consequence because the reviewer saw only a snapshot.
3. Batch any admitted P1 fixes, then self-review the affected surface.
4. Re-run this role when a content fix invalidates its prior verdict.
5. Record every remaining disposition without changing a clean revision.

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

## Setup

Set `DEEPSEEK_REVIEW_API_KEY` in the environment or a gitignored `.env`.
`DEV_DEEPSEEK_API_KEY` is the fallback name. Never put a key in the repository,
`.afk/config.md`, a command argument, or Kilo Code export. Disable with
`DEEPSEEK_REVIEW_GATE=off`.

Config knobs:

- `DEEPSEEK_REVIEW_MODEL` (default `deepseek-v4-pro`)
- `DEEPSEEK_REVIEW_BASE_URL` (default `https://api.deepseek.com`)
- `DEEPSEEK_REVIEW_THINKING` (`off` disables thinking; enabled by default)
- `DEEPSEEK_REVIEW_MAX_CTX_BYTES` (default `400000`)
- `DEEPSEEK_REVIEW_MAX_OUTPUT_TOKENS` (default `8192`)
- `DEEPSEEK_REVIEW_EXCLUDE_GLOBS` (comma- or newline-separated additions;
  built-in exclusions remain)
- `DEEPSEEK_REVIEW_TIMEOUT_MS` (default `900000`; shared fallback
  `AFK_REVIEW_TIMEOUT_MS`)
