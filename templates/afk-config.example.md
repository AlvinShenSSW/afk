# afk config — all optional; omit a line to auto-detect. Personal, gitignored.

## commands
test:  <cmd>
lint:  <cmd>
build: <cmd>

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

## merge
policy: leave-open       # leave-open · merge-to-unblock · merge-when-green

## resume
auto-resume: notify      # off: silent · notify (default): surface a paused run · auto: resume one

## invariants            # must-check rules a reviewer applies — one per line
