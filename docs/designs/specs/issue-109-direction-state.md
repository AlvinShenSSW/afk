# Issue 109: Canonical direction state and attempt accounting

## Spec review

Issue #109 gives direction checks one versioned, machine-readable source for
authorized intent, active policy and consumed audit calls. It replaces neither
the run's lifecycle ledger nor its existing content-repair allowance. Narrative
handoffs reference the structured direction fields instead of maintaining them.

The scope sources are approved issue #109 and Epic #106, especially F1/F4 and
R1/R2. The planning baseline is
`7791a912123e77cf1fbd3c98dda43e93bf76d570`, stacked after the completed #108 and
the #110 transport work. The shipped version will advance from `1.0.4` to
`1.0.5` through the authoritative marketplace field and its generator.

The helper is an artifact reader/writer. It does not call a model, authenticate
operator approval, run an audit, decide semantic alignment or control dispatch
outside its invocation. Issue #110 qualified a provisional version-0 experiment,
not this schema or a final #111 packet/profile. Its remaining qualification slot
and downstream acceptance belong to the driver, outside this implementation.

## Frozen issue contract

### Acceptance criteria

- **C1 — One authority:** a named version-1 record sequence owns baseline
  versions, active baseline digest, frozen policy/source, policy amendments,
  audit reservations and terminals. Checkers never extract these counts or
  digests from arbitrary narrative ledger prose.
- **C2 — Irrevocable reservation:** preparation alone consumes nothing. A
  successful reservation publication charges one slot before an availability
  attempt or model dispatch. Missing terminals, interrupted dispatch observation,
  malformed results, attempted unavailability and retries never refund it.
  Unknown prior consumption permits no further reservation until reconciled.
- **C3 — Sourced amendments:** active-run policy changes require a retained
  explicit operator instruction. They append history and preserve every charged
  slot. Invalid limits fail; zero and limits below consumption permit no new
  reservation. The driver cannot raise its own bound.
- **C4 — Faithful intent:** extract the already authorized request with source
  anchors and labeled assumptions. Separate technical implementation adjustments,
  evidence-backed factual clarification and operator-authorized intent change.
  Retain baseline versions and invalidate direction evidence after active
  baseline or policy digest changes.
- **C5 — Compatibility:** absent direction records mean direction-off. Explicit
  enablement of an active legacy run requires a recoverable baseline and
  conservative initialized audit accounting. Do not import completed/prior runs,
  rewrite completed runs or migrate/reset the existing content-repair ledger.
- **C6 — Concurrent and interrupted operations:** all mutations share one
  previous-digest sequence and exclusive next-record publication. Concurrent
  worktrees cannot both advance the same head through this API. Stale callers,
  partial initialization, orphan staging, invalid chains and ambiguous history
  have explicit, less-dispatch outcomes; no automatic retry or destructive repair.
- **C7 — Bounded integration:** expose the smallest state API needed for #111
  packet binding and result references. Reuse existing hashing, confined reads,
  immutable publication and secret exclusions. Preserve existing review-context
  and receipt schemas, provider defaults, #110 qualification records, repair
  allowance, gates, CI behavior and public skill triggers.

### Invariants and allowed changes

The run's `ledger.md` remains the lifecycle/scope and content-repair record.
The direction sequence owns only the structured direction fields. A baseline
source claim, authorization reference, digest or valid JSON is not authenticated
operator intent or proof a call occurred. The original source wording and
retained evidence remain inspectable.

Allowed changes are the versioned direction artifact API/CLI, its focused
instructions and tests, an optional direction config section with off/four
defaults, and required release metadata. The smallest causal boundary is local
direction-state preparation, validation and append operations. No scheduler,
model dispatcher, semantic direction checker, audit packet/result schema or
automatic workflow activation is added here.

Level 1 is interpreting intent, source evidence and factual clarification.
Level 2 is schema, digest, path, sequence and count validation when this helper
runs. Level 3 is using it before dispatch, honoring its refusal, retaining real
authority and not editing records outside it. No non-bypassable runtime,
tamper-proof approval record or power-loss durability is claimed.

## Assumptions and resolved questions

| Question | Decision and evidence | Limit |
| --- | --- | --- |
| Which publication primitive is available? | `publishImmutable` in `lib/gate/review-receipt.mjs` writes a unique stage file, verifies its bytes, then hard-links to an exclusive destination. Existing tests cover collision and failed linking. | It does not fsync or promise survival of power loss. Unsupported hard links fail; no rename/overwrite fallback. |
| How is the shared root found? | Reuse `mainWorktree` from `lib/gate/git.mjs`; require the existing ignored main-tree `.afk/runs/<run-id>` directory. | This helper does not claim a run or resolve scope collisions. The driver supplies its run. |
| Does the prose ledger provide mechanical accounting? | No. Only its existing run identity/lifecycle header is consulted for write admission; no repair or direction count is inferred from prose. | Header truth and concurrent lifecycle edits remain driver assertions. |
| What does no historical migration mean? | Do not rewrite or import completed/prior runs or repair accounting. Explicit enablement of an active legacy run may initialize documented prior direction attempts conservatively. | Unknown prior consumption cannot become zero through a larger limit or operator risk acceptance. |
| What if a reservation committed but the caller did not see success? | It remains charged and is found on reload by operation/attempt ID. Repeating that request never returns another dispatch opportunity. | The caller cannot infer whether a provider was contacted from the absence of a terminal. |
| Are evidence sources immutable? | Each source is a retained local snapshot with an exact-byte digest; a changed/missing source makes the relevant check unavailable. | A writer with filesystem authority can replace history and hashes outside the helper. |
| Is the final provider interface qualified? | No. #110's namespace is explicitly provisional; this state API does not make it a final packet adapter. | #111 and the driver own final-schema/profile validation and any authorized remaining live call. |

The local sequence protocol assumes a filesystem supporting exclusive hard-link
creation in one directory and cooperating appends through this API. It detects
preexisting symlinks, changed files and sequence collisions; it cannot exclude
hostile same-privilege directory replacement or deletion outside the helper.
Tests establish the exercised local filesystem behavior, not all network
filesystems or OS crash semantics. No external provider behavior is assumed.

## Approach

### One immutable sequence

Use this existing run's issue-local path:

```text
.afk/runs/<run-id>/issues/<issue-id>/direction/
  000001.json
  000002.json
  ...
```

Every file is an immutable record. Folding the complete contiguous sequence
derives the current state; there is no writable `head.json`, active-digest file,
counter file or second baseline store. Baseline and policy versions are payloads
inside that same sequence. Saved CLI output and narrative ledgers are views.

Sequential names serialize all operations, including policy/baseline changes and
reservations. Two writers holding the same expected head attempt the same next
filename; exactly one can publish through `publishImmutable`. The loser reports
`stale_head` after checking the destination and must reload. It does not retry
the mutation automatically under a newer policy or baseline.

### Exact version-1 types

All object shapes below reject unknown and missing keys. Persisted JSON uses
`canonicalBytes`: sorted object keys, preserved array order and exact Unicode,
safe integers, one final newline. Digests are lowercase SHA-256 of those exact
canonical bytes unless an evidence reference explicitly hashes raw file bytes.
There are no embedded self-digest fields.

`Id` is `[A-Za-z0-9][A-Za-z0-9._-]{0,99}`. Run and issue IDs use this grammar;
the issue ID is an opaque local identifier, not a provider-specific integer.
`Text` is a nonblank NUL-free string. `Digest` is 64 lowercase hexadecimal
characters. Times are UTC ISO strings of the form produced by `toISOString()`;
time never orders records or authorizes reclaiming a slot.

```text
EvidenceRef = { path: Text, digest: Digest }
Source = { id: Id, kind: "operator" | "issue" | "repository" | "config",
           origin: Text, evidence: EvidenceRef }
Anchor = { sourceId: Id, startLine: positive integer, endLine: positive integer }
Clause = { id: Id, text: Text, sources: nonempty Anchor[] }
Assumption = { id: Id, text: Text, kind: "technical" | "product-decision",
               status: "open" | "resolved", sources: Anchor[] }
Fact = { id: Id, text: Text, sources: nonempty Anchor[] }
```

Evidence paths are forward-slash paths relative to the existing run directory,
without empty, dot, dot-dot, absolute or excluded components. Sources may name
the original issue/message/commit in `origin`, but URLs are locators only;
the helper reads the retained local snapshot and checks its exact digest.
Anchors must reference a source in the same baseline and valid inclusive lines.
Empty assumption sources are permitted only for an open labeled assumption.
Resolved assumptions need evidence. All IDs in each baseline are unique across
clauses, assumptions and facts; source IDs have their own unique namespace.

```text
Baseline = {
  version: 1, revision: positive integer, previousDigest: Digest | null,
  change: { kind: "extraction" | "clarification" | "intent-change",
            reason: Text, evidence: EvidenceRef[], authorization: Source | null },
  sources: nonempty Source[],
  outcomes: nonempty Clause[], acceptance: nonempty Clause[],
  invariants: Clause[], nonGoals: Clause[], priorities: Clause[],
  allowedChanges: Clause[], publicationLimits: Clause[],
  assumptions: Assumption[], facts: Fact[]
}
PolicySource = { kind: "built-in" | "config" | "operator", source: Source | null }
Policy = {
  version: 1, revision: positive integer, previousDigest: Digest | null,
  mode: "off" | "shadow" | "required", maxAuditAttempts: nonnegative safe integer,
  sources: { mode: PolicySource, maxAuditAttempts: PolicySource },
  amendment: { reason: Text, authorization: Source } | null
}
PriorAttempt = { id: Id, evidence: nonempty EvidenceRef[] }
Accounting = { knowledge: "known" | "unknown", priorAttempts: PriorAttempt[],
               reason: Text, evidence: nonempty EvidenceRef[] }
```

Initial baseline/policy revisions are 1 with null previous digests. Successors
increment by one and bind their prior canonical digest. Built-in policy sources
alone have null `source`; config/operator sources require their matching kind.
An authorization source always has kind `operator`. Empty policy/intent source
claims cannot substitute for retained evidence.

`Accounting` describes reconstructed pre-initialization direction attempts only.
Each prior attempt is charged once by unique ID; IDs cannot collide with later
reservation IDs. `knowledge: unknown` preserves the known lower bound while
withholding any further reservation. Its reason/evidence describes what was
examined and what remains uncertain. Known zero requires positive retained
initialization evidence; a blank ledger or no receipt is not that evidence.

```text
Binding = {
  phase: "initial" | "endpoint" | "signal",
  baselineDigest: Digest, policyDigest: Digest,
  targetDigest: Digest, packet: EvidenceRef
}
Terminal = {
  attemptId: Id,
  kind: "result" | "error" | "timeout" | "unavailable" | "malformed" | "interrupted",
  dispatch: "started" | "not-started" | "unknown",
  exitCode: integer | null, reason: Text,
  evidence: nonempty EvidenceRef[], result: EvidenceRef | null
}
Record = {
  version: 1, runId: Id, issueId: Id, sequence: positive integer,
  previousDigest: Digest | null, operationId: Id, recordedAt: UTC time,
  operation: "initialize" | "baseline" | "policy" | "reserve" | "terminal" | "reconcile",
  payload: payload for that operation
}
```

The sequence's first record has sequence 1 and null previous digest; all others
bind the immediately prior record's digest and increment by one. Operation IDs
are globally unique in that sequence. Record filenames must exactly match the
six-digit sequence number, with no gaps or duplicate numerical spellings.

| Operation | Exact payload and transition |
| --- | --- |
| `initialize` | `{ baseline: Baseline, policy: Policy, authorization: Source, accounting: Accounting }`; first record only, explicit source-authorized enablement or off initialization in an active existing run. Baseline change is extraction; policy amendment is null. |
| `baseline` | `{ baseline: Baseline }`; append a validated successor. Never resets policy, attempts or accounting. |
| `policy` | `{ policy: Policy }`; successor with nonnull sourced amendment, including a decrease, disabling or re-enabling. Never resets baseline or counts. |
| `reserve` | `{ attemptId: Id, binding: Binding }`; current baseline/policy binding, existing packet bytes, known accounting, mode not off and charged count below limit. Unique attempt ID. |
| `terminal` | `{ terminal: Terminal }`; refers to one existing reserved attempt that has no terminal. No refund. A terminal may arrive after policy/baseline changed; it remains historical evidence bound to the original reservation. |
| `reconcile` | `{ accounting: Accounting }`; a successor factual reconstruction of pre-initialization history, retaining every already known prior attempt and its evidence. It may add attempts or mark knowledge unknown; it cannot remove/rewrite known attempts. |

For `result`, `result` is nonnull, dispatch is `started` and exitCode is 0 or
unknown; `interrupted` cannot claim a successful exit. Other kinds have null
`result`; execution values are observations, not inferred from the kind. A
`not-started` unavailable/cancelled-before-dispatch attempt is still charged
because its reservation was already published. Missing evidence cannot be
invented to manufacture a terminal; leaving it absent preserves the charged
reservation. No terminal kind supplies a semantic audit verdict or approval.

`targetDigest` and packet/result references are opaque bindings at this layer.
Issue #111 computes the target descriptor using the existing target utilities,
validates the packet/result schema, and checks actual target freshness. #109
verifies reference bytes, phase and current baseline/policy binding only. This
avoids freezing a second provisional packet schema or changing review receipts.

The source-versus-opaque boundary follows those exact existing record roles,
not arbitrary keys inside referenced JSON. Only `reserve.payload.binding.packet`
and `terminal.payload.terminal.result` defer content secret inspection to #111.
They still require confined nonsymlink, nonexcluded paths, byte limits, strict
UTF-8/NUL validation and exact digests. The state helper neither emits nor
dispatches their raw bytes. Issue #111 must validate and sanitize packet content
before dispatch and result content before use; reference consistency is not
that inspection or an assertion that the content is safe.

Every Source, baseline-change/accounting evidence and Terminal.evidence reference
retains strict secret scanning. Cache identity includes the validation class,
so a reference checked as opaque cannot satisfy a later source/evidence read.
The same reference in both roles must pass the stronger check regardless of
encounter order. R109-1 exposed the prior assumption that a blanket raw-text
secret scan could also admit ordinary digest-bearing JSON; typed reference
checks and mixed-role regressions replace that assumption without changing shapes.

### Intent extraction and successors

Extract clauses from already granted scope without a second approval ceremony.
Retain the original operator wording in local source snapshots when needed to
check interpretation. Never infer new priorities, product outcomes or
publication authority from implementation preferences. Empty optional clause
arrays mean the source specified none; they do not mean permission to invent
them. Open product decisions stay labeled and cannot be silently resolved by
the implementer.

- An **implementation adjustment** changes the plan or implementation within
  the same outcomes/constraints. Record rationale and verification in existing
  work evidence; it does not append a baseline merely because the file plan
  changed.
- A **clarification** changes technical facts or resolves assumptions from
  repository evidence. Require nonempty change evidence. All clause arrays
  (outcomes through publicationLimits) remain byte-equivalent; source additions,
  facts and technical-assumption resolution can change. All product-decision
  assumptions remain byte-equivalent, including their identity and status. A
  clarification has null authorization and retains existing source definitions.
- An **intent change** may alter clauses, priorities, non-goals, allowed behavior
  or authority, or settle a product decision. Require a source-linked operator
  authorization for that successor before append; an unapproved proposal stays
  outside active state. The helper checks the reference and shape, not whether
  the operator's words really authorize that change.

Any active baseline or policy digest change makes prior direction results
inapplicable to the new binding. Raw evidence can be reused only after its
applicability is checked by the consuming audit flow. A new digest, revision,
model, session or worktree creates no new call allowance. Policy off removes
only the additional direction requirement; it does not resolve a verified
finding or waive an existing repository gate.

### Policy, arithmetic and accounting

Add the optional config section `## direction` with `mode: off` and
`max-audit-attempts: 4`. Use `readConfigSectionStrict` for parsing; blank fields
resolve to built-ins, and malformed explicit mode or a limit other than a
nonnegative safe integer is `invalid_policy`. No silent fallback for malformed
values or unreadable config. Explicit operator values take precedence with
their retained source. The initial policy captures both effective values and
their sources; later config edits do not mutate active state. Every subsequent
policy change uses a sourced amendment record.

Defaults alone never enable an existing run. A run with no direction sequence
reads as `off` even if its present config has changed. Initialization is an
explicit operation on an active run with its source authorization, recoverable
baseline and accounting. A policy-off sequence can accept amendments/terminals
and retain its history, but cannot reserve a model attempt.

Charged calls equal the number of distinct known prior attempts plus every
successfully published reservation, regardless of terminal presence or outcome.
`reserved` in the view means charged reservations without terminals; it is a
subset of charged, not additional consumption. Remaining capacity is
`max(0, maxAuditAttempts - charged)` only when accounting is known. If accounting
is unknown, remaining is null and reservation is refused.

The default four covers initial + endpoint + two repair-driven endpoint calls.
There is no retry headroom. A malformed response or unavailable attempted call
uses one of those four; a retry needs a new reservation/attempt ID. Preparation,
printing/checking packets and detecting unavailable prerequisites before reserve
consume nothing. Once reserved, even a trustworthy later `not-started`
observation does not refund the slot. This conservative boundary handles a crash
between publication and dispatch without inventing a free retry.

Zero permits no reservation. Lowering the limit below charged consumption keeps
that consumption and all pending terminals, returns remaining zero, and permits
no new reservation. A larger explicit operator limit increases the bound rather
than resetting the counter. An invalid amendment publishes nothing. A legitimate
increase still cannot waive unknown accounting. Reconciliation may establish a
known conservative total from retained evidence, never erase confirmed calls.

The existing content-repair limit and #110's private qualification allowance
remain separate. Direction-state writes do not reserve or reset repair cycles,
and a direction call is not itself a content repair. The driver continues the
existing shared content-repair rules for any resulting edits.

### Publication and concurrency algorithm

1. Resolve the main worktree and supplied run/issue identity. Require `.afk/`
   ignored, an existing run, and real nonsymlink ancestors. Read the existing
   ledger header with the shared parser, rejecting absent/mismatched run ID,
   missing/duplicate lifecycle fields or state other than active for writes.
   Do not inspect ledger prose for accounting or infer scope authorization.
2. Read and validate the entire direction sequence and referenced evidence with
   confined, bounded, strict UTF-8 reads. Canonical record bytes, filenames,
   identity, previous digests and every transition must agree. Compare the
   caller's exact expected head `{ sequence, digest }`; initialization expects
   `{ sequence: 0, digest: null }`. No last-writer-wins overwrite is available.
3. Validate the requested transition and active baseline/policy binding. Stage
   only a complete validated next record. Recheck directory safety, lifecycle
   header and expected head immediately before exclusive publication.
4. Publish to the deterministic next sequence filename using `publishImmutable`.
   A concurrent baseline/policy/reservation/terminal wins that same filename and
   causes a collision; stale state cannot overwrite it. Return the new head
   only after publication and read-back validation. If post-publication checks
   cannot establish the outcome, return `publication_unknown` and require reload,
   never report no effect or refund a reservation.

All append requests, including terminals and reconciliation, use an explicit
expected head. A caller may deliberately prepare a new request after reload;
the helper never retries a failed append or silently rebinds an operation.
Read-only checks re-list after reading and report `state_changed` if the sequence
changed during inspection, instead of claiming one mixed view was consistent.

The current baseline/policy binding must be rechecked by #111 before actual
dispatch and after the result, along with its actual target. An intervening
policy/baseline append can make a published reservation unusable but never free.
Concurrent unrelated reservations/terminals do not change that binding. This
helper does not hold a filesystem lock across a provider call or make a grant
that remains valid indefinitely.

### Interruption, idempotency and recovery

| Observed state | Required result |
| --- | --- |
| No direction directory | Read-only off; no files or counters created. Explicit initialization may create safe issue/direction directories. |
| Empty directory or only `.stage-*` files | Incomplete initialization, unavailable for reservation. Explicit initialization may compete for `000001.json` after validating the retained request; no stage file is promoted or deleted. |
| Staging failed before final link | No committed operation. Preserve leftovers and log a distinct orphan-stage notice. Preparation consumed no slot; dispatch must not have begun without a successful reservation. |
| Reservation linked, caller interrupted before observing success | Reload finds the charged attempt by operation/attempt ID. Missing terminal remains charged; never repeat dispatch on the old reservation solely because the reply was lost. |
| Same operation ID submitted again | If exact operation/payload is already committed, return `already_recorded` with its record locator and no new publication or dispatch eligibility. Different payload is `operation_conflict`. |
| Terminal publication failed or terminal missing | Reservation remains charged/pending. Record a terminal only from real available observations; terminal retry uses a new expected head without charging another model call. |
| Missing/gapped/malformed/noncanonical record or wrong previous digest | Invalid/unavailable state; no append, no skipped record and no automatic truncation. Restore exact original bytes from retained evidence or leave OUTSTANDING. |
| Unknown pre-initialization history | Record its known lower bound and unknown status. Reconcile only from retained source evidence, with no reduction of confirmed calls. No limit change or blank ledger bypasses this state. |
| Completed run | Read-only inspection permitted; initialization and every append refused. Never reopen, rewrite or import it into another run automatically. |

An orphan staging file is not an authoritative operation and is never replayed.
Report its presence without reading it as state or erasing it. In a valid
sequence it does not add a call: only a successfully published reservation may
precede dispatch. If evidence suggests calls occurred outside that protocol,
record accounting unknown and stop further reservations until reconciled.
Missing terminal alone leaves execution unknown but consumption known.

The no-overwrite protocol protects cooperating concurrent appends. It cannot
detect an attacker deleting the entire valid tail without any retained expected
head, authenticate ledger lifecycle edits, or atomically coordinate external
changes to operator messages/targets. Callers retain expected bindings across
resume, and source digests expose ordinary mutation. Broader trust or crash-safe
storage is outside this artifact helper.

## Minimal API and execution surface

Add `lib/direction/schema.mjs` for exact shapes, canonical content digests,
baseline/policy transitions and pure state folding; add `lib/direction/state.mjs`
for confined reads, source checks, location/admission, append and derived views.
Import `canonicalBytes`, `digestBytes`, `publishImmutable`,
`readConfinedUtf8File`, `isExcluded`, `redactCredential`, `byteLength`,
`mainWorktree`, `gitTry`, `parseLedger` and `readConfigSectionStrict` from their
current shared owners. No receipt-schema or transport changes are needed.

Use one exported `LIMITS` object in the direction schema: record/request bytes
100000, evidence bytes 100000, total sequence bytes 4194304 and records 4096.
Read at most the relevant byte cap plus one; reject overflow and invalid UTF-8
without truncation. Stop directory enumeration at the record bound and report
the reason. These are artifact resource ceilings, not model spending limits.
Apply secret checks to free-text metadata and source bytes; validate designated
digest fields separately so hashes are not mistaken for secrets. Do not read
credentials, traverse excluded sources or silently redact authoritative bytes.
Opaque packet/result content follows the explicit deferred inspection above;
this exception does not apply to any source or evidence role.

Export these operations only:

```text
resolveDirectionPolicy({ cwd, runId, overrides, configSource }) -> initial Policy
readDirectionState({ cwd, runId, issueId, expected? }) -> CheckResult
appendDirectionRecord({ cwd, request }) -> MutationResult
```

`expected`, when provided to a read, is
`{ head: { sequence, digest }, baselineDigest, policyDigest }`; mismatch returns
stale rather than consistency for an unintended candidate. The #111 packet flow
can use the returned active baseline/policy and their digests, charged/pending
counts, reservation bindings and opaque result references. It must separately
validate semantic packet/results, actual target and observed auditor identity.

The policy resolver reads only the main worktree's `.afk/config.md` and explicit
source evidence in the stated run. `overrides` has only optional `mode` and
`maxAuditAttempts` keys; each present value is `{ value, source: Source }` with
an operator source and the corresponding validated scalar. `configSource` is a
config-kind Source or null. When a nonblank configured field supplies a value,
require its source snapshot to match the current config's exact bytes. Confine
and bound that config read, use `readConfigSectionStrict`, and compare the bytes
again afterward so a concurrent config edit refuses resolution. Absent/blank
fields use built-in sources; unreadable or malformed present input fails. The
resolver returns revision 1, null previous digest and null amendment; it writes
nothing and does not enable the run. Policy amendments carry their full explicit
successor in the apply request and never reread config as an implicit amendment.

```text
Request = { version: 1, runId: Id, issueId: Id, operationId: Id,
            expectedHead: { sequence: nonnegative integer, digest: Digest | null },
            operation: Record.operation, payload: operation payload }
CheckResult = {
  version: 1, status: "off" | "valid" | "invalid" | "unavailable" | "stale",
  reasons: Text[], head: { sequence, digest } | null,
  baseline: Baseline | null, baselineDigest: Digest | null,
  policy: Policy | null, policyDigest: Digest | null,
  accounting: { knowledge, charged, reserved, remaining } | null,
  attempts: array of prior/reserved attempts with their record/terminal locators,
  canReserve: boolean
}
MutationResult = { version: 1,
  status: "published" | "already_recorded" | "refused" | "publication_unknown",
  reasons: Text[], record: { sequence, digest, path } | null,
  state: CheckResult | null }
```

Define the attempt view exactly in implementation tests as
`{ id, origin: "prior" | "reservation", reservation: {sequence,digest,path} | null,
binding: Binding | null, terminal: {sequence,digest,path,value:Terminal} | null }`.
Prior attempts have null reservation/binding/terminal and remain visible through
the initialized Accounting payload. `canReserve` is a current artifact-admission
answer, never an authenticated operator permission or reusable dispatch token.
Unavailable/invalid/stale reads always return false and never substitute zeros.

Add one manual CLI `scripts/direction-state.mjs`:

```sh
node "<plugin-root>/scripts/direction-state.mjs" check --run-id <run-id> --issue <issue-id>
node "<plugin-root>/scripts/direction-state.mjs" apply --request <request.json>
```

`check` optionally accepts `--expected <expected.json>`. Both input files are
canonical JSON confined to the supplied run (the apply request is first loaded
through the main `.afk/runs` root, then checked against its stated run).
CLI parsing rejects missing, repeated or unknown options. Output is one
canonical JSON result; distinct reasons are retained for all refusals/no-effects.
Exit 0 for a valid/off read, successful publication or exact already-recorded
operation; exit 1 for invalid, unavailable, stale, refused or unknown publication.
An off/exhausted but valid read may exit 0 with `canReserve: false`; consumers
must read that field and the explicit reason, not equate exit zero with dispatch.

The CLI reads existing run header, direction records, explicit retained request
and evidence files. `apply` may create safe issue/direction directories and append
one record plus its temporary staging file, never edit the ledger. It has no
network, provider, automatic repair, publication or credential side effects.
Configuration is read only during explicit policy resolution, not silently on
every resume; the CLI request carries the resolved policy and source evidence.

Only this design is writable now. After a clean independent design critique,
the root driver may authorize the files below; listing a dependency grants only
read/execute access, not modification. Tests use disposable synthetic repositories
and linked worktrees, never the real run ledger.

## Files to change

| Path | Change | Reason |
| --- | --- | --- |
| `docs/designs/specs/issue-109-direction-state.md` | Add | Freeze schema, transitions, limits and validation scope. |
| `lib/direction/schema.mjs`, `lib/direction/schema.test.mjs` | Add | Versioned shapes and pure transition/accounting checks. |
| `lib/direction/state.mjs`, `lib/direction/state.test.mjs` | Add | Confined immutable sequence and concurrent/interrupted operation tests. |
| `scripts/direction-state.mjs`, `scripts/direction-state.test.mjs` | Add | Explicit check/apply interface without model dispatch. |
| `skills/afk/references/direction-state.md` | Add | Conditional state initialization/read/amend guidance and intent distinctions. |
| `skills/afk/references/output.md`, `skills/afk/references/continuity.md` | Edit | Read canonical direction fields when present; preserve narrative repair/lifecycle ownership. |
| `skills/afk/SKILL.md` | Edit | Conditional route before explicit direction-state operations, without enabling audit workflow. |
| `templates/afk-config.example.md` | Edit | Optional off/four configuration and amendment/source rule. |
| `scripts/instruction-routing.test.mjs`, `scripts/stage-handoff-rules.test.mjs` | Edit | Follow the new canonical state reference and preserve #108 handoff contract. |
| `.claude-plugin/marketplace.json` | Edit source then generate | Advance the `afk-skills` plugin version to 1.0.5. |
| `plugin.json`, `.codex-plugin/plugin.json`, `.github/plugin/marketplace.json`, `package.json` | Generate | Synchronize shipped cache version. |

Generator: `node scripts/sync-marketplace.mjs`, run in the checkout after the
source version change. Inputs are the marketplace, skill inventory and preserved
host metadata. It writes the listed mirrors, source metadata and the existing
`.agents/plugins/marketplace.json` only if drifted (expected unchanged). Its
`--check` form does not write. No external service participates.

The existing evaluation export already includes `lib/direction/**` and
`skills/**`; the new manual state CLI is not automatically added to behavior
subjects. #112/#111 own the actual invocation/export integration when required.
Do not change #110's provisional helper, fixtures or remaining qualification
allowance to make this schema appear transport-qualified.

## Risk assessment

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| Charged attempts disappear after interruption | Plausible / unbounded extra calls | Immutable reservation first; no refunds, replay dispatch or inferred zero. |
| Concurrent policy change permits stale reservation | Plausible / obsolete authority or bound | Every operation competes for the same next sequence filename and expected head; #111 checks binding again at dispatch. |
| A source claim is mistaken for authorization proof | Plausible / unauthorized intent or policy | Retain source bytes and distinguish semantic judgment from artifact consistency. |
| Corruption or filesystem limits leave a run unavailable | Plausible / stalled audit work | Preserve files, name reason, recover exact evidence only; ordinary independent authorized work remains available. |
| New state duplicates existing repair accounting | Low / replenished repair budget | Store direction calls only; ledger repair rules unchanged. |
| Schema prematurely claims final transport support | Plausible / unsupported #111 acceptance | Packet/result bytes are opaque bindings here; #110 final qualification remains explicitly OUTSTANDING. |

## Tests-first plan

1. Add synthetic schema/transition tests before implementation: exact version and
   keys, canonical duplicate-key rejection, safe integers/IDs/times, source line
   anchors, duplicate IDs, missing/excluded/sensitive evidence, baseline digest
   arithmetic and clarification versus sourced intent-change admission.
2. Add sequence tests before I/O code: first initialization, immutable collision,
   stale expected head, competing child processes from two linked worktrees,
   policy/baseline race with reservation, no auto-retry and exact operation-ID
   replay without a new dispatch opportunity. Test both winners and both losers'
   retained bytes, not just the happy path.
3. Inject interruption before staging, before link, after link/before reply and
   during terminal publication. Assert no partial authoritative record, orphan
   stage preservation/notices, charged missing-terminal slots and explicit
   publication-unknown reload. Exercise empty partial init, gapped/malformed
   chains, symlinked ancestors/files, changed inode/bytes, bounded invalid UTF-8,
   byte/count limits and unsupported hard links without overwrite fallback.
4. Test accounting reconstruction and restart: known zero with evidence, known
   prior attempts, unknown lower bound, sourced reconciliation retaining all
   known IDs, every reservation outcome charged, terminal replay/conflict,
   config change without amendment, invalid/zero/lowered/increased limits,
   off/re-enable preserving counts and refusal for completed/missing runs.
5. Demonstrate four-call arithmetic with initial, endpoint and two repair
   endpoint reservations. A fifth and a provider retry after exhaustion fail.
   Reopening sessions/worktrees or changing baseline/policy never replenishes.
   A previously reserved terminal can still be recorded after exhaustion.
   Assert the narrative ledger and all preexisting repair/qualification artifacts
   are byte-identical after every helper operation.
6. Test CLI option errors, confinement, exit/result distinction, check no-writes,
   apply one-record side effects and absence of provider/network calls. Bind
   opaque synthetic packets/results and require exact digest matches without
   treating their contents as approval. Verify routing, trigger/default retention
   and export coverage separately from runtime behavior.
7. Record focused RED, implement minimally, then run
   `node --test lib/direction/schema.test.mjs lib/direction/state.test.mjs
   scripts/direction-state.test.mjs scripts/instruction-routing.test.mjs
   scripts/stage-handoff-rules.test.mjs scripts/review-budget-rules.test.mjs
   lib/gate/review-receipt.test.mjs lib/gate/file-boundary.test.mjs`.
   This is a partial suite. Broaden only for a concrete affected consumer.
8. Run manifest sync check, skill lint, link checks, tracked provenance scan,
   Markdown lint and diff whitespace checks. Inspect new untracked files too;
   repeat tracked-only checks after staging. The root driver owns the unfiltered
   final `node --test`, which contains two live Claude probe tests, under its
   separate authorization. This subtask performs no provider calls.

Deterministic tests can establish artifact consistency when invoked. Real
handoff/resume, intent interpretation and direction behavior remain owned by
issues #112/#113. A green state checker is neither a semantic outcome nor
evidence that a model audit ran. Record the final implementation revision for
those later trials.

## Non-goals and handoff

No dispatcher, scheduler, model retry/fallback, new runtime, automatic rollback,
new review role, fixed audit packet/result protocol, receipt/context rewrite,
global memory, historical-run import or content-repair migration. No parent
P2/minor cleanup merely because a shared utility is read; #110 S110-3/N110-5/
N110-6 and minor findings remain parent-owned.

The root driver owns live stack/PR status, finding admission, repair reservation,
independent design critique, final checks, qualification spending and publication.
Do not implement until that design critique is clean and implementation is
explicitly authorized. Current issue repair consumption is 0 of 2; this document
does not reserve a cycle or create a second account of it.
