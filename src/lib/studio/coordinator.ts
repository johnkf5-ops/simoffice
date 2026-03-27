/**
 * StudioSettingsCoordinator
 *
 * Simple in-memory cache for analytics budget preferences.
 * Supports loading with TTL-based caching and debounced patch saving.
 */

export type StudioSettingsLoadOptions = {
  maxAgeMs?: number;
  force?: boolean;
};

export type StudioSettingsCoordinator = {
  loadSettings(options?: StudioSettingsLoadOptions): Promise<Record<string, unknown>>;
  schedulePatch(patch: Record<string, unknown>, delayMs: number): void;
};

export function createStudioSettingsCoordinator(): StudioSettingsCoordinator {
  let cached: Record<string, unknown> = {};
  let lastLoadMs = 0;
  let pendingPatch: Record<string, unknown> | null = null;
  let patchTimer: ReturnType<typeof setTimeout> | null = null;

  const loadSettings = async (
    options?: StudioSettingsLoadOptions,
  ): Promise<Record<string, unknown>> => {
    const now = Date.now();
    const maxAge = options?.maxAgeMs ?? 0;

    if (!options?.force && lastLoadMs > 0 && now - lastLoadMs < maxAge) {
      return cached;
    }

    lastLoadMs = now;
    return cached;
  };

  const schedulePatch = (patch: Record<string, unknown>, delayMs: number) => {
    if (patchTimer) clearTimeout(patchTimer);
    pendingPatch = deepMerge(pendingPatch ?? {}, patch);

    patchTimer = setTimeout(() => {
      cached = deepMerge(cached, pendingPatch!);
      pendingPatch = null;
      patchTimer = null;
    }, delayMs);
  };

  return { loadSettings, schedulePatch };
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      result[key] = sv;
    }
  }
  return result;
}
