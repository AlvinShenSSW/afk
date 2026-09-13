# Issue 114: direction rollout decision and rollback guidance

The owner decision is PENDING. This design prepares reviewable documentation;
it selects no rollout option, changes no default and authorizes no model call.
Publication depends on the ordered reviews of the exact #113 report revision
recorded below.

## Spec review and dependency attribution

Issue #114 asks for an evidence-based owner decision and usable guidance for
modes, deliberate adoption, policy amendments and rollback. Its causal boundary
is two documentation files. Existing state, audit, evaluation and release owners
retain their contracts; the guide links them rather than defining another schema.

The [actual #113 report](../../evaluations/issue-113-pilot.md) establishes a
source-capability NO-GO: the current author-host observation source is unsupported.
It provides no eligible behavior samples. A qualified auditor transport does not
qualify that author-host surface or complete the missing behavior.

| Identity | Actual source |
| --- | --- |
| B, paired baseline | `6244d63a87826e2834652fc8a96df6647933dce2` |
| H, reviewed #112 implementation | `c4b554bf7edb5a9ed0097a7f8de3aef628757fa0` |
| C, #113 source investigation | `9fd041995828519200e033fb81cfa9b33563ae57` |
| R, current #113 report publication | `4e100c38d3c3f55d46429a814e7b65da373fde88` |
| #113 report SHA-256 | `223d3abd308bf3758ad94ddbb86ad2e7e9eb9f4360c61736437484801aee180b` |
| #111 qualified publication | `78ba796f307eb66b4431e448460c53dd57e95567` |
| Current qualified profile | `abb20b243641972c135eff402461ed8ff1a85ad332aa5597ba6ffe0e44239cb4` |
| Qualification record SHA-256 | `d502dbc47c9dbba54780b9d95044ea2df370a60e8eb8a09c621d535cd467cc37` |

H-to-C adds only the assessment design; C-to-R adds only the report. The report
owns the full 96-entry source comparison and investigation artifact inventory.
The [#111 report](../../evaluations/issue-111-direction-audits.md) owns actual
qualification and its limitations. Its report digest is
`3191ae7c50d892dc3998edc4c5c682566f5c788feff9bec960215547128165be`.
Keep these identities separate from #114's later documentation revision.

## Acceptance criteria

- **C1 — Honest evidence:** publish actual B/H/C/R attribution, NO-GO reason,
  0/72 main observations, 0/180 controls and four unattempted prerequisite slots.
  Preserve the distinct plans of 92 main author stages and 180 control stages.
  No samples means unavailable semantic rates, model identity, model-active time,
  token/cache use and billing, not measured zero cost. Preserve #98's separate
  unmet 0/14 and #111's separate qualification accounting.
- **C2 — Explicit decision:** present retain-off, a new bounded opt-in
  investigation and conditional promotion. Keep the choice, actual source/date,
  scope, limits and disposition of unachieved benefit PENDING until supplied.
  Record an actual owner decision before any new default. A reviewed proposed
  guide is not that decision; #114 and Epic completion cannot be inferred.
- **C3 — Promotion eligibility:** no promotion with unavailable critical behavior,
  unqualified required transport, or unexplained unsafe completion, scope mutation
  or budget reset. Current #111 qualification satisfies only its narrow protocol
  fixture; current #113 NO-GO leaves promotion ineligible. Retain-off guidance
  remains usable if a future qualification record is pending, invalid or stale.
- **C4 — Compatible operation:** explain off/shadow/required, active-only explicit
  initialization, source-backed successor amendments, expected-head reload and
  current endpoint evidence by linking the actual owners. Configuration changes
  do not overwrite an initialized policy; absent records are not migration.
- **C5 — Preserving rollback:** off or lower-limit amendments retain findings,
  historical baselines/policies, reservations, results and all consumption.
  Re-enable supplies no refund. Unknown accounting remains unknown; ordinary
  verified blockers, repository gates and owner merge authority still apply.
- **C6 — Reviewable delivery:** publish English, source-linked documentation with
  concrete owner options and targeted-improvement guidance. Use normal review and
  publication checks. No installed-skill modification, new schema, automatic
  rollout, default selection or version/cache change belongs to this docs-only PR.

## Contract, limits and source owners

The proposed guide must retain the following operational distinctions. These
are existing behavior to document, not new behavior to implement.

| Owner | Binding behavior to preserve |
| --- | --- |
| [Direction state](../../../skills/afk/references/direction-state.md) | One immutable run/issue sequence owns baseline, policy and direction accounting; narrative summaries derive from it. Explicit enablement requires an active recoverable run and conservative prior accounting. |
| [Schema](../../../lib/direction/schema.mjs), lines 52–88, 132–207 | Intent change requires operator source; clarification preserves semantic clauses/product decisions. Policy successors require prior digest, next revision and sourced amendment. No accounting reduction or double-counting of reserved calls. |
| [State helper](../../../lib/direction/state.mjs), lines 58–67, 123–149, 155–244 | Completed runs are read-only history; missing, incomplete and invalid state differ. Exact expected head, exclusive publication and replay semantics apply. Initial config resolution cannot amend an existing policy. |
| [Direction audits](../../../skills/afk/references/direction-audit.md) | Off adds no direction condition; shadow retains evidence/independence/call bounds without a direction-only hold; required needs initial audit and actual current phase-endpoint COMPLETE. |
| [Audit helper](../../../lib/direction/audit.mjs), lines 301–323, 533–565 | Eligibility reads actual qualification metadata plus profile/current target and terminal bindings. Unknown accounting after a completed call preserves its evidence and separate allowance judgment. |
| [Environment](../../../skills/afk/references/environment.md) and [continuity](../../../skills/afk/references/continuity.md) | Resolve plugin root and the supplied shared run; reload retained authority. Do not create a run to read a mode or reset capacity. |
| [Review convergence](../../../skills/afk/references/review-convergence.md) and [publication](../../../skills/afk/references/publication.md) | Content-repair accounting, findings, owner authority and repository gates retain their separate owners. |

The template remains off/four. Four direction slots cover initial, endpoint and
two repaired endpoints without retry headroom. Preparation costs no direction
slot; reservation charges before availability/dispatch and survives invalid,
unavailable or interrupted results. A previously charged last slot may complete
under its valid reservation; no remaining slot permits a fresh call. A completed
result is not erased by later unknown accounting. No limit increase invents
known history. Source hashes preserve inspectable claims, not authenticated intent.

Required completion cannot use initial/signal COMPLETE, ON-TRACK, stale or
missing evidence in place of its endpoint. Disabling direction removes only
that added condition. Restoring missing exact evidence or retaining OUTSTANDING
work is preferable to truncation, reconstructing zeros or discarding a retained
required policy. Standalone audit-check absence may report unavailable/missing
files instead of literal off; state semantics and checker availability differ.

Rollback uses an authorized successor setting off, followed by reread and
verification. Re-enable requires another successor and new current eligibility;
old policy-bound results do not become current again. A genuinely new scope may
select an earlier release, but retained evidence keeps its original protocol,
profile and release. No downgrade/migration command or history rewrite is added.

## Evidence and acceptance limits

The current report's zero launches are supported by its actual planned handoff,
empty launch records and retained driver history. They are not host-wide
attestation. Candidate labels are not observed model identities. The report
records #112's 1,280-test native result: 1,273 passed, seven skipped, zero failed,
and its separately attributed 96/96 affected integration result. These remain
structural checks, not behavior samples or usage measurements. Their provider
activity keeps its original owner; unknown usage remains unknown.

Issue #111 retains four qualification attempts, three HTTP requests and 7,463 charged
ms, including the earlier invalid response. Its report retains known-call cost
estimates and the absence of a provider bill; do not fold these into #113's empty
behavior aggregate or refresh either allowance. Qualification establishes its
bounded source-delivery fixture, not semantic reliability, host confinement,
provider-weight attestation or cache erasure.

Carry the #113 limitations by reference with a concise operational summary:
unsupported full tool/instruction inventory and native catalog; D9 history may
exceed 16 KiB and refuse before charge; late reservation can consume capacity
before dispatch refusal; some read ordering is unobserved; cleanup summaries
and conflicting model labels have retained interpretation limits. These deferred
items are not repaired here. A measurement-fixture COMPLETE does not prove the
original author's target freshness or author response to feedback. A future
handoff must resolve its relevant eligibility constraints explicitly.

Epic AC1, AC2, AC4 and AC6 behavior remains OUTSTANDING. AC3/AC5 retain prior
structural evidence without new behavioral credit. AC7 receives the honest report;
this design does not declare final Epic acceptance. AC8's explicit compatible
owner decision is PENDING. Retain-off preserves unachieved benefit; cancellation
or rescoping, if chosen, is separate from successful delivery.

## Assumptions and unresolved input

Current dependency claims are attributed to the committed reports and inspected
source, not rerun behavior. Root owns the reported #111/#112 publication checks;
the #113 publication review evidence is a dependency of this delivery. No future host capability, model
behavior or successful campaign is assumed. Source fields and reviewer records
remain driver claims rather than authenticated execution. The only unsupplied
owner decision is its rollout/residual disposition; it must not be inferred to
complete C2 or AC8. These limits do not prevent reviewing concrete proposed docs.

## Owner-facing record

The guide will present these options without preselecting one:

1. Retain off: record applicable scope/releases, preserve current initialized
   policies unless separately amended, and state continued work, explicit
   deferral or explicit rescoping of the unachieved outcomes.
2. Continue a bounded opt-in investigation: require a supported observation
   source, independently qualified whole tool/instruction surface and required
   catalog, selected cells, source authority, time/call/spend limits and evidence
   owner. The current adapter and unadopted old proposal grant no new call.
3. Promote an evaluated default: explain the eligibility bar and mark this option
   currently ineligible. Any later eligible selection needs its own authorized,
   reviewed release change; #114 does not implement it.

The decision record contains option, owner source/date, scope/releases/runs,
B/H/C/R and report/profile references, applicable limits, unresolved acceptance
and explicit continuation/deferral/cancellation distinction. It is ordinary
reviewable prose, not a new writable authority schema. Unprovided values remain
PENDING. Prepare this concrete artifact before requesting the final owner choice;
neither silence nor publishing the options supplies that choice.

## Files and execution surface

| Path | Write scope | Purpose |
| --- | --- | --- |
| `docs/designs/specs/issue-114-direction-rollout.md` | Reviewed design contract | Freeze this bounded contract and evidence identities. |
| `docs/direction-rollout.md` | Only after design freeze and implementation handoff | Publish the reviewed guidance, evidence summary and explicitly pending or actually sourced decision. |

During planning, only the design is written and the companion guide remains
private for review. Do not edit README, skill routes, templates, schemas, code,
qualification records, generated manifests or the #113 report. No cache bump:
only documentation changes. A later shipped behavior/default change must use
its own authorized scope and normal version-source/sync rules.

The guide's command templates use the resolved plugin root. Source-verified
read forms are `direction-state.mjs check --run-id <run-id> --issue <issue-id>`
with optional `--expected <expected.json>`, and `check-direction-audit.mjs check`
with run/issue/audit identity plus `--stage result` or `--stage endpoint` and the
required `--endpoint <endpoint-id>`. Canonical expected input belongs inside the
run and is the schema's expected binding, not an entire prior CLI response.

The only documented mutation is the existing state helper
`apply --request <request.json>` after explicit concrete authority. It publishes a
sequence record, does not dispatch a model, and needs result verification and
reread. Templates are not executed for documentation verification. No generator,
provider operation, credential input or data migration is introduced.

## Verification plan and risks

Before implementation, the independent critic reads this design and the private
companion. After freeze, materialize the companion at the single proposed guide
path, preserving source-owned semantics. Verify the actual owner statement only
if supplied; otherwise keep it explicitly pending and report the unfulfilled
criterion. Recheck dependency identity after #113 publication reviews complete;
changes affecting the evidence require an updated attribution, not a stale stamp.

For the later docs implementation, run `node scripts/check-links.mjs`,
`node scripts/scan-provenance.mjs`, `node scripts/sync-marketplace.mjs --check`,
`node scripts/lint-skills.mjs`, `npx --offline --yes markdownlint-cli2@0.23.0` and
`git diff --check`. The expected outputs are diagnostics only; these check
commands do not generate shipped files. Retain complete logs privately. Verify
report/record hashes and the two-path diff; inspect all command templates
against the existing CLI source. No new phrase-matching tests are needed for
this prose-only change. Root owns any required final native suite, current
ordered reviews, revision-specific CI and publication; no tests or calls are
executed during this initial design stage.

The main risks are promoting from structural evidence, treating unknown as zero,
config-only rollback, resetting a continuation and stale qualification. The
source-owned rules and explicit evidence/decision fields address these risks
without a new helper or framework. Level 1 remains semantic judgment, level 2
artifact checks within invoked helpers, and level 3 truthful driver/owner
workflow. None is a guarantee of task alignment.

## Handoff

Return the exact design/private-guide digests and source attribution for root
and independent critique. Initial construction is not a repair cycle. Root owns
findings, admissions and reservations. No guide publication or implementation
before the design gate; no #114 paid reviews before actual final #113 reviews.
Owner choice remains the final unsupplied decision, not an assumed permission or
an excuse to claim #114/Epic completion.
