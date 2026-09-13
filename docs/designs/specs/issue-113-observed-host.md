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
