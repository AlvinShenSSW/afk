# Issue 108: Stage authority and evidence handoffs

## Spec review

Issue #108 makes stage completion and session continuity explicit without
changing the authorized task. A standalone plan request ends with its plan;
a planner inside an authorized full run returns that plan to the driver, which
continues the existing waterfall. Every transition carries enough source
evidence to resume the same work without granting authority or restoring spent
allowances.

The approved issue #108 and parent Epic #106 are the scope sources. This plan
uses dependency revision `e17278ac6e90d565884aa16c7ec19cdb7af0e543` from #107
(plugin `1.0.2`). The dependency PR remains subject to owner review; this plan
does not authorize merging it. Repository evidence corrects the Epic's release
shorthand: the version input is `.claude-plugin/marketplace.json`, not generated
`plugin.json`.

This is an instructions-only delivery with structural contract tests. Epic
**AC2 and AC6 remain OUTSTANDING** until real standalone/nested and resume trials
under #112/#113 execute. Passing text checks cannot close them.

## Frozen issue contract

### Acceptance criteria

- **C1 — Stage endpoints:** explicit plan-only ends at the plan. Nested planning,
  implementation, internal review and relay work return their bounded result,
  evidence and a concrete next action to the invoking driver. Child completion
  does not complete the authorized queue. Standalone stages do only their
  requested work; invoking a satellite does not start the full waterfall.
- **C2 — Retained authority:** retain the already granted scope and publication
  limits with their sources. Resolve existing authorization rather than asking
  again at each stage. A child, a brief, a review verdict or a resumed session
  cannot expand it. The existing `remote-ci: off` local endpoint remains valid.
- **C3 — One source of run state:** use the supplied run identity and main-tree
  run directory across linked worktrees. Derive the handoff from the existing
  ledger and evidence. Preserve consumed and reserved allowances; missing
  accounting is unknown, not zero. Do not create a second writable ledger or
  allocate a run merely to read configuration or return a standalone brief.
- **C4 — Faithful evidence:** preserve command, execution context, target,
  exit/terminal status, failure details and complete log locators. Identify
  timeouts, failed/skipped checks, stale reviews and unavailable evidence.
  Summaries and relay tails never replace required packets, receipts or logs.
- **C5 — Resume:** before dependent work, reread source authority and the frozen
  issue contract, inspect the actual target, reload findings and allowance
  records, and reconcile evidence applicability. Do not continue from a stale
  handoff as if it were current. Apply this at session resume and host-supported
  compaction without assuming a portable reset, cache or compaction command.
- **C6 — Bounded delivery:** preserve #107 routes and their read conditions,
  all public names/triggers, model and gate defaults, independence, publication
  rules and the shared repair allowance. Record the final implementation
  revision for #112/#113; distinguish structural delivery from OUTSTANDING
  behavioral acceptance.

### Invariants, allowed behavior changes and causal boundary

The existing ledger remains the lifecycle, finding and allowance authority;
source operator instructions and consuming-repository rules determine actual
authorization. A recorded claim is not proof of authorization. Existing review
context/receipt schemas and their target/profile validation remain unchanged.
Retain the current allowance reservation and reconstruction rules, completed-run
immutability, collision checks, readiness conditions and owner merge boundary.

Allowed visible changes are clearer endpoint wording, conditional continuity
and output reads, source-linked concise handoffs, and explicit missing evidence.
The smallest causal boundary is the driver and four stage instructions, shared
continuity/output guidance, focused structural tests and required packaging.
No bundled helper behavior needs to change.

Level 1 covers judgments about evidence and scope. Level 2 covers structural
tests and existing invoked artifact validators within their actual boundaries.
Level 3 covers obeying read routes, retaining authority, checkpointing and
continuing or stopping correctly. This design adds workflow doctrine, not an
orchestration runtime or mechanically reliable narrative accounting.

## Assumptions and resolved gaps

| Question | Repository-backed decision | Remaining uncertainty |
| --- | --- | --- |
| Where is the current output contract? | Stage outputs live in the four entry points; continuity owns run state, publication owns the final report, and review-evidence owns packets/receipts. Add one short shared output reference rather than copy evidence rules. | Real agents may still skip a routed read; #112/#113 must observe behavior. |
| What does baseline mean here? | The approved source request, frozen issue contract and their existing locators/revisions, plus the artifact's Git base where relevant. | #109 owns versioned machine-readable direction baselines, digests, migration and attempt accounting. Those fields are not prerequisites for #108 or legacy runs. |
| Who updates an existing run? | The driver checkpoints its existing ledger. A bounded child reports evidence to that driver and does not claim another run or independently maintain state. | This is driver doctrine, not a writer-lock mechanism. |
| Does relay retain complete execution evidence? | `lib/gather.mjs` tails `--logs`; the skill treats a brief as a hypothesis. The caller must retain and inspect source evidence. | A host may not expose complete logs or terminal status; report unavailable rather than reconstructing facts from a brief. |
| Does an output reference need a new export rule? | The existing `supportVisible` policy includes `skills/**` outside excluded test/evaluation paths. Extend coverage inventory only. | Export presence does not prove host access or loading. |
| Are host reset and provider semantics known? | No new CLI or host capability is relied upon; safe continuation uses ordinary available reads and evidence pointers. | Host-specific compaction and real behavior remain unverified. |

The root driver owns live branch/PR overlap checks before implementation. This
planning pass reads the approved issue snapshots and dependency checkout; it
does not independently verify remote PR state or run providers.

## Approach

### Stage completion and authority

Keep stage outputs local to each entry point. Add a brief distinction between
standalone completion and return to the invoking driver. Preserve the planner's
no-code/no-publication rule in both modes. For a nested planner, the next step
is the driver's required design debate, not immediate implementation. The
implementation stage returns checks and self-review evidence for internal
review; internal review returns its verdict for finding triage and the ordered
external roles. Relay returns its brief or scope draft for source verification
and the next authorized task; a scope draft is not implementation approval.

The driver owns subsequent commit, publication, review and queue completion
under the effective policy. Existing delegated commit authority may be used
only when explicitly supplied; the restricted-executor handoff remains intact.
Standalone internal review ends at its verdict and does not claim configured
external roles have run. Its existing final-report prerequisites remain intact.
An outstanding child result names the unavailable prerequisite or unresolved
finding and next action; the driver retains independent authorized work.

At kickoff, record scope and source, publication instructions and source, merge
policy, CI mode and role profile in the existing ledger. Carry the effective
decision forward; configuration or a summary cannot silently replace a retained
operator constraint. Before an outward action, apply the existing publication
rules and source authorization. Missing or conflicting authority calls for a
concrete decision only for the dependent action; it does not justify asking
again for a grant whose source is already available.

### Derived handoff view

Keep run ownership and resume mechanics in `continuity.md`. Add a short
`output.md` reference for the common evidence-complete handoff. Its contents are
a view of existing sources, not a prescribed serialization or separately edited
state file. The driver updates its source records before a handoff or yield;
the receiver reloads them. A saved summary is disposable navigation material.

| View item | Read from and retain |
| --- | --- |
| Identity | Explicit run/issue and shared run path supplied by the driver; standalone work without a run says so instead of guessing by recency. |
| Baseline | Approved request and frozen issue contract locators, known revisions and open assumptions; distinguish requirement source from Git base. |
| Target | Actual worktree/branch, HEAD/base where applicable, and current design, diff or artifact identity, including dirty-tree status. |
| Stage and coverage | Completed and pending criteria with proof references, current stage outcome and limitations. |
| Findings | Stable IDs, current dispositions and retained verification/history from the existing issue record. |
| Allowance | Effective limit/source, consumed and reserved repair cycles and already recorded attempts; preserve unknown state and existing restrictions on further repairs. |
| Authority | Effective scope/publication/merge limits and their source instructions, CI mode and selected role profile. |
| Evidence and next action | Full log/packet/receipt locators, failure or missing evidence, stale applicability and the concrete next authorized step or unavailable prerequisite. |

Do not invent a baseline digest, audit reservation, new policy field or migration
for old runs. When #109 supplies structured authoritative fields, this same
logical view will read those fields and their source links; #109 owns any
migration and consistency checks. It must not leave an independently writable
copy of authority or consumption in handoff prose. This addresses the transition
boundary raised by Epic R1 without implementing R1's later schema work.

### Evidence retention and resume

The shared output rule requires the caller to retain full available command and
review output, including stderr, under the run's ignored directory before
summarizing it. Associate each result with the exact command, working directory,
target identity, relevant non-secret execution restrictions, exit status,
terminal condition and failure details. Distinguish an unfinished call, timeout,
error, skip and a completed result; unknown exit/terminal values remain unknown.
Do not disclose environment secrets while recording execution context. Preserve
source evidence before replacing a summary; inaccessible or truncated evidence
remains explicitly incomplete rather than acquiring a successful status.

For a standalone stage with no run, retain available evidence in an authorized
local location and return its locator; do not allocate a run solely for a
handoff. Existing rules for claiming a run when actually saving a run-owned
review report still apply. A nested child reports its output locations to the
driver, which owns the shared ledger update.

The relay's six-section marker format, defaults, skips and provider behavior
remain unchanged. Capture its available stdout, stderr and exit/terminal status;
retain the original supplied files/logs separately. A tailed `--logs` input or
compressed output cannot establish complete failure evidence. Required review
packets remain full and follow `review-evidence.md`; a brief cannot substitute
for them. Missing logs do not authorize a paid replacement review or a fabricated
receipt.

Before a session transition, checkpoint the existing records when possible.
After resume or supported compaction, load the same run's source authority and
contract, inspect actual branch/status/target, and reread findings, consumed and
reserved allowances and outstanding evidence. Compare the proposed next step
with those sources. Existing review-convergence and receipt rules determine
staleness and reuse; an old approval does not become current through summary.
Complete a reserved cycle's validation under its existing allowance; never
reset consumption because the stage, provider, session or worktree changed.
If a required source is absent, name it and hold only dependent work while
reconstructing from retained evidence under existing rules. Do not reopen a
completed run. Do not require `/clear`, `/compact` or a new session; when no
supported transition exists, continue in-session with bounded reads.

## Files to change

| Path | Change type | Reason |
| --- | --- | --- |
| `docs/designs/specs/issue-108-stage-handoffs.md` | Add | Freeze this scoped contract and verification boundary. |
| `skills/afk/SKILL.md` | Edit | Route handoffs/output and make driver-owned continuation explicit. |
| `skills/afk-spec-planner/SKILL.md` | Edit | Preserve plan-only endpoint; return a nested plan with the next design step. |
| `skills/afk-implementation-pilot/SKILL.md` | Edit | Return evidence to the driver under retained authority; retain standalone limits. |
| `skills/afk-internal-review/SKILL.md` | Edit | Distinguish bounded verdict from run completion and retain evidence. |
| `skills/afk-agent-relay/SKILL.md` | Edit | Route evidence retention, qualify tails/briefs and return within source authority. |
| `skills/afk/references/continuity.md` | Edit | Own checkpoint/reload and source-of-state rules. |
| `skills/afk/references/output.md` | Add | Own concise handoff content and complete source-evidence requirements. |
| `skills/afk/references/kickoff.md` | Edit | Explicitly retain source scope/publication authority in existing records. |
| `scripts/stage-handoff-rules.test.mjs` | Add | Test the new instruction contract with scoped structural assertions. |
| `scripts/instruction-routing.test.mjs` | Edit | Cover the new reference and affected explicit routes/export visibility. |
| `.claude-plugin/marketplace.json` | Edit source, then generate | Bump `afk-skills.version` from `1.0.2` to `1.0.3`; mirror metadata through the generator. |
| `plugin.json`, `.codex-plugin/plugin.json`, `.github/plugin/marketplace.json`, `package.json` | Generate | Keep release metadata synchronized. |

## Execution surface

Only the design is writable during this planning stage. Implementation writes
are limited to the table after a clean mandatory design debate and driver
authorization. Read `AGENTS.md`, `docs/maintaining-skills.md`, applicable routed
references, existing structural tests and `scripts/instruction-test-helpers.mjs`.
Read existing relay gather/entry code and review-context/receipt contracts to
preserve their boundaries; do not modify them.

For packaging, execute `node scripts/sync-marketplace.mjs` from the checkout
after changing the authoritative marketplace version. Inputs are that manifest,
the discovered `skills/*/SKILL.md` inventory and existing host metadata. It writes
the marketplace metadata, listed mirrors and, only if drifted, the existing
`.agents/plugins/marketplace.json`. No new skill is added; the latter is expected
unchanged. The generator has no provider, network or publication side effects.
Its `--check` form reports drift without writing.

Run structural checks and focused tests locally. Test fixtures may write
disposable temporary directories according to existing tests. No provider call,
secret read, shared run-ledger write, commit, push or PR is authorized by this
plan. The root driver owns eventual reviews, full-suite execution and publication
under its separate task authorization.

## Risk assessment

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| A link exists but an agent never reads or follows it | Plausible / premature completion or lost state | Preserve #107 conditional read language; retain AC2/AC6 OUTSTANDING for actual trials. |
| Handoff prose becomes competing state | Plausible / stale authority or reset consumption | Name source ownership and reload; prohibit independent handoff accounting or premature #109 fields. |
| Concise output hides failure or stale approval | Plausible / unsupported readiness | Require terminal/context/log locators and missing evidence; keep existing packet and reuse rules. |
| Stage wording broadens standalone work | Plausible / unauthorized continuation | Test plan-only and each bounded endpoint separately from nested returns. |
| Rules expand into a new framework | Low / maintenance and scope growth | Use one brief output reference and existing records; change no helper, protocol or default. |

## Out of scope

No scheduler, default delegation hierarchy, forced session reset, new
commit/push/merge authority, provider migration, extra paid review, audit mode,
direction helper, structured baseline/accounting schema, generic state renderer,
host adapter or behavioral harness extension. #109 owns structured records;
Issues #112/#113 own real trials. Do not fix deferred parent P2/minor observations merely
because files overlap. In particular, #107 F107-4's route-test semantic limitation
and F107-5's faithfully duplicated GLM environment guidance remain deferred.

## Test plan

1. Before shipped prose edits, add focused tests using the existing instruction
   helpers. Check each affected stage's explicit continuity/output read route
   and its local standalone/nested endpoint. Assert the new reference exports
   and its links/fragments resolve. Keep names, triggers and #107 read conditions.
2. Test the canonical sections for source-owned identity/authority, baseline and
   actual target, coverage/findings/allowance, concrete next action, full stderr
   and logs, exit/terminal status, explicit unavailable/stale evidence and resume
   reload. Verify relay guidance retains original evidence beyond log tails.
   Scope assertions to the relevant section and use negative fixtures for a
   missing new route/section. These establish written contracts, not behavior.
3. Record an expected RED for new absent obligations, then make the smallest
   prose edits and rerun `node --test scripts/stage-handoff-rules.test.mjs
   scripts/instruction-routing.test.mjs scripts/mixed-model-handoff.test.mjs
   scripts/review-budget-rules.test.mjs scripts/loop-rules.test.mjs
   scripts/remote-checks-rules.test.mjs`. This focused suite is partial.
4. Run `node scripts/sync-marketplace.mjs --check`,
   `node scripts/lint-skills.mjs`, `node scripts/check-links.mjs` and
   `node scripts/scan-provenance.mjs`. The provenance CLI scans tracked content;
   review newly added files too before staging and repeat the scan when tracked.
5. The root driver runs the required unfiltered `node --test` on the final
   implementation revision under its own authorization. It includes two live
   Claude probe tests; this planning/implementation subtask must not invoke
   those under its no-provider boundary. Do not label a filtered suite full.
6. Manually review the endpoint matrix against C1–C6: standalone plan-only,
   nested planner/implementer/reviewer/relay, dirty restricted executor, local
   completion with CI off, resume with stale target or missing logs, and an
   exhausted/reserved allowance. This is a document walkthrough, not an executed
   host trial. Record final implementation SHA and AC2/AC6 OUTSTANDING in the
   implementation report for later qualified #112/#113 trials.

## Handoff notes

Do not implement until the root driver's mandatory independent design critic
has produced a clean round on this draft. Apply admitted design repairs only
within the existing issue allowance; this document grants no new cycles.
Retain the dependency baseline and topic boundary, and recheck version drift
before release generation. A structurally complete #108 can proceed to its
normal reviews while behavioral acceptance stays explicitly OUTSTANDING.
