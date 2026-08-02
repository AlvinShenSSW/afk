// Named lookup prevents a provider from inheriting unrelated local secrets.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { git, mainWorktree } from './git.mjs';

export function readCredential(names, { env = process.env, cwd = process.cwd() } = {}) {
  for (const name of names) {
    const value = String(env?.[name] ?? '').trim();
    if (value) return value;
  }

  const top = git(['rev-parse', '--show-toplevel'], { cwd }).trim();
  const main = mainWorktree({ cwd });
  const candidates = [...new Set([
    join(cwd, '.env'),
    top && join(top, '.env'),
    main && join(main, '.env'),
  ].filter(Boolean))];

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    let lines;
    try {
      lines = readFileSync(path, 'utf8').split(/\r?\n/);
    } catch {
      continue;
    }
    for (const name of names) {
      const pattern = new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*(.+?)\\s*$`);
      for (const line of lines) {
        const match = line.match(pattern);
        if (match) return match[1].replace(/^["']|["']$/g, '').trim();
      }
    }
  }
  return '';
}
