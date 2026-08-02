import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { readCredential } from './credential.mjs';

test('credential lookup prefers environment and reads only named dotenv keys', () => {
  const dir = mkdtempSync(join(tmpdir(), 'afk-credential-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: dir });
    writeFileSync(join(dir, '.env'), 'UNRELATED_KEY=wrong\nMIMO_REVIEW_API_KEY="dotenv-key"\n');
    assert.equal(readCredential(
      ['MIMO_REVIEW_API_KEY', 'DEV_MIMO_API_KEY'],
      { cwd: dir, env: { MIMO_REVIEW_API_KEY: 'environment-key' } },
    ), 'environment-key');
    assert.equal(readCredential(
      ['MIMO_REVIEW_API_KEY', 'DEV_MIMO_API_KEY'],
      { cwd: dir, env: {} },
    ), 'dotenv-key');
    assert.equal(readCredential(
      ['MIMO_REVIEW_API_KEY', 'DEV_MIMO_API_KEY'],
      { cwd: dir, env: { AFK_GATE_NO_DOTENV: '1' } },
    ), '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
