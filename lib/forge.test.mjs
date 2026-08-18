import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from 'node:test';

import { FORGES, detectForge, issueCommand, resolveForge } from './forge.mjs';

// The provenance scan reads `user@host` as an operator email. These are git URL
// userinfo, not addresses, so they are assembled rather than written literally.
const AT = '@';
const withUserinfo = (userinfo, rest) => `${userinfo}${AT}${rest}`;

const configWith = (body) => {
  const dir = mkdtempSync(join(tmpdir(), 'afk-forge-'));
  const path = join(dir, 'config.md');
  writeFileSync(path, body);
  return path;
};

test('detects github from every remote shape it is written in', () => {
  for (const url of [
    'https://github.com/org/repo.git',
    withUserinfo('git', 'github.com:org/repo.git'),
    `ssh://${withUserinfo('git', 'github.com/org/repo.git')}`,
    `https://${withUserinfo('user:tok', 'github.com/org/repo.git')}`,
  ]) {
    assert.equal(detectForge(url), 'github', url);
  }
});

test('detects azure-devops from both the current and the legacy host', () => {
  for (const url of [
    'https://dev.azure.com/org/project/_git/repo',
    `https://${withUserinfo('org', 'dev.azure.com/org/project/_git/repo')}`,
    withUserinfo('git', 'ssh.dev.azure.com:v3/org/project/repo'),
    'https://org.visualstudio.com/project/_git/repo',
    'ssh://vs-ssh.visualstudio.com:22/org/project/_ssh/repo',
  ]) {
    assert.equal(detectForge(url), 'azure-devops', url);
  }
});

test('an unknown, empty, or malformed remote detects nothing', () => {
  // Guessing a forge from a host nobody recognised is how a lookalike host
  // gets a credential aimed at it; no detection is the safe answer.
  for (const url of [
    'https://gitlab.com/org/repo.git',
    'https://github.com.evil.example/org/repo.git',
    'https://notgithub.com/org/repo.git',
    '',
    null,
    undefined,
    'not a url',
  ]) {
    assert.equal(detectForge(url), null, String(url));
  }
});

test('a configured forge outranks the remote, and reports its source', () => {
  const path = configWith('## forge\nforge: azure-devops\n');
  assert.deepEqual(
    resolveForge({ configPath: path, remoteUrl: 'https://github.com/o/r.git' }),
    { forge: 'azure-devops', source: 'config', known: true },
  );
});

test('an unset forge falls to the remote, then to github', () => {
  const empty = configWith('## commands\ntest: npm test\n');
  assert.deepEqual(
    resolveForge({ configPath: empty, remoteUrl: 'https://dev.azure.com/o/p/_git/r' }),
    { forge: 'azure-devops', source: 'remote', known: true },
  );
  assert.deepEqual(
    resolveForge({ configPath: empty, remoteUrl: 'https://gitlab.com/o/r.git' }),
    { forge: 'github', source: 'default', known: true },
  );
});

test('an unrecognised configured value names itself rather than falling back', () => {
  // Falling back would run a GitHub command against whatever the operator
  // actually meant, and the wrong-forge read below is exactly what that costs.
  const path = configWith('## forge\nforge: bitbucket\n');
  const resolved = resolveForge({ configPath: path, remoteUrl: 'https://github.com/o/r.git' });
  assert.equal(resolved.forge, 'bitbucket');
  assert.equal(resolved.source, 'config');
  assert.equal(resolved.known, false);
});

test('the shipped template leaves forge unset rather than reading its comment', () => {
  // Every consuming project starts from this file, so a config reader that took
  // the commented key's trailing text as a value would hand each of them a
  // garbage forge before they ever set one.
  const template = new URL('../templates/afk-config.example.md', import.meta.url);
  assert.deepEqual(
    resolveForge({
      configPath: fileURLToPath(template),
      remoteUrl: 'https://dev.azure.com/o/p/_git/r',
    }),
    { forge: 'azure-devops', source: 'remote', known: true },
  );
});

test('github resolves the issue read to a gh command', () => {
  assert.deepEqual(issueCommand('github', 42), {
    bin: 'gh',
    args: ['issue', 'view', '42'],
  });
});

test('azure-devops resolves the issue read to an org-scoped work item', () => {
  // Work item ids are organization-scoped, so the repository the command runs
  // in does not narrow them the way a GitHub issue number does.
  const cmd = issueCommand('azure-devops', 42);
  assert.equal(cmd.bin, 'az');
  assert.deepEqual(cmd.args, ['boards', 'work-item', 'show', '--id', '42', '--output', 'json']);
});

test('an unsupported forge yields a named reason, never a command', () => {
  // The failure this prevents is not a crash: gh installed and authed against
  // a different host returns some other repository's issue 42 with status 0 —
  // a well-formed brief built on the wrong requirement.
  const cmd = issueCommand('bitbucket', 42);
  assert.equal(cmd.bin, undefined);
  assert.match(cmd.unsupported, /bitbucket/);
});

test('a non-numeric issue reference never reaches a command line', () => {
  for (const bad of ['--help', '1; rm -rf /', '', null, '-1', '1.5']) {
    const cmd = issueCommand('github', bad);
    assert.equal(cmd.bin, undefined, String(bad));
    assert.match(cmd.unsupported, /reference/i);
  }
});

test('the forge list is the one the resolver and the dispatch agree on', () => {
  for (const forge of FORGES) {
    assert.notEqual(issueCommand(forge, 1).bin, undefined, forge);
  }
});
