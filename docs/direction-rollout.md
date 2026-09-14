# Direction rollout, owner decision and rollback

The owner selected **retain off for release 1.2.0** on 2026-09-14 in the active execution handoff, adopting the [bounded release scope](designs/specs/release-1.2.0-scope.md). The release contains the merged #107–#112 improvements and this documentation. It excludes PR #123's native observation implementation. #113 and Epic #106 remain open for missing behavioral acceptance; #114 delivers the retain-off decision and rollback guidance.

Direction remains an experimental opt-in addition. The current template defaults to `off` without a direction-attempt cap. Explicit finite policies, including historical built-in-four policies, retain their recorded limits until an authorized amendment. Shadow and required modes are not promoted to production defaults. Retaining off does not require a positive behavior pilot or a newly qualified transport. It also does not change an existing initialized run's policy, authorize another model experiment or reset any allowance.

The canonical operational contracts are [direction state](../skills/afk/references/direction-state.md), [direction audits](../skills/afk/references/direction-audit.md), [environment and shared-run location](../skills/afk/references/environment.md), and [review convergence](../skills/afk/references/review-convergence.md). This guide defines no additional state schema or allowance.

## Historical evidence for the 1.2.0 decision

The historical [#113 report](evaluations/issue-113-pilot.md) records source-capability **NO-GO** with **0/72 main observations, 0/180 controls and four unattempted prerequisites**. Its frozen source assessment and original publication reviews remain attributed to their own revisions. These are unavailable samples, not measured zero-cost behavior or failed author invocations. The planned 92 main author stages and 180 control stages are not observed execution.

| Evidence | Attribution | Limit |
| --- | --- | --- |
| Paired baseline B | `6244d63a87826e2834652fc8a96df6647933dce2` | Comparison input, not behavior evidence |
| Reviewed #112 implementation H | `c4b554bf7edb5a9ed0097a7f8de3aef628757fa0` | Historical suite: 1,280 tests, 1,273 passed, seven skipped; structural coverage only |
| Release implementation base | `d5ca8ddbd37193778b37b1724778294835440be3` | Merged #107–#112; tree equals H |
| Historical #113 investigation C | `9fd041995828519200e033fb81cfa9b33563ae57` | H-to-C adds only its frozen design |
| Historical #113 report R | `4e100c38d3c3f55d46429a814e7b65da373fde88` | C-to-R adds only the report; Kimi then Flash publication reviews belong to R |
| Historical report SHA-256 | `223d3abd308bf3758ad94ddbb86ad2e7e9eb9f4360c61736437484801aee180b` | The report is preserved verbatim |
| Released transport profile | `abb20b243641972c135eff402461ed8ff1a85ad332aa5597ba6ffe0e44239cb4` | Narrow actual transport/protocol qualification, not qualified author behavior |
| Released qualification-record SHA-256 | `d502dbc47c9dbba54780b9d95044ea2df370a60e8eb8a09c621d535cd467cc37` | Revalidate the actual profile and record before adoption |

The [#111 qualification report](evaluations/issue-111-direction-audits.md) retains four driver attempts, three HTTP requests and 7,463 charged ms, including an invalid response. Its retained-rate estimate of USD 0.0027609 is not a provider bill. #98's separate unmet `0/14` remains owned by its [original report](evaluations/issue-98-pilot.md). Structural reviews and native test-suite activity are separate from behavioral samples; unknown usage is not zero.

At the 1.2.0 release checkpoint, subsequent investigation on **unreleased PR #123** had used a different profile. Its small real qualifier passed; a separate 35,173-byte request retaining two controlled history audits returned HTTP 200 but failed `coverage_artifact`, because an artifact list cited source-kind evidence. Those two requests bring the retained qualification/capacity history to six attempts, five HTTP requests and 25,551 charged ms. They are not author trials. That historical profile was pending and excluded from 1.2.0; its result neither replaced nor broadened that release profile's qualification. The [current full-history qualification](evaluations/issue-113-history-qualification.md) records the later corrected profile and its bounded evidence; it does not rewrite these observations or establish all author behavior.

At that checkpoint, critical Epic behavior remained OUTSTANDING: AC1 instruction loading/selection, AC2 authorized completion, AC4 direction detection/justified changes and AC6 faithful continuity. AC3/AC5 structural intent/accounting evidence grants no behavioral credit. AC7 requires honest attribution. This retain-off decision addresses AC8's owner-decision component without asserting full Epic acceptance.

## Historical release decision and limits

The owner adopted the following scope: publish 1.2.0 after current independent reviews, repository checks and the normal merge process; retain off; continue #113 afterward; keep #113 and Epic #106 open. This explicitly replaces the earlier condition that publication await successful completion of the entire Epic. It is a release-scope decision, not cancellation of the missing outcomes or default promotion.

The released evaluator has no qualified author-host surface for this paired campaign. The released transport also retains its 16 KiB request bound: complete D9 history can exceed it and be refused. The narrow qualification therefore cannot establish support for all critical scenarios. Other historical limits in the #113 report remain attributable to that version. PR #123's separate work does not silently repair the released evaluator.

Promotion remains ineligible while critical behavior is unavailable. Later experiments need their own supported observation source and bounded execution handoff; this release authorizes no replacement qualification request, model migration or extra repair cycle. Every consumed/reserved attempt remains with its original accounting owner. A smaller smoke test can supply limited evidence, but cannot complete the missing full scenario coverage.

## Mode semantics

- `off`: adds no direction audit call or direction-specific completion condition. Ordinary findings, tests, reviews, CI, publication limits and owner merge authority still apply.
- `shadow`: uses the same source, independence and call bounds while adding no direction-only hold or readiness condition. It does not bypass dispatch qualification or authorize extra calls.
- `required`: calls for an independent initial audit before implementation and a valid, current phase-`endpoint` `COMPLETE` for the selected endpoint and actual target before dependent completion. Initial/signal `COMPLETE`, `ON-TRACK`, stale or missing evidence cannot substitute. A previously charged last slot can still produce its valid result; exhaustion grants no next attempt.

A measurement-fixture `COMPLETE` is not approval of the original author's target or proof of semantic compliance. Source/hash checks constrain artifacts only when invoked; semantic judgment is level 1, helper-local artifact checks level 2, and truthful driver/owner execution level 3. AFK supplies no external reference monitor or guarantee of task alignment.

## Inspect before enabling or amending

Work from the consuming repository, resolve the installed plugin root through the canonical environment rules, and use the supplied run identity in the main working tree's ignored `.afk/runs/`. Do not allocate a new run merely to read a mode or avoid an exhausted allowance.

The following are command templates, not executed evidence. Replace each placeholder with an actual retained identity/path. Reads do not dispatch models:

```text
node "<plugin-root>/scripts/direction-state.mjs" check --run-id <run-id> --issue <issue-id>
node "<plugin-root>/scripts/direction-state.mjs" check --run-id <run-id> --issue <issue-id> --expected <expected.json>
node "<plugin-root>/scripts/check-direction-audit.mjs" check --run-id <run-id> --issue <issue-id> --audit <audit-id> --stage result
node "<plugin-root>/scripts/check-direction-audit.mjs" check --run-id <run-id> --issue <issue-id> --audit <audit-id> --stage endpoint --endpoint <endpoint-id>
```

`--expected` is optional and uses the schema's retained head/baseline/policy binding for an initialized state, not an unmodified whole CLI response. Its canonical JSON file must be inside the named run. Read status, reasons, mode, active digests, accounting and `canReserve`; exit zero alone is not permission to launch or complete work. An unavailable standalone audit check may report missing files/directories instead of literal `off`. Missing or corrupt state cannot discard a retained required policy.

Absent direction records remain off even when config changes. Explicit initialization is limited to an active run with source authorization, recoverable baseline and conservative prior direction accounting. Completed runs are history and are not reopened or migrated. An unknown prior consumption value cannot be replaced by zero or made known by raising a limit.

For an initialized policy, editing `.afk/config.md` does not amend it. Retain the operator's actual amendment source in the run, inspect the current head and construct the schema's canonical policy-successor request. The successor retains the previous digest, increments the revision and supplies explicit sourced operator authorization for the amendment. Preserve accurate sources for the resulting mode and limit. Request/source references are inspectable claims, not proof of the owner's identity or intent.

Only when that concrete amendment is authorized, apply its retained request:

```text
node "<plugin-root>/scripts/direction-state.mjs" apply --request <request.json>
```

The request must be canonical JSON inside its named run and use the exact expected head. `apply` publishes one exclusive sequence record and does not call a model. Verify the returned record and reread state. A stale head requires a deliberate reload/new request. Exact `already_recorded` replay provides no new dispatch opportunity. `publication_unknown` leaves a potentially published charge/record to reconcile; it is not permission to overwrite, refund or retry a call.

Technical replanning within authorized intent changes the plan, not the intent baseline. Evidence-backed clarification preserves semantic clauses and product decisions. An actual intent change needs a sourced operator-authorized baseline successor. Baseline or policy changes invalidate results bound to old digests.

## Consumption and rollback

Direction-call, content-repair and transport-qualification allowances have separate owners. New unspecified direction policies have no attempt cap. Explicit finite policies retain their sourced ceilings; a new default never resets or expands an existing run. Further calls still require a concrete question or corrective action under the canonical convergence rules. Preparation alone spends no direction slot. A published reservation remains charged across timeout, malformed output, attempted unavailability or missing/interrupted terminal. Reserved-without-terminal attempts are not counted twice. Lowering the limit, disabling or re-enabling the mode refunds nothing; zero or a limit below consumption permits no new reservation. Unknown accounting permits no new dispatch until reconciled from retained evidence.

A completed response is not erased merely because later accounting becomes unknown. Preserve it and its historical terminal; the driver must still resolve the separate allowance judgment and current endpoint eligibility. Do not treat missing output as proof that no call happened.

To roll back an active initialized run:

1. Retain its current ledger, findings/dispositions, source snapshots, full baseline/policy sequence, reservations, results, witnesses and available execution evidence. Record the actual rollback authority and affected run/issue.
2. Reload the current state and retained expected bindings. Construct and apply an explicitly authorized policy successor setting `off`, using the same canonical request procedure above. Do not delete records or edit old policy versions.
3. Verify the published successor and reread state. Preserve every consumed allowance and ordinary verified blocker. Missing evidence remains OUTSTANDING; disabling direction removes only its extra condition.
4. Before later re-enabling, use another sourced successor and recheck current target/baseline/policy/profile and actual qualification. Old results do not become current merely because the same mode is selected again.

Retain-off for future adoption is distinct from rolling back an already initialized run. If an owner selects an earlier release for a genuinely new scope, retain old evidence under its original protocol/profile/release attribution. Never reinterpret newer records through older code or relabel a continuation as a new run to reset its allowance.

Qualification eligibility is not code-byte equality: replacing a pending record with valid qualified metadata can change endpoint eligibility with the same runtime bytes. Validate the actual record and provenance for the current profile after a change. Mock qualification is not real compatibility. A pending/invalid record is enough to withhold promotion and continue ordinary authorized work under an off policy; it does not require an extra qualification experiment to justify retain-off.

## Continued improvement

Use recurring verified failures to propose targeted fixtures and reviewed changes with their existing finding and allowance history. Do not append generic global lessons or modify installed skills automatically. Current independent reviews, required checks and the normal owner merge process apply to the actual release diff; historical review approval is not a new release stamp.
