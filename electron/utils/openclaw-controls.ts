/**
 * OpenClaw Controls — Backend utilities.
 * Reads config snapshot and applies global patches under config lock.
 */
import { join } from 'path';
import { homedir } from 'os';
import { readOpenClawConfig, writeOpenClawConfig } from './channel-config';
import { withConfigLock } from './config-mutex';
import { logger } from './logger';
import type { OpenClawControlsSnapshot, OpenClawGlobalPatch } from '../../shared/openclaw-controls';

const CONFIG_FILE = join(homedir(), '.openclaw', 'openclaw.json');

export async function getOpenClawControlsSnapshot(): Promise<OpenClawControlsSnapshot> {
  const config = await readOpenClawConfig();
  const session = (config.session as Record<string, unknown> | undefined) ?? {};

  return {
    configPath: CONFIG_FILE,
    sessionConfig: {
      idleMinutes: typeof session.idleMinutes === 'number' ? session.idleMinutes : undefined,
      reset: session.reset as OpenClawControlsSnapshot['sessionConfig']['reset'],
      resetByType: session.resetByType as OpenClawControlsSnapshot['sessionConfig']['resetByType'],
      resetByChannel: session.resetByChannel as OpenClawControlsSnapshot['sessionConfig']['resetByChannel'],
      maintenance: session.maintenance as OpenClawControlsSnapshot['sessionConfig']['maintenance'],
    },
    enforcedFlags: {
      toolsProfile: 'full',
      sessionsVisibility: 'all',
    },
  };
}

export async function applyOpenClawGlobalPatch(
  patch: OpenClawGlobalPatch,
): Promise<{ success: boolean; error?: string }> {
  try {
    await withConfigLock(async () => {
      const config = await readOpenClawConfig();

      // Ensure session object exists
      if (!config.session || typeof config.session !== 'object') {
        config.session = {};
      }
      const session = config.session as Record<string, unknown>;

      const sc = patch.sessionConfig;
      if (!sc) {
        await writeOpenClawConfig(config);
        return;
      }

      // idleMinutes
      if (sc.idleMinutes === null) {
        delete session.idleMinutes;
      } else if (sc.idleMinutes !== undefined) {
        session.idleMinutes = sc.idleMinutes;
      }

      // reset
      if (sc.reset === null) {
        delete session.reset;
      } else if (sc.reset !== undefined) {
        session.reset = sc.reset;
      }

      // resetByType
      if (sc.resetByType === null) {
        delete session.resetByType;
      } else if (sc.resetByType !== undefined) {
        const existing = (session.resetByType as Record<string, unknown> | undefined) ?? {};
        for (const [k, v] of Object.entries(sc.resetByType)) {
          if (v === null) {
            delete existing[k];
          } else if (v !== undefined) {
            existing[k] = v;
          }
        }
        if (Object.keys(existing).length > 0) {
          session.resetByType = existing;
        } else {
          delete session.resetByType;
        }
      }

      // resetByChannel
      if (sc.resetByChannel === null) {
        delete session.resetByChannel;
      } else if (sc.resetByChannel !== undefined) {
        const existing = (session.resetByChannel as Record<string, unknown> | undefined) ?? {};
        for (const [k, v] of Object.entries(sc.resetByChannel)) {
          if (v === null) {
            delete existing[k];
          } else if (v !== undefined) {
            existing[k] = v;
          }
        }
        if (Object.keys(existing).length > 0) {
          session.resetByChannel = existing;
        } else {
          delete session.resetByChannel;
        }
      }

      // maintenance
      if (sc.maintenance === null) {
        delete session.maintenance;
      } else if (sc.maintenance !== undefined) {
        const existing = (session.maintenance as Record<string, unknown> | undefined) ?? {};
        for (const [k, v] of Object.entries(sc.maintenance)) {
          if (v === null) {
            delete existing[k];
          } else if (v !== undefined) {
            existing[k] = v;
          }
        }
        if (Object.keys(existing).length > 0) {
          session.maintenance = existing;
        } else {
          delete session.maintenance;
        }
      }

      await writeOpenClawConfig(config);
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to apply OpenClaw global patch', error);
    return { success: false, error: String(error) };
  }
}
