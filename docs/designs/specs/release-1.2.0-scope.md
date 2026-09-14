# Release 1.2.0 with direction auditing kept off

Status: owner adopted this release scope on 2026-09-14 in the active execution handoff. Implementation, current reviews, checks and publication follow; adoption is not a claim that they have already completed.

## Spec review and decision

Separate publishing completed improvements from completing Epic #106's empirical acceptance. Issue #113 is needed to substantiate behavioral benefits and promotion, but issue #114 explicitly permits a retain-off decision with missing outcomes left outstanding. The owner explicitly replaced the earlier full-Epic-completion release condition with the bounded scope below, and instructed continued work after publication.

Adopted decision: release the merged #107–#112 implementation plus evidence, retain-off and rollback documentation as 1.2.0 after current review and checks. Keep #113 and Epic #106 open for missing behavioral acceptance. Complete #114's decision/documentation deliverable without claiming the upstream pilot succeeded. Exclude the unreviewed observation implementation in PR #123.

## Acceptance and frozen contract

- Release code derives from main at d5ca8ddbd37193778b37b1724778294835440be3, whose tree matches reviewed #112.
- No additional runtime, prompt, model, audit limit or default change is included.
- Direction auditing remains off by default. Shadow and required are experimental opt-in interfaces with their existing qualification and accounting requirements, not recommended production defaults.
- Existing initialized runs retain their policies, evidence, findings and consumed allowances. Retain-off for new adoption does not amend an existing run.
- Document missing paired behavior: 0/72 main observations and 0/180 controls. Do not claim demonstrated drift reduction, reliability, token savings or complete Epic delivery.
- Attribute original main qualification separately from PR #123's changed profile: the former retains its own narrow qualification; the latter remains pending after a small real pass and a full-history protocol failure.
- Record explicit owner adoption of this release scope before changing tracker completion claims or publishing.
- Apply current Fable outer review, Kimi K3 fallback if unavailable, and DeepSeek Flash final review to the actual release changes; retain original implementation review attribution.
- Pass final repository checks, required CI checks and owner merge review before tagging the merged revision v1.2.0 and creating the GitHub release.

## Evidence and alternative paths

The original PR #121 is a reviewed documentation-only NO-GO investigation. PR #122 already contains reviewed rollout choices and preserving rollback guidance, with owner choice pending. Its dependency on #113 does not require positive qualification to recommend retain-off.

The subsequent PR #123 is separate unpublished implementation. Its current-profile small qualifier passed with one real request. A 35,173-byte request retaining two complete controlled history audits returned HTTP 200 but failed coverage_artifact: the I1 artifacts list cited source-kind evidence. The system prompt already requires artifact/check evidence in that list. This is a real invalid model response, not evidence that the validator should be weakened or that published main has that changed profile.

A smaller paired smoke test could provide limited supplementary evidence, but cannot replace all original critical scenarios or silently close #113. Repeating the long-history request without a bounded allocation or repairing the model's returned JSON is not part of this release. The fastest justified release path is retain-off with honest limits; behavioral experimentation remains separately tracked.

## Files and execution surface

| File or surface | Proposed change | Reason |
| --- | --- | --- |
| docs/direction-rollout.md | Adapt existing #114 guide to the adopted release decision and current evidence | Resolve pending owner wording while preserving operational contracts |
| docs/evaluations/issue-113-pilot.md | Preserve the historical report verbatim as supporting documentation | Its original source-capability result remains attributable |
| docs/designs/specs/issue-113-behavior-pilot.md | Preserve the historical design linked by the report | Preserve a self-contained evidence chain without importing runtime changes |
| docs/designs/specs/issue-114-direction-rollout.md | Preserve its frozen scope and append the actual release decision when adopted | Distinguish delivery of retain-off guidance from successful empirical delivery |
| README.md | Link rollout guidance and label direction behavior as experimental | Avoid presenting unverified benefit as established behavior |
| .claude-plugin/marketplace.json | Set canonical plugin version to 1.2.0 | Supply the install cache key |
| Generated manifests and package metadata | Run node scripts/sync-marketplace.mjs | Keep all host versions consistent |
| GitHub #114 | Record adopted retain-off decision and residual outcome owners after reviewed delivery | Close the documentation deliverable honestly |
| GitHub #113 and Epic #106 | Keep behavioral acceptance open and distinguish released scope from full completion | Avoid false completion |
| GitHub release | Publish v1.2.0 from the reviewed merged release commit | Deliver the bounded release |

Read-only inputs are the exact merged main revision, historical PR #121/#122 documents, retained current-profile trial evidence and existing configuration/state contracts. Private transcripts, credentials, paths and provider payloads are not published. No model experiment is launched by this plan. Reviews use the existing bounded review helpers and run ledger.

Prepare the actual release diff in an isolated topic branch based on current main. Transfer documentation by exact file selection; do not merge PR #123 or import its runtime/library changes. Preserve original branch and review histories. The historical report links its frozen issue-113-behavior-pilot.md design, so include that exact document as well; its other report dependencies already exist on main. Recheck all imported links. Publish only after owner adoption and normal review/merge conditions; do not tag the plan branch or retarget an existing released tag.

## Release-note text

Version 1.2.0 adds stage-specific instruction routing, explicit handoff context, versioned intent records, bounded direction-audit helpers and evaluation tooling. Project AGENTS.md now routes detailed guidance to the relevant stage.

Direction auditing remains off by default. Shadow and required modes are experimental opt-in capabilities. Existing review, CI, owner approval and accounting requirements continue to apply. Current evidence establishes structural and bounded transport behavior, not an improvement in long-task alignment. Paired behavior evaluation remains open under #113 and Epic #106. The separate native observation implementation in PR #123 is not included.

Consult the direction rollout guide before enabling auditing or changing an existing run. Rollback preserves prior findings, evidence and consumed allowances.

## Verification and risks

Use the actual generated diff to confirm only documentation, README and version mirrors differ from merged main. Run manifest sync check, skill lint, link check, provenance scan, Markdown lint, version-bump check and the final full suite. Require actual current-revision checks and gate success after owner-approved merge preparation. Inspect the release tag target and all mirrored 1.2.0 versions after publication.

The main residual risk is users treating available experimental helpers as proven task supervision. Default-off behavior, visible evidence limits and migration guidance mitigate that risk without claiming to eliminate it. This release cannot itself satisfy missing Epic AC1/AC2/AC4/AC6 behavioral outcomes.

## Handoff

Owner adoption changes the release condition, not the original empirical truth. Implement the adopted, narrowly selected documentation/version change, obtain current independent review and owner merge approval, then publish 1.2.0. Keep #113's further experiments and any content-repair allocation separate; no budget is reset by this release.
