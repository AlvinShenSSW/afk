---
name: afk
description: Away-From-Keyboard autonomous execution. Use when the operator hands off a PRE-SCOPED, pre-reviewed set of issues/PRs for full autonomous execution until the queue is done. Requires an operator-provided scope — never pick work from the tracker yourself. Triggers include "/afk", "AFK mode", "go AFK on …".
---

# afk

Hand-off mode: the operator designed and reviewed a scope; you execute exactly
that queue autonomously and stop yourself when done or stuck. This file is the
self-contained spec.

## Kickoff (every time)

1. **Require a scope.** The operator must name the explicit issues/PRs (and/or
   file areas) to touch. **No scope → stop and ask.** Never browse the tracker
   and pick work yourself; the scope fences everything you may touch.
2. **Notice and auto-bootstrap.** If `.afk/` is absent, run the `afk-init`
   bootstrap automatically; it calls the shared notice CLI. Otherwise run
   `node "<plugin-root>/scripts/gate-profile-notice.mjs" --afk-dir
   "<main-worktree>/.afk" --plugin-root "<plugin-root>"` now and pass on any line
   it prints. This one implementation owns the receipt for kickoff, init, and
   SessionStart. Bootstrap remains idempotent: add the ignore entry, detect
   commands, record `pluginRoot`, announce it, and continue. No manual step;
   `/afk-init` stays available to re-run detection.
3. **Update check.** Run the bundled update check; if the installed plugin is
   behind the canonical repo's latest version, surface a one-line notice. Never
   block on it (silent when offline).
4. **Resolve the PR gate profile.** Explicit role flags in the handoff (e.g.
   `-codex -kimi`) select this run's ordered roles; otherwise a config `gates`
   key, else a legacy profile (`priority`, `min-pass`, or `mode` with no
   `gates` keeps the legacy behavior), else built-in `gates: codex` — a single
   external review ("External gate" below owns the full rules). The bounded
   notice was resolved by step 2. Resolve the implementer and a
   complete locally plausible role assignment now. Missing reviewer capacity is
   an anticipated readiness blocker, not a reason to discard safe issue work.
5. **Confirm the merge policy** (from `.afk/config.md`: `leave-open` default /
   `merge-to-unblock` / `merge-when-green`) and any constraints (branches not to
   touch, naming, safe-direction-only, deploy is the operator's job, summary
   language, explicit gate choice).
6. **Restate the scope and the effective gate profile with its source**
   (`flags` / `config` / `legacy` / `built-in`) in one or two lines, then
   start. The restatement is what makes a misread flag or a template-written
   profile visible before any paid work.

## Per issue — the full waterfall (one at a time)

**Every issue runs the full waterfall — no exceptions.** Each in-scope PR passes
internal review AND the external gate(s) AND lands green (merged, or under
`leave-open` marked ready only after internal review + gate + full test suite all
pass). A design doc, a pushed branch, or a draft PR is a mid-waterfall
checkpoint — never a stopping point and never an operator handoff. "Next:
operator runs the review" is a bug, not an end state.

design doc with a frozen issue contract → adversarial debate (rules below;
evidence and material progress govern convergence, never round count) →
design-stage external gate (opt-in pilot, default off; one role per evaluation —
"Design-stage external gate" below) → tests
first (targeted) → implementation → adversarial sweep →
commit → push early → open the PR as draft → deterministic CI green (fix red
now) → **internal review** (`afk-internal-review`) → triage every finding and
batch-fix admitted P1s plus eligible lower-severity work →
**external gate(s)** (the loop, closure, and termination — rule below) →
**full test suite once** (the project's test command from `.afk/config.md`) on
the final commit → mark ready → merge per policy. The design doc matters more
than the code.

- Scale design/debate depth to the work: mechanical, well-specified work gets a
  brief design and one debate round; design-heavy work gets the full treatment.
  Never scale down tests or gates.
- **Green** = deterministic CI green AND the full test suite green on the final
  commit. A green PR page alone is not green. Never mark ready before the suite
  is green.

**Freeze the issue contract before implementation.** The design records the
acceptance criteria, product and engineering invariants, explicit non-goals,
allowed user-visible behavior changes, and the smallest causal boundary the fix
may operate in. Every implementation edit and admitted finding maps to one of
those items. Repository evidence may correct the contract; a reviewer's
architectural preference may not. Anything else is `OUT-OF-SCOPE`: record it for
the operator, do not implement it, and do not create a follow-up issue
automatically.

## Adversarial debate (the design-stage check)

The critic is a subagent, usually the driver's own model. It is cheap, so it runs
on every design — but being same-model, it can only test claims it *notices*, and
it shares the author's blind spot about what was never considered at all. It is
therefore a check on the design's **claims**, not proof of the design's
**completeness**; an external design gate, where configured, covers omissions and
framing that this step structurally cannot.

**Posture, not verdict.** The critic is dispatched to break the design across
named lenses, and each finding lands as `supported`, `refuted`, or `unverified`.
Do **not** predetermine the outcome: a critic told the answer is "refuted"
invents objections and can never return a clean pass on a sound design. "No
finding" is a valid, reportable result. Reject an unsupported finding as firmly
as an unsupported design claim.

**Every finding carries a severity proposal.** Posture says whether the finding
holds; severity says what it costs. A reviewer does not admit its own blocker:
the author validates and classifies it against the frozen contract.

- **P1** — the design is wrong, or rests on a claim that is wrong or unverified.
  Building it yields a defect, a rewrite, or a hole.
- **P2** — a real weakness the design survives: a cost, a gap, or a risk worth
  taking knowingly.
- **minor** — a non-structural improvement with no demonstrated wrong user or
  system outcome. It is never promoted merely because a reviewer repeats it.

An unlabelled finding starts `UNTRIAGED`. It prevents a clean round until
classified, but never authorizes a code or design change by itself. Admit P1 only
after recording all five elements: the frozen issue contract or an invariant it
violates; the reachable condition that triggers it; a failing check, executed
trace, or complete causal path to the wrong consequence; why the current artifact
cannot safely enter the next waterfall stage; and the minimal causal fix. Missing
one keeps the proposal untriaged or classifies it P2, minor, or out-of-scope.
For a load-bearing claim that cannot be verified, the demonstrated consequence
is that the artifact explicitly depends on it, cannot verify it by any available
safe means, and identifies the wrong-side outcome if the assumption fails. Mere
absence of evidence is not enough.

**Verify claims about external systems — by the cheapest SAFE means.** A design
that asserts how a CLI behaves, what a permission model allows, what a command
returns, or what a config does is asserting a fact, and the debate's job is to
check it rather than reason about it. In descending preference:

1. A hermetic experiment in a disposable workspace (temp dir, scratch repo,
   fixture). Preferred — this is what catches an author and critic sharing a
   wrong belief.
2. Source, official documentation, or a recorded fixture.
3. Neither available → record it in the design as an **assumption and its risk**.
   An unverified claim is reported as unverified; it is never promoted to fact.

Bounds, which override the preference order: never mutate production, never run a
destructive action outside a disposable workspace, never paste credentials or
secrets into a finding. Record the environment and version with any result — a
local pass does not prove another OS, version, or configuration.

**Validate a finding independently; do not re-run it blindly.** The author
confirms a finding by the cheapest safe means — preferably a failing test — not
by repeating a destructive action, and never on the critic's authority alone.
Repeating it in the same environment is not independent confirmation.

**The round, and how the debate ends.** Assign every finding a stable ID. A round
is: the critic reports — first
the status of every finding still open from earlier rounds, each by name, then
anything new — the author validates each finding independently, then resolves it.
A supported P1 is always resolved by revising the design. A supported P2 is
resolved one of two ways — revise, or mark it `Deferred` with its reason, design
untouched. Deferring closes the finding without blocking the next stage; revising
does not: a finding resolved by revision stays **open** until a later round
revalidates the revised design against it, by name, and reports it resolved.
Critics are stochastic and miss things, so silence about an open finding is not
closure — an omitted finding is unexamined, not resolved. Then one of:

- **A clean round ends the debate** — no open finding, no unverified claim the
  design depends on, and no revision made this round. Implementation starts here
  and nowhere earlier.
- **Otherwise, debate the revised design again.** A revision is a new design: its
  fixes are themselves claims nobody has checked yet. A supported P1 is not
  discharged by editing the doc — only by a round that revalidates it by name
  and reports it resolved.

**Exit criteria — evidence and progress, never a counter.** Ask only: has the
design in front of you had a clean round? If yes, advance. If no — an untriaged
finding or admitted P1 is open, a claim the design depends on remains unverified,
or the design was revised after its last clean round — **do not start
implementing**. Continue while a round closes an admitted P1, turns a check green,
reduces a demonstrated shared root cause, a design version lands with its frozen
contract and a named next validation, or the waterfall cleanly advances.

Two consecutive unfinished rounds without material progress trigger an automatic
root-cause checkpoint: cluster the stable finding IDs, remove duplicates and
unsupported scope, sweep the whole design against the contract, and make one
minimal batch revision. A clean terminal round never counts as stalled. If the
checkpoint still cannot progress, mark the issue `OUTSTANDING` and continue
independent queued work. Escalate only if the task depends on scope expansion, an
unavailable external capability, or a product choice with no safe default. Round
count never requests operator permission. Abandoning or replanning a verified P1
that cannot be fixed inside the frozen contract is also an operator authority
decision, not a driver-owned deferral.

This is level 3 — doctrine, not a guarantee (AGENTS.md, "What this plugin can and
cannot enforce"). Nothing stops a driver from implementing anyway. It stops if it
follows this file, which is the same basis as every other step in the waterfall.

**Record what was refuted.** A claim the design made, believed, and got wrong
stays in the doc — but only where it links to what now prevents it: the corrected
decision, and the test or control that pins it. A refuted-claims list with no
such link is a diary; either give it a consumer or leave it out.

The ledger record — a deferred concern, or a P1 that stopped the run — is the only
durable artifact here, and it is what the operator reads.

## Design-stage external gate (opt-in pilot)

A pilot step, **default off**. When enabled it runs **one** external gate over the
design doc, after the adversarial debate and before tests: the debate is a
same-model check on the design's *claims*, and an independent model adds the one
thing it structurally cannot — a less-correlated search for *omissions and wrong
framing*. Configured in `.afk/config.md`:
`design-gate: off` (default, never) · `risky` (design-heavy or high-blast-radius
issues only) · `on` (every issue). `risky` follows the design **scaling** rule —
an external review of a three-paragraph design is waste — and is NOT the
never-scale-down-gates rule, which governs PR gates only.

- **Invocation.** The same gate helpers, selected the same way (`priority`), with
  a design target: `--design <path>` in place of a diff selector. The gate reviews
  the document, not a diff. It is read-only **by construction** for `codex`
  (`exec -s read-only`), `claude` (`Read,Grep,Glob` only), and `glm`, `deepseek`,
  and `mimo` (tool-less API calls); `kimi` is the exception — its read-only is only *requested in the
  prompt* (the same weaker guarantee it carries for diff reviews), so prefer
  another gate for design when one qualifies. A missing or unreadable `--design`
  path is operator error → the gate errors (nonzero), never a skip — skipping here
  would mean no independent review happened at all.
- **Independence is from the design's AUTHOR.** The guard's `--implementer` here
  identifies whoever wrote the *design*, not the code implementer a PR-gate
  `--implementer` names. In the usual case the driver authors the design, so it is
  omitted (the driver is assumed) and a same-model gate self-skips. Only when
  another model authored the design (a design relay) declare that model — do NOT
  pass the eventual code implementer, or a driver-authored design could be
  reviewed by the driver's own model, defeating this step.
- **Exactly one gate per design evaluation, regardless of PR `gates` length or
  legacy `min-pass`.** Those fields govern the PR gate; one independent role is
  the whole point here. A design-invalidating finding restarts the design step;
  later evaluations follow the debate's material-progress and automatic
  root-cause checkpoint, with no invocation counter that requests permission.
- **Findings close under the same vocabulary** the PR gate uses ("External gate":
  fixed / refuted / deferred / suppressed / contested); no design-stage finding is closed by silence. A
  `fixed` whose fix is "a test the implementation must carry" is recorded in the
  design doc as a required test, which the tests-first step then consumes.
- **A distinct `design-gate` ledger section.** Design-gate findings are recorded
  under their own section of `.afk/runs/<run-id>/ledger.md`, keyed by issue +
  design version, **separate from the PR-gate finding record**. The merge bar
  ("External gate") reads the PR-gate section only, so a design-stage `Deferred`
  never bars the PR merge — if that risk is still real in the shipped code, the PR
  gate raises it against the code, where the bar applies.
- **Baseline before the gate.** Before the gate runs, the driver pre-registers the
  debate's findings for this design version into the ledger, timestamped and
  closed before the gate is invoked, so a gate finding cannot be retro-labelled
  "the debate already had it". This is **self-reported evidence the operator
  adjudicates** — the same driver records both sets — not a plugin measurement:
  the operator, not the driver, decides whether a gate finding was genuinely new
  and whether the pilot is promoted toward `on` or retired.
- **A skipped design gate proceeds.** Unlike the PR gate — whose `SKIPPED` round
  is not clean — an environmental skip (no qualifying reviewer available) is
  recorded and the waterfall continues; the mandatory PR gate still follows.

All of this is level 3 — doctrine, not a guarantee (AGENTS.md, "What this plugin
can and cannot enforce").

## External gate (the independent check)

An external role sequence is **mandatory**. New/profileless configurations run
a **single Codex review**; ordered multi-role sequences — e.g. Codex as
**outer**, then Kimi as **final** — run only when explicitly selected by
handoff role flags or a config `gates` value. Every required clean result must
cover the same final revision. Each actual reviewer is a current-generation
mainstream frontier model, differs from the implementer, and differs from
every other role in the sequence.

### PR gate profile and compatibility

`gates` is the ordered required role list: first = `outer`, last = `final` when
there are two or more, and positions between are stable `intermediate-N` roles.
Its length is the required count. `priority` is the closed fallback pool for an
ineligible/unavailable preferred role; it does not add roles. Roles are always
waterfall—final is never parallelized.

Resolve the effective profile as one total function:

1. **Handoff role flags select ordered roles for this run.** A role flag is a
   whitespace-delimited token of the form `-<family>` or `--<family>` —
   one or two leading dashes, the family name matched case-insensitively (the
   config grammar's case rule), surrounding punctuation stripped — where `<family>`
   is `codex`, `claude`, `kimi`, `glm`, `deepseek`, or `mimo`. Flags are taken
   in writing order (first = outer, last = final when two or more; length =
   required count; `-codex -kimi` ⇒ Codex outer → Kimi final). A
   repeated family collapses into its first occurrence — a handoff typo must
   never silently add a paid role. A dash-led token plausibly intended as a role
   flag but naming no family (`-gemini`, `-kim`) selects nothing and is
   recorded in the ledger as an ignored lookalike; ordinary options like
   `--implementer` are not lookalikes. Quoted or declined mentions ("skip
   -kimi this time") are not selections — intent governs, and the step-6
   restatement makes any misread visible before paid work. Flags never mutate
   `.afk/config.md` and override a config `gates` value for this run only.
2. Otherwise a present `gates` key selects ordered roles. It uses `>` separators, ignores
   surrounding whitespace/case and a trailing comment, and must contain no empty
   segment. Valid role families are `codex`, `claude`, `kimi`, `glm`, `deepseek`, and `mimo`;
   an unknown preference is recorded and uses fallback. A later duplicate
   preference is ineligible and also uses fallback. Legacy `min-pass` and `mode`
   beside a valid `gates` key are ignored for PR roles without rewriting the file.
3. With no flags and no `gates`, any legacy external-gate field (`priority`,
   `min-pass`, or `mode`) preserves the complete legacy profile. Omitted legacy
   `min-pass` retains the former one-gate default.
4. Otherwise use built-in `gates: codex` — a single external review — and
   built-in priority `codex > claude > kimi > glm`.
   `design-gate` and `implementer` do not select PR role count/order.

**Fail-closed exception:** a present-but-empty `gates` key (or a malformed
value) is a blocking config error at every step — flags select roles; they
never mask a broken config, and it is never a fallback to one gate.

**Effective-profile lifetime.** The profile is resolved at kickoff, recorded
in the ledger with its source, and restated (step 6). A flag-derived profile
is per-run and ledger-held: ticks and resumes read it from the ledger;
flag absence in a later kickoff-bearing handoff is no statement, deferring to
the recorded profile; a flag statement resolving to an identical role list is a
ledger-recorded affirmation (no source switch, nothing stales). Only a
*differing* resolved list is a profile edit — every stamp stales and
assignment re-derives, announced by the step-6 restatement first. A config-,
legacy-, or built-in-sourced profile keeps live-config behavior: editing the
`## external gate` section stales stamps via the role-profile hash, as
always. A mid-run message that mentions a flag token without re-entering
kickoff is conversation, never a silent re-resolve.

Do not rewrite an existing legacy config. Emit one bounded notice with the exact
opt-in snippet. An existing no/profileless config gets a
one-time default-change notice; `gates: codex > kimi` in config, or
`-codex -kimi` on one handoff, is the explicit double opt-in. Hook, `afk-init`, and
kickoff all call `scripts/gate-profile-notice.mjs`; that shared implementation
owns the atomic at-least-once receipt keyed by plugin version plus recognized
external-gate profile fields (`AFK_GATE_PROFILE_NOTICE=off` opts out).

### Assignment, availability, and outcomes

Resolve every stable role before a paid verdict. Walk roles left-to-right; for
each, deduplicate `[preferred, ...priority]`, exclude the declared implementer
and already-used families, then choose the first locally plausible candidate.
The implementer must be known; a relay declares it. A missing complete plan is
recorded at kickoff but blocks **ready**, not safe implementation work. Recheck
unstamped roles immediately before review.

Local presence is deliberately narrow: Codex requires its binary plus `codex
login status`; Claude/Kimi require their binaries (and Claude rejects an alias in
`CLAUDE_REVIEW_MODEL`); GLM requires `ZAI_API_KEY`/`GLM_API_KEY`, DeepSeek
requires `DEEPSEEK_REVIEW_API_KEY`/`DEV_DEEPSEEK_API_KEY`, and MiMo requires
`MIMO_REVIEW_API_KEY`/`DEV_MIMO_API_KEY`, from the environment or ignored
`.env` locations. Remote auth, credit, network, and model identity may still
fail on first invocation.

- **Declare the implementer when it is not the driver.** Pass
  `--implementer <family>` to the gate whenever another model wrote the change —
  most often after `afk-agent-relay`. Each gate applies the no-self-review rule
  **on the runs routed through its helper** and, absent a declaration, assumes
  the driver is the implementer; under a Claude Code driver `afk-claude-review`
  therefore self-skips and the next gate in `priority` takes its place. That is
  correct behaviour, and it is why the flag matters: without it, a Codex-driven
  relay to Claude would let Claude review its own work.
  A helper cannot constrain a round it was never asked to run — the rule that
  the gate runs at all is doctrine (see AGENTS.md, "What this plugin can and
  cannot enforce").
- **Stickiness:** a provider is locked to its stable role for the PR and changes
  only for independence or availability. A substitution is recorded, resets the
  incoming provider's comparison baseline, and keeps the PR-wide finding archive
  and no-progress streak.
- **Classify the complete outcome.** Only a review message is a verdict.
  Stable-unavailable `SKIPPED` reasons (disabled/missing executable/credential;
  Claude-only quota/model-unavailable) trigger fallback. Independence refusal
  makes that provider ineligible. A rejected/missing driver-supplied implementer
  or bad target stops as a driver error. GLM transient `SKIPPED` and other gates'
  transient nonzero `ERROR` get one sticky retry per role per full sequence,
  then fallback. Unknown `ERROR` stops with its transcript. Skip/error attempts
  are not verdicts, do not increment the no-progress streak, and never count as
  clean.

Default assignment under built-in `gates: codex` is a
single role: Codex for a Claude/GLM/Kimi/DeepSeek/MiMo implementer; Claude for a Codex
implementer. When a two-role profile is selected (flags or config), the default
assignments are Codex outer + Kimi final for a Claude/GLM implementer;
Claude outer + Kimi final for a Codex implementer; and Codex outer + Claude final
for a Kimi implementer. If the required roles cannot be filled by distinct
eligible families, the PR is not clean/ready—one pass is never presented as two.
Neither optional family (DeepSeek/MiMo) changes the built-in role sequence or
fallback pool.

**A finding asserts two things; reading settles one.** Every reported finding is
an `UNTRIAGED` hypothesis. Admit P1 only after recording: the frozen issue
contract or an invariant it violates; the reachable trigger; a failing check,
executed trace, or complete causal path to the wrong outcome; why the current
artifact cannot safely advance; and the minimal causal fix. Reading the cited
`file:line` settles only the code shape. Restating the finding is not a
demonstration. Failing to demonstrate the consequence is evidence against the
finding, not licence to fix it anyway. An affirmative disproof records it
Refuted. Until classified, leave the code as it is: an untriaged claim never
authorizes a code change.

**Account for the fix's reach before it lands.** The gate reads a diff and the
next round reads that diff again, so consumers outside it are invisible to every
reviewer in the loop. Before changing a symbol used outside the diff, enumerate
those consumers and state the effect on each. A consumer you cannot account for
is not licence to proceed: narrow the fix to the caller inside the diff, or
record the finding Deferred as P2 or out-of-scope. That record does not create a
follow-up issue automatically.

**The loop, and what closes a finding.** Every reported finding is named at
triage with a stable ID, then classified against the frozen contract. Every later
round is judged against that PR-wide list — same, reopening, or new — and a named
finding holds at most one **current** recorded disposition. The record keeps its
history:

- **Fixed** — the record maps finding → minimal fix → verification. Use a test
  that failed before and passes after when expressible, otherwise a recorded
  verification step.
- **Refuted** — an affirmative disproof closes it. Record the executable check or
  reproducible verification artifact supporting that disproof. New evidence or a different observable
  consequence may reopen it.
- **Deferred** — a classified P2, minor, or out-of-scope observation remains
  visible. None blocks the role stamp. A structural P2 bars auto-merge until the
  operator owns it at the merge boundary; deferred minor and out-of-scope
  findings do not bar auto-merge. A P1 cannot be deferred.
- **Suppressed** — two evidence-free repeats of a pinned-Refuted finding may be
  recorded `Suppressed` without reopening it for this PR only when the disproof
  is pinned by an executable check or reproducible verification artifact and the
  repeats come from the same role/provider. New
  evidence still reopens it.
- **Contested** — a different role/provider independently repeats a Refuted
  finding, or the existing disproof is not pinned. It authorizes no edit, appears
  in the end-of-run report, and bars the role stamp and auto-merge until a
  root-cause pass resolves it. Close the contest only when that pass re-verifies
  the pinned disproof against the current revision or admits the finding on new
  evidence; otherwise leave the PR `OUTSTANDING`.

Rewording the same consequence is the same finding. Silence closes nothing: a
later round omitting an open finding has not resolved it. The open-findings
record is run-scoped and survives provider switches and sequence restarts. When
the reviewed artifact is a design doc, a required future test closes only once
recorded in that design; the record is the closure, not the future test.

A finding the driver can neither confirm nor refute remains untriaged. First
narrow the change, choose a fail-safe default, or use a default-off guard.
Escalate only when the task depends on the unresolved choice and there is no safe
default.

**Batch lower-severity work by value, not by label.** When an admitted P1 already
requires a content pass, batch-fix a verified lower-severity item only when it is
in scope, shares that root cause or touched surface, adds no dependency,
migration, public contract, or product choice, and needs no gate round beyond the
P1 re-review. Otherwise record its disposition without editing; a
lower-severity-only verdict never reopens a clean revision. This is not authority
to fix every P2 or minor: a structural P2 not admitted to the batch remains
operator-owned at the merge boundary, and unrelated polish remains deferred.

**The loop ends** as soon as triage leaves no `UNTRIAGED`, `Contested`, or open
admitted P1 finding, and every lower-severity item has a recorded disposition
that does not block the role stamp (a structural P2 may still bar auto-merge).
That same verdict earns the role's clean stamp only if that verdict requires no
content change. A content fix invalidates that verdict; the role must re-review
the fixed revision. No extra empty review is needed after a verdict whose only
findings receive non-content dispositions. A final reviewer has no special power
to expand the issue or upgrade a finding without the same evidence.

### Ordered-role revision and convergence rules

Before/after every PR role, record a clean worktree, `HEAD`, merge-base, base-tip
context, and the effective role-profile hash: when handoff flags are present,
the flag-derived role list plus the normalized `## external gate` section
minus its `gates` key — flags replace only what they override, so mid-run
edits to `priority` or the `implementer` declaration still stale stamps —
otherwise the normalized section (or its absent sentinel). Claude/Kimi/GLM/DeepSeek/MiMo
receive the immutable merge-base SHA; Codex receives its supported base ref and its
verdict is invalid if the before/after merge-base changed. All configured role
verdicts must name the same `HEAD`, merge-base, and role-profile hash.

Outer closes its finding loop on the current sequence. Only then run each later
role. A later-role content change invalidates every earlier stamp and starts the
ordered sequence again at outer. Finding identity is PR-scoped. A role keeps the
same provider across sequences unless availability/independence forces a
recorded substitution.

Convergence follows evidence and material progress, not a finding or sequence
counter. A round makes material progress only when it closes an admitted P1,
turns a failing check green, reduces a demonstrated shared root cause, or earns a
clean stage stamp that advances the waterfall. A design version lands with its
frozen contract and a named next validation also counts. A clean terminal
round never counts as stalled. Each role still gets **one transient retry** per sequence;
retries, skips, finding verdicts, and paid attempts remain visible in the ledger.
During implementation, a contract-mapped RED test or implementation slice with
a named next verification also counts as material progress; ordinary commits,
pushes, and diff growth do not.

The no-progress streak crosses debate rounds, paid role verdicts, role
substitutions, and sequence restarts. A stage is unfinished only while it has an
untriaged or contested finding, an open admitted P1, a failing required check, or
an unstamped current role. The streak resets only on material progress; a role
change or sequence restart never resets it by itself.

After final is clean, run the full native suite once on the same commit. A test
failure or content fix restarts ordered roles; a green suite with unchanged
stamps permits ready. Remote-CI exceptions are per-run only: name replacement
local commands in the ledger/PR and report `remote CI not run`, never claim the
pushed revision had deterministic remote-CI green.

**Merge bar.** An open admitted P1, an `UNTRIAGED` or `Contested` finding, a
failing required check, or an unmet frozen-contract item bars merge. A deferred
structural P2 does not block the role stamp or ready state, but it bars auto-merge
until the operator explicitly owns the risk at the merge boundary. Deferred
minor and out-of-scope findings do not bar auto-merge. A P1 cannot be accepted; only the
operator may abandon or replan work that cannot resolve one. This bar reads the
PR-gate record only; design-stage findings have their own section.

Two consecutive unfinished rounds without material progress trigger an
automatic root-cause checkpoint, never an operator permission prompt. Pause paid
gates, cluster stable IDs, remove duplicates and unsupported scope, sweep the
whole diff against the contract, apply one minimal batch fix, and run affected
checks. If the checkpoint still cannot progress, leave the PR draft with
`OUTSTANDING`, continue independent queued work, and report the blocker. If one
decision changed A→B→A, pin the contract-and-test-backed choice; it changes again
only on new evidence. The disposition record lives in the run ledger, PR thread,
commit record, or a collision-safe standalone run directory; untracked is not an
option. All of this is level 3 doctrine, not a guarantee.

The gate skills (`afk-codex-review`, `afk-claude-review`, `afk-kimi-review`,
`afk-glm-review`, `afk-deepseek-review`, `afk-mimo-review`) carry the invocation,
batching, and metering rules; they load when the gate runs.

## Autonomy

Decide with best-practice defaults and record each decision; do not block on
in-scope work. Risky changes ship safe-direction (behind a default-off flag,
fail-safe, additive). Only stop for: out-of-scope work, a destructive or
outward-facing action without authorization, or genuine ambiguity with no safe
default. Never merge a PR that is not green or has an open finding — open
meaning `UNTRIAGED`, `Contested`, or an admitted P1 without a closing
disposition. Deferred minor/out-of-scope notes do not bar merge; a structural P2
uses the operator-owned auto-merge bar in "External gate".
Never touch
another session's branch; never deploy (merge ≠ deploy).

## Continuity and self-pause

Each run owns a directory `.afk/runs/<run-id>/` (gitignored) holding everything
that run produces: `ledger.md`, updated in place, and the per-PR final reports
written beside it. If the ledger is missing, reconstruct it from the state checks
below.

Resolve `.afk/` against the repository's **main working tree** — the first
`worktree` line of `git worktree list --porcelain` — never against the current
directory, and never by taking the parent of the common git dir (under
`--separate-git-dir`, or in a submodule, that parent is git metadata rather than
a working tree). The directory is per **run**, never per worktree: one run
legitimately spans several worktrees, and each linked worktree has its own tree,
so a path resolved from the current directory would split one run's state across
trees and hide concurrent runs from each other.

**Claiming your run directory** — part of kickoff, in this order; each check is
only meaningful before you adopt anything:

1. **Read every `.afk/runs/*/ledger.md`**: its `run-id`, `scope`, `state`, and
   heartbeat. Do this first — once a directory is yours it is no longer "other",
   and stops being checked.
2. **A live run whose scope overlaps yours → stop and ask the operator** — live
   meaning `state: active` with a heartbeat under ~20 min. Two runs would drive
   the same issue. This holds however the scopes overlap, exact match included: a
   live same-scope run is a collision, not an invitation to resume. Disjoint
   scopes proceed silently.
3. **Resume** only a run that is `active` but not live — the directory whose
   ledger scope matches yours, or whose `run-id` the operator handed you. A
   `complete` run is finished history: never resume it, never count it as a
   collision, and leave its directory untouched.
4. **Otherwise allocate** `<run-id>` as `<YYYY-MM-DD>-<scope-slug>`, the slug
   sanitized for the filesystem and length-capped. Create the directory with an
   operation that **fails if it already exists** (`mkdir` without `-p`) — testing
   the path first and writing second leaves a window for a concurrent run to take
   it in between. Write `ledger.md` with its header as the very next action: the
   directory *is* the claim, so a directory with no ledger is a run still
   starting, not a free path.

   Creation failing means someone holds that path — never blindly move to the
   next suffix, which would fork a duplicate run. Read what is there: an `active`
   ledger whose scope overlaps yours sends you back to step 2; a `complete`
   ledger, or one whose scope is disjoint, is a spent or colliding slug, so retry
   the next suffix; no ledger yet means a run is mid-claim — wait briefly,
   re-read, and treat it as live if it stays ledgerless.

The ledger opens with a header carrying `run-id`, the run's `scope` as the
operator gave it, `state`, and the UTC `heartbeat` — written when the directory is
claimed and kept current thereafter. These four are what every other run reads to
identify this one, so a ledger without them is unmatchable.

`state` is `active` from the claim until the queue is done, and `complete` only
once it is. The two ways a run ends are not the same state: **finishing the queue
sets `complete`** — its scope is spent, and a later run over that scope starts
fresh rather than reopening it — while **auto-pausing leaves it `active`**, with
only the heartbeat going stale, which is precisely what makes the work resumable.
Marking a pause `complete` would strand it; never marking anything `complete`
would leave a finished run forever resumable and its scope never free again.

- **Never write into another run's directory.** Concurrent runs in one repository
  are normal; a shared ledger path is what makes them collide.
- **If the host supports scheduled re-invocation** (a cron or wake-up), set up a
  recurring tick that re-invokes you; the tick prompt is static (scope, order,
  merge policy, constraints, effective gate profile, run directory) — never
  embed the ledger itself.
  Otherwise run to completion in-session, checkpointing the ledger before any
  yield so a later session resumes the same issue at its next step.
- **Overlap guard — first action each tick:** refresh a UTC heartbeat in your own
  ledger at each step and during long waits. A tick that finds a heartbeat
  fresher than ~20 min in **its own** ledger exits immediately (another tick of
  this run is working); such exits do not count toward auto-pause.
- **Never identify a run by recency.** Match the operator's scope; the newest
  ledger is as likely to belong to another run as to yours.
- **Legacy layout:** a `.afk/afk-ledger.md` or `.afk/reports/` predates run
  directories and carries no scope header, so it cannot be scope-matched. Ask the
  operator whether it belongs to this run; adopt it on a yes by moving it into
  your run directory, otherwise leave it untouched. Never adopt one silently.
- **State checks** (scoped, not global): view each scoped issue; list PRs for
  your branches; check the current branch and status; resume the first
  unfinished step. One branch per issue off the default branch; push early.
- **Auto-pause:** use the External gate's one material-progress definition above.
  Commits, pushes, and notes outside that definition are activity, not progress. Two consecutive
  working ticks with none → run the automatic root-cause checkpoint. Count a
  barren tick only while the current stage is unfinished. If the checkpoint also
  cannot progress, stop the tick loop, post a status report, and leave
  `state: active` so the run can resume. Queue complete → stop with a final report
  and set `state: complete` in the same breath, ending the tick and claim.
  Always tear down any scheduled tick on stop — never leave one running.

## End-of-run report

Every PR with its state (merged / open-awaiting-review), every notable decision,
each external-gate outcome (including any `SKIPPED`), deferred/remaining items,
and anything blocking. In the operator's preferred language.
