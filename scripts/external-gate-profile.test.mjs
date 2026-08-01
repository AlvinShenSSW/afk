// Active-artifact contract for issue #1. AFK role orchestration is driver
// doctrine, so these tests pin the one shipped story rather than pretending to
// execute an orchestration runtime that does not exist.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const afk = read('../skills/afk/SKILL.md');
const template = read('../templates/afk-config.example.md');
const internal = read('../skills/afk-internal-review/SKILL.md');
const readme = read('../README.md');
const agents = read('../AGENTS.md');
const contributing = read('../CONTRIBUTING.md');
const gates = {
  codex: read('../skills/afk-codex-review/SKILL.md'),
  kimi: read('../skills/afk-kimi-review/SKILL.md'),
  claude: read('../skills/afk-claude-review/SKILL.md'),
  glm: read('../skills/afk-glm-review/SKILL.md'),
};

test('new configs choose ordered Codex outer then Kimi final', () => {
  assert.match(template, /^gates:\s+codex > kimi\s*$/m);
  assert.doesNotMatch(template, /^min-pass:/m);
  assert.doesNotMatch(template, /^mode:/m);
  for (const text of [afk, readme, agents, contributing]) {
    assert.match(text, /Codex[^\n]*(?:outer|外门)/i);
    assert.match(text, /Kimi[\s\S]{0,80}?(?:final|终审)/i);
  }
});

test('the driver doctrine distinguishes ordered roles from fallback priority', () => {
  assert.match(afk, /`gates`[^\n]*ordered/i);
  assert.match(afk, /`priority`[^\n]*fallback/i);
  assert.match(afk, /outer/);
  assert.match(afk, /intermediate-N/);
  assert.match(afk, /final/);
  assert.match(afk, /left-to-right/);
});

test('the implementer and unavailable-provider matrix stays role-safe', () => {
  for (const row of [
    /Codex outer \+ Kimi final for a Claude\/GLM implementer/,
    /Claude outer \+ Kimi final for a Codex implementer/,
    /Codex outer \+ Claude final\s+for a Kimi implementer/,
  ]) assert.match(afk, row);
  assert.match(afk, /Stable-unavailable `SKIPPED` reasons[\s\S]{0,300}?trigger fallback/);
  assert.match(afk, /one pass is never presented as two/i);
});

test('legacy and profileless config behavior is explicit and total', () => {
  assert.match(afk, /legacy external-gate field/i);
  assert.match(afk, /`design-gate`[^\n]*`implementer`[^\n]*do not select/i);
  assert.match(afk, /present-but-empty `gates`/i);
  assert.match(afk, /one-time cost notice/i);
  assert.match(afk, /Legacy `min-pass` and `mode`[\s\S]{0,120}?ignored for PR roles/i);
});

test('ordered role convergence and final revision stamps are pinned', () => {
  for (const phrase of [
    /full-sequence counter/,
    /four finding-bearing verdicts/,
    /one transient retry/,
    /merge-base/,
    /external-gate-section hash/,
    /later-role content change/,
  ]) assert.match(afk, phrase);
  assert.match(internal, /all configured roles/i);
  assert.match(internal, /same `HEAD`[^\n]*merge-base/i);
});

test('design-stage review remains exactly one independent gate', () => {
  assert.match(afk, /Exactly one gate, regardless of PR `gates` length or legacy `min-pass`/);
});

test('gate skills name stable default roles instead of interchangeability', () => {
  assert.match(gates.codex, /default outer/i);
  assert.match(gates.kimi, /default final/i);
  assert.match(gates.claude, /fallback/i);
  assert.match(gates.glm, /fallback/i);
  for (const text of Object.values(gates)) assert.doesNotMatch(text, /interchangeable/i);
});
