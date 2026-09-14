# Issue 107: Stage-specific instruction routing

## Spec review

Issue #107 reduces irrelevant instruction loading while preserving the existing
AFK entry points and obligations. It changes this repository's `AGENTS.md`, the
skill entry points, and their references. It does not change personal or
installed instructions. A shorter entry point is useful only if the required
rules remain discoverable at the point they apply.

This plan is based on revision
`6244d63a87826e2834652fc8a96df6647933dce2` (plugin version `1.0.1`), the published
issue #107, and parent Epic #106 including F1–F6 and R1–R5. The baseline contains
12 public skills in total: the driver and 11 satellites. The Epic review's
phrase "twelve satellite skills" is an inventory error, not a requirement to
add a skill.

The delivery is a structural refactor. Actual reference loading and
natural-language selection require qualified host trials owned by #112 and
issue #113. Neither reachable links, preserved words, nor a smaller entry point proves
those behaviors. Epic AC1 remains **OUTSTANDING** until that evidence exists.

## Frozen issue contract

### Acceptance criteria

- **C1 — Global instructions:** `AGENTS.md` keeps repository-wide invariants,
  the three assurance levels, validation/release duties, and owner review
  authority visible. It routes conditional authoring and runtime-layout detail
  directly to the relevant canonical source. The why-only rule applies to
  explanatory commentary; operational instructions may state actions,
  conditions, and outcomes.
- **C2 — Entry compatibility:** preserve all 12 names, their directory paths,
  existing explicit invocation forms, every current natural-language trigger
  synonym in frontmatter, and normal implicit selection eligibility. Shorten
  descriptions only by relocating non-trigger procedural detail.
- **C3 — Routed obligations:** every explicit entry has a documented conditional
  read route to each applicable common rule. Standalone satellites do not rely
  on an earlier driver invocation. Nested stages may reuse a reference only
  when that same installed revision was already read in the current context.
- **C4 — Single definitions:** the driver becomes a contract and stage router.
  Common detailed rules have one maintained source; satellites carry a short
  local read/apply obligation, not copied triage, implementer, or stop blocks.
  Tests read those canonical definitions and separately verify the routes.
- **C5 — Unchanged workflow:** preserve supplied scope, authority limits, stage
  order, optional design-gate behavior, author/reviewer independence, model
  defaults, review strength, finding admission/dispositions, the shared repair
  allowance, evidence freshness, CI modes, and current terminal states. Preserve
  standalone planner and implementation boundaries; do not implement #108's
  revised handoff protocol as part of relocation.
- **C6 — Complete migration:** migrate affected AGENTS and SKILL phrase readers,
  links and anchors, relative helper/document paths, and evaluation support
  coverage. Keep historical documents accurate without copying new active rules
  into them. Update the cache version through the actual manifest generator.
- **C7 — Evidence honesty:** report structural checks separately from behavior
  coverage. Record the final full implementation commit and its support digest
  for later trials; record unexecuted behavior as OUTSTANDING, not passed.

Allowed visible changes are shorter descriptions and entry points, conditional
reads, new documentation locations, and clearer distinction between explanation
and actionable instruction. They do not grant new work, publication, model
spending, or merge authority. The smallest causal boundary is instruction
organization plus its existing structural readers and packaging checks.

Level 1 is the quality of the agent's understanding. Level 2 is validation of
links, contract artifacts, and exported bytes when checks execute. Level 3 is
whether a host agent follows the read routes and workflow. This change creates
no runtime or non-bypassable instruction loader.

## Assumptions and resolved gaps

| Question | Decision and basis | Remaining uncertainty |
| --- | --- | --- |
| What needs preserving? | Inventory the current 12 frontmatter records and route consumers; retain every trigger synonym rather than infer which ones are redundant. | Host auto-selection after other description edits still needs trials. |
| Which version field is authoritative? | `scripts/sync-marketplace.mjs` reads `.claude-plugin/marketplace.json` → `plugins` → `afk-skills.version`; it regenerates `plugin.json`. Use that source, correcting the Epic's shorthand to "bump plugin.json". | Recheck the current release version before the final implementation commit. |
| Are references exported already? | `supportVisible` exports `skills/**`, excluding tests/evaluation segments. New runtime references need coverage tests, not a broader allowlist. | Real host access/loading remains unqualified here. |
| Should AGENTS reach consuming evaluation subjects? | No. It governs authors of this plugin, not synthetic consuming repositories. Runtime references must not require it or new maintainer documents. | Future repository-author routing evaluation must supply its own scoped fixture in #112. |
| Does the existing link checker verify anchors? | No. `scripts/check-links.mjs` strips fragments and checks existence only. Add focused anchor/route tests without claiming a host loaded them. | Generic Markdown rendering outside the tested route subset is not covered. |
| Do declarations create a new run state authority? | No. Preserve existing narrative ledger and current continuity wording; this issue adds no state fields or schemas. | #108's provisional views and #109's structured authority remain separate work. |
| Are concurrent edits excluded? | Local history and the assigned baseline were inspected. The root driver checks live PR/branch overlap before implementation. | This planning pass did not independently inspect live remote PRs. |

No external CLI, host-loading, isolation, or paid evaluation capability is
assumed from a successful local text check. Existing provider descriptions are
compatibility content to preserve, not newly verified claims about a provider.

## Approach

Use progressive disclosure at real stage boundaries. Keep short single-purpose
skills self-contained, with routes only for common obligations they need. Split
the large driver into focused references; do not add a new public skill, a
loader, a generated combined instruction file, or a configuration knob.

`AGENTS.md` remains the repository authority. Preserve its safety, English-only,
privacy, secrets, branch/owner-review, validation, release, engineering, and
assurance rules. Move skill naming, description construction, relative-link
conventions, host namespacing, and layout detail into
`docs/maintaining-skills.md`. Link runtime layout to its actual skill reference
rather than copying it into a second maintainer guide. Keep release inputs and
the required check commands visible in AGENTS. Replace duplicated contributor
instructions with direct links to those sources.

The driver's body keeps supplied scope, authority boundaries, the waterfall,
and routes that must be read before the corresponding stage. It keeps the list
of all six gate skill entry points for discovery. The full frozen-contract
artifact shape stays in the planner; the driver requires that artifact rather
than maintaining another shape. Provider invocation, metering, credentials,
timeouts, model choices, target selectors, and provider limitations stay in the
respective gate skills.

A route says **when to read**, **which file or named section**, and **before
which action**. A bare link or "see elsewhere" does not satisfy C3. A nested
caller may reuse already-read same-revision material; loss of that material or
uncertain version requires rereading. This is an instruction to the agent, not
a mechanical assertion that its context contains the text.

### Canonical source migration

Paths below `references/` are relative to `skills/afk/`. Section titles can be
retained where useful; new linked anchors use simple, stable ASCII titles.

| Canonical destination | Existing source and retained responsibility |
| --- | --- |
| `AGENTS.md` | Golden rules, engineering rules, validation/release obligations, owner review, assurance levels and vocabulary; short repository purpose and conditional map. |
| `docs/maintaining-skills.md` | AGENTS layout, skill authoring and namespacing detail; contributor authoring links. No runtime policy copy. |
| `references/environment.md` | Common `.afk` main-worktree resolution, plugin-root fallback, absence/bootstrap obligation, safe blank config handling, and local-state secrecy. Specific bootstrap steps and notice operations remain in `afk-init/SKILL.md`. |
| `references/kickoff.md` | Driver kickoff sequence and config/source announcements; links to environment, continuity, external profile, review allowance and publication mode at their point of use. |
| `references/design-review.md` | Adversarial posture, bounded verification, design severity distinctions, clean debate exit, refuted-claim records, and the opt-in external design gate including its separate ledger record and skip behavior. Common admission/repair definitions are linked from convergence. |
| `references/review-convergence.md` | Issue-wide allowance; common P1 admission, findings/dispositions, fix reach and minimal batches; initial/re-review scope; ordered-role invalidation, progress, termination, checkpoint and oscillation rules. The design debate and self-review retain their distinct stage exit obligations. |
| `references/external-review.md` | Role profile grammar/lifetime, per-run qualifiers, availability/retry/fallback behavior, author set and helper implementer semantics, role stickiness, optional families and same-revision role obligations. Links to convergence own repair/closure semantics. |
| `references/review-evidence.md` | Supported context and canonical receipt usage. Keep the version 1 schemas in the existing issue-96/97 documents; do not duplicate them. Preserve native Codex context and observed-identity limitations. |
| `references/publication.md` | Final local suite, Draft/Ready order, remote-check classification and bounded window, local completion/off-mode authority, PR merge bar and endpoint report contents. Convergence links to this source for endpoint consequences. |
| `references/continuity.md` | Existing run-directory claim/collision/resume, ledger header, heartbeat, scheduling/self-pause and completed-run rules; existing restricted-executor handoff and environment-refusal classification. Links to environment for paths and convergence for progress/allowance. No new fields. |
| Existing satellite `SKILL.md` bodies | Planner requirement closure and plan output; implementation procedure and lenses; internal-review dimensions/output; bootstrap procedure; relay modes; provider-specific gate operations. Replace repeated common paragraphs with read/apply routes. |

Move existing instruction content before editing prose. Account for every
original driver section, including bold sub-sections currently hidden inside
"External gate". Do not drop a rule because its heading is absent from a table
of contents. Generalized admissions and repair details supersede duplicated
satellite blocks; provider-specific exceptions stay at the provider route.

### Explicit read routes

This table describes required reading at each condition, not automatic imports.
The implementation tests check these edges and the named canonical content.

| Entry or condition | Required route before action |
| --- | --- |
| Work on this repository | AGENTS; when changing skills, its maintainer-guide link; when changing AFK local-state behavior, environment/continuity links. |
| Driver kickoff or resume | Environment, kickoff, continuity; kickoff reads external profile, allowance section and CI-mode section before announcing the resolved policy. |
| Driver planning/debate | Planner for the frozen artifact; design-review plus convergence before the critic or any review-driven edit. |
| Driver implementation | Implementation skill; convergence for any repair; continuity's existing executor/environment section when handing work to a restricted executor. |
| Driver internal review | Internal-review skill and convergence; publication's check-reading section when checks apply. |
| Driver external PR role | Selected gate skill, external-review and convergence; review-evidence when context or receipts are supplied/reused. |
| Driver publication or local endpoint | Publication; continuity for run completion; final report uses the publication report section. |
| `afk-spec-planner` standalone | Environment for local config/output path resolution; retain the planner's plan-only endpoint and own contract/output shape. It does not load or schedule debate/external gates. |
| `afk-implementation-pilot` standalone | Environment and convergence before checks/self-review; continuity's existing executor/environment section when applicable; publication only for the current CI-watch/publication condition. Preserve current explicit publication boundary. |
| `afk-internal-review` standalone | Environment and convergence; publication check-reading section when enabled; continuity claim/report rules only when saving a report needs a run directory. Verdict-only authority remains local. |
| Each of the six standalone review skills | Environment, external-review and convergence before invocation/triage. Read the shared authorship rule before selecting `--implementer`. Read review-evidence before supplying context/receipts or reusing receipts; read design-review's external-design section before `--design`. No driver invocation is presumed. |
| `afk-init` standalone | Environment for shared path/root rules; perform its existing bootstrap steps. An init operation never recursively dispatches init through the absence route. |
| `afk-agent-relay` standalone, brief or scope | Environment for shared path rules; retain the relay's distinct mode, verification, output and security procedures. No independent PR gate or run allocation is added. |

Environment routes the absence case to init only for stages whose current
operation requires consuming configuration/bootstrap. Do not turn a read of
reference documentation into a new runtime action. A route's prerequisite is
read before the dependent action, not automatically before every unrelated
stage. Named sections avoid loading debate mechanics during a standalone design
review where a host supports bounded reads; later trials record actual bytes
read rather than assuming section-level behavior.

### Invocation inventory

The compatibility fixture preserves these frontmatter trigger sets exactly,
including capitalization and the existing ellipsis. Prefixes remain the skill
name followed by the existing pipeline identification. Detailed descriptions
may move model defaults, verdict syntax, ordering and setup into the body, but
not the triggers below.

| Skill | Existing explicit and natural-language triggers |
| --- | --- |
| `afk` | `/afk`; `AFK mode`; `go AFK on …` |
| `afk-init` | `/afk-init`; `set up afk`; `initialise afk` |
| `afk-spec-planner` | `/afk-spec-planner`; `plan issue N`; `spec this out` |
| `afk-implementation-pilot` | `/afk-implementation-pilot`; `implement the plan` |
| `afk-internal-review` | `/afk-internal-review`; `internal review PR N`; `review before merge` |
| `afk-agent-relay` | `/afk-agent-relay`; `compress context`; `relay brief`; `scope this` |
| `afk-codex-review` | `/afk-codex-review`; `run codex review`; `codex gate` |
| `afk-claude-review` | `/afk-claude-review`; `run claude review`; `claude gate` |
| `afk-kimi-review` | `/afk-kimi-review`; `run kimi review`; `kimi gate` |
| `afk-glm-review` | `/afk-glm-review`; `run glm review`; `glm gate`; `GLM external gate` |
| `afk-deepseek-review` | `/afk-deepseek-review`; `run deepseek review`; `DeepSeek external gate` |
| `afk-mimo-review` | `/afk-mimo-review`; `run mimo review`; `MiMo external gate` |

Preserve qualified `afk-skills:<name>` and flat-name usage documentation.
Manifest enumeration remains unchanged. These fixtures establish textual
compatibility; they do not establish that a host selected the intended skill.

## Consumer and test migration inventory

Do not concatenate all references into an artificial `afkSkill` string to keep
old tests passing: that can hide a missing standalone route. Assert each
invariant against its owning file/section, then test callers' explicit routes
separately. Assertions that depend on exact duplicated paragraphs become
single-source coverage plus route checks. Keep meaningful negative guards and
all existing helper behavior tests.

| Reader | Migration |
| --- | --- |
| `scripts/external-gate-profile.test.mjs` | AGENTS and CONTRIBUTING currently must repeat single Codex/default-double sentences. Replace those obligations with their direct canonical-profile routes; check profile semantics in external-review. Keep visible owner/release checks in AGENTS. Split kickoff, design and convergence assertions by owner. |
| `scripts/debate-rules.test.mjs` | Debate assertions read design-review; shared admission/progress assertions read convergence. Planner's no-debate-or-gate-orchestration guard remains scoped to its own content/routes. |
| `scripts/design-gate.test.mjs` | Read design-review for design mode and convergence/publication for cross-stage consequences. Replace identical implementer-block tests with one external-review definition and six direct gate routes; preserve selector and provider-read-only guards. |
| `scripts/gate-finding-rules.test.mjs` | Common admission, triage, batch, stable-ID and scope rules read convergence once. Replace six identical triage/batch paragraph checks and pilot/internal copies with explicit routes. Preserve internal structural-risk output fields. |
| `scripts/loop-rules.test.mjs` | Closure, allowance/progress and stop rules read convergence; debate exit reads design-review; ticks read continuity. Replace identical gate stop text with routes; preserve each gate's affirmative CLEAN/OUTSTANDING report. |
| `scripts/review-budget-rules.test.mjs` | Read convergence's one allowance/progress source; keep the config-template assertion. |
| `scripts/remote-checks-rules.test.mjs` | Read publication for CI semantics and endpoint report; driver waterfall and convergence references must route there. Replace heading/string slices with explicit bounded canonical sections. Preserve pilot/internal stage-specific behavior and negative overclaim guards. |
| `scripts/mixed-model-handoff.test.mjs` | Read existing handoff and environment-refusal definitions in continuity once; assert driver and pilot routes. Planner's execution-surface requirements remain in planner. |
| `scripts/failure-direction.test.mjs` | Only the driver prose test moves to external-review; executable failure classification tests remain unchanged. |
| `scripts/optional-http-gates.test.mjs` | Optional-family grammar reads external-review. Keep provider options, setup and unchanged-default checks at their existing sources. |
| `scripts/gate-profile-notice.test.mjs` | Kickoff reference names the shared CLI; init and hook retain their actual invocation checks. Assert driver → kickoff route. |
| `scripts/glm-gate.test.mjs` | Keep all six names discoverable in driver/router and manifests. Actual GLM helper tests are unchanged. |
| `scripts/closure-sweep-rules.test.mjs` | Planner retains its procedure and output shape; no source migration expected, run as a regression check. |
| `scripts/evaluate-agent-behavior.test.mjs` | Add runtime-reference visibility, exact-byte export and runtime-link closure coverage; keep exclusions and existing runner/scorer tests. |
| `scripts/lint-skills.test.mjs`, `scripts/audit-remainder.test.mjs`, `scripts/check-version-bump.test.mjs` | Fixture-based name/frontmatter/version tests remain unchanged unless new targeted routing coverage needs an additional case; do not weaken their invariants. |
| `lib/gate/gate.test.mjs`, `lib/gate/snapshot.test.mjs`, `lib/resume/detect.mjs` | Current AGENTS/SKILL mentions are comments, not runtime document readers. Preserve helper behavior; a stale locator may be updated only if needed. No runtime rewrite. |

Inventory was obtained through file searches and inspection of the actual
readers, including dynamic gate arrays. Repeat the search after relocation for
`AGENTS.md`, `SKILL.md`, old heading names and the copied implementer/triage/stop
sentences. Classify each remaining match as an active reader, compatibility
route, preserved provider detail, test fixture or historical rationale.

### Links, anchors and exports

- Update all six gate skills' receipt/context links and their textual design,
  allowance, fallback and stop pointers to direct canonical references.
- Update implementation/internal review's remote-check and allowance pointers;
  migrate their shared path/continuity pointers. Update CONTRIBUTING's authoring
  pointer and README's context/receipt links and repository layout.
- Preserve old driver anchors `supported-review-context` and
  `canonical-review-receipts` as short read-route headings, with no copied
  content, because they are existing documented links. Other retained driver
  headings may be routing stubs where existing references need them. Active
  callers still move directly to the canonical target.
- Runtime evidence links now need `../../../docs/designs/specs/` from a driver
  reference, not the old `../../docs/designs/specs/`. Resolve sibling skill
  links from their new directory. Helper fallback always starts from the
  owning skill directory/plugin root, never the reference's extra directory.
- Give new route targets simple explicit section anchors where Markdown slug
  ambiguity would otherwise matter. Test the two preserved legacy anchors and
  every active route fragment, including issue-97's `invocation-and-ownership`.
- `supportVisible` already admits new `skills/afk/references/**`. Retain the
  existing issue-96/97 schema exceptions. Verify every required runtime
  reference target is export-visible, and export a committed synthetic fixture
  to verify exact paths/bytes. Authoring-only AGENTS/docs and scorer/test files
  stay excluded. No broad `docs/**` allowlist and no new production export rule
  are planned.
- Future `scripts/check-direction-audit.mjs` is not currently export-visible;
  its export obligation belongs to #111/#112, not this issue. This preserves
  R5's valid observation without needless changes to covered prefixes.

## Files to change

| Path | Type | Reason |
| --- | --- | --- |
| `docs/designs/specs/issue-107-instruction-routing.md` | Add design | Freeze scope, migration and validation before implementation. |
| `AGENTS.md` | Edit | Small visible global contract and conditional routes; clarify prose rule. |
| `docs/maintaining-skills.md` | Add reference | Own conditional repository-authoring detail. |
| `skills/afk/SKILL.md` | Edit | Driver contract and stage router with compatible entry/anchor routes. |
| `skills/afk/references/{environment,kickoff,design-review,review-convergence,external-review,review-evidence,publication,continuity}.md` | Add references | Own the migrated stage/common definitions. Braces here describe the eight files, not a literal filename. |
| All 11 satellite `skills/*/SKILL.md` files | Edit | Preserve entry compatibility; replace duplicated common detail with explicit conditional routes. |
| `README.md`, `CONTRIBUTING.md` | Edit | Direct current links and source ownership; no duplicated authoring rules. |
| Affected test readers listed above | Edit | Preserve meaningful invariants at their canonical sources. |
| `scripts/instruction-routing.test.mjs` | Add tests | Route matrix, canonical rule ownership, fragment integrity and invocation compatibility. |
| `scripts/instruction-test-helpers.mjs` | Add test utility if shared | Bounded section/link extraction shared by migrated tests; no runtime loader or exported policy registry. |
| `.claude-plugin/marketplace.json` | Edit source | Increase authoritative plugin cache version. |
| `plugin.json`, `.codex-plugin/plugin.json`, `.github/plugin/marketplace.json`, `package.json` | Generated updates | Mirror version through sync. |

The sync command may also regenerate `.agents/plugins/marketplace.json` and
marketplace metadata if their content changes; no manual divergence is allowed.
`CLAUDE.md` and `GEMINI.md` already defer to AGENTS and need no change. No gate
helper, resume runtime, config parser/template, evaluation scorer, workflow or
provider transport change is planned.

## Execution surface

During this planning assignment, only this design document is writable.
Implementation writes are limited to the table above after design review. The
root driver owns run records, commits, publication and external review calls.
Reading or executing a dependency does not authorize modifying it.

| Output | Producer and exact command | Inputs/configuration | Side effects |
| --- | --- | --- | --- |
| Version mirrors | `node scripts/sync-marketplace.mjs` | Authoritative marketplace version; current `skills/*/SKILL.md` directory set; existing manifest metadata | Rewrites only managed manifests/metadata and package version. |
| Structural results | `node --test scripts/instruction-routing.test.mjs` and migrated tests | Repository Markdown, fixed expected routes/triggers, existing helpers | Test output; disposable fixture files only. No host agent or paid calls. |
| Support manifest/bytes | `node --test scripts/evaluate-agent-behavior.test.mjs` | Synthetic committed Git fixture and production `exportSupport`/`supportVisible` | Temporary export trees and manifests; no change to scorer/report or production export allowlist. |
| Later-trial revision record | Root runs `git rev-parse HEAD` after final content commit; uses `exportSupport({ repository, revision, directory })` at that full SHA | Final commit and a new ignored/disposable output directory | Exact support manifest/digest retained in the existing run record, plus final commit in PR handoff. No source file tries to embed its own commit hash. |

The export API exists and is inspected; no new CLI is needed. A report-only
commit does not silently move trial attribution. Later work must re-export and
bind the actual commit it evaluates. Do not run the evaluation runner's real
host trials under this issue's structural-test authorization.

## Key implementation notes

1. Before content movement, add failing route/compatibility/export tests and
   change phrase readers to the planned canonical targets. Test missing route,
   missing target and wrong fragment failures using temporary Markdown fixtures.
2. Copy each original section into its owner, fix relative paths, then replace
   the original with its read/apply route. Compare against the baseline to
   account for removals; remove duplicated satellite definitions in the same
   change. Do not weaken tests merely to accommodate accidental loss.
3. Use a test-only route inventory for expected entry edges, not a second
   writable policy specification. Test helpers extract/check text; they never
   infer or simulate host instruction loading. No whole-plugin concatenation.
4. Preserve local provider exceptions and standalone endpoints. Do not import
   the driver's complete waterfall through a shared reference into plan-only
   or relay requests. Loading convergence for a repair does not authorize a new
   independent role or reset an existing allowance.
5. Keep simple references readable without a loader. A missing required local
   file is a named unavailable prerequisite for the dependent action; do not
   continue as if the canonical rule had been read. Preserve independent work
   and existing authority rather than inventing a new global stop mechanism.
6. Bump the current authoritative version once for the issue, then sync. At the
   inspected baseline `1.0.2` is the next patch; reconcile with any intervening
   release before committing. Do not edit generated `plugin.json` as the input.

## Risk assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Standalone gate misses common constraints | Medium | Incorrect role or repair decision | Direct pre-action routes plus separate source/edge checks; behavior remains outstanding. |
| Phrase tests pass after losing routing | Medium | False structural confidence | Never concatenate references; test canonical rules and caller edges separately, with negative fixtures. |
| Relative helper/schema path shifts | Medium | Installed invocation fails | Resolve from owning skill/root; verify runtime export closure and fragments. |
| Planning loads unrelated review procedures | Medium | Premature stop or extra work | Planner's minimal route and no-orchestration guard; leave #108 semantics untouched. |
| Shortened descriptions alter selection | Unknown | Missed or wrong activation | Retain all synonyms and exclusions; run paired host evidence in #112/#113. |
| Repository-specific authority leaks to consumers | Low | Synthetic task scope changes | Exclude AGENTS/maintainer docs from runtime dependencies and exports. |
| Refactor changes accepted workflow wording | Medium | Lost CI or review protection | Per-section baseline accounting and migrated semantic-presence/negative guards. |

## Out of scope

No direction audit, intent baseline schema, attempt accounting, new handoff
record, direction configuration, transport qualification, provider/default
migration, paid behavior pilot, global memory/learning, host-specific compaction
command, automatic fan-out, automatic tracker selection, deployment or merge.
No cleanup of ignored historical run artifacts. No reduction of gate strength
or repair-budget reset. No claim to close earlier #98 behavior acceptance.

## Test plan

### Structural and regression checks

Run the new route tests first against temporary fixtures and the planned source
layout. They must distinguish missing edges, missing files and missing anchors,
reject absent canonical sections instead of matching empty slices, and check
that each existing public name/trigger survives in frontmatter. Keep explicit
entry/name tests separate from descriptive auto-selection coverage labels.

Read actual canonical content for rule tests. Assert one common implementer,
triage/batch and stop definition and the required six gate read routes, not
byte-identical rule copies. Check planner, implementation, internal review,
init and both relay modes at their stated conditions. Prove only textual
reachability; no test title or result may call this "instructions loaded".

Extend support tests with both a new runtime reference and the existing schema
link destinations. Check exact exported bytes, immutable revision attribution,
failed second export, and exclusions for tests/scorers, AGENTS, maintainer docs
and this design. No new evaluator scenario or production host adapter is needed.

Run targeted migrated readers, then the repository checks in the isolated
issue worktree:

```sh
node --test scripts/instruction-routing.test.mjs
node --test scripts/debate-rules.test.mjs scripts/design-gate.test.mjs scripts/gate-finding-rules.test.mjs scripts/loop-rules.test.mjs scripts/review-budget-rules.test.mjs scripts/external-gate-profile.test.mjs scripts/remote-checks-rules.test.mjs scripts/mixed-model-handoff.test.mjs scripts/failure-direction.test.mjs scripts/optional-http-gates.test.mjs scripts/gate-profile-notice.test.mjs scripts/closure-sweep-rules.test.mjs scripts/evaluate-agent-behavior.test.mjs
node scripts/sync-marketplace.mjs --check
node scripts/lint-skills.mjs
node scripts/check-links.mjs
node scripts/scan-provenance.mjs
node --test
node scripts/check-version-bump.mjs --base 6244d63a87826e2834652fc8a96df6647933dce2
npx --yes markdownlint-cli2@0.23.0
```

Also run `node --check` for each changed `.mjs`, and inspect the final diff for
source ownership and preserved provider exceptions. Use the existing CI syntax,
Markdown and secret checks before readiness; its Draft-stage behavior is
unchanged. If the branch base changes, use the actual reviewed base for the
version comparison. The root driver supplies the final-commit full-suite and
configured external-review evidence under the existing waterfall.

`scan-provenance.mjs` checks tracked/indexed files only. For the untracked design
and new references, inspect them directly before staging; after the authorized
staging operation run the scan again. `check-links.mjs` also traverses local
ignored Markdown outside `.git`/`node_modules`; use the isolated worktree and
report unrelated local-artifact failures rather than deleting history.

### Behavioral acceptance handoff

Manual inspection here checks only that the route wording is explicit and
matches the migration matrix. It does not qualify a host. #112 must add route
observations to the existing harness; #113 must execute the bounded paired
trials on qualified hosts. Supply baseline SHA, final implementation SHA,
export digest, route/trigger inventory and remaining coverage to those children.
Measure the full instruction set actually read, including references, rather
than entry-point line count. Keep explicit-invocation controls separate from
natural-language selection controls. Synonym relocation needs positive behavior
evidence and its own authorization/budget before a later change removes them.

Until then: structural delivery may pass; actual loading, auto-selection and
Epic AC1 behavior remain **OUTSTANDING**. Unavailable qualification is a named
limitation, not a passing result or justification to weaken confinement.

## Handoff notes

The initial plan consumes no repair cycle. An independent same-model adversarial
design review precedes implementation; its admitted content repairs share the
existing issue allowance. The root driver owns the selected external PR roles,
full-run continuation, publication and owner-review boundary.

For #108, `continuity.md` is only the relocated current doctrine. Its future
handoff view must remain a view of the existing ledger, not a new writable
accounting source; allowance/baseline fields are provisional until #109 chooses
its structured authority (R1). #107 neither claims mechanical accounting nor
preselects that schema. For #109, the shared allowance source and continuity
route are stable integration locations, not authorization to add direction
reservations now.

F3/F5/F6 are addressed by the structural/behavior split, dual AGENTS/SKILL test
migration, exported-reference checks and retained triggers. F1/F2/F4 and
R2–R4 remain with their assigned children. R5's already-covered reference
prefix is verified here; its future direction-script exception stays assigned
to later work. No child acceptance is silently closed by this plan.
