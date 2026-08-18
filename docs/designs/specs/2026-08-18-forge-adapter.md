# Forge adapter: Azure DevOps alongside GitHub

Issue: AlvinShenSSW/afk#46, narrowed by the operator to the adapter seam and its
degradation; the Azure DevOps policy verdict is deferred to a follow-up.

## Frozen issue contract

Acceptance criteria:

1. One place resolves which forge a repository lives on, and no skill or bundled
   script names a forge CLI. `skills/afk-agent-relay/lib/gather.mjs:71` held the
   only executable coupling.
2. Resolution is `.afk/config.md` `forge:` if set, else the `origin` remote,
   else GitHub, and the resolved value and its source are stated once at
   kickoff the way the gate profile already is.
3. A forge with no adapter degrades to a named reason, never a silent omission.
4. A credential in a URL's userinfo is redacted whatever its shape.
5. The pilot's CI-watch step and the driver's PR-lifecycle prose name the
   operation, not one vendor's command.

Engineering invariants: dependency-free Node ESM; no silent skips; fail toward
less exposure. `scripts/external-gate-profile.test.mjs:41` pins the kickoff
restatement sentence, so the forge clause attaches to it rather than rewording
it.

Non-goals: no third forge; no Azure DevOps Pipelines authoring, work-item
creation, or board manipulation; no change to gate ordering or run-state layout;
no vendoring of `az`.

## Design

Dispatch is keyed to the **resolved forge**, never to which CLI happens to run.
That is the whole point of the module. `gh` installed and authenticated against
a different host answers `issue view 42` from some other repository and exits 0,
so a helper that tries the command and reads failure as absence gets no signal
at all — the brief comes back well-formed with the wrong requirement in it. A
forge the adapter cannot serve is therefore named before any command is built,
not discovered by attempting one.

Detection matches host suffixes after the userinfo is stripped, over a parsed
URL rather than a substring test, so `github.com.<attacker>` does not resolve to
GitHub. scp-style remotes (`git@host:path`) are not URLs and are matched
separately. An unrecognised host detects nothing rather than guessing.

An unrecognised **configured** value keeps its name and travels with
`known: false` instead of falling back. Substituting the default there would run
a GitHub command against whatever the operator actually meant, which is the
failure above with the operator's own configuration as the cause.

The issue reference is constrained to a positive integer before it reaches an
argv: it is operator-supplied and lands on a command line, where a leading dash
is read as a flag by either CLI.

Only one operation is dispatched in code, because only one exists in code. The
remaining forge operations live in skill prose, which now names the operation
rather than a command; adding unused dispatch entries would be speculation
about commands nothing calls.

Redaction gains a URL-userinfo rule, placed before the shape rules so none of
them can half-redact a userinfo it only partly matches. The rule is positional
rather than alphabetical: a credential in a URL is a credential whatever it
looks like. The single-component form keeps a length floor because a bare `git@`
in an ssh URL is a user name, and redacting it would cost the reader which
remote a line names.

## Verified against the installed CLI

`az` 2.89.1 with the `azure-devops` extension 1.0.6, on this machine:

- `az boards work-item show` takes `--id` as its only required argument and has
  **no** `--project` parameter, which is what confirms a work item id is
  organization-scoped rather than per-repository — it is not a renamed issue
  number.
- `--draft` on `az repos pr create` is documented `Allowed values: false, true`,
  so it is not a bare flag; emitting one would swallow the next argument.
- Both failure modes reachable without an organization — no Azure DevOps remote
  to auto-detect, and an unauthenticated organization — exit **1** with empty
  stdout, so the status check in `gather.mjs` produces the named skip rather
  than pushing an error string into the brief as an issue body.

Still unverified, and therefore out of this change: whether `az repos pr policy
list` can express "the checks for this commit". It cannot, on the documentation:
policy evaluations attach to the PR artifact and a push resets them, the status
vocabulary (`queued`/`running`/`approved`/`rejected`/`notApplicable`/`broken`)
does not map onto pass/fail, an empty list means "no policies configured" rather
than "green", non-CI gates such as minimum-reviewers appear in the same list,
and `configuration.isBlocking` decides what actually gates a merge. A command
swap would report green where nothing was checked, so the operation stays prose
until it can be verified against a live organization.

## Test plan

`lib/forge.test.mjs`: detection across every remote shape each host is written
in, including scp-style and the legacy `visualstudio.com`; the lookalike host
`github.com.evil.example` detecting nothing; config outranking remote and each
source label; an unrecognised configured value keeping its name with
`known: false`; both dispatches; a non-numeric or dash-leading reference never
reaching a command line; and a consistency test that every forge in the exported
list has a dispatch.

`skills/afk-agent-relay/tests/redact.test.mjs`: a short userinfo credential, a
userinfo credential with no distinguishing alphabet, host and user preserved
while the credential goes, a URL with no credential left byte-identical, and an
Azure DevOps PAT pinned across the three shapes it travels in — that coverage
was incidental before this change and is now intentional.

## Correction record

The issue claimed Azure DevOps PATs were unredacted and called it the one
security defect in the set. That was asserted without running it, and it was
wrong: a 52-character base32 PAT is caught by the base64 catch-all, whose guard
tests for a digit, and the base32 alphabet supplies one. The defect that does
exist is narrower and forge-neutral — there was no URL-userinfo rule at all, so
a short credential in a remote URL survived whole regardless of host.
