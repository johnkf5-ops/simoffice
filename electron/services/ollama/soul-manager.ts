/**
 * SOUL.md Manager — writes full and compact versions of agent personality files.
 * The gateway reads SOUL.md on each chat session start.
 * On provider switch, we swap SOUL.md to match the model's capability.
 */
import { readFile, writeFile, readdir, copyFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ---------------------------------------------------------------------------
// Model Size Tiers
// ---------------------------------------------------------------------------

export type SoulTier = 'compact' | 'full';

/**
 * Determine which SOUL tier to use based on model download size in GB.
 * Under 17GB (roughly under 27B params) → compact
 * 17GB+ (27B+ params) → full
 */
export function getSoulTier(modelDownloadGB: number): SoulTier {
  return modelDownloadGB >= 17 ? 'full' : 'compact';
}

/**
 * Determine tier from an Ollama model tag using the model database.
 * Returns 'compact' for unknown models (safe default).
 */
export function getSoulTierForModel(modelTag: string | undefined): SoulTier {
  if (!modelTag) return 'compact';

  // Known large models by tag prefix
  const largeModels = [
    'qwen3.5:27b', 'qwen3.5:35b', 'qwen3.5:122b',
    'qwen3:32b', 'deepseek-r1:32b', 'deepseek-r1:70b',
    'llama3.3:70b', 'gpt-oss:120b',
  ];

  if (largeModels.some(m => modelTag.startsWith(m))) return 'full';

  // Cloud APIs can always handle full souls
  return 'compact';
}

/**
 * Determine tier based on provider type. Cloud APIs always get full souls.
 */
export function getSoulTierForProvider(vendorId: string, modelTag?: string): SoulTier {
  if (vendorId !== 'ollama') return 'full'; // Cloud APIs handle long prompts fine
  return getSoulTierForModel(modelTag);
}

// ---------------------------------------------------------------------------
// Compact Soul Generator
// ---------------------------------------------------------------------------

/**
 * Generate a compact 2-3 sentence soul from the full version.
 * Extracts the agent name and first meaningful sentence, then adds a brief instruction.
 */
export function generateCompactSoul(fullSoul: string, agentName: string): string {
  // Try to extract the first real description line (skip headers, blank lines)
  const lines = fullSoul.split('\n').filter(l => {
    const trimmed = l.trim();
    return trimmed.length > 10 && !trimmed.startsWith('#') && !trimmed.startsWith('---');
  });

  const firstLine = lines[0]?.trim() ?? '';

  // Build a short, focused soul
  const parts = [`You are ${agentName}.`];

  if (firstLine.length > 0 && firstLine.length < 200) {
    parts.push(firstLine);
  }

  parts.push('Keep responses concise and helpful. Stay in character.');

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// File Operations
// ---------------------------------------------------------------------------

function getOpenClawDir(): string {
  return join(homedir(), '.openclaw');
}

function getWorkspaceDir(agentId: string): string {
  const base = getOpenClawDir();
  return agentId === 'main' ? join(base, 'workspace') : join(base, `workspace-${agentId}`);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write all three SOUL files for an agent.
 * Called when an agent is created or when soul content is updated.
 */
export async function writeSoulFiles(
  agentId: string,
  fullContent: string,
  agentName: string,
  currentTier: SoulTier,
): Promise<void> {
  const dir = getWorkspaceDir(agentId);
  const compactContent = generateCompactSoul(fullContent, agentName);

  await writeFile(join(dir, 'SOUL.full.md'), fullContent, 'utf-8');
  await writeFile(join(dir, 'SOUL.compact.md'), compactContent, 'utf-8');

  // Write the active SOUL.md based on current tier
  const activeContent = currentTier === 'full' ? fullContent : compactContent;
  await writeFile(join(dir, 'SOUL.md'), activeContent, 'utf-8');
}

/**
 * Swap all agents' SOUL.md files to match a new tier.
 * Called when the user switches providers/models.
 */
export async function swapAllSouls(newTier: SoulTier): Promise<number> {
  const openclawDir = getOpenClawDir();
  let swapped = 0;

  try {
    const entries = await readdir(openclawDir, { withFileTypes: true });
    const workspaceDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('workspace'))
      .map(e => join(openclawDir, e.name));

    for (const dir of workspaceDirs) {
      const sourceFile = newTier === 'full'
        ? join(dir, 'SOUL.full.md')
        : join(dir, 'SOUL.compact.md');

      const targetFile = join(dir, 'SOUL.md');

      if (await fileExists(sourceFile)) {
        await copyFile(sourceFile, targetFile);
        swapped++;
      }
    }
  } catch (err) {
    console.error('[soul-manager] Error swapping souls:', err);
  }

  return swapped;
}

/**
 * Backfill SOUL.full.md and SOUL.compact.md for agents that were created
 * before this system existed. Reads existing SOUL.md as the full version.
 */
export async function backfillSoulFiles(): Promise<number> {
  const openclawDir = getOpenClawDir();
  let backfilled = 0;

  try {
    const entries = await readdir(openclawDir, { withFileTypes: true });
    const workspaceDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('workspace'))
      .map(e => ({ dir: join(openclawDir, e.name), name: e.name }));

    for (const { dir, name } of workspaceDirs) {
      const soulPath = join(dir, 'SOUL.md');
      const fullPath = join(dir, 'SOUL.full.md');

      // Only backfill if SOUL.md exists but SOUL.full.md doesn't
      if (await fileExists(soulPath) && !(await fileExists(fullPath))) {
        const content = await readFile(soulPath, 'utf-8');
        // Extract agent name from workspace dir name
        const agentId = name.replace('workspace-', '').replace('workspace', 'main');
        const agentName = agentId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        await writeFile(fullPath, content, 'utf-8');
        await writeFile(
          join(dir, 'SOUL.compact.md'),
          generateCompactSoul(content, agentName),
          'utf-8',
        );
        backfilled++;
      }
    }
  } catch (err) {
    console.error('[soul-manager] Error backfilling souls:', err);
  }

  return backfilled;
}
