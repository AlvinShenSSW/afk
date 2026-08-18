---
name: afk-implementation-pilot
description: Part of the afk pipeline. Executes an approved implementation plan — writes code, runs the project's checks, and self-reviews in a loop until two consecutive clean rounds, then prepares the branch for internal review. Requires a plan from afk-spec-planner or equivalent. Triggers include "/afk-implementation-pilot", "implement the plan".
---

# afk-implementation-pilot

Act as the developer executing an approved plan: implement it correctly, test it,
and self-review until it is genuinely ready, then hand off to `afk-internal-review`.
An efficient coding model is appropriate here.

**A plan is required.** Without one, redirect to `afk-spec-planner`. Do not
re-derive the plan.

## Workflow

### 1 — Load the plan

Confirm the acceptance criteria, files to change, key notes, test plan,
out-of-scope items, assumptions, and frozen issue contract. If anything conflicts
with what you observe in the code, correct the contract with repository evidence
before coding — never let an implementation preference expand it silently.

### 2 — Read before writing

Read the current implementation and existing tests of every file the plan
touches; confirm the plan's assumptions still hold; check for conflicting recent
commits or open PRs.

### 3 — Implement

Make the smallest change that satisfies the acceptance criteria. Follow existing
conventions exactly. No unrelated refactors, no speculative abstractions. Add or
update tests for every changed behaviour. Map every edit to a contract item or an
admitted, demonstrated defect. Anything else is removed or deferred; do not
create a follow-up issue automatically.

### 4 — Run checks

Run the project's checks from `.afk/config.md` (`test`, `lint`, `build`); for any
that is blank, auto-detect from the project and, if none exists, say so rather
than skip silently. Report results verbatim; never suppress a failure. Resolve
`.afk/` from the repository's main working tree — the first `worktree` line of
`git worktree list --porcelain` — never the current directory, or work in a
linked worktree reads a different `.afk/` than the one `afk-init` wrote.

### 5 — Self-review loop

Self-review against the checklist, triage every finding against the frozen
contract, and fix admitted defects. When an admitted P1 already requires a
content pass, also batch a verified lower-severity item only if it is in scope,
shares the root cause or touched surface, adds no dependency, migration, public
contract, or product choice, and needs no review round beyond the P1 re-review.
Record structural P2 for the operator-owned merge boundary; defer every other
ineligible lower-severity or out-of-scope proposal. A lower-severity-only round
never reopens a clean revision. Then
re-run affected checks, and repeat until **two consecutive clean rounds**. A
round is **clean** only if
every checklist lens below was applied to the full diff and reported a result —
"lens applied, nothing found" is a statement; a skipped or silent lens voids the
round — and every finding from an earlier round has its fix verified: by
re-running the affected checks where one applies, otherwise by a recorded
verification step; a fix's absence from later rounds verifies
nothing. Two consecutive clean rounds bound the **effort**, not correctness —
the reason internal review and the ordered external roles still follow.

- **Spec:** every acceptance criterion met; nothing out-of-scope added.
- **Correctness:** edge cases, error paths, off-by-one, concurrency.
- **Tests:** new behaviour, edge cases, and failure paths covered and passing.
- **Quality:** conventions followed; no dead code, debug artifacts, or unplanned
  TODOs.
- **Engineering rules:** no silent skip/exit; no duplicated helper or constant;
  superseded code overwritten in place, not layered; any position-touching path
  fails closed on unreliable input; plus any invariant listed in `.afk/config.md`.
- **Security:** no injection at new inputs; no sensitive data in logs; auth/authz
  correct for new actions.
- **Compatibility:** no unintended breaking changes; migrations safe and
  reversible.

Track decisions as well as findings. If the same decision changes A→B→A, stop
editing, run a whole-diff root-cause pass, and pin the contract-and-test-backed
choice. Change it again only on new evidence.

Stop condition: two consecutive clean rounds. Record both round numbers in the
handoff.

### 6 — Handoff

Summarize what was built, the acceptance-criteria status, deviations from the
plan, files changed, tests added, the lens-by-lens results of the two clean
rounds, and final check results. Suggest running
`afk-internal-review` next. Do not merge, push, or open a PR unless asked.

### 7 — CI watch (only when asked to push / open a PR)

If a push or PR is authorised, the job is not done when `git push` returns. Ask
the forge which checks it required of the pushed revision (`../afk/SKILL.md`,
"Remote checks", for what counts as required) and stay engaged while any is
failing: read its real output, confirm each finding against the cited code, fix
true bugs with a regression test, update any doc it flagged, and push one
comprehensive fix commit per round. Stop when the answer names nothing failing —
an answer naming no required check at all is that condition, not one that has
yet to report — and say which of those it was rather than reporting green. An
answer that keeps naming an unfinished check belongs to the driver's rule; do
not push again to move it, and never chase an informational note with another
commit.

## Hard rules

- Requires a plan. Two consecutive clean self-review rounds is the minimum bar.
- Never merge, push, or open a PR unless explicitly asked.
- Local green never sets the merge-ready bar; the driver's "Remote checks" rule
  does.
- Never fabricate results; never refactor unrelated code; flag plan conflicts
  instead of resolving them silently.
