# AFK Skills

Autonomous PR-pipeline skills for AI coding agents.

`afk-skills` packages a stack-agnostic workflow for handing a scoped software
task to an AI coding agent and getting back PR-ready work: planning,
implementation, self-review, internal review, ordered independent external review, final
checks, and handoff.

The plugin stays generic. Project-specific commands, merge preferences,
invariants, reports, and run ledgers live in the consuming repository's
gitignored `.afk/` directory.

## What It Provides

| Skill | Purpose |
|-------|---------|
| `afk` | Runs the full autonomous waterfall for an operator-provided scope. |
| `afk-init` | Bootstraps `.afk/` for a repository — auto-run when it is missing; detects commands and records the plugin root. |
| `afk-spec-planner` | Turns an issue into a reviewable implementation plan. |
| `afk-implementation-pilot` | Implements an approved plan and self-reviews it. |
| `afk-internal-review` | Performs the internal production-readiness review. |
| `afk-codex-review` | Runs the default Codex outer role. |
| `afk-claude-review` | Runs a Claude fallback role; declines to review Claude's own work. |
| `afk-kimi-review` | Runs the default Kimi final role. |
| `afk-glm-review` | Runs a GLM fallback role with bounded diff context. |
| `afk-deepseek-review` | Runs an optional DeepSeek V4 Pro snapshot-backed role. |
| `afk-mimo-review` | Runs an optional MiMo V2.5 Pro Token Plan snapshot-backed role. |
| `afk-agent-relay` | Offloads large reads or scoping work to an external model. |

## Pipeline

```text
scope
-> design / plan
-> targeted tests
-> implementation
-> self-review
-> pull request
-> CI
-> internal review
-> Codex outer external role (or independent fallback)
-> Kimi final external role (or independent fallback)
-> full final test suite
-> owner approval or configured merge policy
```

`afk` only runs against an explicit operator-provided scope. It does not browse a
tracker and choose work by itself.

## Evidence-Driven Convergence

AFK does not ask for operator permission because a review counter was reached.
The issue contract is frozen before implementation, every reported finding starts
untriaged, and P1 is admitted only with a scope anchor, reachable trigger,
demonstrated wrong consequence, stage-blocking impact, and minimal causal fix.
P2, minor, and out-of-scope observations are recorded without expanding the PR.
A structural P2 does not block a review stamp, but it leaves auto-merge for the
operator to authorize; minor and out-of-scope notes remain non-blocking.
When a P1 already forces a content pass and re-review, AFK may batch a verified,
in-scope P2 or minor that shares its root cause or touched surface and adds no
dependency, migration, public contract, product choice, or extra gate round. It
does not reopen a clean revision for lower-severity work alone.

Review rounds may continue while they close an admitted P1, turn a check green,
reduce a demonstrated root cause, or advance a clean stage. Two unfinished
no-progress rounds trigger an automatic whole-diff root-cause checkpoint rather
than an operator prompt. Reworded or evidence-free repeated findings cannot
reopen a closed decision, and an A→B→A edit is pinned by the contract and tests
before review continues.

## Installation

Install this repository through the host agent's plugin flow — it works with
Claude Code, Codex, Copilot, and other agents that read a `skills/` directory.

The repository ships manifests for the supported host layouts:

- `.codex-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `.agents/plugins/marketplace.json`
- `.github/plugin/marketplace.json`
- `plugin.json`

No manual setup step is required: the first time an afk skill runs in a
repository it bootstraps `.afk/` automatically — creating the config, adding the
ignore entry, detecting commands, and recording the plugin root. To set it
up explicitly or re-detect commands, run:

```text
/afk-init
```

It never overwrites developer-authored values.

## Review Timeouts

Every external review is bounded. Claude, Codex, GLM, DeepSeek, and MiMo default
to 15 minutes; Kimi defaults to 30 minutes because its agentic reviews commonly take longer.
CLI availability and authentication probes are capped at 30 seconds. A
timed-out review produces no verdict and follows the existing transient-error
retry and fallback rule.

Set `AFK_REVIEW_TIMEOUT_MS` to change the shared limit, or override one provider
with `CODEX_REVIEW_TIMEOUT_MS`, `CLAUDE_REVIEW_TIMEOUT_MS`,
`KIMI_REVIEW_TIMEOUT_MS`, `GLM_REVIEW_TIMEOUT_MS`,
`DEEPSEEK_REVIEW_TIMEOUT_MS`, or `MIMO_REVIEW_TIMEOUT_MS`. Values must be
positive integer milliseconds; an unusable value retains a bounded limit and
emits a warning.

CLI timeouts use a hard kill so a process that ignores graceful termination
cannot wedge the gate. On Windows, npm command shims run through a shell; the
gate returns on time, but a surviving shim grandchild may require manual cleanup.

## Staying Up To Date

The install cache is keyed by the plugin version, so an outdated install
silently keeps old skills. On each `afk` run the driver checks whether a newer
version is published and prints a one-line notice when you are behind. The check
is read-only, bounded, degrades silently offline, and never blocks.

## Resuming a Paused Run

An overnight run's wake-up tick is in-session and not durable: a rate limit,
window restart, or the host sleeping ends it silently, leaving the run
`state: active` with a going-stale heartbeat. A bundled `SessionStart` hook
(`hooks/afk-resume-detect.mjs`) closes the common recovery path — when you reopen
a window on the repo, it detects a paused, resumable run and surfaces its
run-id, ledger path, and scope so you do not have to hunt for it. It is a pure
no-op outside an afk repo, never blocks a session, and only ever surfaces a run
whose heartbeat is stale (a fresh heartbeat means a live tick still owns it).

The `auto-resume` knob in `.afk/config.md` sets the behaviour:

- `off` — no resume detection (the stale-install notice below is separate).
- `notify` (default) — surface the paused run; you decide whether to resume.
- `auto` — for a single unambiguous run, also direct an autonomous resume unless
  your first message redirects. Two or more paused runs are only ever listed,
  never auto-driven (each needs its own session).

The hook is not a scheduler — it cannot start a turn on its own, so it does not
replace a durable external scheduler.

The same hook reports when the installed plugin is behind the canonical repo.
The plugin's install cache is version-keyed, so an old install keeps serving old
skills with nothing to show for it — and invoking a skill directly runs no
kickoff check that would say so. The answer is cached in
`.afk/update-check.json` (checked at most once a day), never blocks, and is
silenced with `AFK_UPDATE_CHECK=off`. Installing the update stays yours to do
from your agent host; no skill updates itself.

## Project Configuration

The consuming repository may contain a local, gitignored `.afk/` directory:

```text
.afk/
  config.md
  runs/
    <run-id>/
      ledger.md
      PR#<n>-<title>.md
```

Each run owns one `runs/<run-id>/` directory — its ledger and its final reports
together. Runs never share a path, so concurrent runs in one repository cannot
overwrite each other. `.afk/` lives in the main working tree, so a run spanning
several linked worktrees keeps one ledger and stays visible to other runs.

All fields in `.afk/config.md` are optional. Blank or absent values resolve to
safe defaults or auto-detected commands.

```markdown
# afk config

## commands
test:  <cmd>
lint:  <cmd>
build: <cmd>

## external gate
gates:    codex > kimi
priority: codex > claude > kimi > glm
# implementer:   # who writes the code, if not the driver; may only block a gate

## merge
policy: leave-open

## resume
auto-resume: notify   # off · notify (default) · auto

## invariants
```

`gates` defines ordered required roles and their count; `priority` is only the
fallback pool. Existing configs with legacy `priority`/`min-pass`/`mode` and no
`gates` keep their prior behavior until the operator opts in.

Explicit `gates:` and `priority:` profiles may also name `deepseek` or `mimo`.
They remain opt-in and do not alter the built-in sequence or fallback pool.

Secrets never belong in `.afk/config.md`; use environment variables or a
gitignored `.env`. DeepSeek reads `DEEPSEEK_REVIEW_API_KEY` first and
`DEV_DEEPSEEK_API_KEY` second. MiMo reads `MIMO_REVIEW_API_KEY` first and
`DEV_MIMO_API_KEY` second. GLM reads `ZAI_API_KEY` or `GLM_API_KEY`. These gates
call the provider APIs directly and do not import credentials from Kilo Code or
VS Code.

For the current shell, export only the provider you intend to use:

```bash
export ZAI_API_KEY="<your-zai-key>" # GLM; GLM_API_KEY is also accepted
export DEEPSEEK_REVIEW_API_KEY="<your-deepseek-key>"
export MIMO_REVIEW_API_KEY="<your-mimo-token-plan-key>"
```

For a persistent per-repository setup, put the same assignment without
`export` in the local `.env`. Before adding a real value, verify the ignore rule:

```bash
git check-ignore -v .env
```

If that command prints no matching rule, do not put a credential in the file;
run `/afk-init` or add `.env` to a local Git exclude first.

## Common Invocations

```text
/afk-init
/afk-spec-planner issue 123
/afk-implementation-pilot
/afk issue 123
/afk-internal-review PR 456
/afk-codex-review
/afk-claude-review
/afk-kimi-review
/afk-glm-review
/afk-deepseek-review
/afk-mimo-review
```

## Merge Policies

Configured in `.afk/config.md`:

- `leave-open` prepares the PR and leaves it for operator approval.
- `merge-to-unblock` merges only when needed to unblock the scoped queue.
- `merge-when-green` merges when checks and required gates pass.

The plugin never deploys.

## Developing This Plugin

Run the local checks before opening a PR:

```bash
npm run sync:check
npm run lint:skills
npm run lint:links
npm run scan:provenance
npm test
```

Refresh generated manifests after changing the skill set:

```bash
npm run sync
```

Bump the plugin version in any PR that changes `skills/`, bundled scripts, or
manifests. Host install caches use the version as the update key.

## Repository Layout

```text
skills/       Source skills shipped by the plugin.
scripts/      Manifest sync, lint, link, provenance, and version checks.
lib/          Shared runtime imported by bundled scripts and hooks.
hooks/        Plugin-level hooks (SessionStart auto-resume, update notice).
templates/    Starter `.afk/` files for consuming repositories.
docs/         Design and operating notes.
```

## Contributing

Read [AGENTS.md](AGENTS.md) before changing this repository. It is the canonical
guide for agents and humans; [CONTRIBUTING.md](CONTRIBUTING.md) is the short
human version.

## License

Apache-2.0. See [LICENSE](LICENSE).
