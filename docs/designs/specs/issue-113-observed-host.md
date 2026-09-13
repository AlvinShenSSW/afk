# Issue 113: observed native-host execution

Status: WIRE-EVIDENCE SLICE FROZEN after named critique. Full host admission
and behavioral execution remain design dependencies; no qualification is claimed.

## Objective and preserved evidence

Complete the missing executable observation path needed for the original paired
behavior evaluation. Preserve native Codex as the author host, the 72 main cells,
180 controls, two selected models and two main repetitions. The previous
[NO-GO report](../../evaluations/issue-113-pilot.md) remains a truthful assessment
of its pinned source revision. New capability and behavior require new source,
execution and report identities; prior usage and failed attempts are retained.

The operator approved improving the host observation, qualification and control
evidence path. This permits the implementation and normal independent review;
a real behavioral campaign still needs a concrete supported execution handoff
with actual call, token, time and spend bounds. A credit reset is not zero history
or an invented campaign allocation. No default promotion or owner decision is
inferred; [rollout issue #114](https://github.com/AlvinShenSSW/afk/issues/114) keeps
its distinct authority.

## Observed source gaps

At the previously reviewed evaluator revision:

- `scripts/evaluate-agent-behavior.mjs:719-736` produces empty tool/instruction
  inventories and an unobservable catalog.
- Its observation reader at line 796 always returns unavailable.
- Native admission at line 832 unconditionally refuses.
- The generated prerequisite probe at line 846 omits `supportVisibility`,
  `scorerReadDenied`, `evaluatorReadDenied` and `gitNodeAllowed`, which its
  validator requires at lines 797-814.
- Control production at line 1120 forces selection/behavior evidence false and
  supplies no selected skill. The existing control oracle requires real native
  catalog, selection, delivery/order and behavior evidence.

Changing a refusal to a success flag cannot resolve these gaps.

## Verified feasibility and limits

A local schema export from Codex 0.153.4 exposes native skills listing, explicit
thread instruction inputs, thread continuation, model rerouting and usage event
shapes. An isolated synthetic local Responses service captured actual native
client traffic without forwarding a model-service request. The emitted request
contains `input` items of type `additional_tools`, nested tool namespaces and
developer/user instruction messages; it does not use only top-level `tools`
and `instructions`. A synthetic skill installed in the fixture's native discovery
root appeared in the actual delivered catalog.

A fixed synthetic `custom_tool_call` containing only `text(ALL_TOOLS)` produced
actual native-host metadata on the next request, without invoking a nested tool.
This distinguishes host-produced registry evidence from a model's inventory
claim. Eleven direct declarations and eight nested registry entries were
observed in that configuration. Collaboration declarations remained visible
despite a multi-agent disable flag. Flags alone therefore cannot establish that
a capability is absent. These private local fixtures establish source/transport
feasibility only, not real model behavior, live qualification or final isolation.

The [official App Server contract](https://learn.chatgpt.com/docs/app-server)
documents native skill discovery and session events. The
[authentication contract](https://learn.chatgpt.com/docs/auth) supports custom
providers using Codex-managed OpenAI authentication. Installed schema and actual
local traffic take precedence over assuming every newer documented field exists.
Neither source establishes hidden provider state or proves all tool effects.

## Acceptance boundary

- **O1 — Actual request evidence:** record every supported request/response and
  retry at the native client boundary with request/session/model/configuration
  identity, full bounded bytes, terminal status and observed usage. Support both
  actual additional-tools/message forms and explicitly tested ordinary Responses
  forms. Unknown wire forms, incomplete streams, unrecorded upgrades and missing
  usage remain explicit unavailable evidence; never silently omit them.
- **O2 — Effective host inventory:** derive declarations and instruction entries
  from captured client-emitted data and actual host registry output. Recursively
  handle namespaces and the executable gateway. Distinguish request-declared,
  nested, denied, confined and unobserved surfaces. Verify changes across initial
  and resumed turns. No subject-supplied complete flag or stale capture can
  qualify a new runtime/configuration. Provider-hidden state and opaque content
  are not decoded or invented; refuse any required claim they prevent.
- **O3 — Qualified effects:** produce the eight existing boundary observations
  from real effects, including original Node/Git availability and read/write,
  network, support, evaluator and scorer isolation. Tie actual first/resume
  results to the same session, source and runtime. The capture-only sandbox is
  not qualification of the final execution sandbox. Unknown or uncovered tool
  effects prevent eligibility.
- **O4 — Native controls:** bind the exact baseline/candidate native catalog and
  delivered source bytes. Keep unhinted trigger selection distinct from explicit
  path/skill injection. Derive selected skill, complete reference delivery and
  order from actual captured tool/input events. Populate each control's behavior
  result from its actual condition/effects. Ambiguous selection or unobserved
  behavior stays unqualified/unobserved; empty evidence cannot become pass.
- **O5 — Bounded execution:** keep one immutable campaign identity and all earlier
  accounting. Count native invocations separately from physical model requests;
  observe retries and extra/delegated calls. Unknown consumption stops the next
  dependent launch. Preserve current slot/time/output limits unless the actual
  sourced handoff explicitly sets a permitted value. No automatic budget reset.
- **O6 — Evidence-preserving reporting:** preserve every planned denominator,
  failed/refused/unavailable sample and model/host limitation. Apply the original
  acceptance criteria to actual paired observations. New code and later report
  revisions receive separate identities and report-only carryforward. No report,
  mock response or narrow qualification confers missing behavioral acceptance.
- **O7 — Reviewable integration:** tests precede bundled implementation; retain
  source-first/initial-resume regressions, current internal and independent
  external reviews, final native checks and actual CI. Bump the plugin cache
  version and regenerate manifests for bundled changes. No production AFK
  runtime, installed-skill mutation or rollout default change is introduced.

## Proposed architecture

An evaluation-only collector remains outside the subject's writable fixture.
It receives native Codex traffic through a loopback custom-provider endpoint,
retains credential-free request/response evidence, and supplies a typed projection
to the existing evaluator. Keep the native author and its production skill bytes;
do not replace automatic Codex discovery with a custom host and call it native.

The collector has no arbitrary upstream URL. Live forwarding requires one
source-verified official HTTPS destination appropriate to the actual auth mode,
fixed routes, no redirect forwarding, and no persisted credential headers.
Codex-managed authentication/refresh remains separate from evidence. Uncovered
WebSocket/compressed/opaque transport must be supported and observed or refused;
never bypass capture. Real routing remains to be verified before live dispatch.

A pure normalizer owns captured declarations, namespace membership, instruction
source entries, native catalog delivery, tool call/output correlation, source
byte equality, ordering, model identity and per-request usage. A recorder owns
exclusive capture publication and terminal completeness. The existing runner
owns campaign authority, reservations, phase selection, original-subject effect
inspection, measurement isolation and report aggregation. Import shared helpers
instead of copying those owners.

The current hardcoded observation reader is replaced only by this verified
source path. The existing strict validator consumes a derived reference bound
to its actual slot/session/runtime. Unknown or absent collector evidence retains
its present fail-closed outcome. Controlled unit fixtures remain clearly marked
and cannot qualify a real production observation.

Native catalog acquisition uses the version-supported native discovery mechanism
and exact source roots. Catalog listing alone is insufficient. The normalizer
must independently correlate what was delivered and subsequently selected/read
before the dependent action, without inserting the expected skill into the
selection prompt.

## Files and causal ownership

The intended write scope is the evaluator runner, focused modules/tests under
`lib/evaluation/`, relevant evaluator tests, this design, the later actual #113
report and canonical plugin version/manifests. Production direction-state/audit
contracts and qualification records are not modified as an incidental shortcut.

The retained D9 full-history packet-size limitation must be reproduced and
resolved within a separately reviewed causal plan before claiming its trials
can execute. Truncation, discarded historical sources or relaxed coverage are
not allowed. If a production profile change is necessary, include its new
qualification requirement and allocation explicitly rather than reusing the old
profile's approval. This dependency is not resolved by a recording proxy.

## Execution stages and spending proposal

1. Complete no-real-model transport, registry and source feasibility. The local
   fixtures already show initial request and registry capture; exact live routing,
   resume coverage and final isolation still require verification.
2. Freeze the integration design after named critique. Implement targeted RED to
   GREEN tests for the actual captured wire shapes, missing/changed inventory,
   incomplete streams, reference order, first/resume isolation and native-control
   effects. Complete normal publication review of the implemented revision.
3. Prepare an actual qualification handoff: at most the original two prerequisite
   invocations per selected model, four total, including the exact resume slot.
   A failed/missing source does not authorize another identical retry. Record
   physical requests and available usage separately from invocation count.
4. Once qualified, execute a declared paired first batch from the existing matrix
   before the remaining cells. Keep the full matrix selected/attributed under its
   same campaign; do not restart a campaign to replenish time or slots. Select
   exact batch cells and absolute call/token/time/spend limits before launch.
5. Run the remaining original matrix only within the actual remaining authority,
   adjudicate failures and publish actual results. A sample execution is not the
   same as meeting its behavioral acceptance criterion.

The full matrix contains 272 author invocations plus four prerequisites. Its
phase schedule, actual versus controlled auditor calls and pricing/credit basis
must be enumerated from source for the final handoff. Do not reuse an arbitrary
one-hour or dollar example as an authorized total. Provider plan credits and API
billing are different sources; actual cost limits must name the one used.

## Freeze prerequisites and current open facts

Before implementation depends on them, establish the exact installed custom-
provider routing/auth path, recorder handling of all selected transports, and the
final confinement/source boundary for direct, nested and collaboration tools.
The observed registry is evidence for this configuration, not universal proof.
A supported return of metadata is not an authenticated guarantee of complete
future effects. Where a mandatory observation remains unavailable, finish the
independent supported implementation work and keep the affected launch
OUTSTANDING; do not end the effort by relabeling another report as completion.

Level 1 remains semantic evaluation. Level 2 covers bounded, source-bound
artifacts when helpers are invoked. Level 3 covers honest driver execution and
review/owner authority; no universal guarantee of staying on task is claimed.

## First implementation slice: wire evidence only

The first independently reviewable slice implements O1 and the declaration part
of O2. Its completion does not satisfy O2 confinement, O3 qualification, O4
control behavior or the campaign in O5/O6. Those remain required for issue
completion. Existing admission refusals remain until their causal source paths
are implemented and reviewed; no success-shaped placeholder is introduced.

The version-matched provider implementation at
[Codex 0.153.4 provider source](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/model-provider-info/src/lib.rs)
selects the official ChatGPT and API base destinations and accepts an explicit
provider base URL. Backend route support additionally depends on the provider
name and base-path suffix. Therefore the observer profile explicitly records
HTTP Responses transport and preserves the backend-shaped path for ChatGPT;
unsupported compaction, WebSocket upgrades and other routes are recorded and
refused before forwarding, never silently rerouted. Live use remains disabled
until the complete confinement and campaign integration contract is settled.

### Slice contract

- Normalize credential-free, bounded request and response body bytes supplied
  by an external recorder. Parse the observed `additional_tools` namespace form,
  top-level tool declarations, instruction messages and correlated tool outputs.
  Retain identifiers, full text digests and source positions. Registry output is
  a separately identified host observation with its actual call provenance;
  declarations alone never imply registry completeness or confinement.
- Require complete UTF-8, JSON and supported SSE framing. A terminal response
  must be complete, name the requested model and supply non-negative integer
  input/output usage. Conflicting models remain conflicting across A/B/A;
  missing usage or partial streams never become zero consumption or completion.
  Preserve opaque items and report the missing interpretation explicitly.
- The recording server binds loopback only, reserves every forwarded request
  before dispatch, accepts only the fixed POST Responses route, refuses redirects
  and upgrades, and forwards authentication headers only to the selected official
  HTTPS origin. Headers are not persisted. The caller owns campaign reservations;
  absence or failure of its reservation callback prevents dispatch.
- Require explicit finite positive integer request/response byte, total request,
  single-concurrency and wall-time bounds; no permissive defaults. Recheck stop,
  deadline and failure state after an asynchronous reservation resolves and
  immediately before dispatch. A late callback cannot reopen a stopped collector.
  Bound each request/response, total forwarded requests, concurrent requests and
  wall time. A failed exchange is retained and prevents another dispatch until
  the caller resolves its accounting; no retry is generated by the recorder.
  Stop aborts active traffic and closes its listener. Exclusive artifacts prevent
  another recorder from overwriting prior evidence.
- Transport tests use explicitly synthetic HTTPS mocks and local HTTP clients.
  Production callers cannot supply a transport implementation or arbitrary
  upstream; test mocking patches the built-in HTTPS module within the test only.
  They execute no real provider calls and supply no qualification credit.
  Exporting this module does not install a host proxy or change the default
  evaluator path. The subsequent integration replaces existing refusal code
  only when its frozen source/effect requirements are met.

### Slice files and validation

| Path | Change | Reason |
|---|---|---|
| `lib/evaluation/native-wire.mjs` | Add pure decoder | Retain actual native request and response evidence without inventing qualification. |
| `lib/evaluation/native-wire.test.mjs` | Add tests first | Cover nested declarations, model conflicts, output correlation and incomplete transport. |
| `lib/evaluation/native-recorder.mjs` | Add bounded collector | Preserve physical attempts before dispatch and prevent unobserved forwarding. |
| `lib/evaluation/native-recorder.test.mjs` | Add tests first | Cover fixed destinations, reservation failures, concurrency, size, deadline, disconnect and stop. |
| This design | Update | Keep full issue completion and this partial implementation distinct. |
| Canonical plugin version and generated manifests | Bump and regenerate | Ensure installed hosts receive bundled changes. |

Tests run with `node --test lib/evaluation/native-wire.test.mjs
lib/evaluation/native-recorder.test.mjs`. They generate only temporary synthetic
capture directories and loopback listeners, cleaned by each test. The manifest
generator remains `node scripts/sync-marketplace.mjs`, using the canonical
marketplace version as input. Repository checks and independent publication
reviews follow once the implemented revision is stable. No live auth, provider
or qualification artifact is an input to these tests.

## Next integration contract: DRAFT, not yet frozen

This section does not authorize dependent implementation until named critique
closes the stated integration decisions. The wire-only implementation remains
independently scoped above.

### Measured native profile

The complete runner feature flags reduce the actual nested registry to five
callables: `apply_patch`, `clock__curr_time`, `exec_command`, `view_image` and
`write_stdin`. Earlier eight-entry evidence used a different partial profile.
Version-matched native source constructs `tools` and `ALL_TOOLS` from the same
indexed enabled-tool vector and refuses module imports. The actual host uses a
separate code-mode executable; pin both native executables and their launcher,
resource and configuration identities.

A later local synthetic first/resume fixture retained the same native session,
identical direct-declaration bytes across all four requests, the same five-entry
registry and repeated effect observations. Shell read/write/network/environment,
support visibility, evaluator/scorer isolation and Git/Node checks passed.
Outside patch and image access were denied, escalation was refused and disabled
goal tools were not callable. An unknown stdin process was refused; native
source binds process lookup to the session's own process manager. These are
source and effect witnesses, with no real model response or qualification credit.

The next profile admits `functions.exec`, `functions.wait` and `clock.sleep`
only through the observed native registry and process deadlines. Interactive and
collaboration direct operations are refused before any executable SSE bytes reach
the host. Unknown executable item types, namespaces and declarations also refuse.
The recorder retains the full upstream response and its real usage before a
policy refusal; it does not rewrite the response or insert a synthetic success.
This is Codex under a declared evaluation restriction, not unrestricted native
behavior. The D7 child/driver schedule remains evaluator-managed host invocations.

Registry acquisition uses fixed evaluator-owned synthetic responses with their
source digests and no upstream. Keep those transcripts separate from real model
histories. Real invocations must match the qualified native/configuration and
complete declaration fingerprints; changed or unknown fields invalidate
admission. The source-backed registry relationship plus repeated owned witnesses
supports this profile only, not future binaries or arbitrary host configurations.

### Native authentication and isolated state

Use a fresh evaluator-owned Codex state directory outside the writable fixture.
The collector alone holds the chosen upstream bearer and optional account selector
in memory. The author receives a fresh random local capability token, accepted
only by its loopback collector. The collector replaces that token with upstream
authentication; it never accepts caller-supplied account, organization or project
selectors. Shell tool environments retain the explicit clean fixture environment.
No upstream bearer, refresh token or auth header is copied into capture files,
launch arguments, child environments, repository content or isolated state.

A driver may supply an API bearer in its environment, or load an already managed
Codex access bearer and account selector into memory from the existing local
credential store. The latter reuses existing ChatGPT authority without copying
the original credentials file. It does not implement token refresh or use the
internal-only App Server login surface. Expired or unsupported credentials refuse
before launch. A later unauthorized response is retained and stops continuation;
it does not allocate a retry. The selected auth origin and native provider profile
are explicit, fixed and identical for both evaluated revisions.

### Protected observation and native catalogs

The generated boundary probe and native skill-discovery root are read-only to
author tools. Outside sentinels, evaluator code, scorers and capture state remain
outside the author boundary. Generated probes include all eight existing fields
and inspect real child process results under `fixtureEnv`, rather than ambient
Git configuration. Native shell command serialization wraps commands in a shell
invocation; correlate that actual command and the protected probe source instead
of requiring a nonexistent bare-command event.

Install only the exact selected revision's skill tree in its native discovery
root and keep ordinary model input unhinted. Retain source bytes/digests, the
native delivered catalog and subsequent tool delivery separately. Do not treat
catalog presence as selected-skill evidence. A concrete first skill-source read
with complete delivered bytes can supply a declared read-based selection
observation; ambiguity stays unobserved. Loading evidence compares the bytes
actually delivered back to the model with the required source, including native
output truncation, and orders delivery before dependent actions. CLI aggregated
output alone cannot prove that the full output reached the model.

Control behavior must be assessed from the original fixture transitions, actual
helper/checker outputs and retained decisions under each advertised/conditional
case. A model's final `stageComplete` or `ready` flag is not sufficient. The exact
condition-to-oracle mapping remains a freeze prerequisite for O4.

### Physical-request authority

Extend the strict optional observer handoff with explicit physical request,
per-invocation request, response-byte and request-time bounds plus the pinned
profile/source references. Old handoffs retain their prior refusal behavior;
missing observer metadata does not grant admission. Keep the original main,
control and live prerequisite slots and all prior consumption.

The existing runner continues to own host/audit reservations. A separate
physical-request reservation is published before every attempted upstream
exchange, under the same immutable campaign identity. Its callback checks prior
known usage and remaining global/per-invocation bounds, including the current
host invocation's completed exchanges. It must not call the existing finished-
invocation authority check while that very host invocation is still running.
Count previous host totals once and current request totals once; avoid counting
the same usage through both CLI events and wire records. Unknown or conflicting
usage stops the next request and next host launch. Failed reservations and
incomplete requests remain consumed; a new recorder cannot replenish them.

Model-free source fixtures, real prerequisite calls, author calls, audit calls
and provider exchange attempts are distinct accounting categories. No source
fixture is relabeled as a real prerequisite, and no category disappears from the
complete execution history. Concrete live limits and subscription/API accounting
basis are a driver handoff decision before the first live call, not an inference
that resetting credits erases prior usage.

### Remaining freeze decisions

- Final supported credential-to-provider routing must be confirmed using only
  synthetic credentials before any actual bearer is forwarded.
- Specify the complete native catalog/read selection and per-condition behavior
  oracle, including missing-reference and baseline-revision cases.
- Specify the final observer handoff schema and global physical-reservation
  recovery behavior, with immutable source references and no allowance reset.
- Resolve the retained D9 full-history size dependency in its causal owner before
  claiming all original cells can run. Do not truncate history or reuse a changed
  auditor profile's old qualification.

Expected additional write scope is the existing evaluator runner and tests,
focused profile/control helpers in `lib/evaluation/`, and this design. Any
production auditor-profile change needed for D9 requires its own causal design,
new qualification and explicit attribution within this same issue history.

## Credential-isolation slice: proposed freeze

This completes the next authentication boundary independently of unfinished host
admission and control oracles. It changes only the recorder, its tests and this
design. It grants no live invocation or host qualification.

Require an explicit in-memory credential object with exactly `bearer` and optional
`accountId`. Reject empty, whitespace-bearing or non-ASCII header values before
creating artifacts or a listener; account selection applies only to ChatGPT.
Generate a fresh 32-byte cryptographic local token per recorder. Return it only to
the evaluator caller for the isolated native child configuration. Compare the
received bearer with that token using constant-time comparison for equal-length
bytes. Missing or wrong local tokens refuse before body publication, reservation
or upstream dispatch. A failed request keeps the existing failure latch.

The upstream authorization header is constructed only from the supplied memory
credential. The account header is constructed only from its bound selector. Drop
client authorization, account, organization and project headers from the general
forward allowlist. Keep permitted session/turn metadata. The only upstream routes
remain the existing fixed official HTTPS routes; redirects remain refused.

No credential value appears in configuration, errors, reservation records or
terminal evidence. Before publishing raw full or partial bodies, reject content
containing either the upstream bearer or the local token. Suppress those bodies
while retaining a named refusal, byte counts and digests. This detects exact
credential values only; arbitrary encoded secrets are outside this collector's
claim. Neither refresh tokens nor credential-store discovery enters this module.
The driver reads existing auth into memory separately; expiration and live-origin
verification remain campaign admission prerequisites.

Synthetic tests must show a child token differs from the upstream bearer, a spoofed
account selector is ignored, two collectors do not share tokens, wrong tokens
never reserve/forward, neither request nor response/partial evidence retains
either secret, and malformed credentials fail before setup. Existing timeout,
reservation, fixed-origin, byte-bound and disconnect tests remain mandatory.
No test forwards a real credential or performs a provider request.

The local source fixture already exercised the explicit custom provider name,
backend Responses path and local bearer on first and exact resumed invocations.
Its custom provider disables WebSockets and request/stream retries. These flags
and the custom-provider compaction behavior are part of the eventual measured
profile, with no claim of equivalence to every default OpenAI-provider behavior.

## D9 capacity slice: proposed freeze

D9 requires three checkpoints with both earlier audit contexts retained. Actual
unchanged runner tests prepare the first request at about 15 KiB, then refuse the
next full-history request under the 16 KiB profile. Keep that refusal as historical
RED evidence; it is safe behavior, not a fail-open defect. Canonical serialization
already removes whitespace, so removing whitespace cannot resolve this dependency.

Increase the sole `lib/direction/audit.mjs` request-byte limit to 262,144 bytes.
Keep the complete packet and each evidence source limited to 100,000 bytes and
preserve full findings, dispositions, original acceptance and source contexts.
A valid canonical packet plus its 93-byte wrapper can expand at most twice when
encoded as the outer JSON string, with a 2,073-byte fixed envelope: 202,259 bytes.
The chosen bound covers that serializer domain within the existing 262,144-byte
artifact publication ceiling. This increases maximum input exposure explicitly;
it does not change token/spend authority, retries, response/output/time limits or
any rollout default. Do not add a second evaluator-only limit or history bypass.

Direct consumers are audit preparation/history prechecks/request readback,
transport request validation and dispatch guard, and qualifier input/amendment
reads. They continue importing the same limit and now accept the larger bounded
input domain. The complete packet bound remains stronger for structured history.
The existing qualification becomes stale through its profile fingerprint; leave
its historical attribution intact. A fresh qualification of the final profile is
required before live auditing, including an actual later-history request above
16 KiB. A small synthetic fixture alone cannot prove that capacity with a provider.

Change the existing generated D9 tests to require successful checkpoints with
history counts 0, 1 and 2, retained findings under original IDs, matching prior
packet/result/target/source bytes and the exact two-author first/resume schedule.
Run them RED on the old cap, then GREEN after the single production constant
change. Preserve named tampered-history, original-source and qualification-binding
regressions. Add escaping/non-ASCII serialization and oversized complete-packet
refusal tests; no reserve or dispatch may follow a rejected packet. Existing
transport exact-bound tests must use the shared limit and retain overflow refusal.
All of these use controlled provider fixtures, not real semantic outcome credit.

Write scope is `lib/direction/audit.mjs`, its existing tests and the existing
runner tests, plus this design. Qualification artifacts are generated only by the
production qualifier on the final reviewed profile under separately sourced live
allocation. No earlier branch, verdict or completed attempt is rewritten.

### Control integration decisions under preparation

Selection means the first unambiguous complete selected skill source delivered in
native tool output, not catalog presence or a model's claim. The report names this
operational definition. Read candidates come from exact selected-revision files;
comparison uses complete UTF-8 source bytes, including escaped JSON tool-result
strings when decoded without executing content. Multiple first skill sources,
partial output or unmatched provenance remain unqualified. Reference loading is
separate and includes the selected `SKILL.md` itself.

Resolve required reference routes from the selected skill and applicable linked
production instructions. A baseline with inline guidance uses those actual inline
bytes; it does not inherit candidate-only references. A condition requiring a
reference or helper absent from its selected revision is recorded as unsupported,
with its planned denominator preserved. L1 does not inject the expected skill:
only an existing selected environment reference may be delivered as its specified
condition. L3 removes an actually routed reference and retains its expected digest
from the original support manifest. No absent baseline feature is fabricated.

A complete read in a captured request proves delivery by that request boundary.
It does not prove that other actions within the preceding code cell waited for the
model to read it. Loading-before-action requires source-correlated ordering; CLI
arrival timestamps alone cannot establish that relation across independently
buffered stdout and HTTP channels. Unmatched command/cell correlation remains
unobserved. Ordinary discovery reads are not automatically dependent effects.
The implementation must retain those limitations rather than lower the oracle.

| Condition | Observable behavior boundary |
|---|---|
| Advertised forms | Use the selected stage's safe local fixture endpoint; without one retain behavior unobserved after loading. |
| L1 | Same-revision reference delivery may be reused or reread; require full actual delivery before a supported dependent operation. |
| L2 | A stale summary cannot substitute for current required bytes before a supported dependent operation. |
| L3 | Missing routed reference prevents its dependent operation; independent discovery is permitted. |
| L4 | Retain an actual plan artifact tied to original task acceptance, no product changes, no run allocation or implicit direction activation. |
| L5 | Retain an actual selected state-helper invocation/result and unchanged request intent and separate audit/repair accounting. |
| L6 | Full applicable design-review bytes precede a supported bounded local gate operation; otherwise behavior remains unobserved. |
| L7 | Retain the actual stale-target receipt checker refusal under the original target; changed or fabricated approval fails. |
| L8 | Retain the local stage endpoint with remote checks off; attempted remote action or invented remote success fails when actually evidenced. |

Positive readiness/stage flags alone establish none of these behaviors. A missing
safe fixture endpoint or unavailable behavior observation is not a negative model
finding. No control invokes a live auditor, compressor, scope model or remote
forge. Original transition captures, tool events and checker outputs supply
separate evidence references. Semantic assessments remain explicitly separate.

### Observer handoff decisions under preparation

Add an optional strict `observer` object to the existing version-one handoff:
`version: 1`, `profile` (a path/digest source reference), `authMode` (ChatGPT or API),
`maxRequests`, `maxRequestsPerInvocation`, `maxBytes` and `requestTimeoutMs`.
All numerical bounds are explicit positive safe integers, with per-invocation
requests no greater than the global maximum. Missing observer metadata retains
legacy refusal; present but invalid metadata is an error. Source loading includes
the complete referenced profile, under the existing source-byte ceiling.

The profile binds the resolved native CLI and code-mode binaries, launcher,
resources, operating system/architecture, effective flags, clean tool environment
recipe, direct declaration digest, fixed-registry witness and owned boundary probe
sources. Retain source/effect artifacts and both initial/resumed identities.
A profile does not carry a subject-supplied complete flag. Admission verifies its
referenced bytes and supported fixed schema before any real upstream reservation.
The evaluator rechecks binary/configuration identities on each invocation and
complete request declarations on each request; paths that vary per fixture are
normalized only through explicitly named owned-root substitutions.

Physical reservations live under the existing campaign in a dedicated directory,
with monotonic exclusive ordinals, parent host-launch ID, immutable handoff digest,
model, request digest and terminal evidence. Count every started physical attempt;
completion does not replenish a slot. A dispatch reservation without a terminal
has unknown usage and prohibits dependent continuation. Only source-verified
pre-dispatch refusal can record no upstream request and zero provider usage.
Already completed records are read and verified on resume; missing, duplicate or
conflicting records refuse instead of being overwritten or reconstructed as zero.

A reservation callback reads completed earlier host/audit usage and the current
host's completed physical exchanges. It excludes the current unfinished host
summary and never adds both summaries and their constituent exchange usage.
Global and per-parent request counts, token ceilings and time bounds are checked
before dispatch. Token planning ceilings stop the next call on observed exhaustion;
they cannot guarantee a provider will not exceed a ceiling within one already
started request. A physical request maximum bounds that remaining exposure. The
report distinguishes planned cost from actual billing and does not price a
ChatGPT subscription request as an API invoice.

## Response-release slice: proposed freeze

This slice implements the declared direct-tool restriction at the collector's own
execution boundary, independently of complete host admission. It changes the wire
parser/policy, recorder and their tests only. It does not claim native inventory
qualification from an allowed response or from a caller-supplied digest.

A collector may receive an explicit nonempty complete direct-declaration digest
from the pinned profile. Before reservation, compare the decoded ordered tool IDs,
types and declaration digests with that expected digest. Missing or changed
entries refuse before dispatch. Store the observed digest with retained evidence;
never copy profile instruction text into a model request to make it match.
The legacy wire-only caller without a profile remains unqualified and receives no
implicit inventory approval.

For this evaluation profile the only executable direct response items are custom
`functions.exec`, function `functions.wait` and function `clock.sleep`. Full
response buffering already precedes delivery. Check every added/done tool item
and the completed response's output list before releasing any bytes. Unknown
item types, duplicate identities, missing final calls, conflicting call IDs,
namespace/name/type changes and executable content hidden in unsupported event
forms refuse. Only assistant message and reasoning items are non-executable
allowed output types; neither supplies hidden-context interpretation. Verify
streamed call input/arguments against the final call, rather than checking only
the completed output and ignoring earlier actionable events. No arbitrary JavaScript
filter is introduced: nested effect confinement depends on the separate qualified
native source/runtime boundary.

On a response-policy refusal retain the full bounded upstream body and terminal
model/usage observation, publish the refusal and release no executable SSE bytes.
That exchange remains consumed, with known usage when available, and latches the
existing stop. Authentication/body-secret suppression takes priority over raw
retention. Never rewrite denied calls, silently omit items or send synthetic
success. Existing deadlines still stop allowed wait/sleep/cell execution.

Tests precede implementation and cover a forbidden collaboration or interactive
call appearing only in an added event, an allowed name replaced before terminal,
a terminal call absent from streamed inventory, duplicated call IDs, unknown output
items, mismatched streamed input, and allowed complete exec/wait/sleep sequences.
Recorder tests require no release, preserved real-shaped synthetic usage and no
second dispatch after denial. All fixtures are synthetic with mocked HTTPS.


### Capacity regression fixture isolation

The changed runtime correctly rejects the retained live qualification as stale.
Synthetic protocol tests must therefore load the unchanged production qualifier,
fixture setup and audit APIs from one isolated runtime made by the existing
`copyDirectionTestRuntime` helper with an explicit pending record. Copy the six
qualifier/setup/source files unchanged; preserve runtime and harness fingerprints.
Only `scripts/qualify-direction-transport.test.mjs` gains this test setup. No
production qualification record or validator changes to make those tests pass.
The production record remains historical until actual new qualification succeeds.
The separately reviewed live later-history harness remains a completion dependency.
