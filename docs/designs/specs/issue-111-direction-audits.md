# Issue 111: opt-in direction audit packets and checkpoints

## Draft status and spec review

This is an initial design draft against dependency candidate
`5b5db427094dfbc44267217b4651055f421b1d54`. It is not frozen, does not accept
unfinished #109 review, and authorizes no implementation or provider request.
The driver confirms the dependency status before formal design debate.
This candidate differs from the inspected runtime by one parent test assertion;
its runtime/state interfaces are unchanged. The driver reports both ordered
re-reviews and the final native suite passed; PR 118 actual CI remains pending.

Issue #111 adds source-grounded direction packets and results, artifact checks,
and opt-in driver checkpoints. It separates a direction judgment from code review
and from permission to act. The checker prepares and validates artifacts without
model scheduling. A manual fixed-profile transport performs one explicit request;
no daemon, provider registry, automatic retry or workflow runtime is introduced.

Dependencies #107/#108 supply stage routing and continuity; #109 supplies the
canonical baseline/policy/attempt sequence; #110 supplies a provisional independent
transport qualification and one remaining qualification call. This issue must
exercise the final protocol before claiming required-mode integration is ready.

## Acceptance criteria and proposed frozen contract

| ID | Required behavior |
| --- | --- |
| C1 | Packet and result bind run/issue, phase, selected endpoint, active baseline/policy, actual target, source evidence, history and next action; check freshness before dispatch, after response and before endpoint use. |
| C2 | Validate and inspect packet/result content before use. Free text and source bytes retain secret checks; exact typed digests are not mistaken for secrets. Preserve #109's role-based opaque boundary and unchanged state/review schemas. |
| C3 | An independent fresh-context call uses the qualified fixed profile; observed identity comes from the API envelope, separately from requested identity and model-authored text. Final prompt/wire/extraction/profile must have actual qualification evidence. |
| C4 | Required endpoint direction satisfaction needs a valid, current, phase-endpoint COMPLETE result for that endpoint and target, with source-grounded requirement coverage. It adds to normal tests/reviews/authority conditions; no earlier plan audit or ON-TRACK substitutes. |
| C5 | Off preserves old behavior. Shadow adds no direction-only holds or readiness conditions. Required missing/stale/invalid/unavailable evidence or exhausted calls stays OUTSTANDING. |
| C6 | Audits use existing #109 attempt accounting; corrections use the separate existing shared repair allowance and admission rules. Findings do not authorize scope expansion, more calls or destructive rollback. |
| C7 | Driver checkpoints occur at stage/signal tool boundaries; no periodic supervision or non-bypassable stop is claimed. Existing gate verdicts, receipts, review context and standalone endpoints remain intact. |
| C8 | Reuse the tested fixed transport in one place, shared utilities and existing state APIs. Keep production helper export dependencies explicit and evaluation oracles private. |

The smallest causal boundary is the versioned direction protocol, source/target
checks, one fixed manual transport, and directly routed checkpoint doctrine.
Allowed behavior is explicit opt-in auditing under an already sourced run policy.
No extra mandatory PR reviewer role or automatic audit activation is added.

Semantic judgment and whether source evidence really supports intent are level 1.
Shapes, hashes, references, bounded I/O and returned artifact eligibility are
level 2 when helpers are invoked. Scheduling, spending, truthful provenance,
correction admission and normal completion remain level 3 driver obligations.
The plugin authenticates neither operator intent nor provider weights.

## Existing interfaces and assumptions

Read the existing [state contract](issue-109-direction-state.md) and
[prototype evidence](../../evaluations/issue-110-transport.md). The inspected state
API is:

```text
readDirectionState({cwd,runId,issueId,expected?}) -> CheckResult
appendDirectionRecord({cwd,request}) -> MutationResult
resolveDirectionPolicy({cwd,runId,overrides,configSource}) -> initial Policy
loadDirectionInput({cwd,path,runId}) -> bounded canonical JSON
```

Reuse its baseline/policy validators, typed references, canonical hashing and
limits. State records are already authoritative; no new baseline, attempt or
repair ledger is created. Existing config is `## direction`, `mode: off` and
`max-audit-attempts: 4`; the resolver already owns parsing and frozen sources.

Only reservation `payload.binding.packet` and terminal `payload.terminal.result`
are opaque content roles in #109. Their confinement, size, UTF-8/NUL and digest
checks still run. Source/change/accounting/Terminal.evidence reads stay strict.
The opaque cache cannot satisfy a strict read of the same reference. The state
helper does not dispatch or emit those opaque bytes; #111 assumes responsibility
for their typed schema and content checks before use.

The prototype demonstrated exact `deepseek-flash`, two messages, no tools,
thinking disabled, JSON output and normal stop. Its success does not qualify the
new payload or broad semantic accuracy. The documented stateless interface does
not prove provider cache erasure or a fixed weight generation. Final protocol
comprehension and source-grounded COMPLETE remain unverified until the remaining
live qualification call.

The parent #109 deferred P2 remains: its bounded ledger-prefix read can split a
multibyte UTF-8 character at the byte boundary and make state unavailable. This
issue preserves that fail-closed availability limitation, reports the upstream
reason, and does not modify the parent reader or reinterpret unavailable as off.
Two parent minor dispositions also remain unchanged: an ancestor symlink with an
absent sequence leaf may return off while permitting no reservation, and unknown
direction config keys are ignored while recognized fields retain validation.
A retained required policy/binding must not be disabled by apparent legacy off
from a missing or inaccessible expected sequence. Compare retained packet/state
bindings and report stale/unavailable under the retained policy; only an actual
validated sourced policy amendment can turn that active run off. Do not add a
competing config parser or repair these parent findings here.

## Exact protocol types

All artifacts use canonical JSON where specified, strict keys and version 1.
Reject missing/unknown keys, invalid enums, duplicate IDs and unsupported versions.
`Id`, `Text`, `Source`, `EvidenceRef`, `Baseline` and `Policy` reuse #109's types.
`EvidenceRef` is `{path,digest}` relative to the current run; digests are SHA-256
of exact bytes. Target revisions use the existing target descriptor's Git IDs.
Free-text fields are bounded by the enclosing artifact cap and are secret-checked.
Arrays are bounded by the artifact cap and have unique IDs where stated.

```text
Endpoint = { id: Id, source: Source }
Author = { family: Id, model: Text, source: Source }
Anchor = { evidenceId: Id, startLine: positive integer,
           endLine: integer >= startLine, quote: Text }
Evidence = { id: Id, kind: "source" | "artifact" | "check",
             origin: Origin, reference: EvidenceRef, content: Text }
Origin = { kind: "baseline-source", sourceId: Id }
       | { kind: "target-blob", path: Text, revision: GitId,
           blob: GitId, mode: "100644" | "100755" }
       | { kind: "target-worktree", path: Text, digest: Digest }
       | { kind: "check-claim", targetDigest: Digest,
           command: Text, exitCode: integer | null }
Target = { selector: Selector, descriptor: existing ReviewTargetDescriptor,
           currentHead: GitId, working: ReviewTargetDescriptor | null }
Selector = { kind: "branch", base: Text }
         | { kind: "commit", commit: GitId }
         | { kind: "design", path: Text }
         | { kind: "uncommitted" }
History = { audits: HistoricalAudit[],
            findings: [{ auditId: Id, finding: Finding }],
            dispositions: [{ auditId: Id, findingId: Id,
              disposition: "open" | "fixed" | "refuted" | "deferred"
                         | "suppressed" | "contested",
              reason: Text, evidence: EvidenceRef[] }] }
Finding = { id: Id, requirementIds: Id[], evidence: Anchor[],
            explanation: Text, recommendedAction: Text }
HistoricalAudit = { auditId: Id, packet: EvidenceRef, result: EvidenceRef,
                    phase: "initial" | "endpoint" | "signal", endpointId: Id,
                    baseline: Baseline, baselineDigest: Digest,
                    target: Target, targetDigest: Digest, evidence: Evidence[] }
HistoryInput = { audits: [{ auditId: Id, packet: EvidenceRef, result: EvidenceRef }],
                 findings: History.findings, dispositions: History.dispositions }
```

Endpoint IDs are supplied from the selected authorized scope, with source
provenance; the checker does not invent a new forge/workflow endpoint enum.
The endpoint check requires that same explicitly supplied ID. The driver maps it
to existing publication/local/standalone completion conditions. A standalone
plan-only task is not converted into implementation. Earlier initial-phase plan
evidence cannot satisfy a later implementation endpoint.

A `source` Evidence ID equals its Baseline Source ID, and its reference equals
that Source's exact evidence reference; origin is baseline-source with the same
ID. Artifact/check IDs cannot collide with source IDs. Artifact origins are
helper-observed target-blob or target-worktree origins, never caller-supplied
revision/blob claims. Check origins are explicitly driver claims tied to a target
digest; hashing a log or matching that claim does not authenticate test execution. Anchor lines refer to the supplied evidence's UTF-8 content, split on
LF; the quote must equal the selected contiguous line span after trimming outer
whitespace on both sides. Internal characters and line order must match. This
permits a model to omit indentation while still requiring the full cited span.
Each baseline source anchor must be present and within actual source lines.

```text
Packet = {
  version: 1, runId: Id, issueId: Id, auditId: Id,
  phase: "initial" | "endpoint" | "signal", endpoint: Endpoint,
  baseline: Baseline, baselineDigest: Digest,
  policy: Policy, policyDigest: Digest,
  target: Target, targetDigest: Digest,
  authors: Author[], profileDigest: Digest,
  evidence: Evidence[],
  coverage: [{ requirementId: Id, evidenceIds: Id[], note: Text }],
  history: History, nextAction: Text
}
ModelResult = {
  version: 1, packetDigest: Digest, phase: Packet.phase,
  endpointId: Id, targetDigest: Digest,
  outcome: "ON-TRACK" | "CORRECT-COURSE" | "NEEDS-DECISION" | "COMPLETE",
  coverage: [{ requirementId: Id,
    status: "supported" | "planned" | "gap" | "uncertain" | "not-applicable",
    source: Anchor, artifacts: Anchor[], explanation: Text }],
  findings: Finding[], nextAction: Text
}
```

The coverage row set is exactly the unique clause IDs in baseline outcomes,
acceptance, invariants, nonGoals, priorities, allowedChanges and publicationLimits.
Assumptions and facts remain available in the full baseline; uncertain product
assumptions must be considered by the auditor, but the helper cannot decide
whether an assumption is material to the current endpoint.

Each result coverage source anchor must refer to one of that clause's baseline
sources and lie within its approved line span. Artifact anchors may reference
only artifact/check evidence. `supported` requires at least one artifact/check
anchor; `not-applicable` requires a nonempty source-grounded explanation. For
endpoint COMPLETE, all rows must be supported or not-applicable. This checks
represented evidence, not the truth of the explanation. Omitted rows, unknown
requirements, bad quotes and duplicate IDs are invalid evidence.

Findings remain model-authored; only separate History dispositions record driver
triage. Dispositions must reference retained prior finding IDs and their original
audits, with evidence for non-open outcomes. The current model cannot silently
mark its own findings fixed or enlarge the frozen baseline. COMPLETE requires no
current findings. An auditor may still be wrong about completeness; semantic
fixtures and later evaluations measure that limitation.

### Historical finding context (R111-1, cycle 2 amendment)

Preparation accepts HistoryInput rather than caller-authored HistoricalAudit
content. The helper derives each flat HistoricalAudit from the original retained
packet, using the exact original audit ID, phase/endpoint, baseline, target and
evidence. Audit IDs are unique, differ from the new audit ID and belong to the
same run/issue. Every retained finding names one audit row; every audit row has
at least one retained finding. Multiple findings share that row. Findings keep
their original IDs and complete content. No prior packet's history, result
coverage or complete result is copied into the new wire packet.

The two input references must name that prior audit's exact packet.json and
result.json under its immutable audit directory. The loader verifies their bytes,
strict UTF-8/NUL/size/confinement checks and typed digests, then matches them to
the prior reservation and result terminal retained in the existing state
sequence. It reads the prior preparation/request/response/dispatch/witness using
the existing artifact readers. Their own packet/request/profile bindings and
response-to-payload derivation must agree; the retained prior ModelResult must
be valid, and every supplied historical finding must equal its original result
finding in full. A caller cannot provide an unrelated valid finding or rewrite
an old quote to match the corrected candidate.

Historical replay checks the old request's exact packet wrapper, fixed wire
shape/settings and two roles, with its retained system text and own profile
binding. It does not compare old executed file hashes or system bytes with the
new profile, and does not confer current qualification on an old invocation.
The original result's observed identity and strict sanitized content remain
validated. Current dispatch independently requires its current qualified profile.
No prior provider call is repeated or backfilled.

Validate a historical finding's requirement IDs and anchors against its original
baseline and evidence, never the new candidate. Verify all original referenced
source snapshots and artifact snapshots by strict role-aware reads and exact
hashes; preserve typed Git/worktree origins against the original target. Do not
re-read a prior worktree origin as though its historical bytes must still be the
current file. Old immutable Git metadata may be inspected for binding, but a
corrected current worktree is expected to differ. This is retained evidence of
the original observation, not current artifact freshness.

The loader visits only the explicitly selected prior audits. Original packets
receive bounded structural/content validation, including any flat history
contexts already embedded, without recursively loading their earlier audit
references. The selected prior result is checked against its own original
packet. Nested history is neither projected into the new packet nor recursively
expanded into an archive. All existing record/source/request bounds apply; an
oversized history refuses with the existing limit reason, never truncation.

At preparation, pre-dispatch, result and endpoint use, reconstruct the flat
projection from the retained originals and compare it with the embedded audit
row. A changed original reference, finding, context or source snapshot refuses
use. Current evidence and history remain separate namespaces: current coverage
and current findings resolve only Packet.evidence and the current baseline.
Even identical evidence IDs in a historical context cannot satisfy current
coverage. Historical artifact bytes must never be relabeled as a current check
claim merely to preserve an old quote. Driver dispositions stay separate and
retain strict supporting references; a contested correction keeps the same
original finding plus its disposition and evidence.

Required regressions use a retained mocked prior CORRECT-COURSE response/result
with an actual subtraction quote, then a corrected sum commit with the same
unchanged finding and an evidenced fixed or contested disposition. Preparation
and the mocked next call must succeed with source-grounded current coverage.
Tampered prior packet/result references, bindings, finding text/quotes or retained
snapshots must fail. Historical-only anchors cannot satisfy current coverage;
repeated/contested history remains immutable across another corrected candidate.
These tests make no actual model-call or semantic-reliability claim.

Packet digest is the canonical Packet hash, with no self-digest field. The wire
wrapper is `{packetDigest,packet}`. Baseline and policy digests reuse #109's
canonical content digest. Target digest covers canonical Target, including live
candidate observations. Source hashes cover exact bytes, independently of the
quote normalization used for model evidence.

## Observed result, transport evidence and strict witness

The model does not author observed identity. The manual caller assembles:

```text
Observation = {
  version: 1, packetDigest: Digest, requestDigest: Digest,
  profileDigest: Digest, startedAt: UTC timestamp, endedAt: UTC timestamp,
  elapsedMs: nonnegative integer,
  requestedModel: Text, observedModel: Text | null,
  identitySource: "provider-response.model", identityLimit: Text,
  httpStatus: integer | null, finishReason: Text | null,
  toolCallsPresent: boolean | null, exitCode: integer | null,
  classification: "completed" | "invalid" | "unavailable" | "timeout"
                | "interrupted",
  reason: Text, usage: {input: integer | null, output: integer | null,
                       cacheRead: integer | null},
  response: EvidenceRef | null, wireResponseDigest: Digest | null
}
ResultArtifact = {
  version: 1, packetDigest: Digest, observation: Observation,
  payload: ModelResult | null
}
```

`response.json` is the bounded sanitized provider envelope observation, retaining
its top-level model, selected choice finish/content and tool-call presence, raw
response-byte digest, size, redaction status and extraction status
(`model-result` or `invalid`). This is a direction transport artifact, not a
review receipt. Arbitrary provider keys/text receive secret redaction; approved
binding digest fields in the extracted ModelResult retain their typed values.
The observation's model/finish/tool flags must agree with the retained response
when present. A model's prose or configured name cannot fill an absent envelope
observation. Missing/invalid usage remains null; cached input is a subset, never
additional input billing.

### Response-to-payload derivation (D111-1)

One shared deterministic extraction/sanitization function owns the relationship
between the selected response message content and ResultArtifact.payload. It
parses the selected content as JSON, rejects an invalid ModelResult structure or
binding, preserves only the exact typed binding digest positions, and applies
shared secret redaction to its schema-defined free-text fields. Unknown fields
receive no digest exemption. Revalidate the sanitized ModelResult, including
strict source/anchor checks, before it is eligible for use.

For successful extraction, persist the sanitized envelope's selected
`choices[0].message.content` as the canonical JSON serialization of that sanitized
ModelResult, and set response extraction status to model-result. Persist exactly
that same value as ResultArtifact.payload. The original response-byte digest
continues to describe the unsanitized wire bytes; it is not the digest of this
normalized sanitized content. If raw extraction or validation fails, retain a
sanitized diagnostic response with extraction status invalid and payload null.
Sanitizing diagnostic text must never promote failed extraction to a valid result.

At result validation, endpoint use and qualification acceptance, reload the
retained response and its exact artifact binding. Require successful extraction
status, then independently rerun the same deterministic extraction on its stored
content; sanitization of already sanitized fields must be idempotent and preserve
typed digests. Compare the entire canonical extracted ModelResult with the
entire canonical ResultArtifact.payload. Matching envelope metadata and packet/
target/endpoint digests alone are insufficient. Any outcome, findings, coverage,
next-action or other payload difference is invalid evidence. Malformed content,
failed extraction, missing response or a null extracted result cannot support a
separately supplied valid payload. This comparison happens before semantic outcome
or directionSatisfied is consumed.

A fully consistent fabricated response and payload still cannot be distinguished
from a real call by artifact checks alone; that remains the stated level 3
truthfulness boundary. A disagreement within the retained artifact set is
mechanically detectable and must be rejected when these checks run.

Transport failure may have no response or payload. A malformed semantic payload
is not a valid ModelResult even if observation is completed. The checker keeps
transport validity, protocol validity, semantic outcome and direction eligibility
as separate fields; invalid/unavailable cannot become a semantic approval.

Every observed attempt also publishes `terminal-witness.txt`: strict plain text
containing only the fixed schema label, audit ID, observed transport
classification, dispatch state, numeric exit/elapsed values or the literal
`unknown`, and a whitelisted reason code. It contains no digests, source excerpts,
credentials, provider request IDs or arbitrary exception text. Its exact bytes
are hashed in the state Terminal.evidence reference. The structured artifact
belongs exclusively at Terminal.result, the already opaque role. This avoids
weakening #109's strict source scanner to accommodate typed hash JSON.

The result checker reads references according to their actual role; a result's
nested reference name cannot create an exemption. It verifies typed observation
and payload bindings, the response-to-payload derivation above, source content
and secret handling before use. When
sanitization changes bytes, raw/sanitized/result hashes remain distinct. Never
silently sanitize authoritative packet input under an unchanged digest.

## Target capture and freshness

Reuse `parseTarget`, `validateTarget`, `collectDiff` and
`describeReviewTarget`. The latter already handles branch/commit/design and the
tracked binary diff plus sorted untracked file hashes for an uncommitted target.
No parallel target schema changes are made in review context or receipt code.

Resolve branch base and commit IDs before packet publication. Target.currentHead
always records actual HEAD. Target.working is the existing uncommitted descriptor
when the worktree is dirty, otherwise null. Branch and commit selections require
a clean actual worktree, including staged, unstaged and untracked changes, and
the selected descriptor revision must equal actual HEAD. Enforce this at
preparation, preflight, result validation and endpoint use. A historical commit
or a dirty branch/commit selection is refused; the helper must not hash dirty
bytes into Target while delivering only old committed blob content.

An authorized dirty local candidate explicitly selects uncommitted and binds all
its working bytes. Refusal explains that selector choice without silently
changing the target or requiring a commit. A later dirty transition makes an
already prepared branch/commit candidate stale. Design targets bind actual file
content and current worktree observation. The driver supplies the authorized
selection; the helper never silently changes mode.

Preparation evidence input is this exact discriminated union:

```text
{ id: Id, kind: "source", reference: EvidenceRef }
{ id: Id, kind: "artifact", path: Text }
{ id: Id, kind: "check", reference: EvidenceRef,
  targetDigest: Digest, command: Text, exitCode: integer | null }
```

Source input must equal the matching baseline Source reference. Check input loads
the supplied run-local log, checks its exact hash and a claimed targetDigest equal
to the observed Target, and labels its origin check-claim. It never runs the
claimed command or certifies that the log was generated by that command. Actual
command provenance remains the driver's retained execution evidence.

Artifact input supplies only a normalized repository-relative path; reject
absolute/traversal/excluded paths and do not accept an arbitrary run snapshot as
proof of target content. For branch/commit selectors, resolve that path at the
selected descriptor revision using Git object metadata, require a regular blob
mode, and read those exact blob bytes. Populate target-blob with actual revision,
blob object ID, path and mode. For uncommitted/design selectors, read the actual
confined worktree path and populate target-worktree with its exact byte digest;
for design, include the selected design path among artifact inputs. Other
supporting files require explicit paths and receive the same origin checks.

Use existing Git helpers for object metadata and their bounded process wrapper
with a Buffer-output spawn adapter for blob content, followed by strict UTF-8/NUL
validation. The default `runGit` decodes UTF-8 strings and is not itself proof of
strict blob decoding; no lossy decoded bytes enter a packet. Refuse oversized or
failed blob reads, nonregular modes and missing paths. No shared Git implementation
or review descriptor schema changes are needed.

The helper immutably publishes each captured artifact to
`issues/<issue>/audits/<auditId>/evidence/<evidenceId>.txt`, computes its reference,
and embeds those exact bytes in Packet. Source/check snapshots keep their supplied
verified run-local references. Origin and reference are distinct: the first says
which target bytes were captured, the second locates their retained copy.

Re-observe every target-worktree origin and target-blob object binding after
capture, before dispatch, after response and before endpoint use, comparing to
both origin metadata and retained snapshot digest. This includes explicitly
selected ignored-but-not-excluded files whose changes may not appear in the usual
Git dirty descriptor. Missing/mismatched origins make evidence stale/unavailable;
a supplied snapshot alone cannot establish actual-target agreement.

Capture source/diff evidence from the selected target and observe Target both
before and after capture. For tracked content selected from an immutable commit,
read that Git object's bytes; do not accidentally read a newer working copy.
For dirty/design content use confined actual file reads. Included files and diff
references must identify their source target. Missing/unreadable/excluded/binary
required content or overflow refuses preparation; no truncated packet is sent.

At preflight, result validation and endpoint use, reload active state and compare
baselineDigest, policyDigest, targetDigest and selected endpoint. Verify the
matching attempt's exact reservation binding and packet reference. A stale
baseline/policy/target makes the returned evidence unusable, even if an LLM said
COMPLETE. A terminal may still be recorded against an old reservation as history.

Do not permanently compare preparation head to current head. Own reservation and
terminal publication advance the sequence; unrelated valid attempt records can
also advance it without changing authority. Use exact expectedHead only for
append CAS, and compare active digests plus the matching reservation afterward.
`canReserve` controls a new reservation, not dispatch of the just-published last
slot or use of its result; post-reservation remaining zero does not invalidate
that charged reservation.
`already_recorded` and `publication_unknown` never grant a fresh dispatch. Missing
terminal cannot prove that an old reservation was unused.

For S111-2, pre-dispatch additionally requires current accounting knowledge to
remain known, including after a charged reservation. Reconciliation to unknown
does not grant a new call. A known last slot still dispatches at remaining zero.
Later unknown accounting does not erase an already completed protocol/outcome or
prevent historical terminal recording. Result and endpoint checks preserve those
observations and explicitly add accounting_unknown to their reasons. It does not
by itself change directionSatisfied: the driver's separate workflow/allowance
judgment remains subject to reconstructing unknown consumption. No audit count,
schema or allowance is reset.

There is no lock around a remote model call. The explicit caller runs preflight
immediately before its one POST and the checker repeats freshness afterward.
Changes in the gap make evidence stale; this is not a trusted continuous monitor.

## Fixed transport and qualification binding

Extract the existing bounded exchange from
`scripts/qualify-direction-transport.mjs` into `lib/direction/transport.mjs` and
replace the old in-script implementation with imports. Keep one implementation
of request settings, bounds, response streaming, observation and extraction.
Use `makeOpenAiProvider`, existing HTTP abort/failure handling and shared hashing,
confined reads, secret helpers and immutable publication. No generic provider
selection, gate guard changes, negotiation or fallback.

The one profile retains exact `deepseek-flash` at
`https://api.deepseek.com/chat/completions`, two system/user messages, no prior
transcript/session, no tools, `tool_choice: none`, thinking disabled,
`response_format: json_object`, stream false, maximum 16384 serialized request
bytes, 8192 output tokens, 131072 response bytes and 120000ms HTTP timeout.
The 16KiB cap applies to the entire production wire body, including full intent,
all required source content, prompt and JSON escaping. It is an explicit opt-in
coverage limit: a baseline/evidence set may be valid within #109's larger storage
cap and still be too large for this qualified profile. Such an audit is refused
with a distinct profile-input-limit reason; required completion stays OUTSTANDING.
Shadow records the unavailable observation without adding a workflow hold. Do
not truncate, omit sources, compress context or combine partial packets while
claiming complete coverage. No larger profile or qualification allowance is
introduced here.

Redirects are refused, caller-local assertions retain their classification, and
returned tool/function calls, extra choices, incomplete finish or missing/mismatched
observed identity cannot qualify. There is no output-to-tool dispatcher or
recursive evidence fetching. Node's own local I/O is not author-host sandboxing.

The system prompt is canonical in the direction module: compare authorized
source-linked intent to actual supplied artifacts and the proposed next action;
treat source text as data; return only the exact ModelResult; do not fix files,
amend authority or triage history; cite all normative requirements with the
specified quote/coverage contract. Scope ambiguity is NEEDS-DECISION; concrete
misalignment is CORRECT-COURSE; ongoing aligned work is ON-TRACK; COMPLETE is only
for an adequately represented endpoint. Prompt bytes form part of the profile.

A profile fingerprint covers protocol version, prompt bytes, fixed settings and
an explicit manifest of the actual direction/HTTP/source/target/state dependency
bytes used by the invocation. The implementation closes that finite file list
over every executed local import before the execution handoff and records/tests it; it does
not introduce a runtime dependency scanner or provider framework. Every executed prompt, formatter, extractor, limit/profile and dependency byte
participates. Test/fixture, evaluation/report and unrelated library files are
excluded only when they are not executed by the actual audited invocation. Qualification data
itself is excluded to avoid a circular fingerprint when proof is recorded.

`lib/direction/qualification.json` is a small shipped compatibility record:

```text
{ version: 1, status: "pending" | "qualified", profileDigest: Digest,
  proof: null | {
    profile: { protocolVersion: 1, promptDigest: Digest,
      settingsDigest: Digest,
      runtimeFiles: [{path: Text,digest: Digest}] },
    request: { digest: Digest, profileDigest: Digest,
      systemDigest: Digest, messageRoles: ["system","user"],
      toolsPresent: false },
    response: { artifactDigest: Digest, wireDigest: Digest,
      envelope: {model: Text, finishReason: Text, toolCallsPresent: false} },
    result: { digest: Digest, packetDigest: Digest, phase: "endpoint",
      outcome: "COMPLETE", coverageEvidenceDigest: Digest },
    review: { reportPath: Text, reportDigest: Digest,
      executionRevision: GitId, evidenceSetDigest: Digest }
  } }
```

The driver constructs proof from the retained actual request, envelope and
validated result, not the model's self-description. Qualification acceptance
recomputes every artifact digest, actual wire roles/tools/settings/system bytes,
source-grounded endpoint result and observed envelope fields against those
artifacts before publishing the record. It also independently extracts the
retained response content and requires canonical equality with the stored payload
under the response-to-payload rule; a substituted COMPLETE payload cannot qualify
a retained CORRECT-COURSE response. Missing or internally inconsistent
artifacts fail the invoked artifact checks. Whether a call actually occurred,
and whether the retained evidence is truthful rather than mocked or fabricated,
is the driver's level 3 actual-invocation judgment. An artifact validator cannot
distinguish a complete fabricated proof from genuine API evidence solely by its
shape and hashes. A model self-description or report flag alone is insufficient
for that driver judgment; no stronger authenticity mechanism is claimed.

The published report binds the execution revision and reviewed evidence-set
inventory; full evidence remains retained by the driver. The report hashes the
actual request/response/result/profile artifacts, never its own bytes or the
qualification record. Root finalizes report bytes first, then records their
reportDigest in qualification.json. The report does not hash that record, so
there is no report/record self-hash cycle. The record is not a new direction
attempt ledger.

Runtime compatibility validation rejects pending/null/incomplete proof, duplicate
or missing runtime paths, unsupported fields, mismatched recomputed current file/
prompt/settings/profile hashes, wrong request roles/tool surface, mismatched
request profile/system bindings, absent/wrong envelope model or finish, tool
calls, and any non-endpoint/non-COMPLETE recorded result. It checks actual envelope
observation fields rather than a second caller-authored observed-model claim.
The driver verifies the report/evidence source when adopting qualification; the
runtime does not fetch private logs or treat an arbitrary boolean as proof that
a live call occurred. Evidence-set provenance and a truthful driver qualification
decision remain level 3, just as the actual reviewed provider response is not a
cryptographic attestation.

The record is compact public compatibility metadata, not the fixture, oracle,
scorer, raw packet or a duplicate of source evidence. Those remain excluded from
behavior-author support. A matching record gives artifact compatibility only
under its retained driver-reviewed qualification source; missing source evidence
at qualification/adoption remains OUTSTANDING. Changing fingerprinted bytes
invalidates it; report-only publication does not change that fingerprint. Root
verifies report-only carryforward by exact file comparison rather than relaxing
an executed-code binding. No third call is available after a later incompatible
profile/source change.

Production `dispatchAudit` requires the qualified compatibility record, valid
current reservation and authors whose observed provenance differs from the
DeepSeek family/requested model. Unknown or same-author identity refuses the
call; no fallback is selected. This direction auditor is independent of artifact
authors and is not an added PR gate. Existing PR-role independence stays intact.

The qualifier invokes the same low-level fixed exchange without requiring a
pre-existing final qualification stamp. It then runs the actual packet/result
checks. Before stamp publication the only intentionally unmet production
condition is that qualification claim; root records proof after inspecting the
call, then reruns network-free endpoint checking on the unchanged artifacts.
No product CLI flag bypasses qualification for normal dispatch.

## APIs, CLI and generated artifacts

`lib/direction/audit.mjs` owns network-free functions:

```text
prepareAudit({cwd,runId,issueId,input}) -> PreparationResult
checkAudit({cwd,runId,issueId,auditId,stage,endpointId?}) -> AuditCheck
terminalRequest({cwd,runId,issueId,auditId,operationId}) -> existing StateRequest
```

Stage is `pre-dispatch`, `result` or `endpoint`. AuditCheck has exact fields
`{version:1,status,reasons,mode,packetDigest,resultDigest,transportValid,
protocolValid,outcome,current,directionSatisfied,attemptId}`. Status is
`off`, `valid`, `invalid`, `unavailable` or `stale`; absent digests/outcome/attempt
are null, boolean fields are false when not established. DirectionSatisfied is
true only for the current endpoint COMPLETE condition; it never claims normal
workflow readiness. Shadow failures do not introduce a workflow hold merely
because artifact status is invalid; the driver follows the mode doctrine below.

Preparation input has exact keys
`{version:1,auditId,phase,endpoint,target,evidence,coverage,history,authors,nextAction}`.
Target is a Selector. Evidence input uses the source/artifact/check union defined
in target capture; source/check references are verified, while artifact paths are
captured by the helper from the selected target into immutable run snapshots. Restrict auditId to at most
80 characters so derived reservation operation IDs fit #109 identifiers.
Baseline/policy come only from the active state, not caller replacement fields.
The input history field is HistoryInput; Packet.history contains the helper's
derived flat HistoricalAudit projections and the unchanged supplied findings and
driver dispositions.
Preparation fills Packet and writes a canonical state reservation request with
attemptId=auditId and operationId=`<auditId>-reserve` against the observed head.
It consumes no attempt and does not initialize absent state.

The manual network-free CLI is:

```text
node "<plugin-root>/scripts/check-direction-audit.mjs" prepare --run-id <run> --issue <issue> --input <input.json>
node "<plugin-root>/scripts/check-direction-audit.mjs" check --run-id <run> --issue <issue> --audit <id> --stage pre-dispatch
node "<plugin-root>/scripts/check-direction-audit.mjs" check --run-id <run> --issue <issue> --audit <id> --stage result
node "<plugin-root>/scripts/check-direction-audit.mjs" check --run-id <run> --issue <issue> --audit <id> --stage endpoint --endpoint <endpoint-id>
node "<plugin-root>/scripts/check-direction-audit.mjs" terminal-request --run-id <run> --issue <issue> --audit <id> --operation-id <operation-id>
```

Resolve plugin root through the existing environment route. Input must be
canonical JSON within the supplied current run. Reject repeated/unknown/missing
options. Output is one canonical JSON value with distinct reasons. Valid/off
checks exit 0, all other statuses exit 1; exit 0 alone is never endpoint approval.
The terminal-request command writes only its JSON result to stdout; the driver
retains that request at a new run-local path and invokes existing direction-state
apply. Stale-head retry rebuilds the terminal request with a new operation ID and
current head, without any repeat model dispatch. It never overwrites a request.

Artifacts live in the current run at `issues/<issue>/audits/<auditId>/`, outside
the #109 numbered sequence directory. Verify parent directories, create the audit
directory exclusively, and use `publishImmutable`. An existing directory or
future output refuses reuse before dispatch; preserve the exclusive dispatch
marker for concurrency. The driver owns root execution deadlines and call records.

| Output | Producer and inputs |
| --- | --- |
| `evidence/<evidenceId>.txt` | prepare; exact captured artifact bytes from its typed target origin, never an arbitrary caller snapshot. |
| `packet.json` | prepare; active state, authorized input, stable target/evidence. |
| `request.json` | prepare; exact fixed-profile body built from Packet. Credentials are never in it. |
| `preparation.json` | prepare; canonical packet/request/profile hashes, observed preparation head, target and candidate bindings. |
| `reserve-request.json` | prepare; existing #109 request, current expectedHead and exact packet reference. |
| `dispatch.json` | explicit manual caller; exclusive start marker after preflight, before availability/request attempt. |
| `response.json` | shared exchange; bounded sanitized observation and distinct wire digest when available. |
| `result.json` | manual caller; ResultArtifact with observed identity separated from model payload, including invalid/unavailable states. |
| `terminal-witness.txt` | manual caller, or explicitly observed pre-dispatch refusal; fixed strict text witness. |
| Terminal state request | terminal-request stdout; current state head, real observation/witness and the reserved attempt; no dispatch. |

`lib/direction/transport.mjs` exports the explicit single-call
`dispatchAudit({cwd,runId,issueId,auditId,env})` plus the bounded fixed exchange used
by qualification. It performs no call on import. The driver invokes it with its
normal Node execution tool, passing credentials only in the environment. The
canonical documented invocation is:

```bash
node --input-type=module - "$PLUGIN_ROOT" "$RUN_ID" "$ISSUE_ID" "$AUDIT_ID" <<'NODE'
const { dispatchAudit } = await import(`${process.argv[2]}/lib/direction/transport.mjs`);
const result = await dispatchAudit({ cwd: process.cwd(), runId: process.argv[3],
  issueId: process.argv[4], auditId: process.argv[5], env: process.env });
process.stdout.write(JSON.stringify(result) + '\n');
process.exitCode = result.exitCode;
NODE
```

This explicit command is the caller's dispatch decision, not scheduler ownership
by the checker. It rechecks preparation/request/profile and current state/target
at the actual call boundary. A repeated marker or terminal refuses reuse. The
shared exchange never retries, selects a different model or loads `.env`.

Terminal mapping preserves #109: valid protocol response maps to kind result;
invalid payload to malformed; provider unavailable to unavailable; timeout to
timeout; other observed failure to error. Interrupted/unknown execution is
recorded only from real driver observations, never inferred from no file. Result
references are supplied only for a valid ModelResult; otherwise retain the raw
ResultArtifact as run evidence and set the state result reference null. A valid
but stale result can be recorded historically, then fails current-use checks.

## Mode and checkpoint doctrine

Off: absent/legacy state remains off even when config changes; no implicit audit,
extra call or new readiness condition. Read state before loading unnecessary
packet input. Malformed existing state is not silently converted to legacy off.

Shadow: the same bounds and honest artifact classifications apply, but absent,
stale, invalid, unavailable or exhausted audit evidence creates no direction-only
hold. Verified existing code/scope defects still follow existing review rules.
Shadow is not permission for unlimited observations.

Required: at stage transitions/resume compare active intent and next action;
audit independently before implementation and before the selected completion
endpoint. Batch simultaneous concrete drift signals and check at the next tool
boundary. Examples of signals are changed requirements/target scope, an admitted
omission, conflicting next action, or a contested correction. Elapsed time alone
is not an automatic background audit trigger.

A current endpoint COMPLETE is necessary alongside ordinary checks, review,
publication and owner authority. Initial COMPLETE, initial ON-TRACK, signal
COMPLETE, endpoint ON-TRACK, stale target or unavailable identity cannot satisfy
it. Missing proof, unavailable auditor or exhausted calls stays OUTSTANDING.

An auditor finding is initially untriaged. The driver records source, reachable
consequence and disposition through existing convergence rules before a repair.
Corrections fit authorized intent and the shared content-repair allowance.
Changed intent requires the existing sourced baseline successor. No destructive
rollback, new feature or additional model attempt is authorized by a finding.
Default four audits still cover initial + endpoint + two repaired endpoints,
without retry headroom; all reservations remain charged.

Add one direction-audit reference with direct conditional routes from the driver,
continuity and publication. Output derives audit/state fields from retained
artifacts. Keep global AGENTS small, old trigger names and standalone stage
boundaries unchanged. Direction off does not cause every satellite to load the
new detailed protocol.

## Final qualification and distinct accounting

One #110 qualification slot remains, with 298100ms cumulative allowance from the
original 300000ms after the recorded 1900ms call. That one invocation still has a
150000ms process watchdog and the profile's 120000ms HTTP bound. Preserve the
original USD0.10 planned experiment allowance and observed usage; it is not a
billing guarantee. No issue/session/fixture change grants another slot.

Use synthetic #109 state solely to demonstrate the final accounting/protocol
path. Real issue111 audit policy remains off. The final synthetic fixture contains
an authorized endpoint, baseline clauses and matching requirement snapshots,
a correct `combine(left,right)` implementation returning a sum, and a retained
deterministic check observation. A unique label appears in the cited requirement
source line but not the baseline's paraphrase. The model's required full-span
source quote must return that label, and artifact/check quotes must identify the
actual correct operation and observation. This proves concrete source delivery
and represented coverage beyond echoed wrapper hashes.

Expected result is phase endpoint, outcome COMPLETE, all normative coverage
supported, no current findings, exact packet/target/endpoint bindings and exact
observed envelope model. A retained prior finding may be represented only as
separate immutable model finding plus driver disposition with source evidence;
it is optional for this one live fixture and must not manufacture current closure.
Four deterministic semantic fixtures remain separate from this narrow success.

The existing qualifier's prepare/probe CLI is replaced in place to use this
actual final Packet, prompt, shared exchange, result extraction and checker.
Its fixture oracle remains under excluded qualification fixtures and never enters
the wire. Preparation initializes only the isolated synthetic fixture's state,
prepares its real packet and explicit reservation, and produces no provider call.
The root-controlled probe reserves/records the one synthetic attempt, invokes the
shared exchange once and retains the actual observed result and strict witness.

Root decrements the remaining #110 experiment slot exactly once, cross-referencing
the same physical invocation in the synthetic reservation/terminal evidence.
Synthetic state demonstrates product accounting; it is not a second permission
to spend. No real issue111 production-audit allowance is silently initialized or
charged, and neither counter creates retries for the other.

Use this exact root-owned execution order:

1. Finish independent design debate, tests-first implementation, deterministic
   checks and internal review. Run the ordinary ordered Fable then Flash
   structural reviews before spending the last qualification slot. C3's actual
   final-protocol invocation and required endpoint integration acceptance remain
   explicitly OUTSTANDING at this stage. A review noting that missing live proof
   records expected pending acceptance, not a completed milestone or permission
   to fabricate it.
2. Resolve admitted runtime/content defects within #111's existing shared repair
   allowance, preserving the ordered review rules. Once the structural candidate
   is clean, root freezes the complete executed-code/prompt/settings/profile
   fingerprint and the concrete remaining-call handoff.
3. Root makes the single remaining actual qualification call, inspects source
   quotes, coverage and observations, and retains its evidence. Only success
   permits a qualified compatibility record. Failure or an incompatible later
   runtime/profile change leaves required integration and paid behavior acceptance
   OUTSTANDING; no third call follows.
4. After success, change only the qualification record and report, both outside
   the executed fingerprint. Finalize the report first, then its hash in the
   record. Verify exact runtime carryforward against the executed candidate and
   run network-free endpoint checking on the unchanged observed artifacts.
5. Rerun the ordered Fable then Flash reviews on that publication revision and
   complete the final native suite under normal publication rules. Neither
   report-only carryforward nor the earlier structural reviews substitutes for
   current-revision final review. Any later runtime edit invalidates the call's
   compatibility proof rather than silently consuming another qualification slot.

This sequence reduces avoidable spending before structural defects are found;
it does not guarantee reviewers find every defect. Positive transport
qualification proves neither semantic reliability nor the unresolved #98
author-host confinement.

## File plan and export ownership

| Path | Change and purpose |
| --- | --- |
| `lib/direction/audit.mjs` and `.test.mjs` | Add typed packet/result/content/target checks, preparation, terminal request assembly and endpoint eligibility; network-free. |
| `lib/direction/transport.mjs` and `.test.mjs` | Extract one fixed bounded exchange and explicit manual caller from the qualifier; no scheduling or provider registry. |
| `lib/direction/qualification.json` | Add pending/qualified compatibility record; root fills actual proof after the final call. |
| `scripts/check-direction-audit.mjs` and `.test.mjs` | Add strict manual artifact CLI. |
| `scripts/qualify-direction-transport.mjs` and `.test.mjs` | Replace prototype-only formatting/extraction with final shared protocol and synthetic state demonstration; retain prior evidence. |
| `scripts/fixtures/direction-transport/` | Update the tiny final qualification packet/state/source/check/oracle fixture; no consuming-project data. |
| `skills/afk/references/direction-audit.md` | Add canonical mode/checkpoint/dispatch/terminal instructions. |
| `skills/afk/SKILL.md`, references `continuity.md`, `publication.md`, `output.md`, `direction-state.md` | Add narrow conditional routes and clarify the fulfilled opaque-content consumer; no duplicate doctrine/state. |
| `templates/afk-config.example.md` | Explain existing mode behavior only; preserve off/four defaults and existing resolver. |
| Direction semantic fixture file under `scripts/fixtures/` | Add four small source/artifact/history cases for #112 to consume, with no semantic success claim. |
| `docs/evaluations/issue-111-direction-audits.md` | Root-owned actual qualification/limitations report and final profile proof; initially NOT RUN. |
| Canonical marketplace and generated mirrors | Recheck final baseline, increment shipped version and run sync; no hand-edited generated versions. |
| This design | Initial draft, later driver-controlled freeze. |

The existing support exporter automatically includes `lib/**` and `skills/**`,
including the runtime compatibility record. It excludes new script entry points
unless specifically allowlisted. #111 declares exactly two production script
dependencies for evaluated routes: `scripts/check-direction-audit.mjs` and
`scripts/direction-state.mjs`. #112 owns the narrow supportVisible allowlist update
and evaluation coverage before it invokes those routes. #111 does not modify the
evaluator merely to prepare this integration. Qualifier, fixtures, oracle,
semantic scorer and evaluation reports stay excluded. No blanket script export.

Existing state and review schema files are read/imported, not modified. Parent
P2/minor cleanups, including the UTF-8 prefix availability limitation, are not
part of this issue.

## Test plan and execution checks

The driver accepted two causal implementation refinements after design debate.
Expose the existing state directory-validation primitive unchanged and reuse it
from the audit module, with audit-only recursive parent creation kept local.
Close the production fingerprint over production entry points and their local
imports; bind the qualifier wrapper/setup and captured fixture/oracle bytes
separately as experiment preparation evidence. Those harness files do not supply
another prompt, formatter or extractor and are not production export dependencies.
These refinements change neither state schemas/accounting nor the frozen profile.

Tests precede implementation and use injected HTTP responses, temporary Git/run
fixtures and synthetic credentials only. No unfiltered full-suite invocation by
the executor: the driver owns the two existing live Claude tests.

| Area | Required deterministic coverage |
| --- | --- |
| Typed protocol | Strict schemas/enums/versions/IDs, exact normative row set, anchors/quotes, stable finding history, separate driver dispositions, acyclic binding hashes. |
| Opaque boundary | Typed hash fields pass; free text/source secrets fail before dispatch/use; arbitrary digest-looking JSON keys do not bypass; shared source/result reference retains its stronger role; strict terminal witness accepted by unchanged #109. |
| Source/target | Excluded/outside/symlink/nonregular/binary/invalid UTF-8/overflow reads; stable source capture, tracked Git versus working bytes, artifact path/object/mode origins, false supplied snapshot claims, revalidation of explicit ignored worktree evidence, branch/commit clean-worktree and actual-HEAD equality at every boundary, refusal of historical commits and dirty selections without silent selector changes, uncommitted dirty targets, initial design and current endpoint selection. Driver check-log provenance remains a claim. |
| State lifecycle | Own reservation/terminal and harmless unrelated head advances accepted; baseline/policy amendment or real target change stale; replay/publication-unknown/pending reservation cannot dispatch twice; exhausted/unknown history no new call; terminal recording does not refund. |
| Identity/transport | Exact final body/profile, no history/tools/fallback, requested versus observed identity, author independence, missing/false identity, empty/tool-call/length/extra-choice/malformed results, stream/fetch abort, byte caps, unknown usage and redaction without digest corruption. |
| Response-to-payload derivation (D111-1) | At result, endpoint and qualification acceptance, reject a valid CORRECT-COURSE response paired with separately valid COMPLETE payload sharing all bindings; independently mutate findings and coverage with unchanged metadata and require rejection. Malformed/failed response extraction plus a valid substituted payload must fail. Matching payload after defined free-text sanitization and preserved typed digests must pass; repeated sanitization is idempotent. No state/review schema changes. |
| Completion/modes | Initial/signal/endpoint crossed with all four outcomes; only current endpoint COMPLETE eligible; incomplete coverage/finding/gap/uncertain row refuses endpoint; off preserves behavior, shadow does not add direction holds, required unavailable remains outstanding. |
| Publication | Existing output refusal before call, exclusive dispatch, concurrent attempts, immutable bytes, strict witness and state result mapping for every transport outcome, post-call stale result retained historically. |
| Qualification | Candidate uses actual final formatter/extractor/profile; pending stamp cannot satisfy normal dispatch; root-recorded matching proof permits net-free endpoint recheck, changed profile invalidates; prototype stamp cannot pass final protocol. Prove the report/record hash graph is acyclic; do not claim fabricated complete proofs are mechanically distinguishable from real calls. |
| Routes/exports | Conditional direct routes resolve, standalone endpoints retained, state CLI remains the accounting owner; report the two #112 script export obligations, oracle/scorers excluded. |
| Semantic fixtures | Omitted requirement despite green tests; justified supporting-file change; reviewer preference expanding scope; contested correction. Check fixture representation only, not model detection. |

After the new targeted RED tests, run the deterministic partial suite:

```bash
node --test lib/direction/audit.test.mjs lib/direction/transport.test.mjs scripts/check-direction-audit.test.mjs scripts/qualify-direction-transport.test.mjs lib/direction/schema.test.mjs lib/direction/state.test.mjs scripts/direction-state.test.mjs lib/gate/file-boundary.test.mjs
node scripts/sync-marketplace.mjs
node scripts/sync-marketplace.mjs --check
node scripts/lint-skills.mjs
node scripts/check-links.mjs
node scripts/scan-provenance.mjs
npx --yes markdownlint-cli2@0.23.0
git diff --check
```

The first command is explicitly partial. The sync generator reads the canonical
marketplace and writes normal host/package mirrors. Run the version checker
against the final committed branch/base; before commit it can report a benign
no-change skip that is not dirty-tree coverage. Inspect untracked provenance
separately and validate any new link fragments because the link checker ignores
fragments. The final unmodified full suite and remote checks remain driver-owned.

Before the live call, root records fixture preparation/reservation, actual command,
watchdog and remaining budget. Preserve complete stdout/stderr, request/source/
response/result/witness and state evidence before summarizing. No hidden provider
backfill, retry or invented positive qualification. Publish only synthetic and
sanitized evidence with distinct structural/live/semantic-accuracy rows.

## Risks, non-goals and handoff

| Risk | Mitigation and remaining limitation |
| --- | --- |
| Final field/prompt complexity fails the one remaining call | Freeze smallest representative endpoint fixture within the demonstrated caps; deterministic checks first; honest outstanding result on failure. |
| Typed metadata mistaken for source secrets | Reuse exact schema positions and recomputed digests, strict free-text/source inspection and unchanged parent role boundary. |
| Endpoint judgment credited with normal workflow authority | Return directionSatisfied only; retain tests/reviews/CI/owner gates in publication doctrine. |
| Mutable target between tools or changing provider alias | Pre/post/current-use checks and timestamped alias observations; no continuous lock or weight-attestation claim. |
| Qualification data mistaken for model-semantic proof | Source-grounded narrow fixture plus explicit unresolved semantic evaluation and author-host confinement. |
| Parent state unavailable at UTF-8 prefix boundary | Preserve upstream unavailable reason; no fail-open or parent-code repair. |

No always-on supervisor, extra mandatory PR role, arbitrary provider framework,
state/receipt/review-context schema rewrite, automatic migration/activation,
unbounded retry, destructive rollback, branch-protection integration or semantic
guarantee is included.

Before freeze, the driver confirms #109 terminal review and the actual dependency
revision, inspects the exact protocol/profile/witness/qualification proposal and
runs the independent same-model design debate. Implementation starts only after
that handoff. The runtime dependency fingerprint file inventory is completed from
actual implementation imports before the live execution freeze, not assumed from
this draft. Final live schema/profile compatibility and source-grounded COMPLETE
are explicitly unverified; successful qualification is a prerequisite for
required-mode integration acceptance, not a claim made by this design.
