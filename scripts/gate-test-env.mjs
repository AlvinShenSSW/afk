import { spawnSync } from 'node:child_process';

// Every gate test spawns its gate SYNCHRONOUSLY, so a gate that hangs takes the
// whole `node --test` run down with it — and because spawnSync blocks the event
// loop, the runner's own per-test timeout can never fire. A hung suite reports
// nothing and has to be bisected by hand. Bound every gate spawn instead: these
// tests run against stubs and --print-* paths that finish in well under a
// second, so anything approaching this bound is a hang, not a slow machine.
export const GATE_SPAWN_TIMEOUT_MS = 120000;

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
  return { ...clean, AFK_GATE_NO_DOTENV: '1', ...overrides };
}

/**
 * Spawn a gate under the bound above, and turn the bound being hit into a named
 * failure. Without this the caller sees an empty stdout and asserts against '',
 * which reads like a gate that printed nothing rather than one that never
 * returned.
 */
export function spawnGate(argv, options = {}) {
  const spawnOpts = { timeout: GATE_SPAWN_TIMEOUT_MS, ...options };
  const res = spawnSync(process.execPath, argv, spawnOpts);
  if (res.error && res.error.code === 'ETIMEDOUT') {
    throw new Error(
      `the gate did not exit within ${spawnOpts.timeout}ms and was killed: ${argv.join(' ')}`,
    );
  }
  return res;
}

/**
 * Windows inherits `Path`, not `PATH`, and `gateTestEnv` merges overrides by
 * EXACT key — so a plain `{ PATH: ... }` override adds a second key beside the
 * inherited one and the child may well read the wrong one. A PATH-dependent
 * test that silently keeps the inherited value passes vacuously on the only
 * platform it runs on, which is worse than failing.
 */
export function pathKey(env = process.env) {
  return Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
}
