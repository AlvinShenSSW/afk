# Contributing

Read [AGENTS.md](AGENTS.md) before changing this repository; it owns the global
rules, required checks and release duties.

## Making a change

1. Open an issue describing the change, or comment on an existing one.
2. Use one topic branch and follow the design/tests/review workflow in AGENTS.
3. Before authoring a skill, read [maintaining skills](docs/maintaining-skills.md).
4. Run the required checks and update the canonical version through its generator.
5. Open a PR using the template.

## Review and merge

Before selecting reviewers, read the [canonical external role profile and
independence rules](skills/afk/references/external-review.md). Independent review
by a different model satisfies this repository's review requirement; native
GitHub human approval is not required. Follow AGENTS and the consuming merge
policy for the squash-merge boundary. A passing CI or contributor-authorization
check does not establish that independent-model review happened.
