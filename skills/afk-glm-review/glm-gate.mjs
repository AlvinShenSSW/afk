#!/usr/bin/env node
// glm-gate.mjs — Z.ai GLM external review over the shared snapshot lifecycle.
//
// Usage:
//   node glm-gate.mjs                 # current branch vs default base
//   node glm-gate.mjs --base master   # vs an explicit base
//   node glm-gate.mjs --commit <sha>  # one commit
//   node glm-gate.mjs --uncommitted   # staged/unstaged/untracked
//   node glm-gate.mjs --design <path> # review a design doc (sends the doc text, not a diff)
//   node glm-gate.mjs --print-args    # resolve and print the target; no API call
//   node glm-gate.mjs --print-prompt  # print the exact prompts; no API call
//
// Opt out with GLM_REVIEW_GATE=off. GLM_REVIEW_BASE_URL must be an
// Anthropic-protocol endpoint (the OpenAI-compatible Z.ai URL is no longer
// auto-detected).

import { runOpenAiSnapshotGate } from '../../lib/gate/openai-snapshot-gate.mjs';
import { makeAnthropicProvider } from '../../lib/http/anthropic-provider.mjs';

const provider = makeAnthropicProvider({
  name: 'GLM',
  keyEnv: 'ZAI_API_KEY',
  modelEnv: 'GLM_REVIEW_MODEL',
  modelDefault: 'glm-5.2',
  baseUrlEnv: 'GLM_REVIEW_BASE_URL',
  baseUrlDefault: 'https://api.z.ai/api/anthropic',
});

await runOpenAiSnapshotGate({
  family: 'glm',
  label: 'GLM',
  slug: 'glm-gate',
  disableEnv: 'GLM_REVIEW_GATE',
  keyEnvs: ['ZAI_API_KEY', 'GLM_API_KEY'],
  modelEnv: 'GLM_REVIEW_MODEL',
  modelDefault: 'glm-5.2',
  baseUrlEnv: 'GLM_REVIEW_BASE_URL',
  baseUrlDefault: 'https://api.z.ai/api/anthropic',
  maxContextEnv: 'GLM_REVIEW_MAX_CTX_BYTES',
  maxOutputEnv: 'GLM_REVIEW_MAX_OUTPUT_TOKENS',
  excludeGlobsEnv: 'GLM_REVIEW_EXCLUDE_GLOBS',
  provider,
});
