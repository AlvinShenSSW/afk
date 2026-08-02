// The triage rules are prose executed by an agent — nothing here can enforce
// them. These are presence pins on the load-bearing sentences of the
// demonstrated-consequence and accounted-reach rules (they fail on silent
// deletion or rewording), plus doesNotMatch guards on the shape-only
// verification standard this change retires. They are not proof a driver
// applies the rules.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { test } from 'node:test';

const read = (p) =>
  readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const afkSkill = read('../skills/afk/SKILL.md');
const internalReview = read('../skills/afk-internal-review/SKILL.md');
const pilot = read('../skills/afk-implementation-pilot/SKILL.md');
const gates = {
  codex: read('../skills/afk-codex-review/SKILL.md'),
  claude: read('../skills/afk-claude-review/SKILL.md'),
  kimi: read('../skills/afk-kimi-review/SKILL.md'),
  glm: read('../skills/afk-glm-review/SKILL.md'),
};

// The summary every gate skill carries, byte-identical. The driver holds the
// full rules; a gate skill is loadable standalone, so the summary sits where
// findings are handled and must not drift the way the old stop rules did.
const TRIAGE_SENTENCE = [
  'Treat every reported finding as `UNTRIAGED`. Admit P1 only after mapping it to',
  'the frozen issue contract or an invariant, demonstrating a reachable trigger',
  'and wrong consequence, explaining why the current artifact cannot safely',
  'advance, and naming the minimal causal fix. Do not edit for an untriaged claim;',
  'record structural P2 for the operator-owned merge boundary, and defer minor or',
  'out-of-scope items without expanding the PR.',
].join('\n');

const BATCH_SENTENCE = [
  'When an admitted P1 already requires a content pass, batch-fix a verified',
  'lower-severity item only when it is in scope, shares that root cause or touched',
  'surface, adds no dependency, migration, public contract, or product choice, and',
  'needs no gate round beyond the P1 re-review. Otherwise record its disposition',
  'without editing; a lower-severity-only verdict never reopens a clean revision.',
].join('\n');

const countMatches = (text, re) => (text.match(new RegExp(re, 'g')) ?? []).length;

test('the driver states each triage rule exactly once', () => {
  for (const phrase of [
    /A finding asserts two things; reading settles one/,
    /Restating the finding is not a\s+demonstration/,
    /Account for the fix's reach before it lands/,
    /consumers outside it are invisible to\s+every\s+reviewer in the loop/,
  ]) {
    assert.equal(
      countMatches(afkSkill, phrase.source),
      1,
      `expected exactly one match for ${phrase} in skills/afk/SKILL.md`,
    );
  }
});

test('an undemonstrated consequence is recorded, not fixed', () => {
  // The incident this rule answers: the shape was confirmed, the asserted
  // consequence never was, and the fix landed anyway.
  assert.match(afkSkill, /evidence against the\s+finding, not licence to fix it anyway/);
  assert.match(afkSkill, /leave the code as it is/);
  assert.match(afkSkill, /An affirmative disproof records it\s+Refuted/);
  assert.match(afkSkill, /untriaged claim never\s+authorizes a code change/);
});

test('an unaccountable consumer narrows or defers the fix without expanding scope', () => {
  assert.match(afkSkill, /not licence to\s+proceed/);
  assert.match(afkSkill, /narrow the fix to the caller inside the diff/);
  assert.match(afkSkill, /record the finding\s+Deferred/i);
  assert.match(afkSkill, /does not create a\s+follow-up issue automatically/i);
});

test('P1 admission is scope-anchored and evidence-complete', () => {
  for (const phrase of [
    /frozen issue contract or an invariant/,
    /reachable (condition|trigger)/,
    /wrong (outcome|consequence)/,
    /cannot safely (enter|advance)/,
    /minimal causal fix/,
  ]) assert.match(afkSkill, phrase);
  assert.match(afkSkill, /unlabelled finding (starts|is) `UNTRIAGED`/i);
  assert.match(afkSkill, /never\s+authorizes a code change/i);
});

test('stable finding identity prevents evidence-free reopening and oscillation', () => {
  assert.match(afkSkill, /stable ID/);
  assert.match(afkSkill, /Rewording the same consequence is the same finding/i);
  assert.match(afkSkill, /new evidence or a different\s+observable\s+consequence/i);
  assert.match(afkSkill, /Suppressed/);
  assert.match(afkSkill, /Contested/);
  assert.match(afkSkill, /executable check|reproducible verification artifact/i);
  assert.match(afkSkill, /different (role|provider)/i);
  assert.match(afkSkill, /bars? (the role stamp and )?auto-merge/i);
  assert.match(afkSkill, /re-verifies\s+the pinned disproof against the current revision/i);
  assert.match(afkSkill, /admits\s+the finding on new\s+evidence/i);
  assert.match(afkSkill, /A→B→A/);
});

test('structural P2 risk remains operator-owned at auto-merge', () => {
  assert.match(afkSkill, /structural P2/i);
  assert.match(afkSkill, /does not block the role stamp/i);
  assert.match(afkSkill, /bars auto-merge/i);
  assert.match(afkSkill, /operator[^.]*merge boundary/i);
  assert.match(afkSkill, /minor[^.]*out-of-scope[^.]*do not bar auto-merge/i);
  assert.match(internalReview, /operator merge decision pending/i);
  assert.match(internalReview, /operator owns that risk at the merge boundary/i);
});

test('all four gate skills carry the identical triage sentence', () => {
  for (const [name, text] of Object.entries(gates)) {
    assert.equal(
      countMatches(text, TRIAGE_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      1,
      `expected exactly one copy of the triage sentence in ${name} gate skill`,
    );
  }
});

test('valuable lower-severity work batches only into an already-required P1 pass', () => {
  assert.match(afkSkill, /admitted P1 already\s+requires a content pass/i);
  assert.match(afkSkill, /shares that root cause or touched\s+surface/i);
  assert.match(afkSkill, /adds no dependency,\s+migration, public contract, or product choice/i);
  assert.match(afkSkill, /needs no gate round beyond the\s+P1 re-review/i);
  assert.match(afkSkill, /lower-severity-only verdict never reopens a clean\s+revision/i);
});

test('all four gate skills carry the identical value-aware batch rule', () => {
  for (const [name, text] of Object.entries(gates)) {
    assert.equal(
      countMatches(text, BATCH_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      1,
      `expected exactly one copy of the batch sentence in ${name} gate skill`,
    );
    assert.doesNotMatch(text, /resolve minor items|Deferred pass once/i);
  }
});

test('implementation and internal review apply the same value boundary', () => {
  for (const text of [pilot, internalReview]) {
    assert.match(text, /admitted P1 already\s+requires a\s+content pass/i);
    assert.match(text, /root cause or touched\s+surface/i);
    assert.match(text, /no dependency, migration,\s+(?:public contract|public\s+contract), or product choice/i);
    assert.match(text, /no review round beyond the P1\s+re-review/i);
    assert.match(text, /lower-severity-only (?:round|verdict)\s+never reopens a\s+clean revision/i);
  }
});

test('suppression closes evidence-free repeats, not the already-refuted finding', () => {
  assert.match(afkSkill, /evidence-free repeats of a pinned-Refuted finding/i);
  assert.match(afkSkill, /recorded `Suppressed` without reopening it/i);
  assert.doesNotMatch(afkSkill, /repeating a Refuted finding twice without new evidence may\s+close it/i);
});

test('the retired shape-only verification standard does not return', () => {
  // "Verify against the cited file:line" settles that the code is as
  // described and nothing about the defect; it is what let the incident
  // through. Note "reading the cited" in the pinned sentence is deliberately
  // not matched by these guards.
  for (const [name, text] of Object.entries(gates)) {
    assert.doesNotMatch(text, /against the cited/, `shape-only standard back in ${name}`);
    assert.doesNotMatch(text, /read the cited/, `shape-only standard back in ${name}`);
    // The summary sits under a list that sorts minor items out and defers
    // them; an unscoped opener would demand a demonstrated consequence for a
    // cosmetic item, which no such item can supply.
    assert.doesNotMatch(text, /^A finding claims both/m, `unscoped opener back in ${name}`);
  }
});
