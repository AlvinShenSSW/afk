# AGENTS.md

Canonical instructions for work on this repository. `CLAUDE.md` and `GEMINI.md`
defer here. This plugin packages a stack-agnostic PR pipeline; consuming project
preferences and run evidence stay in their ignored `.afk/` directory.

## Golden rules

- **Explanatory comments state why.** Operational instructions may state actions,
  conditions and outcomes. Keep lengthy rationale, background and worked
  examples in a design doc, issue or PR body rather than inline commentary.
- **No personal, project, or non-public information** in any file, ever.
- **English only** for all repository content.
- **Every PR is reviewed by the owner/maintainer before merge.** Never commit to
  `main`; one topic per branch; squash-merge.
- **Bump the plugin `version`** in any PR changing shipped skills, scripts, libraries,
  hooks, templates or manifests — it is the install cache key, and hosts ignore changes without it.
- **Secrets live in the environment only** — a shell env var or a gitignored
  `.env`, never a committed file and never `.afk/config.md`.

## Engineering rules for bundled code

- **No silent skips.** Every early return or skip logs a distinct reason; a
  benign skip exits 0; nothing is truncated or deleted before its replacement is
  verified.
- **No duplication.** Import a shared helper or constant; never copy it. Define a
  threshold once.
- **Overwrite, don't layer.** Replace superseded code in place; no `*_v2`,
  `.old`, or correction-wrapper siblings.
- **Fail toward less exposure.** On unreliable input, a check fails closed; any
  fail-open path is named and justified.

## What this plugin can and cannot enforce

AFK is Markdown followed by a host agent, not an orchestration runtime.
Every rule here sits at one of three levels. Name the level; do not borrow a
stronger word than the level supports.

| Level | Examples | What is actually available |
|---|---|---|
| **1 — Epistemic** | how hard a critic tries, which lenses it picks, noticing what nobody represented | Prose and evaluation only. Not mechanisable, at all. |
| **2 — Artifact** | a helper's output shape, a marker block, an exit code, whether a skip states a distinct reason, ledger format | Mechanically checkable **within a helper's own execution** |
| **3 — Workflow** | "the gate must run", "an unresolved P1 blocks the merge" | **Not enforceable by this plugin.** A driver may skip the helper, ignore its exit code, or fabricate its output |

**Vocabulary rule.** "Enforced", "blocked", "guaranteed" are for level 2, and
even there they mean *enforced when invoked* — a bundled helper constrains the
runs routed through it and nothing else. For level 3, say what is true: the
waterfall is doctrine the driver follows. Claiming otherwise is the same defect
this repo keeps finding in its own designs — a mechanism credited with something
it cannot do.

Real non-bypassability needs a control point outside the agent's authority: a
required CI check, branch protection, a host hook. Where an invariant genuinely
matters, put it there — not in a sentence.

## Local checks (mirror CI)

```bash
node scripts/sync-marketplace.mjs --check   # manifests in sync
node scripts/lint-skills.mjs                 # skill structure
node scripts/check-links.mjs                 # internal links resolve
node scripts/scan-provenance.mjs             # no leaked provenance
node --test                                  # unit tests
```

## Contribution and release

Design non-trivial changes under `docs/designs/specs/`, then tests first,
implementation, self-review and a PR. Every PR needs the owner/maintainer's review
before merge. CI green is necessary, not sufficient; configured independent
external roles also apply. Each actual reviewer differs from the implementer
and every other review role. Read the [canonical role profile and independence
rules](skills/afk/references/external-review.md) before selecting those roles.

The version input is `.claude-plugin/marketplace.json` → the `afk-skills` plugin's
`version`. Change it, then run `node scripts/sync-marketplace.mjs` to regenerate
host manifests and package metadata. Never hand-edit a generated mirror as the
version source. Run the local checks above and the required CI checks before
readiness.

## Read when applicable

- Before authoring a skill or changing host discovery, read
  [maintaining skills](docs/maintaining-skills.md).
- Before changing consuming config, helper location or bootstrap behavior, read
  [AFK environment](skills/afk/references/environment.md).
- Before changing run state or resumption, read
  [continuity](skills/afk/references/continuity.md).
- Before changing review or publication behavior, read
  [review convergence](skills/afk/references/review-convergence.md) and
  [publication](skills/afk/references/publication.md).
