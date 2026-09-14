# Issue 111 direction audit qualification

Status: **QUALIFIED for the recorded profile**. The driver observed and inspected
one actual corrected-profile request returning a strict, current endpoint
`COMPLETE`. This qualifies the bounded transport/protocol fixture; it does not
establish general semantic reliability or author-host confinement.

| Acceptance | Evidence and limit |
| --- | --- |
| Typed response and deterministic extraction | Actual result passed strict extraction, response-to-payload equality and complete clause coverage. |
| Source-grounded endpoint | Both `O1` and `A1` cite the approved source, actual implementation and actual arithmetic check. |
| Independent observed identity | `deepseek-flash`, from the provider response; separate from the Codex implementer. Alias observation is not weight attestation. |
| Required-mode integration | Matching compatibility metadata permits the network-free current endpoint check; ordinary workflow gates remain separate. |
| Semantic drift detection | OUTSTANDING; this narrow clean fixture is not the #112/#113 behavior campaign. |
| Author-host confinement | OUTSTANDING; a zero-tool auditor interface does not confine the author host. |

## Execution and source inspection

Execution revision: `2bc7ab6be03a3538ce0122279ad8828bc94e649a`.
Profile: `abb20b243641972c135eff402461ed8ff1a85ad332aa5597ba6ffe0e44239cb4`.
The 21-file production closure matches this revision byte for byte. The separate
qualifier/setup harness is
`7e9e4c63ebf317312cfa87cad86bc36c941f4cf004bf995fada7f82bd4d91d37`;
qualifier bytes are `b8a19707247053803917e8ccc0c7c6e03242e7f3d467ada70d13794af3ffc0e5`.
The synthetic target is `013bf0f410f1620e835313f130a962662bbabab4`.

Actual HTTP observation ran from `2026-09-13T13:00:33.845Z`
to `2026-09-13T13:00:36.162Z`. It returned HTTP 200, observed alias
`deepseek-flash`, finish reason `stop` and no tool calls. The request contained
exactly system/user messages, `thinking: disabled`, `tool_choice: none`,
`response_format: json_object`, `stream: false` and no tools field. The request
was 6753 bytes; the observed response was accepted without repair or coercion.
Credentials were confined to the child environment and did not enter the packet.

The driver read both returned coverage rows and compared their full quotes with
the retained sources. Each `source` is one object citing approved line 3,
including the fixture's source marker. Each `artifacts` array cites the addition
implementation and passing positive, mixed-sign and zero arithmetic checks.
Coverage is exactly `O1` and `A1`, both supported, with no findings; the remaining
normative arrays in this synthetic baseline are empty. The result is phase
`endpoint`, outcome `COMPLETE`, bound to the current target and reservation.
The synthetic direction state retains one charged, completed attempt and zero
remaining attempts. A completed last slot is not a new dispatch allowance.

| Bound artifact | SHA-256 |
| --- | --- |
| Packet | `abc364c739ab3a7d80e524ac1ff6d6cac58f5120615eb00eabfd7976ddaa4a35` |
| Request | `b36b4926e2633d5449ea71998ba034d60d1ba7d858a3d18d4d1437abf7d4136e` |
| Retained response | `4c01af9ef1e0a7713ed6bd8f75d56848278a6c55d07736ef3cf1b738c4280119` |
| Raw response wire | `ee17cc451fda2377e30253a643321f611e067b2b28f3cf131ed1e785ee113e74` |
| Result | `3d87f7456c8699db7e0fdf068c6c16158f676823d3600df124bf82695c5fa65b` |
| Coverage and supplied evidence | `39eb0b1091a6f67e965434ced8a6b1879fe4e0529efedc2488a59d385f35e6a9` |
| Protocol evidence set | `c20aed011e7ba4566b7a0cc7b8c3ea3e0c400775518aed0daf8a843eb1d4b4a2` |
| Prepared metadata | `ecb70eafb1858b028cceacc6a31bc3b9ad59236216df867e49d6fbfbf7a8d890` |
| Source-bound amendment | `16817a4201ed04356153f61680aae4544f3612ea05e36e50c8898249329f0d3a` |

## Accounting and retained failures

| Driver attempt | Actual HTTP requests | Charged invocation ms | Result | Observed input/output/cache tokens |
| --- | --- | --- | --- | --- |
| 1 | 1 | 1900 | Prototype candidate pass | 624 / 178 / 0 |
| 2 | 0 | 37 | Noncanonical budget JSON refused before probe entry | Unknown; observed no HTTP dispatch |
| 3 | 1 | 2868 | Final-protocol `invalid_schema` | 1805 / 529 / 0 |
| 4 | 1 | 2658 | Corrected-profile candidate pass, adopted here | 1834 / 528 / 0 |

All four attempts and three actual HTTP requests are retained. Total charged
invocation time is 7463ms, including wait/publication within each invocation and
excluding offline gaps. The current exchange took 2317ms; helper elapsed time was
2560ms; the driver measured and charged 2658ms. None of these durations refunds an
attempt. Review invocations and later behavior experiments have separate owners.

The original unamended two-slot defaults remain unchanged. A sourced one-attempt
amendment retained priorAttempts 3, priorRequests 2 and priorElapsedMs 4805; the
actual fourth invocation used ordinal 4 and 295195ms remaining. Earlier helper
metadata retained its original frozen ordinal; the driver ledger records actual
attempts without resetting them. The amendment and root execution handoff bind
this exact call and preserve the 150000ms process watchdog, 120000ms HTTP bound,
300000ms cumulative budget, 16384 request bytes, 8192 output tokens and 131072
response bytes. No automatic retry is granted.

The original USD0.10 planning ceiling remains a driver estimate, not billing
enforcement. At the previously retained input/output rates, known observed calls
estimate USD0.0027609 total, including USD0.0011838 for this invocation. The
pre-HTTP refusal keeps unknown usage fields; no provider bill was observed.
Unknown usage needed for a later spend decision cannot be treated as zero.

Attempt 3 used profile
`58ccb60e7ae8f729922dd9736f80f08c4343834f09c682b337dd1eead3289d98` and request
`917a2f343dc1fe54e51c9471faa4f1e36bdc739003d01e3bfeb8e6920abbedeb`.
Its retained response
`ccfa42dbed42f4f58abddca7674133f36d805baa7ab394a74857565ddeb4b91f` and result
`eae2dac9bce3e2e69b22cc319c761907c887d7859d674fe76a23d125f0129043` remain INVALID.
An offline shape diagnostic did not replace those artifacts. Only the newly
observed strict result supports the current qualification.

## Retained evidence inventory

The following is the complete prepared evidence inventory, excluding Git's
internal files. Paths are relative to the isolated prepared artifact; `S/` means
`subject/.afk/runs/qualification/` and `A/` means
`S/issues/synthetic/audits/final-protocol/`. Raw local evidence is retained by the
driver; no private absolute paths or credential-bearing configuration are
published. The canonical sorted inventory digest is `e5d5a3dca0309120adfb170d4ade7db187c77986cc7257693db72c278ec8678f`.

| Artifact | Bytes | SHA-256 |
| --- | --- | --- |
| `budget-amendment/amendment.json` | 377 | `16817a4201ed04356153f61680aae4544f3612ea05e36e50c8898249329f0d3a` |
| `budget-amendment/attempt-history.txt` | 1135 | `448d915af58df94c219d9c5435566165f21d9fe94c025c35fac1e7c5cebc78c0` |
| `budget-amendment/authorization.txt` | 1247 | `6655746c6ec439699a55288a9f663a4a20c68e1faed9a194d826b6a2c716bbfc` |
| `budget.json` | 424 | `71a859293aedbd4f5a4e24d0589e1fd38d6ccd79e152a9122a4ed09a4d87a203` |
| `expected.json` | 171 | `acfcfb6ea1014e0dab1b8367694a10d9975a9ecdb6125d9e7f44b5d1002121ab` |
| `fixture/artifact.mjs` | 40 | `1dd6cbf7d76a98950a694e13dfa98b286d7009407ccebf09648c825e945baba8` |
| `fixture/check.txt` | 63 | `2280809dd6f900d0c54adcf624457da4b008cc210ff3b1784eb9952c05cca075` |
| `fixture/expected.json` | 204 | `8cd8908cb55b7c0bcfa69172b36f30c7fff69ff6f7b85d444984c0e1837b6931` |
| `fixture/requirements.md` | 143 | `47002c6bee7b358a579c75e2b97282c0dc5a5a363ba6dfba86552cde24d57adf` |
| `prepared.json` | 1475 | `ecb70eafb1858b028cceacc6a31bc3b9ad59236216df867e49d6fbfbf7a8d890` |
| `S/check.txt` | 63 | `2280809dd6f900d0c54adcf624457da4b008cc210ff3b1784eb9952c05cca075` |
| `S/input.json` | 1524 | `60c806ce719cd0144c43365dbcc786cf0c2485b59c0094b3340aed94216f3b28` |
| `A/dispatch.json` | 328 | `dc53ebb1cbf5ba62464f7fa346e57cc2bd91c8ae2030c93ab71be594609029f6` |
| `A/evidence/implementation.txt` | 40 | `1dd6cbf7d76a98950a694e13dfa98b286d7009407ccebf09648c825e945baba8` |
| `A/packet.json` | 4109 | `abc364c739ab3a7d80e524ac1ff6d6cac58f5120615eb00eabfd7976ddaa4a35` |
| `A/preparation.json` | 599 | `bf553f084341f348c2ed0886fc75e6d37bb9ab439d4094f194fd0ed359e4a294` |
| `A/request.json` | 6753 | `b36b4926e2633d5449ea71998ba034d60d1ba7d858a3d18d4d1437abf7d4136e` |
| `A/reserve-request.json` | 694 | `a83f12d2b01093ec8d4eeb5733330e1817f16f0c1d98016a8386e44e434f1a17` |
| `A/response.json` | 2601 | `4c01af9ef1e0a7713ed6bd8f75d56848278a6c55d07736ef3cf1b738c4280119` |
| `A/result.json` | 2874 | `3d87f7456c8699db7e0fdf068c6c16158f676823d3600df124bf82695c5fa65b` |
| `A/terminal-witness.txt` | 135 | `f3a319ba4d87837807ce24293ac10c92dff426000cc71dd73f10756d24b21e0b` |
| `S/issues/synthetic/direction/000001.json` | 1952 | `be776a65923e51c8a5490deb8603858f9fe9f2719f2ee6460209a13225d249ee` |
| `S/issues/synthetic/direction/000002.json` | 725 | `836a09bb144d70a78d6e14efe7797625339eb8711759f44080f55100a99fb18f` |
| `S/issues/synthetic/direction/000003.json` | 692 | `bf3ac9c29a150296ce5a0962e22d4bb6de0c67d62226910254ec4d1d9d9297e0` |
| `S/ledger.md` | 124 | `4fd6c1671f356544f2a9b5733cfc840e1c556497a30c14c305269fa53dbf1c4f` |
| `S/source.md` | 143 | `47002c6bee7b358a579c75e2b97282c0dc5a5a363ba6dfba86552cde24d57adf` |
| `subject/artifact.mjs` | 40 | `1dd6cbf7d76a98950a694e13dfa98b286d7009407ccebf09648c825e945baba8` |
| `terminal.json` | 4234 | `4ed4c9ac51af897838861600abab32f7ae170b181e1a498fa7d34277cc5875f4` |

The driver additionally retains its immutable preflight/budget input, stdout and
stderr, attempt ledger, sourced allocation, current structural-role receipts and
source/coverage inspection. Their local locations are not publication inputs or
claims of cryptographic provider attestation.

## Review, carryforward and limitations

Before the actual call, internal review, Kimi K3 outer review and DeepSeek Flash
final structural review accepted the execution revision. Root independently
passed 169 affected/dependency/helper tests. All 116 affected tests passed in
both pending and validator-accepted mock-qualified ambient states. These mocks
only tested publication compatibility; they supplied no live qualification.

Only this report and `lib/direction/qualification.json` change after execution.
The report is finalized first; `buildQualificationRecord` then binds its digest
to the observed artifacts and exact execution profile. This report does not hash
itself or the qualification record. Publication separately requires exact runtime
carryforward, the network-free endpoint recheck, current ordered reviews, the
final native suite and the revision's CI reading; those outcomes are retained in
the PR and run record.

The 16 KiB complete-request cap still refuses oversized evidence without
truncation. Deferred fail-closed availability limits include secret-pattern
source rejection, derived-path classification and a smaller result-read cap than
the maximum response size. Normal tests, reviews, unresolved findings and owner
merge authority remain necessary. Qualification does not enable auditing by
default, authorize a behavior campaign, establish semantic accuracy or complete
the Epic's unmet behavior criteria.

Compatibility adoption depends on truthful driver evidence. Artifact checks can
reject inconsistent response/payload pairs; a fully consistent fabrication
remains a level 3 trust boundary. The auditor received a fresh two-message request;
that proves the delivered context shape, not provider-side cache erasure.
