---
name: afk-glm-review
description: Part of the afk pipeline. Runs GLM (Z.ai glm-5.2) as an independent, read-only fallback external review role for an ordered .afk/config.md gate profile. Triggers include "/afk-glm-review", "run glm review", "glm gate", and "GLM external gate".
---

# afk-glm-review

An independent second-opinion review by Z.ai `glm-5.2`, used as a fallback role
after `afk-internal-review`. Run the ordered roles required by `.afk/config.md`,
and never use a reviewer whose model matches the implementer or another role.

GLM is reached through the Z.ai REST API, not an agentic CLI. The helper gathers
the diff and full current contents of changed files, then sends that bounded
context to GLM. Verify findings that depend on files outside that context.

The helper `glm-gate.mjs` ships with this skill and travels with the plugin.

## Metering

Metered like any external gate. Batch admitted P1 and eligible lower-severity
fixes into one content pass, self-review, then re-run once. Record every other
disposition together at the end without editing a clean revision.

## Run it

The bundled helper `glm-gate.mjs` sits beside this SKILL.md. Locate its directory
as `${CLAUDE_PLUGIN_ROOT}/skills/afk-glm-review` if the env var is set, else
`<pluginRoot>/skills/afk-glm-review` from `.afk/config.md`, else this skill's own
directory. Resolve `.afk/` from the repository's main working tree — the first
`worktree` line of `git worktree list --porcelain` — never the current directory,
or a run from a linked worktree reads a different `.afk/` than the one `afk-init`
wrote. If `.afk/` is absent, the `afk-init` bootstrap runs automatically first:

```text
node "<helper-dir>/glm-gate.mjs"
```

Run it in the **background** with a generous timeout; redirect stdout to a file
and read it when it completes. Pass through any target flag (`--base <branch>` /
`--commit <sha>` / `--uncommitted`). Do not poll in a sleep loop.

**The review is bounded** by `GLM_REVIEW_TIMEOUT_MS` (default 15 min), with
`AFK_REVIEW_TIMEOUT_MS` as the shared fallback. A timeout is a non-zero `ERROR`,
never a partial verdict; it follows the role's transient retry rule.

**Design mode** (`--design <path>`) reviews a design document's reasoning instead
of a diff — the opt-in design-stage gate (see `../afk/SKILL.md`, "Design-stage
external gate"). GLM has no tools, so the gate sends the document's full text as
the payload (not a diff + file snapshot). A missing or unreadable `--design` path
fails loudly (`ERROR`, non-zero), never a skip.

Read the verdict between the `===== GLM REVIEW (final message) =====` markers.
`SKIPPED: ...` (no key, auth failure, HTTP error, or disabled via
`GLM_REVIEW_GATE=off`) is not a failure; record it and continue according to the
`afk` gate-selection rule.

## Handle findings

Use the same discipline as `afk-codex-review` and `afk-kimi-review`:

1. Map every hypothesis to the frozen contract and apply the P1 admission rule.
2. Verify its trigger and consequence; GLM saw the diff and changed
   files, not the whole repo.
3. Fix admitted P1 findings in one batch and include only lower-severity work
   eligible under the rule below.
4. Self-review once.
5. Re-run the gate once if structural findings were fixed.
6. Record remaining dispositions in one final pass without editing the clean
   revision or running another gate round.

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

Optional and self-skipping. Set `ZAI_API_KEY` or `GLM_API_KEY` in the environment
or a gitignored `.env`. Disable with `GLM_REVIEW_GATE=off`.

Config knobs:

- `GLM_REVIEW_MODEL` (default `glm-5.2`)
- `GLM_REVIEW_BASE_URL` (default `https://api.z.ai/api/anthropic`)
- `GLM_REVIEW_MAX_CTX_BYTES` (default `400000`)
- `GLM_REVIEW_TIMEOUT_MS` (default `900000`; shared fallback
  `AFK_REVIEW_TIMEOUT_MS`)
