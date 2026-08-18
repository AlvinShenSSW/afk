// The check rule is prose an agent chooses to follow — nothing here makes it
// run. These pin the sentences three refutation rounds turned on, plus
// doesNotMatch guards on the wordings each round refuted, so a reworded
// regression fails rather than shipping. See
// docs/designs/specs/2026-08-18-remote-checks.md for what each guard cost.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { test } from 'node:test';

const read = (p) =>
  readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const afk = read('../skills/afk/SKILL.md');
const pilot = read('../skills/afk-implementation-pilot/SKILL.md');
const internal = read('../skills/afk-internal-review/SKILL.md');
const template = read('../templates/afk-config.example.md');

test('the checks are always read; only an empty reading is configurable', () => {
  // Making the read itself configurable would let a stale config hide a check
  // that a repository added after the key was written.
  assert.match(afk, /ask the forge which checks it required of the\s+final revision/);
  assert.match(afk, /`remote-ci`\s+governs only an empty or unanswered reading/);
  assert.match(afk, /only the forge's own branch rule\s+makes a check required/);
});

test('classification never reads an exit code', () => {
  // gh pr checks exits non-zero for failing AND for pending, so classifying a
  // lookup failure by exit status misroutes the two most common answers.
  assert.match(afk, /Classify\s+by what the answer names, never by how the lookup exited/);
  assert.doesNotMatch(afk, /non-zero exit/);
});

test('no forge outcome vocabulary is restated in the prose', () => {
  // A third forge, or a sixth bucket on an existing one, must edit nothing
  // here. Naming a forge's own status words is what made rounds 1 and 2 wrong.
  // Scoped to a check: the driver has its own "queued work" for the run queue.
  for (const vocabulary of [
    /\bbucket\b/i,
    /notApplicable/,
    /check[^.]{0,20}\bqueued\b/i,
    /\bin_progress\b/i,
  ]) {
    assert.doesNotMatch(afk, vocabulary, `${vocabulary} is a forge's word`);
  }
});

test('an empty reading cannot satisfy the passing clause', () => {
  // "every required check passed" is vacuously true over an empty set, so the
  // reading nobody could take would have passed the bar by absence.
  assert.match(afk, /the answer names at least one required check and none is failing or\s+unfinished/);
  assert.doesNotMatch(afk, /every required check passed → \*\*resolved\*\*/);
});

test('every unresolved reading has the same named exit', () => {
  // The `expected` branch once said only that it never settles, leaving the
  // one state with no next step at all.
  assert.match(afk, /`absent` settles it at once,\s+`detect` \(default\) once the window closes, `expected` never/);
  assert.match(afk, /Unsettled, it\s+takes the same exit as a failing check/);
  assert.equal((afk.match(/OUTSTANDING`, take up other queued work/g) ?? []).length, 1);
});

test('the wait is bounded from a recorded start', () => {
  // A window with no durable start cannot tell a resumed tick that it is spent.
  assert.match(afk, /stamp the reading's first\s+attempt on the revision/);
  assert.match(afk, /30 minutes of wall clock from that\s+stamp/);
});

test('a check never ends the waterfall anywhere but at its own step', () => {
  assert.match(afk, /This is the one step that may leave a PR not ready over\s+a check/);
  assert.match(afk, /a check read earlier never ends an issue's waterfall/);
});

test('every rule that turns on a check reads the same object', () => {
  // Green, the ready enumeration, the merge bar and the unfinished-stage rule
  // diverged across earlier drafts; each names the reading now.
  assert.match(afk, /full test\nsuite \+ the revision's check reading\)/);
  assert.match(afk, /that commit's\n  check reading resolved \("Remote checks"\)/);
  assert.match(afk, /an\nunresolved check reading \("Remote checks"\), or an unmet frozen-contract item/);
  assert.match(afk, /an open admitted P1, an unresolved check\nreading, or/);
  assert.doesNotMatch(afk, /deterministic CI green/);
  assert.doesNotMatch(afk, /remote CI not run/);
});

test('the tradeoff is stated in the driver and reaches the report', () => {
  // AGENTS.md's level table is the whole reason this feature is dangerous to
  // describe casually; silence about it is as bad as overclaiming.
  assert.match(afk, /one of the few control points outside this agent's authority/);
  assert.match(afk, /both are evaluation the driver performs on itself/);
  assert.match(afk, /every revision no required\ncheck constrained/);
  const start = afk.indexOf('**Remote checks.**');
  const end = afk.indexOf('**Merge bar.**');
  // Fail closed: a renamed heading would slice to '' and pass every guard.
  assert.ok(start !== -1 && end > start, 'the rule must be bounded by both headings');
  // The AGENTS.md section is cited by its own title; only prose is guarded.
  const prose = afk.slice(start, end)
    .replace('"What this plugin can and cannot enforce"', '');
  assert.doesNotMatch(prose, /enforc|block|guarantee|\bbars\b/i);
});

test('the pilot and internal review defer to the driver rather than restating it', () => {
  assert.match(pilot, /for what counts as required/);
  assert.match(pilot, /an answer naming no required check at all is that condition/);
  assert.match(pilot, /Local green never sets the merge-ready bar/);
  assert.doesNotMatch(pilot, /CI green — not local green/);
  assert.match(internal, /Which readings permit ready is the driver's/);
  assert.doesNotMatch(internal, /CI hard gate/);
});

test('the config key ships unset so a bootstrapped repo chooses nothing', () => {
  // A value written by the template is one the operator never chose, and it
  // would move the ready bar for every PR in the run.
  assert.match(template, /^## checks$/m);
  assert.match(template, /^# remote-ci:/m);
  assert.doesNotMatch(template, /^remote-ci:/m);
});
