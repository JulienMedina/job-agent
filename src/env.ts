import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function parseLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const eq = trimmed.indexOf('=');
  if (eq === -1) return null;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return [key, val];
}

export function loadEnv(dotenvPath = resolve(process.cwd(), '.env')) {
  try {
    if (!existsSync(dotenvPath)) return;
    const content = readFileSync(dotenvPath, 'utf8').split(/\r?\n/);
    for (const line of content) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.warn('[env] Failed to load .env:', err);
  }
}

// Auto-load on import
loadEnv();

