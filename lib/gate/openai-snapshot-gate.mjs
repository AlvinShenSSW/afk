// One lifecycle prevents provider wrappers from drifting on verdict safety.

import { isGateDisabled, positiveIntEnv, reviewTimeoutMs } from './env.mjs';
import { failureDirection } from './failure.mjs';
import { readCredential } from './credential.mjs';
import { guardFor } from './implementer.mjs';
import { isVersionedModelId, sameVersionedModelLineage } from './model-identity.mjs';
import { createProtocol } from './protocol.mjs';
import { buildSnapshot, formatExcludedPathsNote } from './snapshot.mjs';
import { parseTarget, validateTarget } from './target.mjs';
import { redactCredential } from '../secret.mjs';

function finishReasonLabel(value) {
  return value == null ? 'missing' : JSON.stringify(value);
}

function listEnv(name, env) {
  return String(env[name] ?? '').split(/[\n,]/).map((value) => value.trim()).filter(Boolean);
}

export async function runOpenAiSnapshotGate(config, {
  argv = process.argv.slice(2),
  env = process.env,
  cwd = process.cwd(),
} = {}) {
  const protocol = createProtocol({ label: config.label, slug: config.slug });
  const { emitSkip, emitReview, emitError } = protocol;

  const printArgsOnly = argv.includes('--print-args');
  const printPromptOnly = argv.includes('--print-prompt');
  const model = String(env[config.modelEnv] ?? '').trim() || config.modelDefault;
  const baseUrl = (String(env[config.baseUrlEnv] ?? '').trim() || config.baseUrlDefault).replace(/\/+$/, '');
  const maxCtx = positiveIntEnv(config.maxContextEnv, 400000, { env });
  const maxTokens = positiveIntEnv(config.maxOutputEnv, 8192, { env });
  const timeoutMs = reviewTimeoutMs(config.family, { env });
  const extraExcludeGlobs = listEnv(config.excludeGlobsEnv, env);
  const target = parseTarget(argv, { cwd });
  const availableCredential = readCredential(config.keyEnvs, { env, cwd });
  const missingCredentialReason = `No API key; set ${config.keyEnvs.join(' or ')} in env or .env, or ${config.disableEnv}=off to disable.`;
  const safeReason = (value) => redactCredential(value, availableCredential).text;

  // A target that could not be parsed is operator error and must surface on
  // every gate, including one about to skip: a disabled gate or an independence
  // decline would otherwise exit 0 and swallow the named reason.
  if (target.kind === 'error') {
    const valid = validateTarget(target, { cwd });
    emitError(`cannot review — ${safeReason(valid.reason || 'unparseable target')}`, 1);
  }

  let snapshot;
  if (target.kind === 'design') {
    const valid = validateTarget(target, { cwd });
    if (!valid.ok) emitError(`cannot review — ${safeReason(valid.reason)}`, 1);
    snapshot = buildSnapshot({
      target, cwd, maxBytes: maxCtx, budgetName: config.maxContextEnv, extraExcludeGlobs,
    });
    if (snapshot.error) emitError(`cannot review — ${safeReason(snapshot.error)}`, 1);
  }

  if (isGateDisabled(config.disableEnv, env)) {
    emitSkip(`${config.label} gate disabled via ${config.disableEnv}.`);
  }

  const guard = guardFor(config.family, argv, { env });
  if (!guard.run) emitSkip(`independence check — ${guard.reason}`);

  if (target.kind !== 'design') {
    const valid = validateTarget(target, { cwd });
    if (!valid.ok) emitError(`cannot review — ${safeReason(valid.reason)}`, 1);
    if (!availableCredential && !printArgsOnly && !printPromptOnly) emitSkip(missingCredentialReason);
    snapshot = buildSnapshot({
      target, cwd, maxBytes: maxCtx, budgetName: config.maxContextEnv, extraExcludeGlobs,
    });
    if (snapshot.error) emitError(`cannot review — ${safeReason(snapshot.error)}`, 1);
  }

  if (!isVersionedModelId(model)) {
    emitError(
      `cannot review — ${config.modelEnv} must be a pinned model ID containing a version digit.`,
      1,
    );
  }

  if (printArgsOnly) {
    const safe = (value) => redactCredential(value, availableCredential).text;
    const rendered = JSON.stringify({
      kind: target.kind,
      base: target.base == null ? null : safe(target.base),
      commit: target.commit == null ? null : safe(target.commit),
      label: safe(target.label),
      command: target.command == null ? null : safe(target.command),
      hasChanges: snapshot.hasChanges,
      changedFiles: snapshot.changedFiles.map(safe),
      model: safe(model),
      protocol: safe(config.provider.kind),
      baseUrl: safe(baseUrl),
      maxTokens,
      timeoutMs,
    }, null, 2);
    process.stdout.write(`${rendered}\n`);
    return;
  }

  const previewSystem = redactCredential(snapshot.systemPrompt, availableCredential).text;
  const previewLabel = redactCredential(snapshot.reviewLabel, availableCredential).text;
  const previewPayload = redactCredential(snapshot.payload, availableCredential).text;
  const previewUserPrompt = `Review ${previewLabel}.\n\n${previewPayload}`;
  if (printPromptOnly) {
    process.stdout.write(`${previewSystem}\n\n----- user -----\n${previewUserPrompt}\n`);
    return;
  }

  const apiKey = availableCredential;
  if (!apiKey) emitSkip(missingCredentialReason);

  for (const note of [...new Set(snapshot.notes)]) {
    process.stderr.write(`[${config.slug}] snapshot: ${redactCredential(note, apiKey).text}\n`);
  }
  const excludedPathsNote = formatExcludedPathsNote(snapshot.excludedPaths, apiKey);
  if (excludedPathsNote) {
    process.stderr.write(`[${config.slug}] snapshot: ${excludedPathsNote}\n`);
  }
  if (snapshot.unreviewable) {
    // Changes exist and none reached the reviewer. SKIPPED is for a reviewer
    // that could not run; this is a review that could not read its target, and
    // reporting it as a skip is how a change nobody read passes for clean.
    emitError(
      `cannot review ${snapshot.reviewLabel} — every change was omitted from the snapshot`
        + `${snapshot.notes.length ? ` (${snapshot.notes.join('; ')})` : ''}`,
      1,
    );
  }
  if (!snapshot.hasChanges) {
    const reason = snapshot.notes.length
      ? `No reviewable changes found for ${snapshot.reviewLabel} after snapshot exclusions.`
      : `No changes found for ${snapshot.reviewLabel}.`;
    emitSkip(reason);
  }

  const redactedSystem = redactCredential(snapshot.systemPrompt, apiKey);
  const redactedLabel = redactCredential(snapshot.reviewLabel, apiKey);
  const redactedPayload = redactCredential(snapshot.payload, apiKey);
  const requestSystem = redactedSystem.text;
  const requestLabel = redactedLabel.text;
  const requestPayload = redactedPayload.text;
  const exactCredentialCount = redactedSystem.exactCount + redactedLabel.exactCount + redactedPayload.exactCount;
  if (exactCredentialCount) {
    process.stderr.write(
      `[${config.slug}] snapshot: redacted ${exactCredentialCount} occurrence(s) of the configured credential\n`,
    );
  }
  if (Buffer.byteLength(requestPayload, 'utf8') > maxCtx) {
    emitError(`cannot review — credential redaction exceeded the ${maxCtx}-byte snapshot budget.`, 1);
  }
  const userPrompt = `Review ${requestLabel}.\n\n${requestPayload}`;
  const logModel = redactCredential(model, apiKey).text;

  process.stderr.write(
    `[${config.slug}] POST model=${logModel} payload=${Buffer.byteLength(snapshot.payload, 'utf8')}B files=${snapshot.changedFiles.length}\n`,
  );

  const providerEnv = {
    ...env,
    [config.provider.keyEnv]: apiKey,
    [config.modelEnv]: model,
    [config.baseUrlEnv]: baseUrl,
  };
  let result;
  try {
    result = await config.provider.complete({
      system: requestSystem,
      user: userPrompt,
      model,
      maxTokens,
      env: providerEnv,
      httpTimeoutMs: timeoutMs,
    });
  } catch (error) {
    // Direction is table-owned (lib/gate/failure.mjs); messages stay here.
    if (failureDirection(error?.code) === 'skip') {
      if (error?.code === 'auth') {
        emitSkip(`${config.label} authentication failed; check ${config.keyEnvs[0]}.`);
      }
      if (error?.code === 'rate_limit') {
        emitSkip(
          `${config.label} is rate-limited or out of quota — this reviewer is unavailable right now; the next gate in priority takes its place.`,
        );
      }
      if (error?.code === 'model_unavailable') {
        emitSkip(
          `${config.label} returned HTTP 404 — the configured model may be unavailable for this account (${config.modelEnv}) or the endpoint path may be wrong (${config.baseUrlEnv}).`,
        );
      }
      emitSkip(`${config.label} is unavailable (${error?.code}): ${error?.message || 'provider request failed'}`);
    }
    emitError(`${config.label} review failed (${error?.code || 'unknown'}): ${error?.message || 'provider request failed'}`, 1);
  }

  if (result.finishReason !== 'stop') {
    const safeReason = redactCredential(finishReasonLabel(result.finishReason), apiKey).text;
    emitError(
      `${config.label} returned finish_reason ${safeReason}; the verdict was discarded.`,
      1,
    );
  }
  if (!sameVersionedModelLineage(result.reportedModel, model)) {
    const safeRequested = redactCredential(model, apiKey).text;
    const safeReported = redactCredential(result.reportedModel || 'no model identity', apiKey).text;
    emitError(
      `${config.label} reviewer identity unverified; requested ${safeRequested}, reported ${safeReported}. The verdict was discarded.`,
      1,
    );
  }

  const safeReview = redactCredential(result.text, apiKey);
  if (safeReview.exactCount) {
    process.stderr.write(
      `[${config.slug}] response: redacted ${safeReview.exactCount} occurrence(s) of the configured credential\n`,
    );
  }
  const coverageNote = snapshot.excludedCount
    ? `SNAPSHOT_NOTE excluded_entries=${snapshot.excludedCount}\n`
    : '';
  emitReview(`${coverageNote}${safeReview.text}`);
}
