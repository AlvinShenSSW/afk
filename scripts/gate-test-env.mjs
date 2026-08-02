const GATE_PREFIXES = [
  'AFK_REVIEW_',
  'CLAUDE_GATE_',
  'CLAUDE_REVIEW_',
  'CODEX_GATE_',
  'CODEX_REVIEW_',
  'DEEPSEEK_REVIEW_',
  'GLM_REVIEW_',
  'KIMI_GATE_',
  'KIMI_REVIEW_',
  'MIMO_REVIEW_',
];
const GATE_EXACT_KEYS = new Set([
  'CLAUDECODE',
  'DEEPSEEK_REVIEW_API_KEY',
  'DEV_DEEPSEEK_API_KEY',
  'DEV_MIMO_API_KEY',
  'GLM_API_KEY',
  'MIMO_REVIEW_API_KEY',
  'ZAI_API_KEY',
]);

export function gateTestEnv(overrides = {}, base = process.env) {
  const clean = { ...base };
  for (const key of Object.keys(clean)) {
    if (GATE_EXACT_KEYS.has(key) || GATE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      delete clean[key];
    }
  }
  return { ...clean, ...overrides };
}
