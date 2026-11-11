#!/usr/bin/env node

import { runOpenAiSnapshotGate } from '../../lib/gate/openai-snapshot-gate.mjs';
import { makeOpenAiProvider } from '../../lib/http/openai-provider.mjs';

const MODEL_DEFAULT = 'gemini-4-argon';
const BASE_URL_DEFAULT = 'https://generativelanguage.googleapis.com/v1beta/openai';
const REASONING_EFFORT = Object.freeze({
  env: 'GEMINI_REVIEW_REASONING_EFFORT',
  default: 'high',
  allowed: Object.freeze(['minimal', 'low', 'medium', 'high']),
});

const provider = makeOpenAiProvider({
  name: 'Gemini',
  keyEnv: 'GEMINI_REVIEW_API_KEY',
  modelEnv: 'GEMINI_REVIEW_MODEL',
  modelDefault: MODEL_DEFAULT,
  baseUrlEnv: 'GEMINI_REVIEW_BASE_URL',
  baseUrlDefault: BASE_URL_DEFAULT,
  tokenParam: 'max_tokens',
  tokenParamOverrideEnv: null,
  emptyHint: 'retry once after lowering GEMINI_REVIEW_MAX_CTX_BYTES and/or raising GEMINI_REVIEW_MAX_OUTPUT_TOKENS',
  // The gate resolves and validates the effort before any request.
  buildExtraBody: (env) => ({ reasoning_effort: env[REASONING_EFFORT.env] }),
});

await runOpenAiSnapshotGate({
  family: 'gemini',
  label: 'GEMINI',
  slug: 'gemini-gate',
  disableEnv: 'GEMINI_REVIEW_GATE',
  keyEnvs: ['GEMINI_REVIEW_API_KEY', 'GEMINI_API_KEY'],
  modelEnv: 'GEMINI_REVIEW_MODEL',
  modelDefault: MODEL_DEFAULT,
  baseUrlEnv: 'GEMINI_REVIEW_BASE_URL',
  baseUrlDefault: BASE_URL_DEFAULT,
  maxContextEnv: 'GEMINI_REVIEW_MAX_CTX_BYTES',
  // Gemini counts thinking against max_tokens; 8192 would truncate a high-effort review.
  maxOutputEnv: 'GEMINI_REVIEW_MAX_OUTPUT_TOKENS',
  maxOutputDefault: 65536,
  excludeGlobsEnv: 'GEMINI_REVIEW_EXCLUDE_GLOBS',
  reasoningEffort: REASONING_EFFORT,
  provider,
});
