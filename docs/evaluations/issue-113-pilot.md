# Issue 113: behavioral-evaluation capability assessment

## Outcome

**NO-GO: the current observation adapter cannot qualify the required author-host
surface.** No behavioral model, control, prerequisite, auditor or relay call was
launched for this investigation. Main observations remain **0/72**, controls
**0/180**, and all four prerequisite slots are unattempted. This is a source
capability result, not a failed host invocation or a semantic behavior result.

The [frozen assessment contract](../designs/specs/issue-113-behavior-pilot.md)
permits this outcome while keeping the original behavioral acceptance
OUTSTANDING. It changes no runtime, default, installed skill or allowance.

## Immutable attribution

| Identity | Revision |
| --- | --- |
| B, pre-Epic paired baseline | `6244d63a87826e2834652fc8a96df6647933dce2` |
| H, independently reviewed #112 implementation | `c4b554bf7edb5a9ed0097a7f8de3aef628757fa0` |
| C, executed source investigation | `9fd041995828519200e033fb81cfa9b33563ae57` |

H to C adds only the frozen assessment design. The investigation compared all
96 selected production/support and executable source entries, with modes and
actual checkout bytes, against H and C. Executable bytes were checked before
repository imports. The evaluator and production code are unchanged. R denotes
the subsequent commit containing this report; its full identity and C-to-R
carryforward result are retained with the publication record rather than
embedded in the commit that defines them.

The actual runner SHA-256 is
`2f5610bc89216f6fe6767872caa8f69b283d22c5e04364df4abe3c9484184e7e`;
the scenario source SHA-256 is
`4126675cd7e238d3771e856aa0f43f6f9dc18bd2fab88d756ac5ac8c810baf3c`.
The design SHA-256 is `ec95be6bf7fd4d73b74a9db53f3879bb49b036e03ed0cfa75948602a7f2bcc0e`.

## Why another identical prerequisite cannot qualify this adapter

Coordinates refer to `scripts/evaluate-agent-behavior.mjs` at C.

| Source | Observed condition | Consequence |
| --- | --- | --- |
| `parseDirectionHostEvents`, lines 719–736 | The parser retains action/model events but supplies empty tool/instruction inventories and an unobservable native catalog. | Richer subject claims do not establish complete observation. |
| `HOST_OBSERVATION_READER`, line 796 | A private constant returns `unsupported-current-host-inventory`; production has no replacement option or caller. | Stored flags or source digests cannot provide the missing supported source. |
| `validateHostObservation`, lines 798–815; `observedQualification`, lines 817–832 | Qualification obtains that private source and requires observed, complete inventories with bound terminal/session/boundary evidence. Native catalog admission separately refuses. | A fabricated qualification row, unrelated stdout or a copied mock record cannot qualify the shipped path. |
| `runDirectionPrerequisite`, lines 835–849 | The initial A1/S1 slot can launch if separately authorized; A2/S2 validates the first observation before exact-session resume. | A first call can spend a slot but cannot make the unavailable reader observable. No such call was allocated here. |
| `runDirectionSlice`, lines 1071–1078 | Every main/control row requires qualification before its lock, fixture or phase dispatch. | No behavioral or control launch is admitted through this current adapter. |

The S112-3 regressions exercise the refusal and strict source validator.
Controlled tests replace the reader only in an owned copy; they establish helper
behavior under a synthetic observation source, not real confinement, native
skill selection or complete host visibility. A matching CLI version or the
[qualified direction transport](issue-111-direction-audits.md) supplies none of
those missing author-host observations.

## Executed noncalling artifact operations

The reviewed private investigation script called the existing C APIs
`createEvaluation` with `campaign: issue112`, then `aggregateEvaluation`.
Both returned successfully; the wrapper exited zero. These were API calls,
not claimed CLI executions. Source inspection shows preparation uses file/Git
exports and a credential-free Node profile computation. No prerequisite,
trial execution, host fingerprint probe, dispatch or `--execute` operation ran.

The actual handoff has planned authorization with a null authority source,
empty model/selection/prerequisite arrays, and zero author, prerequisite and
audit allocations. Planned spending and input/output token allocations are
zero. Its budget and spending references point to the actual frozen design's
no-call paragraph, lines 59–61; no hypothetical paid proposal was adopted.
The unused auditor profile is the actual current C profile, with no fabricated
qualification source. Required observation fields express policy, not evidence.

Positive administrative ceilings copy existing source constants: 90,000 ms
prerequisite, 180,000 ms invocation, 360,000 ms resume, 150,000 ms audit,
1,440,000 ms slice, 3,600,000 ms total, four cells per slice, 8,388,608 output
bytes and 3,000 ms cleanup grace. The zero schedule and zero spend provide no
callable allocation. Planned status independently refuses execution.

The resulting 252 rows are unselected and unobserved; all four prerequisite
records are unselected and unconsumed. The retained launch directory contains
no started/finished records. The driver's prior issue-113 command and allowance
history also contains no behavioral launch; the earlier four-slot/spend proposal
remains unadopted. This is retained driver evidence, not host-wide authenticated
proof that no other process called a model.

## Denominators and interpretation

| Planned group | Source definitions | Actual observations |
| --- | --- | --- |
| Main D1–D9, B/C, Astra/Sol, two repetitions | 72 cells; 92 main author stages | 0/72 |
| Description selection and reference loading | 180 control cells/invocations | 0/180 |
| Initial/resumed prerequisite pairs | P112-A1, P112-A2, P112-S1, P112-S2 | 0/4; unattempted |

Candidate labels `gpt-6-astra` and `gpt-5.6-sol` are definitions, not observed
response identities. With no eligible samples, semantic pass/fail rates,
model-active time, token/cache use and billing observations are unavailable.
Empty aggregate numeric sums are arithmetic on empty arrays, not measured free
execution. No sample was excluded, retried, relabeled as passed or refunded.
The [separate #98 report](issue-98-pilot.md) retains its unmet 0/14 result.

The current #111 record is valid and qualified for profile
`abb20b243641972c135eff402461ed8ff1a85ad332aa5597ba6ffe0e44239cb4`;
its record digest is `d502dbc47c9dbba54780b9d95044ea2df370a60e8eb8a09c621d535cd467cc37`.
That report owns four driver qualification attempts, three HTTP requests and
7,463 ms, including the earlier INVALID response. This investigation made no
additional qualification attempt and claims no semantic reliability from it.

## Structural verification and limitations

H passed Kimi K3 outer review, followed by DeepSeek Flash final review, both
APPROVE WITH COMMENTS on the same revision/base/configuration. The root's final
native suite on H completed **1,280 tests: 1,273 passed, seven skipped, zero
failed**. The separately attributed affected integration suite passed 96/96
on byte-identical source. Root also reproduced the D6 resume source locator.
These are structural/deterministic checks, not behavior samples. Native-suite
Claude probes and external reviewers keep their own accounting; provider usage
not retained by native tests remains unknown.

Retained #112 limitations remain relevant to future eligibility: full D9 history
can exceed 16 KiB and refuse before charge; late reservation can conservatively
consume a slot before dispatch refusal; some reference-read ordering remains
unobserved. A failed audit's summary can conservatively misclassify cleanup
while retained raw process evidence says otherwise, and conflicting model labels
can be masked by a later repeated label. None confers current host qualification;
future runnable investigation must adjudicate these limits rather than silently
assuming that this NO-GO removed them.

Report review, its final native checks and revision-specific CI reading are
publication validation only. They cannot convert missing behavior into an
observed result. The publication record retains their actual outcomes and the
C-to-R comparison; no default promotion follows from a clean report review.

## Retained investigation artifacts

Public identifiers below bind the private, complete investigation records.
Their contents include local paths and are not committed. Digests establish
artifact identity, not trusted execution or semantic truth.

| Artifact | Bytes | SHA-256 |
| --- | --- | --- |
| `enumeration.json` | 58381 | `2bea37744a66461e3f1b5f9d07701539a5257598445a9431a261f86c4bec6e34` |
| `source-identity.json` | 30131 | `2fece67d518e74375b7dcf3f03bd65919ca02fbdd5391b79915d43de26b75e50` |
| `preimport-executable-identity.json` | 10377 | `b1b9dfc9a79c4bb908ae65d440abffd74938ece257a6d439bfb0cd15abf03ef7` |
| `source-chain-index.json` | 32857 | `4c55aab3bc9e58a6552b9ca4710974801e4a7af0caf770bbd94ca0e801495c8b` |
| `planned-handoff.json` | 2067 | `c1cbbb2866d1868616325696f1976922df4360346dea84f8c276c3d3227d30a7` |
| `prepare-result.json` | 86105 | `a3f815ae0581add4bb483dcd4de67fecf1f3ad193c4dd36cb2da1be2390aab63` |
| `aggregate.json` | 173630 | `01dbf4a34a210959d1fd39f32ce9ec465e75f12de7f38384cce7138c6634a737` |
| `artifact-operations.json` | 1223 | `e241a07f7935c4d1b56453906047f5e3fb9ce122e0b8b891caece0ef49070ef1` |
| `completion.json` | 382 | `c93b8f396a8cce4d7e5a7cc8b3ea22cd8648f17a457b5cd2cb75d45ed6233525` |

The complete enumeration includes every row, phase and prerequisite definition.
The source identity record binds actual B/H/C, all selected source bytes and the
qualification record. API outputs preserve the planned handoff and full empty
aggregate without inventing host fingerprints or exposing configuration.

## Acceptance and remaining work

| Epic criterion | Result |
| --- | --- |
| AC1 relevant instructions | Actual loading/native selection OUTSTANDING. |
| AC2 authorized completion | Standalone/nested behavior OUTSTANDING. |
| AC3 stable intent | Prior structural evidence only; no behavioral credit. |
| AC4 direction detection | Actual drift detection and justified-change acceptance OUTSTANDING. |
| AC5 bounded correction | Prior accounting evidence only; no behavioral credit. |
| AC6 faithful continuity | Actual resume/preserved-authority behavior OUTSTANDING. |
| AC7 honest evidence | Source limitation, complete denominators and absence of samples disclosed. |
| AC8 compatible rollout | Promotion and explicit owner decision OUTSTANDING. |

A future executable handoff needs a supported observation source, independently
qualified full tool/instruction surface and any required native catalog, then
explicit selected cells and sourced attempt/time/spend limits. Old attempts and
unresolved evidence remain with their original owners. Qualification and review
waiting time belongs inside that handoff's global wall bound.

Issue #114 receives this report and the unchanged off default. The owner still
chooses continued work, explicit deferral or rescoping of unachieved outcomes.
No such choice is inferred here. A valid NO-GO report neither completes the
Epic's critical behavioral acceptance nor authorizes merging unmet scope.

## Enumerated main IDs

```text
M-D1-B-ASTRA-R1 M-D1-B-ASTRA-R2 M-D1-B-SOL-R1 M-D1-B-SOL-R2 M-D1-C-ASTRA-R1 M-D1-C-ASTRA-R2 M-D1-C-SOL-R1 M-D1-C-SOL-R2
M-D2-B-ASTRA-R1 M-D2-B-ASTRA-R2 M-D2-B-SOL-R1 M-D2-B-SOL-R2 M-D2-C-ASTRA-R1 M-D2-C-ASTRA-R2 M-D2-C-SOL-R1 M-D2-C-SOL-R2
M-D3-B-ASTRA-R1 M-D3-B-ASTRA-R2 M-D3-B-SOL-R1 M-D3-B-SOL-R2 M-D3-C-ASTRA-R1 M-D3-C-ASTRA-R2 M-D3-C-SOL-R1 M-D3-C-SOL-R2
M-D4-B-ASTRA-R1 M-D4-B-ASTRA-R2 M-D4-B-SOL-R1 M-D4-B-SOL-R2 M-D4-C-ASTRA-R1 M-D4-C-ASTRA-R2 M-D4-C-SOL-R1 M-D4-C-SOL-R2
M-D5-B-ASTRA-R1 M-D5-B-ASTRA-R2 M-D5-B-SOL-R1 M-D5-B-SOL-R2 M-D5-C-ASTRA-R1 M-D5-C-ASTRA-R2 M-D5-C-SOL-R1 M-D5-C-SOL-R2
M-D6-B-ASTRA-R1 M-D6-B-ASTRA-R2 M-D6-B-SOL-R1 M-D6-B-SOL-R2 M-D6-C-ASTRA-R1 M-D6-C-ASTRA-R2 M-D6-C-SOL-R1 M-D6-C-SOL-R2
M-D7-B-ASTRA-R1 M-D7-B-ASTRA-R2 M-D7-B-SOL-R1 M-D7-B-SOL-R2 M-D7-C-ASTRA-R1 M-D7-C-ASTRA-R2 M-D7-C-SOL-R1 M-D7-C-SOL-R2
M-D8-B-ASTRA-R1 M-D8-B-ASTRA-R2 M-D8-B-SOL-R1 M-D8-B-SOL-R2 M-D8-C-ASTRA-R1 M-D8-C-ASTRA-R2 M-D8-C-SOL-R1 M-D8-C-SOL-R2
M-D9-B-ASTRA-R1 M-D9-B-ASTRA-R2 M-D9-B-SOL-R1 M-D9-B-SOL-R2 M-D9-C-ASTRA-R1 M-D9-C-ASTRA-R2 M-D9-C-SOL-R1 M-D9-C-SOL-R2
```

## Enumerated control IDs

```text
C-F01-B-ASTRA C-F01-B-SOL C-F01-C-ASTRA C-F01-C-SOL
C-F02-B-ASTRA C-F02-B-SOL C-F02-C-ASTRA C-F02-C-SOL
C-F03-B-ASTRA C-F03-B-SOL C-F03-C-ASTRA C-F03-C-SOL
C-F04-B-ASTRA C-F04-B-SOL C-F04-C-ASTRA C-F04-C-SOL
C-F05-B-ASTRA C-F05-B-SOL C-F05-C-ASTRA C-F05-C-SOL
C-F06-B-ASTRA C-F06-B-SOL C-F06-C-ASTRA C-F06-C-SOL
C-F07-B-ASTRA C-F07-B-SOL C-F07-C-ASTRA C-F07-C-SOL
C-F08-B-ASTRA C-F08-B-SOL C-F08-C-ASTRA C-F08-C-SOL
C-F09-B-ASTRA C-F09-B-SOL C-F09-C-ASTRA C-F09-C-SOL
C-F10-B-ASTRA C-F10-B-SOL C-F10-C-ASTRA C-F10-C-SOL
C-F11-B-ASTRA C-F11-B-SOL C-F11-C-ASTRA C-F11-C-SOL
C-F12-B-ASTRA C-F12-B-SOL C-F12-C-ASTRA C-F12-C-SOL
C-F13-B-ASTRA C-F13-B-SOL C-F13-C-ASTRA C-F13-C-SOL
C-F14-B-ASTRA C-F14-B-SOL C-F14-C-ASTRA C-F14-C-SOL
C-F15-B-ASTRA C-F15-B-SOL C-F15-C-ASTRA C-F15-C-SOL
C-F16-B-ASTRA C-F16-B-SOL C-F16-C-ASTRA C-F16-C-SOL
C-F17-B-ASTRA C-F17-B-SOL C-F17-C-ASTRA C-F17-C-SOL
C-F18-B-ASTRA C-F18-B-SOL C-F18-C-ASTRA C-F18-C-SOL
C-F19-B-ASTRA C-F19-B-SOL C-F19-C-ASTRA C-F19-C-SOL
C-F20-B-ASTRA C-F20-B-SOL C-F20-C-ASTRA C-F20-C-SOL
C-F21-B-ASTRA C-F21-B-SOL C-F21-C-ASTRA C-F21-C-SOL
C-F22-B-ASTRA C-F22-B-SOL C-F22-C-ASTRA C-F22-C-SOL
C-F23-B-ASTRA C-F23-B-SOL C-F23-C-ASTRA C-F23-C-SOL
C-F24-B-ASTRA C-F24-B-SOL C-F24-C-ASTRA C-F24-C-SOL
C-F25-B-ASTRA C-F25-B-SOL C-F25-C-ASTRA C-F25-C-SOL
C-F26-B-ASTRA C-F26-B-SOL C-F26-C-ASTRA C-F26-C-SOL
C-F27-B-ASTRA C-F27-B-SOL C-F27-C-ASTRA C-F27-C-SOL
C-F28-B-ASTRA C-F28-B-SOL C-F28-C-ASTRA C-F28-C-SOL
C-F29-B-ASTRA C-F29-B-SOL C-F29-C-ASTRA C-F29-C-SOL
C-F30-B-ASTRA C-F30-B-SOL C-F30-C-ASTRA C-F30-C-SOL
C-F31-B-ASTRA C-F31-B-SOL C-F31-C-ASTRA C-F31-C-SOL
C-F32-B-ASTRA C-F32-B-SOL C-F32-C-ASTRA C-F32-C-SOL
C-F33-B-ASTRA C-F33-B-SOL C-F33-C-ASTRA C-F33-C-SOL
C-F34-B-ASTRA C-F34-B-SOL C-F34-C-ASTRA C-F34-C-SOL
C-F35-B-ASTRA C-F35-B-SOL C-F35-C-ASTRA C-F35-C-SOL
C-F36-B-ASTRA C-F36-B-SOL C-F36-C-ASTRA C-F36-C-SOL
C-F37-B-ASTRA C-F37-B-SOL C-F37-C-ASTRA C-F37-C-SOL
C-L1-B-ASTRA C-L1-B-SOL C-L1-C-ASTRA C-L1-C-SOL
C-L2-B-ASTRA C-L2-B-SOL C-L2-C-ASTRA C-L2-C-SOL
C-L3-B-ASTRA C-L3-B-SOL C-L3-C-ASTRA C-L3-C-SOL
C-L4-B-ASTRA C-L4-B-SOL C-L4-C-ASTRA C-L4-C-SOL
C-L5-B-ASTRA C-L5-B-SOL C-L5-C-ASTRA C-L5-C-SOL
C-L6-B-ASTRA C-L6-B-SOL C-L6-C-ASTRA C-L6-C-SOL
C-L7-B-ASTRA C-L7-B-SOL C-L7-C-ASTRA C-L7-C-SOL
C-L8-B-ASTRA C-L8-B-SOL C-L8-C-ASTRA C-L8-C-SOL
```
