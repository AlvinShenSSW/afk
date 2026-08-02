// A single boundary keeps every tool-less gate on the same exposure policy.

import {
  lstatSync, readFileSync, realpathSync,
} from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { TextDecoder } from 'node:util';

import { isExcluded, redactSecrets } from '../secret.mjs';
import { git, gitTry } from './git.mjs';
import { buildDesignReviewPrompt, buildReviewPrompt } from './prompt.mjs';
import { collectDiff } from './target.mjs';

const MAX_FILE_BYTES = 200000;
const SNAPSHOT_CONTEXT = 'You are given a bounded snapshot of the selected artifact. That snapshot is everything you have: you cannot run commands or open other files, so never claim to have done either. Where a judgement would require material you were not given, say so rather than assume.';

function utf8Prefix(text, maxBytes) {
  const buffer = Buffer.from(String(text), 'utf8');
  if (buffer.length <= maxBytes) return String(text);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (let end = Math.max(0, maxBytes); end >= Math.max(0, maxBytes - 3); end--) {
    try {
      return decoder.decode(buffer.subarray(0, end));
    } catch {
      // A UTF-8 boundary is at most three bytes before the requested prefix.
    }
  }
  return '';
}

function entryPaths(entry) {
  return [entry.oldPath, entry.path].filter(Boolean);
}

function literalPath(path) {
  return `:(literal)${path}`;
}

function approvedPatch(target, paths, cwd) {
  if (!paths.length || target.kind === 'design') return { text: '', error: null };
  const pathspecs = [...new Set(paths)].map(literalPath);
  let args;
  if (target.kind === 'commit') {
    args = [
      'show', '--format=', '-M', '-C', '--find-copies-harder',
      target.commit, '--', ...pathspecs,
    ];
  } else if (target.kind === 'uncommitted') {
    args = ['diff', '-M', '-C', '--find-copies-harder', 'HEAD', '--', ...pathspecs];
  } else {
    args = [
      'diff', '-M', '-C', '--find-copies-harder', `${target.base}...HEAD`,
      '--', ...pathspecs,
    ];
  }
  const result = gitTry(args, { cwd });
  return result.ok
    ? { text: result.out, error: null }
    : { text: '', error: `git could not build the approved patch: ${result.err}` };
}

function worktreeFile(path, cwd) {
  const top = git(['rev-parse', '--show-toplevel'], { cwd }).trim() || cwd;
  const absolute = resolve(top, path);
  let stat;
  try {
    stat = lstatSync(absolute);
  } catch {
    return { content: null, note: 'missing file omitted', excluded: false };
  }
  if (stat.isSymbolicLink()) {
    return { content: null, note: 'symlink omitted', excluded: true };
  }
  if (!stat.isFile()) {
    return { content: null, note: 'non-regular file omitted', excluded: true };
  }
  let actual;
  let root;
  try {
    actual = realpathSync(absolute);
    root = realpathSync(top);
  } catch {
    return { content: null, note: 'unresolvable file omitted', excluded: true };
  }
  const rel = relative(root, actual);
  if (!rel || rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(rel)) {
    return { content: null, note: 'out-of-worktree file omitted', excluded: true };
  }
  if (stat.size > MAX_FILE_BYTES) {
    return { content: null, note: 'large file omitted', excluded: false };
  }
  try {
    const content = readFileSync(actual, 'utf8');
    if (content.includes('\0')) return { content: null, note: 'binary file omitted', excluded: false };
    return { content, note: '', excluded: false };
  } catch {
    return { content: null, note: 'unreadable file omitted', excluded: true };
  }
}

function trackedFile(revision, path, cwd) {
  const spec = `${revision}:${path}`;
  const tree = gitTry(['ls-tree', '-z', revision, '--', literalPath(path)], { cwd });
  if (!tree.ok || !tree.out) return { content: null, note: 'missing blob omitted', excluded: false };
  const mode = tree.out.slice(0, tree.out.indexOf(' '));
  if (mode === '120000') return { content: null, note: 'symlink blob omitted', excluded: true };
  const size = Number.parseInt(git(['cat-file', '-s', spec], { cwd }).trim(), 10);
  if (!Number.isFinite(size) || size > MAX_FILE_BYTES) {
    return { content: null, note: 'large or unreadable blob omitted', excluded: false };
  }
  const blob = gitTry(['show', spec], { cwd });
  if (!blob.ok) return { content: null, note: 'unreadable blob omitted', excluded: true };
  if (blob.out.includes('\0')) return { content: null, note: 'binary blob omitted', excluded: false };
  return { content: blob.out, note: '', excluded: false };
}

function designSnapshot({ target, cwd, maxBytes, budgetName }) {
  if (isExcluded(target.path)) {
    return { error: '--design names a secret-bearing path.', payload: '', changedFiles: [], notes: [] };
  }
  const path = cwd ? resolve(cwd, target.path) : target.path;
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    return { error: `--design "${target.path}" could not be read.`, payload: '', changedFiles: [], notes: [] };
  }
  if (stat.isSymbolicLink()) {
    return { error: '--design must not be a symlink.', payload: '', changedFiles: [], notes: [] };
  }
  if (!stat.isFile()) {
    return { error: '--design must name a regular file.', payload: '', changedFiles: [], notes: [] };
  }
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return { error: `--design "${target.path}" could not be read.`, payload: '', changedFiles: [], notes: [] };
  }
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    return {
      error: `--design doc is over the ${maxBytes}-byte budget; scope it or raise ${budgetName}.`,
      payload: '', changedFiles: [], notes: [],
    };
  }
  const redacted = redactSecrets(text);
  const safePath = redactSecrets(target.path).text;
  const reviewLabel = redactSecrets(target.label).text;
  return {
    error: null,
    payload: `## Design document (${safePath})\n${redacted.text}\n`,
    changedFiles: [target.path],
    notes: redacted.count ? [`redacted ${redacted.count} secret-like value(s)`] : [],
    hasChanges: true,
    reviewLabel,
    systemPrompt: buildDesignReviewPrompt({ scope: reviewLabel, context: SNAPSHOT_CONTEXT }),
  };
}

export function buildSnapshot({
  target,
  cwd = process.cwd(),
  maxBytes = 400000,
  budgetName = 'REVIEW_MAX_CTX_BYTES',
} = {}) {
  if (target.kind === 'design') {
    return designSnapshot({ target, cwd, maxBytes, budgetName });
  }

  const collected = collectDiff(target, { cwd });
  if (collected.error) {
    return { error: collected.error, payload: '', changedFiles: [], notes: [], hasChanges: false };
  }

  const notes = [];
  const approved = [];
  let excludedCount = 0;
  for (const entry of collected.entries) {
    if (entryPaths(entry).some((path) => isExcluded(path))) {
      excludedCount++;
      continue;
    }
    if (target.kind === 'uncommitted' && entry.status !== 'D') {
      const probe = worktreeFile(entry.path, cwd);
      if (probe.excluded) {
        excludedCount++;
        notes.push(probe.note);
        continue;
      }
    }
    approved.push(entry);
  }

  const trackedPaths = approved
    .filter((entry) => entry.status !== '?' && entry.status !== 'D')
    .flatMap(entryPaths);
  const patch = approvedPatch(target, trackedPaths, cwd);
  if (patch.error) {
    return { error: patch.error, payload: '', changedFiles: [], notes, hasChanges: false };
  }
  const redactedPatch = redactSecrets(patch.text);
  if (redactedPatch.count) notes.push(`redacted ${redactedPatch.count} secret-like diff value(s)`);

  const currentEntries = approved.filter((entry) => entry.status !== 'D');
  const changedFiles = [...new Set(currentEntries.map((entry) => entry.path))];
  const prefix = `## Diff summary\nIncluded files: ${changedFiles.length}\nExcluded entries: ${excludedCount}\n\n## Full diff\n`;
  const contentsHeading = '\n## Full selected contents\n';
  const truncationMarker = '\n[diff truncated at the snapshot budget]\n';
  const bareOverhead = Buffer.byteLength(prefix + contentsHeading, 'utf8');
  if (bareOverhead > maxBytes) {
    return {
      error: `snapshot metadata is over the ${maxBytes}-byte budget; raise ${budgetName}.`,
      payload: '', changedFiles: [], notes, hasChanges: false,
    };
  }
  const rawDiffBytes = Buffer.byteLength(redactedPatch.text, 'utf8');
  const preferredDiffBudget = Math.floor(maxBytes * 0.6);
  let diffBudget = Math.min(preferredDiffBudget, maxBytes - bareOverhead);
  const truncated = rawDiffBytes > diffBudget;
  if (truncated) {
    const boundedOverhead = bareOverhead + Buffer.byteLength(truncationMarker, 'utf8');
    if (boundedOverhead > maxBytes) {
      return {
        error: `snapshot metadata is over the ${maxBytes}-byte budget; raise ${budgetName}.`,
        payload: '', changedFiles: [], notes, hasChanges: false,
      };
    }
    diffBudget = Math.min(preferredDiffBudget, maxBytes - boundedOverhead);
  }
  let payload = prefix + utf8Prefix(redactedPatch.text, diffBudget);
  if (truncated) payload += truncationMarker;
  payload += contentsHeading;

  const revision = target.kind === 'commit' ? target.commit : 'HEAD';
  const visibleFiles = [];
  for (const entry of currentEntries) {
    const loaded = target.kind === 'uncommitted'
      ? worktreeFile(entry.path, cwd)
      : trackedFile(revision, entry.path, cwd);
    if (loaded.excluded) {
      excludedCount++;
      notes.push(loaded.note);
      continue;
    }
    if (loaded.note) notes.push(loaded.note);
    if (loaded.content == null) continue;
    const redacted = redactSecrets(loaded.content);
    if (redacted.count) notes.push(`redacted ${redacted.count} secret-like file value(s)`);
    const safePath = redactSecrets(entry.path).text;
    const block = `\n### ${safePath}\n\`\`\`\n${redacted.text}\n\`\`\`\n`;
    if (Buffer.byteLength(payload + block, 'utf8') > maxBytes) {
      notes.push('remaining file contents omitted at snapshot budget');
      break;
    }
    payload += block;
    visibleFiles.push(entry.path);
  }

  if (excludedCount) notes.push(`${excludedCount} secret-bearing or unsafe entr${excludedCount === 1 ? 'y was' : 'ies were'} omitted`);
  const reviewLabel = redactSecrets(target.label).text;

  return {
    error: null,
    payload,
    changedFiles: visibleFiles,
    notes,
    hasChanges: approved.length > 0,
    reviewLabel,
    systemPrompt: buildReviewPrompt({ scope: reviewLabel, context: SNAPSHOT_CONTEXT }),
  };
}
