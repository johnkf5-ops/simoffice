/**
 * Memory Plugin Configuration
 *
 * Manages the GigaBrain memory plugin slot in openclaw.json.
 * Config structure:
 *   plugins.slots.memory = "gigabrain"
 *   plugins.entries.gigabrain = { config: { ... } }
 *   plugins.allow includes "gigabrain"
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { withConfigLock } from './config-mutex';

const OPENCLAW_CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json');

// GigaBrain handles ALL defaults internally via normalizeConfig() in lib/core/config.js.
// Passing {} lets GigaBrain use its DEFAULT_CONFIG (config.js lines 96-340).
// Do NOT hardcode defaults here — they would diverge from GigaBrain's actual defaults
// across version upgrades and cause subtle config conflicts.

function readConfig(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(OPENCLAW_CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(config: Record<string, unknown>): void {
  mkdirSync(join(homedir(), '.openclaw'), { recursive: true });
  writeFileSync(OPENCLAW_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

export async function isMemoryEnabled(): Promise<boolean> {
  const config = readConfig();
  const plugins = config.plugins as Record<string, unknown> | undefined;
  if (!plugins || typeof plugins !== 'object') return false;
  const slots = plugins.slots as Record<string, unknown> | undefined;
  return slots?.memory === 'gigabrain';
}

export async function enableMemory(): Promise<void> {
  return withConfigLock(async () => {
    const config = readConfig();

    // Ensure plugins object structure
    if (!config.plugins || typeof config.plugins !== 'object' || Array.isArray(config.plugins)) {
      config.plugins = {};
    }
    const plugins = config.plugins as Record<string, unknown>;

    // Set memory slot
    if (!plugins.slots || typeof plugins.slots !== 'object') plugins.slots = {};
    (plugins.slots as Record<string, unknown>).memory = 'gigabrain';

    // Ensure entries
    if (!plugins.entries || typeof plugins.entries !== 'object') plugins.entries = {};
    const entries = plugins.entries as Record<string, unknown>;
    if (!entries.gigabrain || typeof entries.gigabrain !== 'object') {
      entries.gigabrain = { config: {} };
    }

    // Ensure gigabrain is in plugins.allow
    if (!Array.isArray(plugins.allow)) plugins.allow = [];
    const allow = plugins.allow as string[];
    if (!allow.includes('gigabrain')) allow.push('gigabrain');

    writeConfig(config);
  });
}

export async function disableMemory(): Promise<void> {
  return withConfigLock(async () => {
    const config = readConfig();
    const plugins = config.plugins as Record<string, unknown> | undefined;
    if (!plugins || typeof plugins !== 'object') return;

    // Remove memory slot
    const slots = plugins.slots as Record<string, unknown> | undefined;
    if (slots) delete slots.memory;

    // Remove from allow list
    if (Array.isArray(plugins.allow)) {
      plugins.allow = (plugins.allow as string[]).filter(p => p !== 'gigabrain');
    }

    // Keep entries.gigabrain config so user doesn't lose settings on re-enable

    writeConfig(config);
  });
}
