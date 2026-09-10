# Deferred CI and local AFK completion

## Contract

Issue #104. Target release: 1.0.1.

Draft pull requests should avoid repeated full validation while implementation
and independent review are still changing the revision. The forge's Ready for
review transition must precede CI, while AFK merge readiness still follows CI.
A conditional skip must never stand in for executed validation.

An operator may select `remote-ci: off` in `.afk/config.md` to finish AFK with
local checks and all configured review roles. This explicit choice differs from
`absent`, which still reads the forge and only settles an empty reading.

## Decisions

- Filter the validation job for Draft PRs; preserve non-Draft updates, main
  pushes, and manual runs. Keep the inexpensive owner approval job unchanged.
- Finish reviews and the final local suite before marking a PR Ready for
  review. Read the ensuing current-revision validation run before claiming
  merge readiness, including when that validation is advisory at the forge.
  A Draft skip or an unrelated successful job cannot satisfy that step.
- Keep `detect`, `expected`, and `absent` behavior for empty readings. An
  observed validation workflow awaiting its real run is not an empty reading.
- With `off`, do not poll, dispatch CI, automatically push, open a PR, mark it
  ready, or merge. Complete the local branch and report `LOCAL-COMPLETE` after
  the same review and local test requirements. Existing PRs stay as found;
  remote publication needs explicit operator direction because it can trigger
  workflows the plugin does not control. This is not an offline model mode.
- Record the effective mode at kickoff and reuse it on resume. Preserve the
  issue-wide repair allowance across CI failures and mode changes.

The mode does not disable repository workflows, cancel existing runs, alter
branch protection, or fabricate a CI result. These are workflow instructions
(level 3), not a trusted execution boundary. The workflow condition controls
only jobs routed through that GitHub workflow.

## Validation

Exercise the checked-in job condition against Draft creation/updates, the Ready
transition, non-Draft creation/updates, main push, and manual dispatch. Update
the existing remote-check contract guards for mode precedence and stage order;
they check authored artifacts, not agent compliance. Run the repository's local
checks and full test suite. No new runtime or additional review role is needed.
