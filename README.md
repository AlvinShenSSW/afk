# afk-skills

[![validate](https://github.com/AlvinShenSSW/afk/actions/workflows/validate.yml/badge.svg)](https://github.com/AlvinShenSSW/afk/actions/workflows/validate.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**Away-From-Keyboard autonomous execution for AI coding agents.** Hand your
agent a scoped set of issues, walk away, and come back to PR-ready work that a
*different* model has already reviewed.

`afk-skills` packages a stack-agnostic waterfall — design, plan, tests,
implementation, self-review, internal review, ordered independent external
review, full test suite, handoff — as a cross-agent plugin. It works with Claude
Code, Codex, Copilot, and any host that reads a `skills/` directory.

The plugin stays generic. Project-specific commands, merge preferences,
invariants, reports, and run ledgers live in the consuming repository's
gitignored `.afk/` directory — nothing about your project is ever written back
into the plugin.

## Why

Left alone, an agent grades its own homework. The three failure modes this
plugin is built around:

- **Self-review is not review.** Every external role runs as a *different*
  model from the one that wrote the code, read-only, on the real diff. A role
  that matches the implementer steps aside for an independent fallback.
- **Round counters are not convergence.** Review continues while it closes an
  admitted P1, turns a check green, or reduces a demonstrated root cause — never
  because a counter says "one more pass". Evidence ends the loop.
- **A draft PR is not a finish line.** The waterfall has one end state: green
  checks, a clean internal review, clean external roles, and the full test suite
  passing on the final commit.

## Quick start

1. Install this repository through your agent host's plugin flow (see
   [Installation](#installation)).
2. Open a repository you want to work in. The first afk skill you run
   bootstraps `.afk/` for you; to do it explicitly, run `/afk-init`.
3. Hand over a scope:

   ```text
   /afk issue 123
   ```

`afk` only runs against an explicit operator-provided scope. It does not browse
a tracker and choose work by itself.

**Requirements:** git, Node 20+ for the bundled helpers (dependency-free ESM, no
`npm install`), and the CLI or API credential for whichever external review
roles you enable. Reading a tracked issue also needs that forge's CLI — `gh` for
GitHub, `az` with the `azure-devops` extension for Azure DevOps. Everything else
in the pipeline is plain git.

## What it provides

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
-> design doc with a frozen issue contract
-> adversarial debate
-> design-stage external gate (opt-in pilot, default off)
-> targeted tests
-> implementation
-> self-review
-> pull request (draft) + required checks resolved
-> internal review
-> Codex external role (or independent fallback; single by default)
-> Kimi final external role (only when a double profile is selected)
-> full final test suite on the final commit
-> owner approval or configured merge policy
```

The plugin never deploys.

## External review roles

Each role is an independent model reading the diff, bounded by a timeout, and
read-only. Codex, Claude, GLM, DeepSeek, and MiMo are read-only *by
construction* (sandbox flag, tool allow-list, or a tool-less API call); Kimi's
read-only is only requested in the prompt, which is the weaker guarantee.

| Role | Runs via | Credential | Default timeout |
|------|----------|-----------|-----------------|
| `codex` | Codex CLI (`exec -s read-only`) | the CLI's own auth | 15 min |
| `claude` | Claude Code CLI (`Read,Grep,Glob` only) | the CLI's own auth | 15 min |
| `kimi` | Kimi CLI (drives git itself) | the CLI's own auth | 45 min |
| `glm` | Z.ai `glm-5.2`, Anthropic-protocol API | `ZAI_API_KEY` or `GLM_API_KEY` | 15 min |
| `deepseek` | DeepSeek V4 Pro API | `DEEPSEEK_REVIEW_API_KEY`, else `DEV_DEEPSEEK_API_KEY` | 15 min |
| `mimo` | Xiaomi MiMo V2.5 Pro API | `MIMO_REVIEW_API_KEY`, else `DEV_MIMO_API_KEY` | 15 min |

Kimi gets longer because it drives git itself rather than receiving a
pre-injected diff. CLI availability and authentication probes are capped at 30
seconds. A timed-out review produces no verdict and follows the existing
transient-error retry and fallback rule; an abnormal child exit is never read as
a verdict.

Set `AFK_REVIEW_TIMEOUT_MS` to change the shared limit, or override one provider
with `CODEX_REVIEW_TIMEOUT_MS`, `CLAUDE_REVIEW_TIMEOUT_MS`,
`KIMI_REVIEW_TIMEOUT_MS`, `GLM_REVIEW_TIMEOUT_MS`,
`DEEPSEEK_REVIEW_TIMEOUT_MS`, or `MIMO_REVIEW_TIMEOUT_MS`. Values must be
positive integer milliseconds; an unusable value retains a bounded limit and
emits a warning.

CLI timeouts use a hard kill so a process that ignores graceful termination
cannot wedge the gate. On Windows, npm command shims run through a shell; the
gate returns on time, but a surviving shim grandchild may require manual cleanup.

## Evidence-driven convergence

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

## What this can and cannot enforce

These skills are markdown read by a host agent. **There is no afk runtime.**
Nothing executes the waterfall; an agent reads prose and chooses to comply, and
the agent being governed is also the orchestrator.

- **Prose only.** How hard a critic tries, which lenses it picks — evaluation,
  not mechanism.
- **Enforced when invoked.** A bundled helper's output shape, marker block, exit
  code, and skip reason are mechanically checked *within that helper's own
  execution*. Review bodies that contain a lookalike marker line are neutralized
  so a review cannot forge a verdict.
- **Not enforceable here.** "The gate must run", "an unresolved P1 blocks the
  merge" — a driver may skip a helper or ignore its exit code. These are
  doctrine the driver follows.

Real non-bypassability needs a control point outside the agent's authority. This
repository puts its own there: branch protection plus a required
`require-owner-approval` check (see [docs/branch-protection.md](docs/branch-protection.md)).
Do the same in yours.

## Installation

Install this repository through the host agent's plugin flow. The repository
ships manifests for the supported host layouts:

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

Hosts address these skills as `afk-skills:<name>` (Claude Code) or by their
unique `afk-`prefixed name on flat-namespace hosts. A personal skill with the
same name overrides a plugin skill — invoke the qualified form, or rename the
local one.

## Project configuration

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
gates:    codex
# gates:  codex > kimi   # opt-in: ordered double review (Codex outer → Kimi final)
priority: codex > claude > kimi > glm
# implementer:   # who writes the code, if not the driver; may only block a gate

## forge
# forge:                 # github · azure-devops
# azure-organization:    # https://dev.azure.com/<org>, for a cross-host setup
# github-repository:     # [HOST/]OWNER/REPO, likewise

## checks
# remote-ci:             # detect (default) · expected · absent

## merge
policy: leave-open

## resume
auto-resume: notify   # off · notify (default) · auto

## invariants
```

`gates` defines ordered required roles and their count; `priority` is only the
fallback pool. The built-in default is a single Codex review; per handoff,
explicit role flags (`-codex -kimi`) select that run's ordered roles and
override `gates`. Existing configs with legacy `priority`/`min-pass`/`mode`
and no `gates` keep their prior behavior until the operator opts in. A config
bootstrapped before 0.4.0 carries a template-written `gates: codex > kimi`;
delete the line (or set `gates: codex`) to adopt the single-gate default.

Explicit `gates:` and `priority:` profiles may also name `deepseek` or `mimo`.
They remain opt-in and do not alter the built-in sequence or fallback pool.

An optional `design-gate:` key runs one external role over the *design doc*
before any code is written — `off` (default), `risky` (design-heavy or
high-blast-radius issues only), or `on` (every issue).

## Credentials

Secrets never belong in `.afk/config.md`; use environment variables or a
gitignored `.env`. The API-backed gates call the provider directly and do not
import credentials from any editor or extension.

`GLM_REVIEW_BASE_URL` must be an Anthropic-protocol endpoint (the default is
`https://api.z.ai/api/anthropic`); the OpenAI-compatible Z.ai URL is no longer
auto-detected.

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

The snapshot-backed API gates (GLM, DeepSeek, MiMo) and the agent relay filter
their payload before it leaves the machine: secret-bearing paths (`.env`, keys,
credential and secret files) are dropped from the snapshot, and known token
shapes are redacted from what is sent.

### Which forge

`forge` decides which tracker an issue id is read from. Left unset it is detected
from the `origin` remote, and falls back to GitHub when nothing matches. Set it
explicitly when the code host and the tracker are not the same service: the id
reaches whichever CLI the forge selects, and the CLI of a different forge can
answer for that id and succeed, putting another tracker's issue into the plan.
That cross-host case also needs the key naming the tracker itself —
`azure-organization` or `github-repository` — because there is no remote to read
it from and each CLI would otherwise take one from the checkout or its own
environment. A forge that cannot be served is named where it is needed rather
than attempted.

### What an empty check reading means

`remote-ci` says what to do when the forge names no required check for a
revision, or cannot be asked at all. `detect` (the default) settles it once the
run's re-read window closes; `absent` settles it at once, for a repository the
operator knows runs none; `expected` never settles it, for one that must always
report. It adds no required check of its own; what counts as required is the
forge's answer — a forge that draws no required/advisory line has every check it
reports read as required.

Where no required check constrained a revision, the ordered roles and the local
suite are the whole of what the run applied, and both are evaluation the driver
performs on itself. A required check is one of the few control points outside
that authority, so every such revision is named in the end-of-run report.

## Merge policies

Configured in `.afk/config.md`:

- `leave-open` prepares the PR and leaves it for operator approval.
- `merge-to-unblock` merges only when needed to unblock the scoped queue.
- `merge-when-green` merges when checks and required gates pass.

## Resuming a paused run

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

## Staying up to date

The install cache is keyed by the plugin version, so an outdated install
silently keeps serving old skills — and invoking a satellite skill directly runs
no kickoff check that would say so. The `afk` driver checks at kickoff, and the
same `SessionStart` hook checks too. The answer is cached in
`.afk/update-check.json` (checked at most once a day), is read-only and bounded,
degrades silently offline, and never blocks. Silence it with
`AFK_UPDATE_CHECK=off`.

Installing the update stays yours to do from your agent host; no skill updates
itself.

## Common invocations

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

## Repository layout

```text
skills/       Source skills shipped by the plugin.
scripts/      Manifest sync, lint, link, provenance, and version checks.
lib/          Shared runtime imported by bundled scripts and hooks.
hooks/        Plugin-level hooks (SessionStart auto-resume, update notice).
templates/    Starter `.afk/` files for consuming repositories.
docs/         Design and operating notes.
```

## Developing this plugin

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

Bump the plugin version in any PR that changes `skills/`, `scripts/`, `lib/`,
`hooks/`, `templates/`, or the manifests. Host install caches use the version as
the update key.

## Contributing

Read [AGENTS.md](AGENTS.md) before changing this repository. It is the canonical
guide for agents and humans; [CONTRIBUTING.md](CONTRIBUTING.md) is the short
human version.

## License

Apache-2.0. See [LICENSE](LICENSE).
