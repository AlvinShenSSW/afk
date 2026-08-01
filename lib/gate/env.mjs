// One definition of the opt-out vocabulary, shared by every gate's
// <NAME>_REVIEW_GATE variable, and of how a numeric bound reads its override.

const OFF_VALUES = new Set(['off', '0', 'false', 'no', 'disabled']);

// Only an exact opt-out spelling disables a gate: an unrecognised value leaves
// the gate enabled, so a typo cannot silently drop the review.
export function isGateDisabled(varName, env = process.env) {
  return OFF_VALUES.has((env[varName] || '').trim().toLowerCase());
}

// A bound's override, parsed strictly. Anything that is not a whole number
// above zero keeps the fallback: the values this rejects — `0`, a negative, a
// unit suffix, a decimal — are read by the platform as "no bound at all", so a
// lenient parse would silently remove the limit the variable exists to set.
// Rejection is announced; a bound that quietly ignored its own knob would be
// indistinguishable from one that honoured it.
export function positiveIntEnv(varName, fallback, {
  env = process.env,
  warn = (message) => process.stderr.write(message),
} = {}) {
  const raw = (env[varName] || '').trim();
  if (!raw) return fallback;
  if (/^\d+$/.test(raw)) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  warn(`[gate] ignoring unusable ${varName}=${JSON.stringify(raw)}; using ${fallback}\n`);
  return fallback;
}
