// One reader for the flat single-line `key: value` fields of `.afk/config.md`,
// shared so each consumer parses the file the same way instead of copying the
// regex. An unreadable or absent file contributes nothing.

import { existsSync, readFileSync } from 'node:fs';

function readConfigText(configPath) {
  try {
    if (!configPath || !existsSync(configPath)) return '';
    return readFileSync(configPath, 'utf8');
  } catch {
    return '';
  }
}

function sectionLines(configPath, section) {
  const wanted = String(section || '').trim().toLowerCase();
  if (!wanted) return [];
  const lines = readConfigText(configPath).split('\n');
  const result = [];
  let active = false;
  for (const line of lines) {
    const heading = line.match(/^\s*##\s+(.+?)\s*$/);
    if (heading) {
      active = heading[1].trim().toLowerCase() === wanted;
      continue;
    }
    if (active) result.push(line);
  }
  return result;
}

function keyMatch(line, key) {
  const escaped = String(key || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return null;
  return line.match(new RegExp(`^\\s*${escaped}\\s*:(.*)$`, 'i'));
}

// Return the trimmed value of the first `key: value` line, comment stripped, or
// '' when the key, file, or path is absent/unreadable.
export function readConfigValue(configPath, key) {
  try {
    if (!configPath || !existsSync(configPath)) return '';
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^\\s*${escaped}\\s*:\\s*([^#]+)`, 'i');
    for (const line of readFileSync(configPath, 'utf8').split('\n')) {
      const match = line.match(re);
      if (match) return match[1].trim();
    }
  } catch {
    // An unreadable config contributes nothing; callers fall back to defaults.
  }
  return '';
}

// Presence is distinct from value: `gates:` is a present configuration error,
// while an absent `gates` key selects compatibility/default behavior.
export function hasConfigKeyInSection(configPath, section, key) {
  return sectionLines(configPath, section).some((line) => Boolean(keyMatch(line, key)));
}

// Return the first value from one `## <section>`, with inline comments removed.
// Empty and comment-only values intentionally return '' while presence remains
// observable through hasConfigKeyInSection.
export function readConfigSectionValue(configPath, section, key) {
  for (const line of sectionLines(configPath, section)) {
    const match = keyMatch(line, key);
    if (match) return match[1].split('#', 1)[0].trim();
  }
  return '';
}
