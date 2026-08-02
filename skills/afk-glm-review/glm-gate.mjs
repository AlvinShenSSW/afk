#!/usr/bin/env node
// glm-gate.mjs — Z.ai GLM external review wrapper.
//
// The one gate reached through a REST API rather than an agentic CLI: it packs
// the diff AND the full current contents of changed files into a bounded
// context and sends that. The reviewer has no tools, so anything outside that
// snapshot is invisible to it — which is why this gate's context clause tells
// the model so explicitly.
//
// Usage:
//   node glm-gate.mjs                 # current branch vs default base
//   node glm-gate.mjs --base master   # vs an explicit base
//   node glm-gate.mjs --commit <sha>  # one commit
//   node glm-gate.mjs --uncommitted   # staged/unstaged/untracked
//   node glm-gate.mjs --design <path> # review a design doc (sends the doc text, not a diff)
//   node glm-gate.mjs --print-args    # resolve and print the target; no API call
//
// Opt out with GLM_REVIEW_GATE=off.

import {
  abortAfter, isGateDisabled, positiveIntEnv, reviewTimeoutMs,
} from '../../lib/gate/env.mjs';
import { readCredential } from '../../lib/gate/credential.mjs';
import { guardFor } from '../../lib/gate/implementer.mjs';
import { createProtocol } from '../../lib/gate/protocol.mjs';
import { buildSnapshot } from '../../lib/gate/snapshot.mjs';
import { parseTarget, validateTarget } from '../../lib/gate/target.mjs';
import { redactCredential } from '../../lib/secret.mjs';

const { emitSkip, emitReview, emitError } = createProtocol({ label: 'GLM', slug: 'glm-gate' });

const userArgs = process.argv.slice(2);
const printArgsOnly = userArgs.includes('--print-args');
// Prints the exact system + user prompt GLM would receive, and calls no API. In
// design mode the argv is not the review — only the prompt reveals whether the
// document text (not a diff) is what got sent.
const printPromptOnly = userArgs.includes('--print-prompt');

const model = String(process.env.GLM_REVIEW_MODEL ?? '').trim() || 'glm-5.2';
const baseUrl = (String(process.env.GLM_REVIEW_BASE_URL ?? '').trim() || 'https://api.z.ai/api/anthropic').replace(/\/+$/, '');
const maxCtx = positiveIntEnv('GLM_REVIEW_MAX_CTX_BYTES', 400000);
const timeoutMs = reviewTimeoutMs('glm');

const target = parseTarget(userArgs);
const isDesign = target.kind === 'design';
let snapshot;

// A malformed --design is operator error that must fail loud on EVERY gate, even
// one about to self-skip, so a design target validates BEFORE the independence
// guard. A diff target validates after it.
if (isDesign) {
  const valid = validateTarget(target);
  if (!valid.ok) {
    emitError(`cannot review — ${valid.reason}`, 1);
  }
  snapshot = buildSnapshot({
    target, maxBytes: maxCtx, budgetName: 'GLM_REVIEW_MAX_CTX_BYTES',
  });
  if (snapshot.error) emitError(`cannot review — ${snapshot.error}`, 1);
}

if (isGateDisabled('GLM_REVIEW_GATE')) {
  emitSkip('GLM gate disabled via GLM_REVIEW_GATE.');
}

const guard = guardFor('glm', userArgs);
if (!guard.run) {
  emitSkip(`independence check — ${guard.reason}`);
}

if (!isDesign) {
  const valid = validateTarget(target);
  if (!valid.ok) {
    emitError(`cannot review — ${valid.reason}`, 1);
  }
  snapshot = buildSnapshot({
    target, maxBytes: maxCtx, budgetName: 'GLM_REVIEW_MAX_CTX_BYTES',
  });
  if (snapshot.error) emitError(`cannot review — ${snapshot.error}`, 1);
}

const availableKey = readCredential(['ZAI_API_KEY', 'GLM_API_KEY']);

if (printArgsOnly) {
  // Dry run: resolve the target, call nothing. Runs before every skip so a dry
  // run on a clean tree can still report which base it resolved.
  const safe = (value) => redactCredential(value, availableKey).text;
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
  process.exit(0);
}

const previewSystem = redactCredential(snapshot.systemPrompt, availableKey).text;
const previewLabel = redactCredential(snapshot.reviewLabel, availableKey).text;
const previewPayload = redactCredential(snapshot.payload, availableKey).text;
const previewUserPrompt = `Review ${previewLabel}.\n\n${previewPayload}`;

if (printPromptOnly) {
  process.stdout.write(`${previewSystem}\n\n----- user -----\n${previewUserPrompt}\n`);
  process.exit(0);
}

const apiKey = availableKey;
if (!apiKey) {
  emitSkip('No API key; set ZAI_API_KEY or GLM_API_KEY in env or .env, or GLM_REVIEW_GATE=off to disable.');
}

for (const note of [...new Set(snapshot.notes)]) {
  process.stderr.write(`[glm-gate] snapshot: ${note}\n`);
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
    `[glm-gate] snapshot: redacted ${exactCredentialCount} occurrence(s) of the configured credential\n`,
  );
}
if (Buffer.byteLength(requestPayload, 'utf8') > maxCtx) {
  emitError(`cannot review — credential redaction exceeded the ${maxCtx}-byte snapshot budget.`, 1);
}
const userPrompt = `Review ${requestLabel}.\n\n${requestPayload}`;

const isAnthropic = /\/anthropic(\/|$)/.test(baseUrl);
const url = isAnthropic ? `${baseUrl}/v1/messages` : `${baseUrl}/chat/completions`;
const logModel = redactCredential(model, apiKey).text;
process.stderr.write(`[glm-gate] POST model=${logModel} mode=${isAnthropic ? 'anthropic' : 'openai'} payload=${Buffer.byteLength(snapshot.payload, 'utf8')}B files=${snapshot.changedFiles.length}\n`);

const headers = { 'Content-Type': 'application/json' };
let reqBody;
if (isAnthropic) {
  headers.Authorization = `Bearer ${apiKey}`;
  headers['x-api-key'] = apiKey;
  headers['anthropic-version'] = '2023-06-01';
  reqBody = JSON.stringify({
    model,
    max_tokens: 8192,
    temperature: 0.2,
    system: requestSystem,
    messages: [{ role: 'user', content: userPrompt }],
  });
} else {
  headers.Authorization = `Bearer ${apiKey}`;
  reqBody = JSON.stringify({
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: requestSystem },
      { role: 'user', content: userPrompt },
    ],
  });
}

let response;
let raw;
let requestError;
const deadline = abortAfter(timeoutMs);
try {
  response = await fetch(url, {
    method: 'POST', headers, body: reqBody, signal: deadline.signal,
  });
  raw = await response.text();
} catch (error) {
  requestError = error;
} finally {
  deadline.clear();
}
if (deadline.signal.aborted) {
  emitError(
    `GLM review timed out after ${Math.round(timeoutMs / 1000)}s with no verdict. `
    + 'Raise GLM_REVIEW_TIMEOUT_MS or AFK_REVIEW_TIMEOUT_MS, or narrow the target.',
    1,
  );
}
if (requestError) {
  emitSkip('network error calling Z.ai. Gate skipped.');
}
if (!response.ok) {
  if (response.status === 401 || response.status === 403) {
    emitSkip(`Z.ai auth failed (HTTP ${response.status}); check ZAI_API_KEY.`);
  }
  emitSkip(`Z.ai HTTP ${response.status}; gate could not run.`);
}

let data;
try {
  data = JSON.parse(raw);
} catch {
  emitSkip('Z.ai returned non-JSON content.');
}

const review = (isAnthropic
  ? (Array.isArray(data?.content) ? data.content.filter((block) => block?.type === 'text').map((block) => block.text).join('\n') : '')
  : (data?.choices?.[0]?.message?.content || '')
).trim();

if (!review) {
  emitSkip('Z.ai returned no review content.');
}

const safeReview = redactCredential(review, apiKey);
if (safeReview.exactCount) {
  process.stderr.write(
    `[glm-gate] response: redacted ${safeReview.exactCount} occurrence(s) of the configured credential\n`,
  );
}
emitReview(safeReview.text);
