#!/usr/bin/env node
// afk-resume-detect.mjs — plugin-level SessionStart hook.
//
// When a window (re)opens against a repo, detect any afk run that is paused and
// resumable (state: active, heartbeat stale beyond the overlap guard) and inject
// it as SessionStart context so the operator does not have to hunt down the
// ledger. Behaviour is set by the `auto-resume` knob in .afk/config.md
// (off | notify | auto; default notify). See
// docs/designs/specs/2026-07-18-session-start-auto-resume.md.
//
// It also carries the stale-install notice. This hook fires before any skill is
// chosen, so it is the only place a direct satellite invocation — which never
// runs the afk driver's kickoff check — can see that its wrappers are old. The
// two signals are independent: `auto-resume: off` silences resume detection and
// not the notice, which has its own opt-out (AFK_UPDATE_CHECK).
//
// Contract: reads the hook JSON from stdin, writes at most one JSON object to
// stdout, and ALWAYS exits 0. It never blocks or crashes a session — any error
// is swallowed and produces no output. Pure no-op outside an afk repo.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  hasConfigKeyInSection,
  readConfigSectionValue,
  readConfigValue,
} from '../lib/config.mjs';
import { mainWorktree } from '../lib/gate/git.mjs';
import { buildContext, collectResumable, normalizeMode } from '../lib/resume/detect.mjs';
import { resolveUpdateNotice } from '../scripts/update-check.mjs';

async function readStdin() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  return raw;
}

function pluginVersion(pluginRoot) {
  try {
    return JSON.parse(readFileSync(join(pluginRoot, 'package.json'), 'utf8')).version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function gateProfileNoticeEnabled() {
  return !/^(?:off|0|false|no|disabled)$/i.test(
    String(process.env.AFK_GATE_PROFILE_NOTICE || '').trim(),
  );
}

function gateProfileNotice({ configPath, receiptPath, version }) {
  const section = 'external gate';
  if (hasConfigKeyInSection(configPath, section, 'gates')) return '';

  const values = Object.fromEntries(
    ['priority', 'min-pass', 'mode', 'design-gate', 'implementer']
      .map((key) => [key, readConfigSectionValue(configPath, section, key)]),
  );
  const present = Object.fromEntries(
    Object.keys(values).map((key) => [key, hasConfigKeyInSection(configPath, section, key)]),
  );
  const signature = createHash('sha256')
    .update(JSON.stringify({ version, values, present }))
    .digest('hex');

  try {
    const prior = JSON.parse(readFileSync(receiptPath, 'utf8'));
    if (prior.signature === signature) return '';
  } catch {
    // Missing/unreadable receipt means at-least-once notification.
  }

  const legacy = present.priority || present['min-pass'] || present.mode;
  const notice = legacy
    ? [
        `This AFK config uses a legacy gate profile (effective min-pass: ${values['min-pass'] || '1'}, mode: ${values.mode || 'waterfall'}).`,
        'Add `gates: codex > kimi` to opt in to ordered Codex outer + Kimi final review.',
      ].join(' ')
    : [
        'This AFK config has no PR gate decision and now uses `gates: codex > kimi` (two sequential external reviews).',
        'If reduced coverage is deliberate, a one-item profile such as `gates: codex` is the explicit escape hatch.',
      ].join(' ');

  try {
    mkdirSync(dirname(receiptPath), { recursive: true });
    const temp = `${receiptPath}.${process.pid}.tmp`;
    writeFileSync(temp, JSON.stringify({ signature, version }), 'utf8');
    renameSync(temp, receiptPath);
  } catch {
    // A lost receipt write costs at most one duplicate bounded notice.
  }
  return notice;
}

async function main() {
  let data = {};
  try {
    data = JSON.parse(await readStdin()) || {};
  } catch {
    return; // no/garbled input → nothing to do
  }

  // Act only on a real window (re)start, never on clear/compact.
  if (data.source !== 'startup' && data.source !== 'resume') return;

  const cwd = (typeof data.cwd === 'string' && data.cwd) || process.cwd();
  const root = mainWorktree({ cwd }) || cwd;
  const afkDir = join(root, '.afk');

  // No .afk/ means no afk repo: the hook's no-op contract, unchanged by the
  // notice below.
  if (!existsSync(afkDir)) return;

  // Disabled → do not scan. The update notice is a different fact and is
  // resolved regardless, so this knob can no longer end the run early.
  const mode = normalizeMode(readConfigValue(join(afkDir, 'config.md'), 'auto-resume'));
  const runs = mode === 'off'
    ? []
    : collectResumable(join(afkDir, 'runs'), { root, now: new Date() });

  const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const notice = await resolveUpdateNotice({
    pluginRoot,
    cachePath: join(afkDir, 'update-check.json'),
  });
  const profileNotice = gateProfileNoticeEnabled()
    ? gateProfileNotice({
        configPath: join(afkDir, 'config.md'),
        receiptPath: join(afkDir, 'gate-profile-notice.json'),
        version: pluginVersion(pluginRoot),
      })
    : '';

  const context = [notice, profileNotice, buildContext(runs, { mode })].filter(Boolean).join('\n\n');
  if (!context) return; // nothing to say

  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  });
  // Await the write: a forced process.exit() can truncate a still-pending pipe
  // write, which would silently drop the JSON the whole hook exists to emit.
  await new Promise((resolve) => { process.stdout.write(payload, resolve); });
}

main()
  .catch(() => {}) // never crash a session
  .finally(() => process.exit(0));
