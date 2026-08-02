import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gateTestEnv } from './gate-test-env.mjs';

test('gate test environment removes ambient gate configuration', () => {
  const result = gateTestEnv({}, {
    KEEP: 'yes',
    AFK_REVIEW_TIMEOUT_MS: '1',
    CLAUDE_REVIEW_TIMEOUT_MS: '2',
    CODEX_REVIEW_TIMEOUT_MS: '3',
    DEEPSEEK_REVIEW_TIMEOUT_MS: '3',
    GLM_REVIEW_TIMEOUT_MS: '4',
    KIMI_REVIEW_TIMEOUT_MS: '5',
    MIMO_REVIEW_TIMEOUT_MS: '6',
    CODEX_REVIEW_MODEL: 'ambient-model',
    CODEX_REVIEW_GATE: 'off',
    CLAUDECODE: '1',
    DEEPSEEK_REVIEW_API_KEY: 'ambient-key',
    DEV_DEEPSEEK_API_KEY: 'ambient-key',
    DEV_MIMO_API_KEY: 'ambient-key',
    MIMO_REVIEW_API_KEY: 'ambient-key',
    ZAI_API_KEY: 'ambient-key',
  });
  assert.deepEqual(result, { KEEP: 'yes' });
});

test('explicit test overrides are applied after ambient cleanup', () => {
  const result = gateTestEnv(
    { KIMI_REVIEW_TIMEOUT_MS: '1234' },
    { KIMI_REVIEW_TIMEOUT_MS: '9999' },
  );
  assert.equal(result.KIMI_REVIEW_TIMEOUT_MS, '1234');
});
