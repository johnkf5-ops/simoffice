/**
 * SOUL.md Manager — writes agent personality files with a backup copy.
 * The gateway reads SOUL.md on each chat session start.
 * Full souls are always used — all supported models (8B+) can handle them.
 */
import { writeFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

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
 * Write SOUL.md and a backup SOUL.full.md for an agent.
 * Full soul is always used — no compression needed for 8B+ models.
 */
export async function writeSoulFiles(
  agentId: string,
  fullContent: string,
): Promise<void> {
  const dir = getWorkspaceDir(agentId);
  await writeFile(join(dir, 'SOUL.full.md'), fullContent, 'utf-8');
  await writeFile(join(dir, 'SOUL.md'), fullContent, 'utf-8');
}

/**
 * Backfill SOUL.full.md for agents created before the backup system existed.
 */
export async function backfillSoulFiles(): Promise<number> {
  const openclawDir = getOpenClawDir();
  let backfilled = 0;

  try {
    const entries = await readdir(openclawDir, { withFileTypes: true });
    const workspaceDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('workspace'))
      .map(e => join(openclawDir, e.name));

    for (const dir of workspaceDirs) {
      const soulPath = join(dir, 'SOUL.md');
      const fullPath = join(dir, 'SOUL.full.md');

      if (await fileExists(soulPath) && !(await fileExists(fullPath))) {
        const { readFile } = await import('node:fs/promises');
        const content = await readFile(soulPath, 'utf-8');
        await writeFile(fullPath, content, 'utf-8');
        backfilled++;
      }
    }
  } catch (err) {
    console.error('[soul-manager] Error backfilling souls:', err);
  }

  return backfilled;
}
