const TIMEOUT_KEYS = [
  'AFK_REVIEW_TIMEOUT_MS',
  'CLAUDE_REVIEW_TIMEOUT_MS',
  'CODEX_REVIEW_TIMEOUT_MS',
  'GLM_REVIEW_TIMEOUT_MS',
  'KIMI_REVIEW_TIMEOUT_MS',
];

export function gateTestEnv(overrides = {}, base = process.env) {
  const clean = { ...base };
  for (const key of TIMEOUT_KEYS) delete clean[key];
  return { ...clean, ...overrides };
}
