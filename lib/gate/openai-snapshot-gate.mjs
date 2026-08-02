// One lifecycle prevents provider wrappers from drifting on verdict safety.

import { isGateDisabled, positiveIntEnv, reviewTimeoutMs } from './env.mjs';
import { readCredential } from './credential.mjs';
import { guardFor } from './implementer.mjs';
import { sameModelLineage } from './model-identity.mjs';
import { createProtocol } from './protocol.mjs';
import { buildSnapshot } from './snapshot.mjs';
import { parseTarget, validateTarget } from './target.mjs';
import { redactCredential } from '../secret.mjs';

function finishReasonLabel(value) {
  return value == null ? 'missing' : JSON.stringify(value);
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
  const timeoutMs = reviewTimeoutMs(config.family, { env });
  const target = parseTarget(argv, { cwd });

  let snapshot;
  if (target.kind === 'design') {
    const valid = validateTarget(target, { cwd });
    if (!valid.ok) emitError(`cannot review — ${valid.reason}`, 1);
    snapshot = buildSnapshot({
      target, cwd, maxBytes: maxCtx, budgetName: config.maxContextEnv,
    });
    if (snapshot.error) emitError(`cannot review — ${snapshot.error}`, 1);
  }

  if (isGateDisabled(config.disableEnv, env)) {
    emitSkip(`${config.label} gate disabled via ${config.disableEnv}.`);
  }

  const guard = guardFor(config.family, argv, { env });
  if (!guard.run) emitSkip(`independence check — ${guard.reason}`);

  if (target.kind !== 'design') {
    const valid = validateTarget(target, { cwd });
    if (!valid.ok) emitError(`cannot review — ${valid.reason}`, 1);
    snapshot = buildSnapshot({
      target, cwd, maxBytes: maxCtx, budgetName: config.maxContextEnv,
    });
    if (snapshot.error) emitError(`cannot review — ${snapshot.error}`, 1);
  }

  const availableCredential = readCredential(config.keyEnvs, { env, cwd });

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
      baseUrl: safe(baseUrl),
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
  if (!apiKey) {
    emitSkip(`No API key; set ${config.keyEnvs.join(' or ')} in env or .env, or ${config.disableEnv}=off to disable.`);
  }

  for (const note of [...new Set(snapshot.notes)]) {
    process.stderr.write(`[${config.slug}] snapshot: ${note}\n`);
  }
  if (!snapshot.hasChanges) {
    const reason = snapshot.notes.length
      ? `No reviewable changes found for ${target.label} after snapshot exclusions.`
      : `No changes found for ${target.label}.`;
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
      maxTokens: 8192,
      env: providerEnv,
      httpTimeoutMs: timeoutMs,
    });
  } catch (error) {
    if (error?.code === 'auth') {
      emitSkip(`${config.label} authentication failed; check ${config.keyEnvs[0]}.`);
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
  if (!sameModelLineage(result.reportedModel, model)) {
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
  emitReview(safeReview.text);
}
