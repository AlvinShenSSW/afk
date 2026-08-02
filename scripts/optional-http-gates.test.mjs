import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);

test('optional DeepSeek and MiMo gate entry points and skills are bundled', () => {
  for (const family of ['deepseek', 'mimo']) {
    const dir = new URL(`skills/afk-${family}-review/`, root);
    assert.equal(existsSync(new URL('SKILL.md', dir)), true, `${family} skill missing`);
    assert.equal(existsSync(new URL(`${family}-gate.mjs`, dir)), true, `${family} helper missing`);
  }
});

test('optional families are documented without changing built-in defaults', () => {
  const afk = readFileSync(new URL('skills/afk/SKILL.md', root), 'utf8');
  const template = readFileSync(new URL('templates/afk-config.example.md', root), 'utf8');
  assert.match(afk, /valid role families[^\n]*deepseek[^\n]*mimo/i);
  assert.match(template, /^gates:\s+codex > kimi\s*$/m);
  assert.match(template, /^priority:\s+codex > claude > kimi > glm\b/m);
  assert.doesNotMatch(template, /^priority:.*(?:deepseek|mimo)/m);
});
