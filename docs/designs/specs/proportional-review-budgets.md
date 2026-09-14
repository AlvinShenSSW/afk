# Proportional review budgets

An increased repair allowance needs corresponding headroom in an already bounded
review budget; otherwise the granted repairs may remain unusable. This is driver
workflow policy, not a new billing or orchestration runtime.

## Contract

An operator-approved increase scales existing finite model-call and cost ceilings
unless the instruction retains a separate cap. An explicit multiplier wins.
Otherwise use the new cycle allowance divided by the cycle allowance paired with
the original budget totals. Each amendment derives from that same recorded
baseline, once; multiplying a remaining balance or repeatedly compounding the
same amendment would distort the authorized total. Integer call ceilings round
down. Keep original, consumed, reserved and amended amounts and their authority.

A zero or unknown original cycle baseline prevents inference of a multiplier;
it does not invalidate an explicit multiplier on known finite budget totals.
Missing original totals, invalid factors or an unknown cost conversion remain
unresolved. Do not infer dollars from tokens without a recorded pricing basis.
Operator instruction retains precedence over config, then the default.
A default upgrade alone cannot silently amend an active run.

Execution handoffs remain immutable. An amendment or replacement retains its
predecessor identity, all attempts and accounting. Unknown actual usage stays
unknown. Any finite conservative hold needs its own explicit reservation policy,
source and allowance, is deducted from available headroom, and is not an observed
charge. Larger ceilings alone cannot make missing accounting complete. Reconcile
only against authoritative usage; do not release a hold on a guessed zero.

Task rows, deadlines, per-invocation limits, retries, evidence requirements and
merge authority retain separate owners. More total call/cost capacity does not
authorize extra tasks or an automatic retry of an unsuccessful outcome.
No new consumer config key or automatic monetary default is introduced.

## Validation

Keep the canonical rule, README and template consistent. Check repeat amendments
against their recorded original baseline, explicit ratios with unavailable cycle
baselines, rounding and consumed/reserved deductions. Historical fixtures with
explicit budgets remain unchanged. Existing repository tests and static checks,
independent review and an updated install cache key remain required. These are
level3 instructions; helper-local checks do not establish non-bypassability.
