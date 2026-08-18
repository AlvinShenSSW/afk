// One place decides which forge a repository lives on, so no skill or helper
// names a CLI. Dispatch is keyed to the resolved forge, never to which CLI
// happens to run: `gh` installed and authed against a different host answers
// `issue view 42` from some other repository with status 0, so a helper that
// tries the command and treats failure as absence gets no signal at all.

import { readConfigSectionValue } from './config.mjs';

export const FORGES = ['github', 'azure-devops'];

// Host suffixes, matched on the host alone after the userinfo is stripped — a
// substring test would accept `github.com.<attacker>` and aim a credential at
// it.
const HOSTS = [
  { forge: 'github', suffixes: ['github.com'] },
  {
    forge: 'azure-devops',
    suffixes: ['dev.azure.com', 'ssh.dev.azure.com', 'visualstudio.com'],
  },
];

function hostOf(remoteUrl) {
  const url = String(remoteUrl ?? '').trim();
  if (!url) return null;
  // scp-style (`git@host:path`) is not a URL; everything else is parsed as one.
  const scp = /^(?:[^@/\s]+@)?([^@/:\s]+):(?!\/\/)/.exec(url);
  if (scp) return scp[1].toLowerCase();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `ssh://${url}`;
  try {
    const { hostname } = new URL(withScheme);
    return hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function detectForge(remoteUrl) {
  const host = hostOf(remoteUrl);
  if (!host) return null;
  for (const { forge, suffixes } of HOSTS) {
    for (const suffix of suffixes) {
      if (host === suffix || host.endsWith(`.${suffix}`)) return forge;
    }
  }
  return null;
}

// `known: false` travels with an unrecognised configured value so a caller can
// say which forge it could not serve. Substituting a default here would run a
// GitHub command against whatever the operator meant instead.
export function resolveForge({ configPath, remoteUrl } = {}) {
  const configured = configPath ? readConfigSectionValue(configPath, 'forge', 'forge') : null;
  if (configured) {
    return { forge: configured, source: 'config', known: FORGES.includes(configured) };
  }
  const detected = detectForge(remoteUrl);
  if (detected) return { forge: detected, source: 'remote', known: true };
  return { forge: 'github', source: 'default', known: true };
}

// Positive-integer only: the reference reaches an argv, and a leading dash
// would be read as a flag by either CLI.
function issueId(reference) {
  const raw = String(reference ?? '').trim();
  return /^[0-9]+$/.test(raw) && raw !== '0' ? raw : null;
}

const ISSUE_COMMAND = {
  github: (id) => ({ bin: 'gh', args: ['issue', 'view', id] }),
  // Work item ids are organization-scoped rather than per-repository, so the
  // directory the command runs in does not narrow the id the way it does for a
  // GitHub issue number.
  'azure-devops': (id) => ({
    bin: 'az',
    args: ['boards', 'work-item', 'show', '--id', id, '--output', 'json'],
  }),
};

export function issueCommand(forge, reference) {
  const id = issueId(reference);
  if (!id) return { unsupported: `not a positive issue reference: ${reference}` };
  const build = ISSUE_COMMAND[forge];
  if (!build) return { unsupported: `no issue adapter for forge: ${forge}` };
  return build(id);
}
