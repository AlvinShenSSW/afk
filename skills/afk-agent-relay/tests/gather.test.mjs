import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gatherContext, filterDiffByExcludes, filterGrepByExcludes } from '../lib/gather.mjs';
import { runRole } from '../lib/role.mjs';
import { mainWorktree } from '../../../lib/gate/git.mjs';

const noRun = () => ({ status: 1, stdout: '', stderr: '', error: new Error('nope') });

test('excluded files are skipped with a loud note', () => {
  const g = gatherContext(
    { files: ['.env', 'app.py'] },
    { run: noRun, readFile: (p) => (p === 'app.py' ? 'print(1)' : 'SECRET=1') },
  );
  assert.ok(g.notes.some((n) => n.includes('excluded') && n.includes('.env')));
  assert.match(g.text, /print\(1\)/);
  assert.doesNotMatch(g.text, /SECRET=1/);
});

test('byte cap truncates and emits a loud note', () => {
  const big = 'x'.repeat(5000);
  const g = gatherContext(
    { files: ['a.py', 'b.py'] },
    { run: noRun, readFile: () => big, maxBytes: 1000 },
  );
  assert.ok(g.notes.some((n) => /truncated|dropped/.test(n)));
  assert.ok(g.bytes <= 1200);
});

test('redaction note when secrets present', () => {
  const g = gatherContext(
    { files: ['cfg.py'] },
    { run: noRun, readFile: () => 'token = "abcdef1234567890"' },
  );
  assert.ok(g.notes.some((n) => n.includes('redacted')));
  assert.doesNotMatch(g.text, /abcdef1234567890/);
});

test('git diff is gathered via the injected run', () => {
  const run = (cmd, args) => {
    if (cmd === 'git' && args[0] === 'diff') {
      return { status: 0, stdout: 'diff --git a/x.py b/x.py\n+DIFFBODY', stderr: '', error: null };
    }
    return { status: 0, stdout: 'main', stderr: '', error: null };
  };
  const g = gatherContext({ diff: 'main' }, { run, readFile: () => null });
  assert.match(g.text, /DIFFBODY/);
});

test('filterDiffByExcludes drops a secret file section, keeps the rest', () => {
  const diff = [
    'diff --git a/app.py b/app.py',
    '+print(1)',
    'diff --git a/.env b/.env',
    '+SECRET=abcdef1234',
    'diff --git a/lib.py b/lib.py',
    '+x=2',
  ].join('\n');
  const { text, dropped } = filterDiffByExcludes(diff);
  assert.deepEqual(dropped, ['.env']);
  assert.match(text, /app\.py/);
  assert.match(text, /lib\.py/);
  assert.doesNotMatch(text, /SECRET=abcdef1234/);
});

test('filterDiffByExcludes drops a secret renamed to a non-secret name (both sides)', () => {
  // rename .env -> config.txt: b/ path is innocuous, a/ path is the secret
  const diff = 'diff --git a/.env b/config.txt\nrename from .env\n+LEAKED=supersecretvalue';
  const { text, dropped } = filterDiffByExcludes(diff);
  assert.deepEqual(dropped, ['config.txt']);
  assert.doesNotMatch(text, /LEAKED=supersecretvalue/);
});

test('a secret file in the diff is excluded end-to-end', () => {
  const diff = 'diff --git a/.env b/.env\n+TOKEN=zzzthisissecret\ndiff --git a/ok.py b/ok.py\n+y=1';
  const run = (cmd, args) => {
    if (cmd === 'git' && args[0] === 'diff') return { status: 0, stdout: diff, stderr: '', error: null };
    return { status: 0, stdout: 'main', stderr: '', error: null };
  };
  const g = gatherContext({ diff: 'main' }, { run, readFile: () => null });
  assert.ok(g.notes.some((n) => n.includes('excluded from diff') && n.includes('.env')));
  assert.doesNotMatch(g.text, /TOKEN=zzzthisissecret/);
  assert.match(g.text, /ok\.py/);
});

test('filterGrepByExcludes drops hits from excluded files (incl. secret dirs)', () => {
  const out = ['.env:3:SECRET=abc', 'app.py:10:foo()', 'secrets/x.json:1:bar'].join('\n');
  const { text, dropped } = filterGrepByExcludes(out);
  assert.ok(dropped.includes('.env'));
  assert.ok(dropped.includes('secrets/x.json'));
  assert.match(text, /app\.py:10:foo/);
  assert.doesNotMatch(text, /SECRET=abc/);
});

// The issue read dispatches on the resolved forge rather than on which CLI
// answers, so these pin which command is built and that every path that does
// not produce issue text says which one it was.

const runnerFor = (remoteUrl, issueResult) => {
  const calls = [];
  const run = (bin, args) => {
    calls.push([bin, ...args].join(' '));
    if (bin === 'git' && args[0] === 'remote') {
      return { status: 0, stdout: remoteUrl, stderr: '', error: undefined };
    }
    return issueResult;
  };
  return { run, calls };
};

const ok = (body) => ({ status: 0, stdout: body, stderr: '', error: undefined });
const failed = { status: 1, stdout: '', stderr: 'boom', error: undefined };

test('a github remote reads the issue through gh', () => {
  const { run, calls } = runnerFor('https://github.com/o/r.git', ok('issue body here'));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null });
  assert.ok(calls.includes('gh issue view 42 --repo o/r'), calls.join(' | '));
  assert.match(g.text, /issue body here/);
  assert.equal(g.notes.length, 0);
});

test('an azure devops remote reads the work item through az', () => {
  const { run, calls } = runnerFor(
    'https://dev.azure.com/org/proj/_git/repo',
    ok('{"fields":{"System.Title":"t"}}'),
  );
  gatherContext({ issue: ['42'] }, { run, readFile: () => null });
  assert.ok(
    calls.includes(
      'az boards work-item show --id 42 --organization'
        + ' https://dev.azure.com/org --detect false --output json',
    ),
    calls.join(' | '),
  );
  assert.ok(!calls.some((c) => c.startsWith('gh ')), 'gh must not be tried');
});

test('a configured forge with no adapter names itself and builds no command', () => {
  // The failure this replaces is not a crash: gh authed against another host
  // answers for id 42 and exits 0, so the brief comes back well-formed with
  // another tracker's issue in it. An unrecognised configured value must not
  // fall back for the same reason — the fallback would be that command.
  const dir = mkdtempSync(join(tmpdir(), 'afk-gather-'));
  const configPath = join(dir, 'config.md');
  writeFileSync(configPath, '## forge\nforge: bitbucket\n');
  const { run, calls } = runnerFor('https://github.com/o/r.git', ok('wrong issue'));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null, configPath });
  assert.ok(!calls.some((c) => c.startsWith('gh ') || c.startsWith('az ')), calls.join(' | '));
  assert.doesNotMatch(g.text, /wrong issue/);
  assert.equal(g.notes.length, 1);
  assert.match(g.notes[0], /no issue adapter for forge: bitbucket/);
});

test('an unrecognised remote host falls back to github, still bound to its repo', () => {
  // Self-hosted GitHub is the common case behind an unrecognised host, so the
  // fallback is deliberate; the host stays in the selector so the read is not
  // left for GH_REPO to decide, and gh refuses a host it does not know.
  const { run, calls } = runnerFor('https://git.example.com/o/r.git', ok('body'));
  gatherContext({ issue: ['42'] }, { run, readFile: () => null });
  assert.ok(
    calls.includes('gh issue view 42 --repo git.example.com/o/r'),
    calls.join(' | '),
  );
});

test('a CLI that fails and a forge that is unsupported give different notes', () => {
  const { run: failingRun } = runnerFor('https://github.com/o/r.git', failed);
  const cliFailed = gatherContext({ issue: ['42'] }, { run: failingRun, readFile: () => null });
  assert.equal(cliFailed.notes.length, 1);
  assert.match(cliFailed.notes[0], /gh could not read issue 42 on github/);

  const { run: badRefRun } = runnerFor('https://github.com/o/r.git', ok('x'));
  const badRef = gatherContext({ issue: ['--help'] }, { run: badRefRun, readFile: () => null });
  assert.equal(badRef.notes.length, 1);
  assert.match(badRef.notes[0], /not a positive issue reference/);
  assert.notEqual(cliFailed.notes[0], badRef.notes[0]);
});

test('the role pipeline hands gather the main worktree config path', async () => {
  // The forge override is read from `.afk/config.md`. Without it reaching the
  // one caller that runs in production, the shipped key resolves only in tests.
  let seen = 'GATHER NEVER CALLED';
  // Only the argument gather receives is under test; the provider call after it
  // is stubbed just far enough to be reached, and may fail past that point.
  await runRole(
    {
      label: 'BRIEF',
      defaultProvider: 'deepseek',
      providerEnv: 'P',
      modelEnv: 'M',
      systemPrompt: 's',
      validate: () => ({ ok: true }),
      buildUser: () => 'u',
    },
    {
      argv: ['--manual', '--task', 't', '--issue', '1'],
      env: { DEV_DEEPSEEK_API_KEY: 'k' },
      gather: (_sources, opts) => {
        seen = opts.configPath;
        return { text: '', notes: [], bytes: 0 };
      },
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'x' } }] }),
        text: async () => '{}',
      }),
    },
  ).catch(() => {});
  assert.notEqual(seen, 'GATHER NEVER CALLED', 'gather was never reached');
  assert.equal(seen, join(mainWorktree({}), '.afk', 'config.md'));
});

test('a cross-host azure setup reads the organization from config', () => {
  // forge: azure-devops with a non-Azure origin is the case the key exists for;
  // deriving from that origin would name a plausible wrong organization.
  const dir = mkdtempSync(join(tmpdir(), 'afk-gather-'));
  const configPath = join(dir, 'config.md');
  writeFileSync(
    configPath,
    '## forge\nforge: azure-devops\nazure-organization: https://dev.azure.com/contoso\n',
  );
  const { run, calls } = runnerFor('https://github.com/code-owner/repo.git', ok('{}'));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null, configPath });
  assert.ok(calls.some((c) => c.includes('https://dev.azure.com/contoso')), calls.join(' | '));
  assert.ok(!calls.some((c) => c.includes('code-owner')), calls.join(' | '));
  assert.equal(g.notes.length, 0);
});

test('a cross-host azure setup without the organization builds no command', () => {
  const dir = mkdtempSync(join(tmpdir(), 'afk-gather-'));
  const configPath = join(dir, 'config.md');
  writeFileSync(configPath, '## forge\nforge: azure-devops\n');
  const { run, calls } = runnerFor('https://github.com/code-owner/repo.git', ok('{}'));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null, configPath });
  assert.ok(!calls.some((c) => c.startsWith('az ') || c.startsWith('gh ')), calls.join(' | '));
  assert.match(g.notes[0], /azure-organization/);
});

// A read whose payload carries a comment count but no comment bodies loses the
// discussion. The count makes the loss knowable, so leaving it unsaid is the
// silent skip the rules forbid.

const workItem = (commentCount) =>
  JSON.stringify({ id: 42, fields: { 'System.Title': 't', 'System.CommentCount': commentCount } });

test('an issue read that drops its discussion says how much it dropped', () => {
  const { run } = runnerFor('https://dev.azure.com/org/proj/_git/repo', ok(workItem(12)));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null });
  assert.equal(g.notes.length, 1, g.notes.join(' | '));
  assert.match(g.notes[0], /issue 42/);
  assert.match(g.notes[0], /12/);
  assert.doesNotMatch(g.notes[0], /\baz\b|\bgh\b/, 'the note must not name a CLI');
  assert.match(g.text, /System\.Title/, 'the payload still reaches the brief');
});

test('an issue with no discussion adds no note', () => {
  // A note on every read is noise, and noise is how a real one gets missed.
  const { run } = runnerFor('https://dev.azure.com/org/proj/_git/repo', ok(workItem(0)));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null });
  assert.deepEqual(g.notes, []);
});

test('a payload carrying no count at all adds no note', () => {
  // The GitHub read renders its comments inline and has no count field; a note
  // derived from the forge rather than the response would fire spuriously.
  const { run } = runnerFor('https://github.com/o/r.git', ok('#42 issue body\n\nsome comment text'));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null });
  assert.deepEqual(g.notes, []);
});

test('a count that is not a positive integer adds no note', () => {
  // The note stands in for a payload the reader cannot see, so a fractional or
  // negative count would read as a defect in the note rather than in the read.
  for (const count of ['many', 2.7, -3, null, Number.NaN]) {
    const { run } = runnerFor('https://dev.azure.com/org/proj/_git/repo', ok(
      JSON.stringify({ fields: { 'System.CommentCount': count } }),
    ));
    const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null });
    assert.deepEqual(g.notes, [], String(count));
  }
});

test('an unparseable payload is passed through without a note', () => {
  // The read succeeded; guessing at a shape it does not have would invent a
  // loss that may not exist.
  const { run } = runnerFor('https://dev.azure.com/org/proj/_git/repo', ok('not json at all'));
  const g = gatherContext({ issue: ['42'] }, { run, readFile: () => null });
  assert.deepEqual(g.notes, []);
  assert.match(g.text, /not json at all/);
});
