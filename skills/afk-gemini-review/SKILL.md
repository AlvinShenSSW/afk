---
name: afk-gemini-review
description: "afk-gemini-review: Part of the afk pipeline. Independent read-only Gemini review, an optional external role. Triggers include \"/afk-gemini-review\", \"run gemini review\", and \"Gemini external gate\"."
---

# afk-gemini-review

Read [AFK environment](../afk/references/environment.md) before resolving
configuration, local state or bundled helper paths.
Before invoking this gate, read [external review](../afk/references/external-review.md)
and [review convergence](../afk/references/review-convergence.md). They own role
selection, authorship declaration, admission, repair allowance and closure.
Before supplying context/receipts or reusing receipts, read
[review evidence](../afk/references/review-evidence.md). Before `--design`, read
[external design review](../afk/references/design-review.md#external-design-review).
Reuse only the same installed revision already read and still in context;
otherwise reread it. Apply these routes for standalone invocations too.

For standalone review, run only the requested gate and return its verdict.
Follow [external review](../afk/references/external-review.md) for the distinction
between standalone invocation and driver-managed AFK sequencing.

An optional independent review by `gemini-4-argon` (Gemini 4 Argon) through
Google's OpenAI-compatible Gemini API, at `high` reasoning effort by default.
Run it only when an explicit `.afk/config.md` `gates:` or `priority:` profile
selects Gemini, or when the operator invokes this skill directly. Never use it
when Gemini wrote the change or already occupies another ordered role.

Gemini receives a bounded, redacted snapshot through its REST API. It has no
repository tools, so verify findings that require material outside the snapshot.

## Review context

Read [review evidence](../afk/references/review-evidence.md) before using
`--review-context`, `--review-phase` or `--review-receipt`.
Use `--print-prompt` to inspect the supplied section before a provider call.
Required history is validated and never silently truncated.

## Run it

Read [environment](../afk/references/environment.md) to resolve
`gemini-gate.mjs` beside this skill and bootstrap when needed.

```text
node "<helper-dir>/gemini-gate.mjs"
```

Run it in the background with a generous timeout and save stdout for the run
record. Pass through `--base <branch>`, `--commit <sha>`, `--uncommitted`, or
`--design <path>`. Use `--print-args` for resolved metadata or `--print-prompt`
for the redacted prompt without a provider call. Do not poll in a sleep loop.

Read [authorship declaration](../afk/references/external-review.md#authorship-declaration)
before choosing `--implementer`; design mode names the design author.

The bounded snapshot excludes secret-bearing paths, redacts secret-shaped
values, and rejects unsafe design inputs before the request. A missing or
invalid `--design` target is `ERROR`, not a skip. A timeout, unsafe finish
reason, unverified response model, or an undocumented reasoning effort also
yields a non-zero `ERROR` with no partial verdict. Auth failures, rate limits, and an unavailable model or
endpoint (HTTP 404) are `SKIPPED` — the reviewer is unavailable and the next
family takes its place, per the shared skip-vs-error table. A successful review that omitted entries carries a bounded
`SNAPSHOT_NOTE` count; redacted excluded paths stay in local stderr only.

Read the verdict between the
`===== GEMINI REVIEW (final message) =====` markers. Treat only column-0
marker lines as markers; the last END marker wins. A `SKIPPED` result is not a
verdict; record it and follow [external review](../afk/references/external-review.md) for fallback.

## Handle findings

Apply [review convergence](../afk/references/review-convergence.md) before triage,
repairs or re-review. Keep the issue's current finding record and allowance;
apply consuming `.afk/config.md` invariants as extra must-check lenses.

## Stop rule

Use the [canonical closure and stop rules](../afk/references/review-convergence.md)
to decide whether this revision earns the role stamp.

Report `CLEAN`, or `OUTSTANDING` with what remains. A clean pass is not
authority to merge.

## Setup

Set `GEMINI_REVIEW_API_KEY` in the environment or a gitignored `.env`.
`GEMINI_API_KEY` is the fallback name. Never put a key in the repository,
`.afk/config.md` or a command argument. Disable with `GEMINI_REVIEW_GATE=off`.

Config knobs:

- `GEMINI_REVIEW_MODEL` (default `gemini-4-argon`)
- `GEMINI_REVIEW_BASE_URL` (default
  `https://generativelanguage.googleapis.com/v1beta/openai`)
- `GEMINI_REVIEW_REASONING_EFFORT` (default `high`; one of `minimal`, `low`,
  `medium`, `high`; Gemini 4 serves `minimal` as `low` and cannot disable
  reasoning)
- `GEMINI_REVIEW_MAX_CTX_BYTES` (default `400000`)
- `GEMINI_REVIEW_MAX_OUTPUT_TOKENS` (default `65536`; Gemini counts reasoning
  against this cap, so a small value truncates the review)
- `GEMINI_REVIEW_EXCLUDE_GLOBS` (comma- or newline-separated additions; built-in
  exclusions remain)
- `GEMINI_REVIEW_TIMEOUT_MS` (default `900000`; shared fallback
  `AFK_REVIEW_TIMEOUT_MS`)

The response model must match the request (a dated `-YYYYMMDD` snapshot suffix
is accepted). If Google reports a different identity, the verdict is discarded
as `ERROR`; check `GEMINI_REVIEW_MODEL` and `GEMINI_REVIEW_BASE_URL` first.
