# afk config — all optional; omit a line to auto-detect. Personal, gitignored.

## commands
test:
lint:
build:

## plugin
pluginRoot:

## external gate
gates:    codex
                         # ordered required roles: outer → ... → final; one item = single gate
# gates:  codex > kimi   # opt-in: ordered double review (Codex outer → Kimi final);
                         #   or pass -codex -kimi on one handoff for that run only
priority: codex > claude > kimi > glm # closed fallback pool for an ineligible preferred role
                         # explicit profiles may also name deepseek or mimo; neither is a built-in fallback
design-gate: off         # opt-in pilot: one gate over the design doc before code
                         #   off (default) · risky (design-heavy/high-blast-radius only) · on (every issue)
# implementer:           # who writes the code, if not the driver (relay). May only
                         # BLOCK a gate, never permit one: a value here is written
                         # once and goes stale, so it must not outrank a live signal.

## review
# max-fix-cycles:        # nonnegative integer; blank defaults to two per issue
                         # kickoff override only; consumed cycles survive resumes
                         # exhaustion leaves unresolved repairs outstanding

## forge
# forge:                 # github · azure-devops. Omit to detect from the origin
                         # remote, else github. Set it when the remote host is
                         # not the tracker's, so an id is not read from whichever
                         # CLI answers first.
# azure-organization:    # https://dev.azure.com/<org>. Required only when the
                         # forge is azure-devops and origin is on another host —
                         # there is no Azure remote to read the org from, and a
                         # same-named org on another host may exist.
# github-repository:     # [HOST/]OWNER/REPO. The same, for a github forge whose
                         # origin is elsewhere: gh would otherwise pick the
                         # repository from the checkout or its environment.

## checks
# remote-ci:             # detect (default) · expected · absent · off. Enabled modes govern
                         # what an empty or unanswered reading means: detect
                         # settles it once the window closes, absent at once,
                         # expected never. It adds no required check of its
                         # own; deferred Draft validation must actually run.
                         # off finishes locally with all reviews and checks,
                         # without CI reads or automatic push/PR/ready/merge.

## merge
policy: leave-open       # leave-open · merge-to-unblock · merge-when-green

## resume
auto-resume: notify      # off: silent · notify (default): surface a paused run · auto: resume one

## invariants
