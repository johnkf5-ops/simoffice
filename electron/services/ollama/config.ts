import type { HardwareInfo } from '../hardware/detect';
import type { ModelEntry } from '../hardware/model-recommender';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OllamaConfig {
  numCtx: number;
  keepAlive: string;
  flashAttention: boolean;
  kvCacheType: 'f16' | 'q8_0' | 'q4_0';
  maxLoadedModels: number;
  thinkingEnabled: boolean;
}

export interface OllamaSetupState {
  status: 'idle' | 'installing' | 'pulling' | 'configuring' | 'done' | 'error';
  lastModel: string | null;
  lastError: string | null;
  pullProgress: number;
  ollamaOwned: boolean;
  ollamaPid: number | null;
}

// ---------------------------------------------------------------------------
// Environment Variables (for process we own)
// ---------------------------------------------------------------------------

export function getOllamaEnvVars(config: OllamaConfig): Record<string, string> {
  return {
    OLLAMA_KEEP_ALIVE: config.keepAlive,
    OLLAMA_FLASH_ATTENTION: config.flashAttention ? '1' : '0',
    OLLAMA_MAX_LOADED_MODELS: String(config.maxLoadedModels),
    OLLAMA_KV_CACHE_TYPE: config.kvCacheType,
  };
}

// ---------------------------------------------------------------------------
// Per-Request Options (for Ollama we don't own)
// ---------------------------------------------------------------------------

export interface OllamaRequestOptions {
  num_ctx: number;
  keep_alive: string;
}

export function getPerRequestOptions(config: OllamaConfig): OllamaRequestOptions {
  return {
    num_ctx: config.numCtx,
    keep_alive: config.keepAlive,
  };
}

// ---------------------------------------------------------------------------
// Thinking Mode
// ---------------------------------------------------------------------------

export type ThinkingEndpoint = 'native' | 'openai-compat';

export interface ThinkingParams {
  endpoint: ThinkingEndpoint;
  nativeParams: { think: boolean } | null;
  openAiParams: { reasoning_effort: string } | null;
}

/**
 * Build the correct thinking parameters based on the endpoint type
 * and the user's thinkingLevel setting.
 *
 * - Native /api/chat: use `think: true/false`
 * - OpenAI-compat /v1/chat/completions: use `reasoning_effort` or omit
 *   WARNING: `think: false` on /v1 causes a Go unmarshal error
 */
export function getThinkingParams(
  thinkingLevel: string | null,
  endpoint: ThinkingEndpoint,
  _model: ModelEntry,
): ThinkingParams {
  const enabled = thinkingLevel !== null && thinkingLevel !== 'off';

  if (endpoint === 'native') {
    return {
      endpoint,
      nativeParams: { think: enabled },
      openAiParams: null,
    };
  }

  // OpenAI-compat: omit reasoning_effort to disable thinking (it's opt-in)
  // Only include it when explicitly enabled
  if (!enabled) {
    return {
      endpoint,
      nativeParams: null,
      openAiParams: null,
    };
  }

  // Map thinkingLevel to reasoning_effort
  const effortMap: Record<string, string> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
  };
  const effort = effortMap[thinkingLevel ?? ''] ?? 'high';

  return {
    endpoint,
    nativeParams: null,
    openAiParams: { reasoning_effort: effort },
  };
}

/**
 * Get a user-facing warning about thinking mode for specific models.
 */
export function getThinkingWarning(model: ModelEntry): string | null {
  if (!model.hasThinking) return null;
  return model.thinkingNote ?? null;
}

// ---------------------------------------------------------------------------
// Optimal Config Builder
// ---------------------------------------------------------------------------

/**
 * Build optimal Ollama configuration based on hardware and selected model.
 */
export function buildOptimalConfig(
  hardware: HardwareInfo,
  model: ModelEntry,
): OllamaConfig {
  const headroom = hardware.availableRamGB - model.downloadGB;

  let numCtx: number;
  if (headroom >= 8) numCtx = 16384;
  else if (headroom >= 4) numCtx = 8192;
  else if (headroom >= 2) numCtx = 4096;
  else numCtx = 2048;

  return {
    numCtx,
    keepAlive: '-1',        // Never unload — prevents cold starts
    flashAttention: true,    // Reduces VRAM usage
    kvCacheType: 'q8_0',    // Halves KV cache memory, minimal quality loss
    maxLoadedModels: 1,      // Prevents memory pressure
    thinkingEnabled: false,  // Default: off for fast responses
  };
}

// ---------------------------------------------------------------------------
// Disk Space Check
// ---------------------------------------------------------------------------

export interface DiskSpaceCheck {
  sufficient: boolean;
  requiredGB: number;
  availableGB: number;
  shortfallGB: number;
}

const HEADROOM_GB = 2; // Extra space for temp files during extraction

export function checkDiskSpace(freeDiskGB: number, downloadGB: number): DiskSpaceCheck {
  const requiredGB = downloadGB + HEADROOM_GB;
  const sufficient = freeDiskGB >= requiredGB;
  return {
    sufficient,
    requiredGB,
    availableGB: freeDiskGB,
    shortfallGB: sufficient ? 0 : Math.ceil(requiredGB - freeDiskGB),
  };
}

// ---------------------------------------------------------------------------
// Version Compatibility
// ---------------------------------------------------------------------------

const MIN_OLLAMA_VERSION = '0.12.0';

export interface VersionCheck {
  compatible: boolean;
  currentVersion: string | null;
  minVersion: string;
  updateRecommended: boolean;
}

function parseVersion(v: string): number[] {
  return v.split('.').map(n => parseInt(n, 10) || 0);
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function checkOllamaVersion(currentVersion: string | null): VersionCheck {
  if (!currentVersion) {
    return {
      compatible: false,
      currentVersion: null,
      minVersion: MIN_OLLAMA_VERSION,
      updateRecommended: true,
    };
  }

  const compatible = compareVersions(currentVersion, MIN_OLLAMA_VERSION) >= 0;

  return {
    compatible,
    currentVersion,
    minVersion: MIN_OLLAMA_VERSION,
    updateRecommended: !compatible,
  };
}

// ---------------------------------------------------------------------------
// Default Setup State
// ---------------------------------------------------------------------------

export function getDefaultSetupState(): OllamaSetupState {
  return {
    status: 'idle',
    lastModel: null,
    lastError: null,
    pullProgress: 0,
    ollamaOwned: false,
    ollamaPid: null,
  };
}
