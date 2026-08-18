// gather.mjs — collect raw context OUT OF PROCESS so it never enters Claude's
// window. Reads git diff / tracked issues / files / ripgrep hits / log tails, applies
// excludes + redaction, and enforces a loud byte cap (no silent truncation).
//
// All side-effecting deps (process spawn, file read) are injectable for test
// mocking.

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { readConfigSectionValue } from '../../../lib/config.mjs';
import { issueCommand, resolveForge } from '../../../lib/forge.mjs';
import {
  filterDiffByExcludes,
  filterGrepByExcludes,
  isExcluded,
  redactSecrets,
} from '../../../lib/secret.mjs';

export { filterDiffByExcludes, filterGrepByExcludes };

function defaultRun(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return {
    status: r.status,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    error: r.error,
  };
}

function defaultReadFile(p) {
  try {
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  } catch {
    return null;
  }
}

function detectBase(run) {
  const r = run('git', ['rev-parse', '--abbrev-ref', 'origin/HEAD']);
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().replace(/^origin\//, '');
  return 'main';
}

export function gatherContext(sources = {}, opts = {}) {
  const {
    maxBytes = 400000,
    excludeGlobs = [],
    redact = true,
    run = defaultRun,
    readFile = defaultReadFile,
    logTailLines = 200,
    configPath = null,
  } = opts;

  const notes = [];
  const chunks = [];

  // git diff (only when --diff was passed; '' means "default base")
  if (sources.diff !== undefined) {
    const base = sources.diff || detectBase(run);
    const r = run('git', ['diff', base]);
    if (r.error || r.status !== 0) {
      notes.push(`[skip: git diff ${base} unavailable]`);
    } else if (r.stdout.trim()) {
      const { text: filtered, dropped } = filterDiffByExcludes(r.stdout, excludeGlobs);
      for (const p of dropped) notes.push(`[excluded from diff: ${p} (secret/binary exclude)]`);
      if (filtered.trim()) chunks.push({ title: `git diff ${base}`, body: filtered });
    }
  }

  // tracked issues — dispatched on the resolved forge, never on which CLI runs.
  // A forge without an adapter is named here rather than attempted: the CLI of
  // a different forge can answer for an id it recognises and exit 0, which
  // would put another tracker's issue into the brief under this id.
  if ((sources.issue || []).length) {
    const remote = run('git', ['remote', 'get-url', 'origin']);
    const remoteUrl = remote.status === 0 ? remote.stdout.trim() : '';
    const { forge } = resolveForge({ configPath, remoteUrl });
    // Both name the tracker for a checkout whose remote cannot; without them the
    // forge's CLI picks one from the working directory or its own environment.
    const organization = configPath
      ? readConfigSectionValue(configPath, 'forge', 'azure-organization')
      : null;
    const repository = configPath
      ? readConfigSectionValue(configPath, 'forge', 'github-repository')
      : null;
    for (const n of sources.issue) {
      const cmd = issueCommand(forge, n, { remoteUrl, organization, repository });
      if (cmd.unsupported) {
        notes.push(`[skip: issue ${n} not read — ${cmd.unsupported}]`);
        continue;
      }
      const r = run(cmd.bin, cmd.args);
      if (r.error || r.status !== 0) {
        notes.push(`[skip: ${cmd.bin} could not read issue ${n} on ${forge}]`);
      } else if (r.stdout.trim()) {
        chunks.push({ title: `issue #${n}`, body: r.stdout });
      }
    }
  }

  // files
  for (const f of sources.files || []) {
    if (isExcluded(f, excludeGlobs)) {
      notes.push(`[excluded: ${f} (secret/binary exclude)]`);
      continue;
    }
    const body = readFile(f);
    if (body == null) {
      notes.push(`[skip: cannot read ${f}]`);
      continue;
    }
    chunks.push({ title: `file ${f}`, body });
  }

  // ripgrep hits
  for (const g of sources.grep || []) {
    const r = run('rg', ['-n', '--no-heading', g]);
    if (r.error) {
      notes.push(`[skip: rg unavailable for '${g}']`);
      continue;
    }
    if ((r.stdout || '').trim()) {
      const { text: filtered, dropped } = filterGrepByExcludes(r.stdout, excludeGlobs);
      for (const p of dropped) notes.push(`[excluded from grep: ${p}]`);
      if (filtered.trim()) chunks.push({ title: `grep '${g}'`, body: filtered });
    }
  }

  // log tails
  for (const lg of sources.logs || []) {
    if (isExcluded(lg, excludeGlobs)) {
      notes.push(`[excluded: ${lg}]`);
      continue;
    }
    const body = readFile(lg);
    if (body == null) {
      notes.push(`[skip: cannot read ${lg}]`);
      continue;
    }
    const lines = body.split(/\r?\n/);
    if (lines.length > logTailLines) {
      notes.push(`[note: ${lg} tailed to last ${logTailLines} lines]`);
    }
    chunks.push({ title: `log ${lg} (tail)`, body: lines.slice(-logTailLines).join('\n') });
  }

  // redact every chunk before anything is assembled for sending
  if (redact) {
    let total = 0;
    for (const c of chunks) {
      const { text, count } = redactSecrets(c.body);
      c.body = text;
      total += count;
    }
    if (total > 0) notes.push(`[redacted ${total} secret-like token(s)]`);
  } else {
    notes.push('[warning: secret redaction DISABLED (AGENT_RELAY_REDACT=off)]');
  }

  // assemble under the byte cap — truncation is loud
  let budget = maxBytes;
  let capped = false;
  const parts = [];
  for (const c of chunks) {
    const header = `\n===== ${c.title} =====\n`;
    if (capped || budget - header.length <= 0) {
      capped = true;
      notes.push(`[dropped: ${c.title} — AGENT_RELAY_MAX_INPUT_BYTES reached]`);
      continue;
    }
    let body = c.body;
    const avail = budget - header.length;
    if (body.length > avail) {
      const cut = body.length - avail;
      body = body.slice(0, avail) + `\n…[truncated ${cut} bytes of ${c.title}]`;
      notes.push(`[truncated: ${c.title} (${cut} bytes) to fit cap]`);
      capped = true;
    }
    parts.push(header + body);
    budget -= header.length + body.length;
  }

  const text = parts.join('\n');
  return { text, notes, bytes: text.length };
}
