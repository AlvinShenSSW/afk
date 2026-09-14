# Issue 113: bounded behavioral-evaluation capability assessment

## Contract and dependency

Issue #113 requires actual paired behavior evidence when a qualified evaluation
surface exists, and an honest NO-GO with outstanding behavior acceptance when it
does not. This design selects the latter path only after inspecting the final
reviewed #112 implementation. It does not replace the unexecuted acceptance
criteria with source review or unit tests.

The #112 design owns the scenarios, controls, observation contract, evaluator,
export policy and accounting. This issue adds only this design and the report at
`docs/evaluations/issue-113-pilot.md`. It introduces no runtime, fixture, host
adapter, qualification override, default change or additional model invocation.

Before publication, bind the actual reviewed dependency and investigation
revision. A draft source observation cannot establish the final capability
result. If the reviewed implementation supports the missing observation surface,
this conditional NO-GO no longer follows; record that evidence and return to a
concrete, separately bounded execution handoff before any model call.

## Investigation outputs

| ID | Required output | Limit |
| --- | --- | --- |
| O1 | Exact source path from host observations through inventory qualification to the next-launch decision. | A configured model or a subject's claim does not establish complete inventory. |
| O2 | Actual revision, source hashes, relevant regression evidence and review attribution. | Mock tests establish artifact behavior only. |
| O3 | All planned cells and prerequisite slots with their actual attempt state. | Zero launches provides no positive or negative behavior sample. |
| O4 | Explicit mapping to Epic AC1–AC8 and the earlier #98 evidence owner. | Critical behavior and promotion remain outstanding without executed evidence. |
| O5 | Sanitized report and verified report-only carryforward. | Publication cannot confer host qualification or change rollout authority. |

These are investigation outputs. The original requirement for critical scenarios
on each selected model and clean/legitimate-replanning controls remains
OUTSTANDING if no surface qualifies. A reviewed report is not successful delivery
of the Epic's behavioral outcomes.

## Capability decision

Inspect the final evaluator's actual parser, observation-source reader,
qualification validator and call sites. The proof must establish all of these:

1. The exposed event format has no supported source of complete tool and
   instruction inventories in the current adapter.
2. Qualification requires observations from that supported source. Stored flags,
   unrelated digest-bound text and subject declarations cannot override a missing
   source.
3. A resumed prerequisite or behavior cell cannot be admitted through that
   unavailable source. Native skill selection has its own observation requirement.
4. The relevant final deterministic regressions exercise the actual refusal.
   Controlled source substitutions remain explicitly test-owned observations.

If these conditions hold, another invocation using the same observation adapter
cannot supply the missing capability. Select NO-GO without launching a paid
prerequisite merely to rediscover that source limitation. Record the outcome as
source capability unavailable, not a failed host invocation, model-service
outage, fresh confinement test or semantic behavior failure. An earlier matching
CLI version alone would not prove this result.

No prerequisite, author, control, auditor or relay call is allocated on this
path. Existing attempts from other experiments keep their original owners and
accounting. This report neither refunds them nor creates a replacement allowance.

## Revision and artifact boundary

Use these symbols until the actual identities are recorded:

- B: the pre-Epic baseline selected for the paired comparison.
- H: the final reviewed #112 implementation supplying the evaluator.
- C: the #113 investigation revision, including this reviewed design and H's
  unchanged evaluator and production bytes.
- R: the report revision, differing from C only at
  `docs/evaluations/issue-113-pilot.md`.

Record full B/H/C/R identities in the retained investigation evidence. Verify
H-to-C equality for evaluator and production files. Inspect the real C source,
record its relevant line coordinates and hashes, and attribute each regression
result to the revision on which it ran. No design or code change may appear
between C and R. Later source changes require a new assessment rather than an
unchanged capability stamp.

Retain raw local evidence in the run's ignored directory. Public evidence uses
repository-relative source coordinates, immutable revisions and sanitized
summaries. It includes no personal paths, raw sessions, credentials or private
configuration.

## Enumeration and optional preparation

Preserve the #112 matrix: 72 main cells, 92 planned main author invocations,
180 additional control cells/invocations and four prerequisite slots. Enumerate
actual IDs from the reviewed source and retain their digest and complete list.
Report 0/72 main and 0/180 control observations when zero launches is verified.
All four prerequisite slots remain unattempted, not failed or qualified.
Candidate model labels are not observed response identities.

Local preparation and aggregation are optional artifact checks. Use them only
if the actual API supports an honest planned, nonexecuting handoff with empty
main/control selection and real available inputs. Do not adopt a hypothetical
spend proposal, invent host fingerprints or manufacture an authorization source
to obtain a manifest. If preparation needs unavailable inputs, report the exact
limitation and distinguish source-derived enumeration from a helper aggregate.
Inspect the final call graph before asserting that preparation makes no model
call. Do not invoke `prerequisite`, `run` or `--execute` on the NO-GO path.

When these artifact operations are actually supported, retain their exact
commands, inputs, exits and outputs:

```text
node <C>/scripts/evaluate-agent-behavior.mjs prepare --campaign issue112 --execution-handoff <planned-handoff.json> --repository <clean-C> --directory <exclusive-directory> --baseline <full-B> --candidate <full-C>
node <C>/scripts/evaluate-agent-behavior.mjs report --directory <exclusive-directory>
node <C>/scripts/evaluate-agent-behavior.mjs carryforward --campaign issue112 --repository <repository> --implementation <full-C> --report-head <full-R>
```

The carryforward campaign selects this report's owner; the legacy campaign has
a different report path. Verify the final interface before execution. Command
templates here are not execution evidence.

## Interpretation and review

Actual launch records, if any, take precedence over a proposed zero-launch plan.
Never relabel an interrupted attempt as unattempted. With no eligible behavior
samples, success/failure rates and semantic behavior adjudication are not
applicable. Token, cache, billing and model-active-time observations are absent;
arithmetic zeros from an empty aggregate are not measured free usage.

The configured independent review sequence inspects the actual capability proof
and report claims. Its verdicts provide neither host qualification nor behavior
credit. A later review cannot retroactively authorize an earlier resumed
prerequisite. Any future executable handoff must account for qualification and
review delays inside its original time and attempt bounds.

| Epic criterion | Zero-launch report treatment |
| --- | --- |
| AC1: relevant instructions | Actual loading and native selection remain OUTSTANDING. |
| AC2: authorized completion | Standalone and nested stage behavior remain OUTSTANDING. |
| AC3: stable intent | Retain separately owned structural evidence; add no behavior claim. |
| AC4: direction detection | Actual drift detection and justified-change acceptance remain OUTSTANDING. |
| AC5: bounded correction | Retain separately owned accounting evidence; add no behavior claim. |
| AC6: faithful continuity | Actual resumption and preserved-authority behavior remain OUTSTANDING. |
| AC7: honest evidence | Disclose unavailable capability, unexecuted cells and evidence limits. |
| AC8: compatible rollout | Promotion and the explicit owner decision remain OUTSTANDING. |

Preserve #98's separate unmet 0/14 behavior result. Attribute any unresolved
transport qualification to its own issue and actual current record. This source
assessment cannot qualify the transport or authorize another experiment.

## Validation and publication

Validate source capability, ID enumeration, artifact operation side effects,
review attribution, H-to-C equality and C-to-R report-only equality. Run the
repository's documentation, link and provenance checks, then its required
review/publication checks. This documentation-only issue adds no test mirroring
the report and changes no plugin cache-key inputs.

Keep unexecuted critical acceptance visible in the issue and PR. Do not declare
the Epic successful, merge work with unmet required acceptance, change defaults
or infer an owner rollout decision from a valid NO-GO investigation. Issue #114
receives the concrete report and remaining decisions.
