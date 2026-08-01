// Unit tests for the shared single-line `.afk/config.md` reader.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { test } from 'node:test';

import {
  hasConfigKeyInSection,
  readConfigSectionValue,
  readConfigValue,
} from './config.mjs';

function withConfig(text, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'afk-config-'));
  const path = join(dir, 'config.md');
  try {
    writeFileSync(path, text, 'utf8');
    return fn(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('readConfigValue reads a key and trims the value', () => {
  withConfig('auto-resume:   notify  \n', (p) => {
    assert.equal(readConfigValue(p, 'auto-resume'), 'notify');
  });
});

test('readConfigValue strips a trailing inline comment', () => {
  withConfig('auto-resume: auto   # opt in to auto-drive\n', (p) => {
    assert.equal(readConfigValue(p, 'auto-resume'), 'auto');
  });
});

test('readConfigValue is case-insensitive on the key and ignores leading space', () => {
  withConfig('   Auto-Resume: off\n', (p) => {
    assert.equal(readConfigValue(p, 'auto-resume'), 'off');
  });
});

test('readConfigValue returns empty for an absent key', () => {
  withConfig('policy: leave-open\n', (p) => {
    assert.equal(readConfigValue(p, 'auto-resume'), '');
  });
});

test('readConfigValue returns empty for a missing or empty path', () => {
  assert.equal(readConfigValue('', 'auto-resume'), '');
  assert.equal(readConfigValue(join(tmpdir(), 'does-not-exist-xyz', 'config.md'), 'auto-resume'), '');
});

test('readConfigValue matches the first occurrence only', () => {
  withConfig('auto-resume: notify\nauto-resume: auto\n', (p) => {
    assert.equal(readConfigValue(p, 'auto-resume'), 'notify');
  });
});

test('readConfigValue reproduces the implementer parse it replaces', () => {
  // Parity with the pattern lib/gate/implementer.mjs used before this reader
  // was shared: `^\s*<key>\s*:\s*([^#]+)` trimmed.
  withConfig('# comment\nimplementer:  codex  # who wrote it\n', (p) => {
    assert.equal(readConfigValue(p, 'implementer'), 'codex');
  });
});

test('section readers distinguish absent, empty, and nonempty keys', () => {
  withConfig([
    '## external gate',
    'gates:',
    'priority: codex > kimi',
    '',
    '## commands',
    'mode: unrelated',
    '',
  ].join('\n'), (p) => {
    assert.equal(hasConfigKeyInSection(p, 'external gate', 'gates'), true);
    assert.equal(readConfigSectionValue(p, 'external gate', 'gates'), '');
    assert.equal(readConfigSectionValue(p, 'external gate', 'priority'), 'codex > kimi');
    assert.equal(hasConfigKeyInSection(p, 'external gate', 'mode'), false);
    assert.equal(readConfigSectionValue(p, 'commands', 'mode'), 'unrelated');
  });
});

test('section readers are heading/key case-insensitive and stop at the next heading', () => {
  withConfig('## External Gate\n  Gates: CODEx > KIMI # note\n## Merge\ngates: wrong\n', (p) => {
    assert.equal(hasConfigKeyInSection(p, 'external gate', 'gates'), true);
    assert.equal(readConfigSectionValue(p, 'EXTERNAL GATE', 'GATES'), 'CODEx > KIMI');
  });
});

test('section readers return safe defaults for missing files and sections', () => {
  const missing = join(tmpdir(), 'afk-config-missing', 'config.md');
  assert.equal(hasConfigKeyInSection(missing, 'external gate', 'gates'), false);
  assert.equal(readConfigSectionValue(missing, 'external gate', 'gates'), '');
  withConfig('## commands\ntest: node --test\n', (p) => {
    assert.equal(hasConfigKeyInSection(p, 'external gate', 'gates'), false);
  });
});
