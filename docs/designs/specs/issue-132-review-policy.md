# Independent review policy and latest approval decisions

## Frozen contract

Issue #132 follows the operator's explicit policy correction: an independent
review by a different model is sufficient. Do not require a native GitHub human
approval or self-approval. Keep the consuming `leave-open` policy, existing branch
protections, and contributor authorization check. Do not mutate live settings or
build an attestation system. Permission-API handling belongs to existing PR #95.

The existing approval workflow must not accept an old approval after the same
reviewer requests changes or has their latest decisive review dismissed. Fetch
all review pages successfully before evaluating any approval. A current-head
approval after a change request qualifies again; an ordinary comment or pending
review does not erase an otherwise valid decisive review.

## Implementation

Update AGENTS, CONTRIBUTING, branch-protection documentation and the CODEOWNERS
comment to distinguish independent-model review from contributor authorization.
The admin-author exemption is an authorization rule, not evidence of review.
Retain the workflow name and required check context so existing rulesets do not
need migration. Independent-model review remains level 3 driver doctrine; CI
cannot infer model identity from an admin author or a GitHub approval. The actual
review roles still differ from the implementer and each other.

In the existing Bash workflow step, capture `gh api --paginate --slurp` output,
check its exit status, then evaluate the complete nested array with `jq`. Reduce
chronological decisive reviews per login and select only latest APPROVED records
for the current head before checking admin permission. APPROVED,
CHANGES_REQUESTED and DISMISSED are decisive; COMMENTED and PENDING are not.
A malformed collection or failed filter exits nonzero with a distinct diagnostic.
Keep this bounded transformation in the existing workflow, not a new framework.

The GitHub [review API](https://docs.github.com/en/rest/pulls/reviews)
documents chronological results. A local parser probe with GitHub CLI 2.95.0
confirmed `--slurp` cannot be combined with `--jq`, so collection and filtering
must be separate. The Ubuntu workflow already provides jq; regression tests run
that actual filter instead of reproducing its algorithm in a fake CLI.

## Validation and release

Tests first: prior approval followed by changes requested on the same head,
including a page boundary; latest dismissal; reapproval; comments and pending
reviews; independent reviewers; stale commits; empty history; malformed pages;
and failed later pagination with no partial acceptance. Preserve existing
admin-author and non-admin-reviewer behavior. The fixture replaces only the gh
network boundary; the workflow's Bash and jq execute unchanged. If jq is missing
locally, state that prerequisite explicitly instead of claiming verification.

Run the focused workflow suite, repository checks, internal review, the selected
Claude Opus 5.5 external gate, the final full suite and current-revision CI.
The design and related policy documents are the only new documentation surface.
Bump the canonical plugin version to 1.3.3 and regenerate mirrors, since the
workflow is a shipped script. No new consuming config key or live migration is
required. Leave the resulting PR open after review and validation.
