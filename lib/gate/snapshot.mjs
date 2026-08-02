// A single boundary keeps every tool-less gate on the same exposure policy.

import {
  lstatSync, readFileSync, realpathSync,
} from 'node:fs';
import {
  basename, isAbsolute, join, relative, resolve,
} from 'node:path';
import { TextDecoder } from 'node:util';

import { isExcluded, redactCredential, redactSecrets } from '../secret.mjs';
import { git, gitTry } from './git.mjs';
import { buildDesignReviewPrompt, buildReviewPrompt } from './prompt.mjs';
import { collectDiff } from './target.mjs';

const MAX_FILE_BYTES = 200000;
const SNAPSHOT_CONTEXT = 'You are given a bounded snapshot of the selected artifact. That snapshot is everything you have: you cannot run commands or open other files, so never claim to have done either. Where a judgement would require material you were not given, say so rather than assume.';
const DESIGN_CONTEXT = 'You are given the full text of the design document. That document is everything you have: you cannot run commands or open other files, so never claim to have done either.';

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
  return `:(top,literal)${path}`;
}

export function formatExcludedPathsNote(paths, credential) {
  const unique = [...new Set(paths)];
  if (!unique.length) return '';
  const shown = unique.slice(0, 20).map((path) => {
    const safe = utf8Prefix(redactCredential(path, credential).text, 200);
    return JSON.stringify(safe);
  });
  const remainder = unique.length - shown.length;
  return `excluded paths: ${shown.join(', ')}${remainder ? `, and ${remainder} more` : ''}`;
}

function approvedPatch(target, paths, cwd) {
  if (!paths.length || target.kind === 'design') return { text: '', error: null };
  const pathspecs = [...new Set(paths)].map(literalPath);
  let args;
  if (target.kind === 'commit') {
    args = [
      'show', '--no-relative', '--format=', '-M', '-C', '--find-copies-harder',
      target.commit, '--', ...pathspecs,
    ];
  } else if (target.kind === 'uncommitted') {
    args = ['diff', '--no-relative', '-M', '-C', '--find-copies-harder', 'HEAD', '--', ...pathspecs];
  } else {
    args = [
      'diff', '--no-relative', '-M', '-C', '--find-copies-harder', `${target.base}...HEAD`,
      '--', ...pathspecs,
    ];
  }
  const result = gitTry(args, { cwd });
  if (!result.ok) return { text: '', error: `git could not build the approved patch: ${result.err}` };
  if (!result.out.trim()) {
    return { text: '', error: 'git returned an empty approved patch for tracked changes.' };
  }
  return { text: result.out, error: null };
}

function worktreeFile(path, cwd, top) {
  const rootPath = top || git(['rev-parse', '--show-toplevel'], { cwd }).trim() || cwd;
  const absolute = resolve(rootPath, path);
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
    root = realpathSync(rootPath);
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
  if (!tree.ok) return { error: `git could not inspect tracked path: ${tree.err}` };
  if (!tree.out) return { error: 'git could not locate the tracked blob.' };
  const [mode, type] = tree.out.split(/\s+/, 2);
  if (mode === '120000') return { content: null, note: 'symlink blob omitted', excluded: true };
  if (type !== 'blob') return { content: null, note: 'gitlink or non-blob entry omitted', excluded: true };
  const sizeResult = gitTry(['cat-file', '-s', spec], { cwd });
  if (!sizeResult.ok) return { error: `git could not inspect the tracked blob: ${sizeResult.err}` };
  const size = Number.parseInt(sizeResult.out.trim(), 10);
  if (!Number.isFinite(size) || size > MAX_FILE_BYTES) {
    return { content: null, note: 'large or unreadable blob omitted', excluded: false };
  }
  const blob = gitTry(['show', spec], { cwd });
  if (!blob.ok) return { error: `git could not read the tracked blob: ${blob.err}` };
  if (blob.out.includes('\0')) return { content: null, note: 'binary blob omitted', excluded: false };
  return { content: blob.out, note: '', excluded: false };
}

function designSnapshot({ target, cwd, maxBytes, budgetName, extraExcludeGlobs }) {
  const path = cwd ? resolve(cwd, target.path) : resolve(target.path);
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
  const repo = gitTry(['rev-parse', '--show-toplevel'], { cwd });
  const root = resolve(repo.ok && repo.out.trim() ? repo.out.trim() : cwd || process.cwd());
  let actualPath;
  let actualRoot;
  try {
    actualPath = realpathSync(path);
    actualRoot = realpathSync(root);
  } catch {
    return { error: `--design "${target.path}" could not be resolved.`, payload: '', changedFiles: [], notes: [] };
  }
  const rel = relative(actualRoot, actualPath);
  const exclusionPath = rel && rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(rel)
    ? rel
    : basename(actualPath);
  if (isExcluded(exclusionPath, extraExcludeGlobs)) {
    return { error: '--design names a secret-bearing path.', payload: '', changedFiles: [], notes: [] };
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
    excludedCount: 0,
    excludedPaths: [],
    hasChanges: true,
    reviewLabel,
    systemPrompt: buildDesignReviewPrompt({ scope: reviewLabel, context: DESIGN_CONTEXT }),
  };
}

export function buildSnapshot({
  target,
  cwd = process.cwd(),
  maxBytes = 400000,
  budgetName = 'REVIEW_MAX_CTX_BYTES',
  extraExcludeGlobs = [],
} = {}) {
  if (target.kind === 'design') {
    return designSnapshot({ target, cwd, maxBytes, budgetName, extraExcludeGlobs });
  }

  const collected = collectDiff(target, { cwd, detectCopiesHarder: true });
  if (collected.error) {
    return { error: collected.error, payload: '', changedFiles: [], notes: [], hasChanges: false };
  }

  const notes = [];
  const approved = [];
  const excludedPaths = [];
  let excludedCount = 0;
  let worktreeTop = '';
  let entries = collected.entries;
  if (target.kind === 'uncommitted') {
    const top = gitTry(['rev-parse', '--show-toplevel'], { cwd });
    if (!top.ok || !top.out.trim()) {
      return {
        error: `git could not resolve the worktree root${top.err ? `: ${top.err}` : ''}`,
        payload: '', changedFiles: [], notes: [], hasChanges: false,
      };
    }
    worktreeTop = top.out.trim();
    const untracked = gitTry(['ls-files', '--others', '--exclude-standard', '-z'], { cwd: worktreeTop });
    if (!untracked.ok) {
      return {
        error: `git could not list repository-wide untracked files: ${untracked.err}`,
        payload: '', changedFiles: [], notes: [], hasChanges: false,
      };
    }
    entries = [
      ...collected.entries.filter((entry) => entry.status !== '?'),
      ...untracked.out.split('\0').filter(Boolean).map((path) => ({ status: '?', oldPath: null, path })),
    ];
  }
  for (const entry of entries) {
    if (entryPaths(entry).some((path) => isExcluded(path, extraExcludeGlobs))) {
      excludedCount++;
      excludedPaths.push(...entryPaths(entry));
      continue;
    }
    approved.push(entry);
  }

  const revision = target.kind === 'commit' ? target.commit : 'HEAD';
  const reviewable = [];
  const fileBlocks = [];
  for (const entry of approved) {
    if (entry.status === 'D') {
      reviewable.push(entry);
      continue;
    }
    const loaded = target.kind === 'uncommitted'
      ? worktreeFile(entry.path, cwd, worktreeTop)
      : trackedFile(revision, entry.path, cwd);
    if (loaded.error) {
      return { error: loaded.error, payload: '', changedFiles: [], notes, hasChanges: false };
    }
    if (loaded.excluded) {
      excludedCount++;
      excludedPaths.push(entry.path);
      notes.push(loaded.note);
      continue;
    }
    reviewable.push(entry);
    if (loaded.note) notes.push(loaded.note);
    if (loaded.content == null) continue;
    const redacted = redactSecrets(loaded.content);
    if (redacted.count) notes.push(`redacted ${redacted.count} secret-like file value(s)`);
    const safePath = redactSecrets(entry.path).text;
    fileBlocks.push({
      path: entry.path,
      text: `\n### ${safePath}\n\`\`\`\n${redacted.text}\n\`\`\`\n`,
    });
  }

  const trackedPaths = reviewable
    .filter((entry) => entry.status !== '?')
    .flatMap(entryPaths);
  const patch = approvedPatch(target, trackedPaths, cwd);
  if (patch.error) {
    return { error: patch.error, payload: '', changedFiles: [], notes, hasChanges: false };
  }
  const redactedPatch = redactSecrets(patch.text);
  if (redactedPatch.count) notes.push(`redacted ${redactedPatch.count} secret-like diff value(s)`);

  const patchPaths = redactedPatch.text.trim()
    ? reviewable.filter((entry) => entry.status !== '?').map((entry) => entry.path)
    : [];
  const candidatePaths = [...new Set([...patchPaths, ...fileBlocks.map((block) => block.path)])];
  const prefix = `## Diff summary\nIncluded files: ${candidatePaths.length}\nExcluded entries: ${excludedCount}\n\n## Full diff\n`;
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
  if (rawDiffBytes && diffBudget <= 0) {
    return {
      error: `snapshot diff cannot fit within the ${maxBytes}-byte budget; raise ${budgetName}.`,
      payload: '', changedFiles: [], notes, hasChanges: false,
    };
  }
  const renderedDiff = utf8Prefix(redactedPatch.text, diffBudget);
  let payload = prefix + renderedDiff;
  if (truncated) payload += truncationMarker;
  payload += contentsHeading;

  const visibleFiles = renderedDiff.trim() ? [...new Set(patchPaths)] : [];
  let visibleContentCount = 0;
  for (const block of fileBlocks) {
    if (Buffer.byteLength(payload + block.text, 'utf8') > maxBytes) {
      notes.push('remaining file contents omitted at snapshot budget');
      break;
    }
    payload += block.text;
    visibleContentCount++;
    if (!visibleFiles.includes(block.path)) visibleFiles.push(block.path);
  }

  const finalPrefix = `## Diff summary\nIncluded files: ${visibleFiles.length}\nExcluded entries: ${excludedCount}\n\n## Full diff\n`;
  payload = finalPrefix + payload.slice(prefix.length);

  if (excludedCount) {
    notes.push(`${excludedCount} secret-bearing or unsafe entr${excludedCount === 1 ? 'y was' : 'ies were'} omitted`);
  }
  const reviewLabel = redactSecrets(target.label).text;

  return {
    error: null,
    payload,
    changedFiles: visibleFiles,
    notes,
    excludedCount,
    excludedPaths,
    hasChanges: Boolean(renderedDiff.trim() || visibleContentCount),
    reviewLabel,
    systemPrompt: buildReviewPrompt({ scope: reviewLabel, context: SNAPSHOT_CONTEXT }),
  };
}
