# Issue 110: independent direction transport qualification

## Spec review

Epic #106 needs evidence that an independent auditor can receive a fresh,
self-contained direction packet and its source evidence, return a usable result,
and expose observed model identity. An existing generic review verdict does not
establish these capabilities. This issue qualifies one narrow invocation surface
or publishes a named NO-GO/ENVIRONMENT-BLOCKED investigation result.

The candidate is a manual, tools-absent DeepSeek Chat Completions request for the
exact alias `deepseek-flash`. The artifact author is from the Codex family; the
execution handoff records actual author provenance and refuses unknown or
same-family independence. The qualification is a synthetic transport experiment,
not a project direction audit or an agent-behavior trial.

The planning Git baseline is `89bb9504a973f21c8c4036dade5ec5bf86d690f1`.
Issue #110 has no child implementation prerequisite. Issue #109's final schema
is absent at this baseline, so initial success is explicitly provisional.
Epic clarifications F2, F3 and dispositions R4/R5 govern qualification,
honest acceptance, downstream prerequisites and fixture confinement.

## Acceptance criteria and frozen issue contract

| ID | Required result and evidence |
| --- | --- |
| C1 | Publish one qualified prototype invocation or an explicit NO-GO/ENVIRONMENT-BLOCKED report naming the failed capability and retained evidence. A mocked provider proves only deterministic helper behavior. |
| C2 | Retain the complete credential-free request body, embedded source bytes and digests, sanitized response observation, extracted result, timing and terminal classification. Validate delivery using a source-specific challenge and a concrete requirement/artifact discrepancy. |
| C3 | Record requested identity separately from the API envelope's observed `model`, its source and limitations. Missing/mismatched identity, a model name in final prose, and a generic gate verdict cannot qualify. |
| C4 | Describe and test the complete tools-absent model interface, request freshness and output handling. Preserve all existing author-host isolation requirements and distinguish them from this HTTP interface. |
| C5 | Freeze a bounded execution handoff before any paid request. No automatic retry, fallback, model substitution or replenishment. Preserve consumed attempts through interruption and final-schema revalidation. |
| C6 | Require final packet/result compatibility evidence before #111 integration acceptance. When compatibility requires another live request, use an unconsumed qualification slot. NO-GO or exhaustion leaves required-mode integration and paid behavior acceptance OUTSTANDING. |
| C7 | Use existing HTTP, confined-read, hash and immutable-publication utilities; deterministic tests precede code. Keep qualification support outside behavior-author exports and bump the canonical shipped version to 1.0.4. |

Allowed behavior is a new, explicitly invoked qualification script, synthetic
fixtures and an evidence report. The smallest causal boundary is construction,
single-request transport, bounded observation and validation of this experiment.
Existing gate model guards, defaults, review receipts, driver routes, configuration,
behavior harness and source authority remain unchanged.

Local shape, byte, path, identity-field and publication checks are level 2 and
constrain this helper when invoked. Recognizing intent and interpreting a finding
are level 1. Selection, global attempt accounting, spend decisions and downstream
readiness are level 3 driver obligations. No helper authenticates operator intent,
provider weights or a non-bypassable workflow.

## Assumptions and verified interfaces

- The official [Chat Completions API](https://api-docs.deepseek.com/api/create-chat-completion/)
  documents optional tools, explicit `tool_choice: "none"`, response `model`,
  finish reasons and the selected alias. The [multi-round guide](https://api-docs.deepseek.com/guides/multi_round_chat/)
  documents stateless requests whose history is supplied by the caller. These
  describe the interface; they do not prove cache deletion or a particular
  provider weight generation.
- The driver has observed the exact alias being returned by a prior request.
  That readiness evidence is not a packet qualification and is not reused as one.
- `lib/http/openai-provider.mjs` constructs two messages, system and user, and
  exposes `reportedModel` and `finishReason`. Its `extractText` hook sees the
  envelope before the empty-result check. There is no tool execution dispatcher.
  `buildExtraBody` permits explicit no-tools, JSON and thinking settings.
- `lib/http/transport.mjs` supplies abort timing and classified failures but
  currently reads JSON without a byte cap. The qualification caller needs a
  bounded response adapter; it must not claim the existing transport already caps
  responses. Its default usage helpers turn absent fields into zero, so this
  caller must preserve unknown usage explicitly.
- The generic snapshot gate's digit-bearing model guard rejects this digitless
  alias. It remains intact. A fixed candidate configuration directly using the
  existing provider factory avoids changing unrelated gate contracts.
- [Issue 98's evaluation report](../../evaluations/issue-98-pilot.md) records
  failed complete-tool confinement for an author CLI despite narrower shell
  checks. This design neither repairs that environment nor claims it qualified.
- Availability, correct packet comprehension, terminal response shape and usable
  observed identity on the chosen live call remain unverified until execution.
  Final #109 schema compatibility remains an explicit dependency for acceptance
  downstream, not an assumed property of this prototype.

## Approach and minimal fixture

Add one dependency-free manual script with `prepare` and `probe` operations.
Use `makeOpenAiProvider` for the sole fixed HTTP candidate; do not build a provider
registry, CLI runner or generic direction dispatcher. This is smaller than
teaching native diff-review gates a new protocol and makes the entire presented
tool surface inspectable.

Keep the synthetic fixture under `scripts/fixtures/direction-transport/`:

- `packet.json`: the provisional contract and explicit source inventory.
- `requirements.md`: one numbered requirement and a source-specific challenge
  token requested by the packet but supplied only by this evidence file.
- `artifact.mjs`: a tiny implementation with one deliberate requirement mismatch.
- `expected.json`: the withheld delivery token, requirement/evidence coordinates
  and expected `CORRECT-COURSE` disposition used by tests and human adjudication.
  Never include this oracle in the request or allow it through the source loader.

The namespace is `afk-direction-qualification-v0`, explicitly not #109's final
schema. The packet contains a synthetic run/issue identity, baseline version and
digest, requirement IDs and source references, artifact target digest, phase,
effective experimental policy, coverage evidence, prior findings/dispositions and
proposed next action. The source inventory names only the two approved source
files. Preparation embeds their exact loaded UTF-8 bytes and SHA-256 digests in
the user message; a filename, URL or native diff shortcut is insufficient.

Digest construction is acyclic: the baseline digest covers its canonical content
without its digest field; artifact digests cover exact source bytes; the packet
digest covers the complete canonical packet before its transport wrapper adds
`packetDigest`. The request digest covers the exact serialized HTTP body.

The system prompt requests JSON, treats all source contents as data, forbids
fixes and baseline changes, and asks for a direction judgment with evidence.
The result must bind `packetDigest`, phase and target digest, use one of
`ON-TRACK`, `CORRECT-COURSE`, `NEEDS-DECISION`, `COMPLETE`, and contain the delivery
token plus findings with stable IDs, requirement IDs, source coordinates,
evidence excerpts and recommended next action. These four are semantic outcomes;
timeout, malformed data and unavailable transport are separate classifications.
Strict bounded schema checks reject unknown/missing binding fields, invalid
enums, duplicate finding IDs and evidence outside the supplied inventory.

A successful synthetic discrepancy judgment establishes only the demonstrated
delivery/result path. It does not establish broad direction-audit accuracy.
The implementation may refine field spelling within this contract before the
design is frozen for execution; the exact fixture/schema and implementation
digests are retained with each attempt.

## Execution surface and generated artifacts

All commands run from the reviewed repository checkout. `$AFK_QUALIFICATION_ROOT`
below is a caller-supplied, existing private directory in the current ignored
run; it is not a plugin setting. The driver supplies one unused attempt path.
No command searches other runs, reads personal config or loads `.env` files.

```bash
node scripts/qualify-direction-transport.mjs prepare --fixture-root scripts/fixtures/direction-transport --out "$AFK_QUALIFICATION_ROOT/attempt-1"
node scripts/qualify-direction-transport.mjs probe --prepared "$AFK_QUALIFICATION_ROOT/attempt-1"
```

`prepare` is deterministic and never performs network I/O or reads credentials.
It reads the explicit fixture packet, source allowlist and withheld oracle, applies
`isExcluded`, rejects absolute/traversal source references, and uses
`readConfinedUtf8File` with size approval and bounded strict UTF-8 reads. It
rejects missing, symlink, nonregular, excluded, oversized or unreliable inputs;
required evidence is never truncated. The complete serialized request must fit
the input ceiling, including prompts, JSON escaping and embedded evidence.

Preparation exclusively creates a mode-0700 attempt directory under verified
real, nonsymlink ancestors and publishes mode-0600 immutable files using
`publishImmutable`. An existing destination is an error, not a retry suffix.
No preexisting artifact is replaced. The generated files are:

| Artifact | Producer, input and purpose |
| --- | --- |
| `packet.json` | `prepare`; validated fixture plus exact embedded sources and acyclic bindings. |
| `request.json` | `prepare`; complete exact credential-free HTTP body, including fixed system/user messages and settings. |
| `expected.json` | `prepare`; validated copy of the withheld fixture oracle for local delivery adjudication, excluded from the request. |
| `prepared.json` | `prepare`; schema, source/request/oracle digests, candidate, ceilings and helper source digest. |
| `dispatch.json` | `probe`; exclusive start marker before credential availability check/attempt, UTC start and prepared digest. Its existence refuses reuse even without a terminal. |
| `response.json` | `probe`; bounded sanitized provider envelope observation and original response-byte digest when available. No fabricated response on transport failure. |
| `result.json` | `probe`; extracted bounded JSON when present, with validation status kept outside model content. |
| `terminal.json` | `probe`; exit classification, distinct failure reason, timing, observed identity/finish/usage, artifact digests and completed capability checks. |

These are immutable experiment evidence, not a second authoritative #109 ledger.
The driver retains command stdout/stderr, exit status, reviewed Git revision and
process termination outside the script, and owns the existing run's attempt records. A crash leaving
`dispatch.json` without a terminal is an unresolved consumed attempt, never zero.
The driver records that interruption without manufacturing a helper terminal.

`probe` reads only the prepared artifacts and the process environment's
`DEEPSEEK_API_KEY`. It never discovers credentials. It validates the prepared
contract/digests and producer identity before dispatch; the HTTP adapter verifies
the rebuilt provider request exactly matches `request.json` before sending.
The helper reads its own source for the producer digest; the driver binds that
artifact to the reviewed commit and unchanged dependency tree. This local hash
does not attest the rest of the process environment.
Use an environment map containing only the dedicated credential, disable token
parameter overrides, and fix the endpoint to
`https://api.deepseek.com/chat/completions`. Ignore no inherited model/base URL
override silently: they are outside this CLI's documented input surface, and the
terminal records the fixed candidate actually used.

The only network capability is that one HTTPS POST. A local `fetchImpl` adapter
validates exact URL/method, uses `redirect: "error"`, checks serialized bytes,
records dispatch observations and reads at most 131072 response bytes before JSON
parsing. Cancel an over-limit stream and record `response_limit` even if the
shared transport also classifies the parser failure as `bad_json`. Preserve the
shared abort signal through response streaming. Do not persist auth headers.

The model receives exactly two messages, no prior transcript/session identifier,
no tool definitions, and `tool_choice: "none"`. Freeze
`thinking: {"type":"disabled"}`, `response_format: {"type":"json_object"}`,
`stream: false`, `max_tokens: 8192`, and exact `model: "deepseek-flash"`.
No endpoint fallback or parameter negotiation is attempted if these fail.
Thinking-disabled is specific to this experiment: it changes no PR-review
strength/default and does not qualify an untested downstream thinking profile.

The whole exposed model tool surface is empty: no shell, filesystem, browser,
MCP, connectors, function tools or output-to-tool execution exist on this call
path. Reject returned tool/function calls, additional choices, non-string content
or a finish reason other than `stop`; never execute or recursively fetch anything
suggested by the model. Local Node necessarily reads the bounded fixture, an
environment credential and writes evidence; that local process is not a sandbox
qualification for the author CLI or proof about provider-internal operations.

## Observation, terminal outcomes and identity

Capture envelope observations through the provider's existing `extractText` hook,
including empty-content responses. Preserve raw-aware nullable usage via a local
`normalizeUsage` callback: absent or invalid input/output/cache fields are unknown,
not zero; cache tokens are a subset, not additional input billing. Record timing
from local execution separately from provider-reported metadata.

Sanitize arbitrary response text with the shared secret helpers and exact
credential redaction before publication. Preserve validated digest fields through
an explicit field-aware serializer, since broad 64-hex redaction would corrupt
hash evidence. The sanitized envelope is not described as exact wire bytes:
retain its own digest and separately the raw-byte digest, byte count and redaction
status. Request fixtures must be synthetic and pass secret screening before
dispatch. Never store the credential or raw auth header even on errors.

Observed identity is solely the nonempty API envelope `model` field, labeled
`provider-response.model`. Require exact `deepseek-flash` for this candidate.
Configured/requested identity and any name written by the model are separate
fields and cannot fill an absent observation. Record Node/helper revision,
endpoint and request digest as local provenance. The observed alias supports
family independence for the recorded author provenance; it does not pin provider
weights, establish cryptographic attestation or prove erased provider caches.

| Terminal | Exit | Meaning |
| --- | --- | --- |
| `CANDIDATE-PASS` | 0 | All invoked structural, identity and fixture-delivery checks pass; the driver must inspect retained source judgment before publishing `QUALIFIED-PROTOTYPE`. |
| `ENVIRONMENT-BLOCKED` | 2 | A named external prerequisite prevents the relevant assertion, such as missing credential, provider quota or network availability. Never label failed assertions this way. |
| `INVALID` | 1 | Malformed/stale input or response, missing/mismatched identity, tool calls, incomplete finish, invalid delivery/result or rejected publication. |
| `TIMEOUT` | 3 | The bounded HTTP call times out; completion/billing remain unknown where not observed. |

Publication failure can prevent a helper terminal from being retained; stderr and
the driver's exit/termination record expose this explicitly. The final report
uses `NO-GO` for unresolved capability failures, retaining exact attempt terminals;
it does not replace them with a semantic direction verdict.

## Bounded live execution handoff

No paid request is authorized by this design document. The driver freezes the
specific execution handoff under the already authorized #110 work before calling
`probe`; it does not reopen authorization for the eight-issue scope.

| Bound | Frozen proposal |
| --- | --- |
| Surface/model | Node HTTP caller above; DeepSeek `deepseek-flash`; no fallback surfaces. |
| Attempts | At most two across prototype and final-schema qualification combined. Reserve in the existing run record before invoking `probe`; attempted unavailable calls, invalid results, timeout and missing terminal consume. Preparation-only work does not. |
| Per call | 120 seconds through shared abort; 16384 bytes complete request; 8192 output tokens; 131072 response bytes; no automatic retry. |
| Total execution time | At most 300 seconds cumulative wall time in `probe` invocations, including waiting and publication overhead. Each invocation has a driver-owned 150-second process watchdog, within which HTTP has its 120-second limit. Time between issue stages and offline preparation are excluded; they do not reset consumption. |
| Planned spend ceiling | USD 0.10 for qualification calls only. The driver verifies the advertised rate and conservative request estimate before dispatch and preserves observed/unknown usage afterward. This is a spending decision, not a provider billing guarantee. |

The [published peak Flash prices](https://api-docs.deepseek.com/quick_start/pricing/)
observed on 2026-09-13 are USD 0.30 per million cache-miss input tokens and USD
1.20 per million output tokens. At a conservative 16384 input-token allowance
and 8192 output tokens per call, two calls estimate below USD 0.03. The request
byte bound is a local data limit, not a tokenizer/billing attestation. Recheck the
estimate against the actual candidate/rate before spending; unresolvable billing
uncertainty is recorded and referred to the driver, not silently treated as free.
Abort cannot prove the provider stopped billing. Main PR review calls are separate
from this budget and never reused as qualification.

The driver retains UTC start/end and measured elapsed time for each invocation.
An interruption with unknown elapsed time charges the full 150-second slot for
time budgeting; unknown call consumption still requires reconciliation. Launch
only with an unused attempt and at least 150 seconds remaining; the process
watchdog terminates an overrun even if normal artifact publication fails. Final
schema revalidation days later uses the carried cumulative allowance, never a
new five-minute window. Preparation may be repeated offline without using a call
but cannot overwrite an existing attempt directory or dispatch marker.

Stop after the first qualified prototype. Preserve the second slot for final
schema revalidation; do not spend it merely repeating documented statelessness.
If the first attempt fails, the driver may use the second only for a named,
evidence-backed qualification correction within the same bounds. Exhaustion or
unknown consumption permits no further call. No third attempt or automatic new
quota follows from a new session, schema revision or child issue.

## Files to change and dependencies

| Path | Change | Reason |
| --- | --- | --- |
| `scripts/qualify-direction-transport.mjs` | Add | Manual bounded preparation and one-call qualification; no runtime integration. |
| `scripts/qualify-direction-transport.test.mjs` | Add | Deterministic provider/path/artifact/protocol checks with injected fetch and temporary directories. |
| `scripts/fixtures/direction-transport/{packet.json,requirements.md,artifact.mjs,expected.json}` | Add | Tiny synthetic packet, delivered evidence and withheld oracle. |
| `docs/evaluations/issue-110-transport.md` | Add | Sanitized invocation, capability matrix, attempt identities/results, limits and final-schema revalidation obligation, including a valid NO-GO conclusion. |
| `.claude-plugin/marketplace.json` | Edit source version | Set the `afk-skills` version to 1.0.4 after rechecking concurrent version changes. |
| Generated host manifests and `package.json` | Regenerate only | `node scripts/sync-marketplace.mjs` reads the canonical marketplace input and writes its normal mirrors. |
| This design | Add | Frozen contract and reviewable execution proposal. |

Import `makeOpenAiProvider`, `readConfinedUtf8File`, `canonicalBytes`,
`digestBytes`, `publishImmutable`, `isExcluded`, secret redaction and byte helpers
from their existing modules. Do not copy their implementations, modify receipt
schemas or import the behavior runner to dispatch HTTP. Small qualification-local
validation and the bounded response adapter stay in the one script.

The behavior harness's `supportVisible` excludes fixture/test paths and does not
allowlist this new script or evaluation report. Assert those exclusions without
changing its export policy. No qualification helper, oracle or report becomes
author support; existing automatic `skills/**` and `lib/**` exports stay unchanged.

## Test plan

Write deterministic tests first and observe meaningful failures for the absent
helper. Tests inject fetch and credentials as synthetic values; no test probes an
external provider or reads a credential file.

1. Preparation accepts the tiny fixture and embeds exact source bytes/digests;
   expected oracle is absent. Reject missing/excluded/traversal/symlink/nonregular,
   invalid UTF-8, changed/oversized source and total request overflow before fetch.
2. The wire contains only the fixed endpoint/model/body and two fresh messages;
   no prior conversation, tools or inherited override is used. Reject redirects,
   request mismatch and any response suggesting a tool/function call. Assert no
   dispatcher, second request or source URL fetching occurs.
3. Mock complete pass, missing credential, quota/HTTP failure, transport error,
   timer abort during fetch and during body read, malformed/oversized body, empty
   result, length finish, extra choices and invalid content/result. Verify distinct
   terminal/exit behavior and no retries. Mocks never qualify the live surface.
4. Missing/mismatched envelope identity fails even when model prose names the
   requested model. Matching envelope identity preserves its provenance label;
   missing usage stays null. Credential echoes are removed without altering
   validated hash fields, and sanitized/wire digest meanings remain distinct.
5. Validate result bindings, source challenge, requirement/evidence membership,
   findings and all four semantic enums; wrong fixture judgment cannot become a
   candidate pass merely because JSON is valid.
6. Existing output/reused dispatch, symlink output ancestors, stale prepared or
   producer digests and publication errors fail closed. Interrupted dispatch is
   not reused and original artifacts survive. Deterministic export assertions
   cover the script, oracle, fixture and report without exposing them to authors.

After the targeted red state, implement and run this deterministic partial suite:

```bash
node --test scripts/qualify-direction-transport.test.mjs lib/gate/file-boundary.test.mjs lib/gate/review-receipt.test.mjs scripts/http-gates.test.mjs scripts/optional-http-gates.test.mjs
node scripts/sync-marketplace.mjs
node scripts/sync-marketplace.mjs --check
node scripts/lint-skills.mjs
node scripts/check-links.mjs
node scripts/scan-provenance.mjs
git diff --check
```

The first command is explicitly a partial suite. The driver owns the final
unmodified full suite because existing tests include two live Claude CLI probes;
do not remove, filter and mislabel, or silently rerun those paid checks.
Run ordinary validation in the isolated worktree; unrelated historical ignored
run artifacts are not cleanup scope. Confirm link fragments separately where
used because the current link checker validates paths only.

After independent design review, implementation review and the bounded execution
handoff, the driver runs preparation, reserves a slot and invokes the exact probe
command. Inspect the complete request, observed envelope/identity, extracted
source challenge, concrete mismatch evidence, exit and elapsed time. Publish a
synthetic-only report with reviewed code/request/result digests and capability
matrix. Available evidence must be inspectable; inaccessible or missing proof
cannot count as qualification. Keep private provider IDs and local paths out of
the committed report, using non-sensitive bindings and retained evidence locators.

## Risks and non-goals

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| Mutable provider alias or response identity limits | Expected / limited provenance | Record exact observed field, timestamp and endpoint; no weight-generation claim. |
| Final schema differs from prototype | Likely / downstream acceptance delay | Reserve remaining slot and require explicit revalidation before #111 acceptance. |
| Model output consumes cap or omits JSON | Possible / failed qualification | Disable thinking, allow bounded output, classify faithfully without automatic retry. |
| Private data reaches evidence | Possible / high | Synthetic allowlist, bounded confined reads, no `.env`, field-aware redaction and publication review. |
| Passing HTTP check mistaken for author isolation | Possible / invalid behavior claims | Preserve #98 confinement results and separate the complete zero-tool interface from author-host tools. |
| Timeout leaves unknown provider spend or interrupted artifacts | Possible / allowance ambiguity | Preserve consumed slot, terminal absence and unknown usage; driver reconciliation before more calls. |

No #109 canonical state/accounting implementation, #111 runtime integration,
automatic dispatch, fallback provider, default model change, generic gate rewrite,
new public skill, repair of #98 author confinement, large behavioral evaluation,
or unrelated deferred findings belongs in this issue.

## Handoff and final-schema revalidation

The initial artifact is a plan only. Mandatory independent same-model adversarial
design review precedes implementation; the driver owns review-cycle accounting,
external gates, commits, publication and provider execution.

The #110 report records prototype schema/fixture/producer digests and consumed
attempts. The #109/#111 integration owner must compare the final packet/result
contract against that evidence and record a field-level compatibility decision
in the same run's authoritative records, with final schema digest and report
reference. An exact accepted wire/result contract with only compatible local
validation changes may be revalidated deterministically, explicitly labeled as
such; it is not a fresh final-protocol invocation.

Any change to supplied fields, evidence delivery, result bindings, prompts,
model/settings or response extraction that the existing call did not exercise
requires a live final-schema qualification using the unconsumed second slot.
Adapt only the fixture/caller boundary to the approved final contract and retain
the prototype evidence. If both slots are spent, required-mode integration and
paid behavior acceptance remain OUTSTANDING; do not replenish the allowance.
The integration owner records this prerequisite before accepting #111, while
the driver remains responsible for the actual bounded call and evidence review.

Structural helper tests, provisional live qualification and final-schema
qualification are separate report rows. A NO-GO can complete the #110
investigation without completing those downstream outcomes. Even positive final
transport evidence establishes neither semantic reliability nor the later
behavior pilot's author confinement and completion criteria.
