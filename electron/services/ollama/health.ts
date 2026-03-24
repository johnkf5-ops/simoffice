import { execSync } from 'node:child_process';
import fs from 'node:fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OllamaStatus = 'not-installed' | 'installed-not-running' | 'running';

export interface OllamaHealthResult {
  status: OllamaStatus;
  binaryPath: string | null;
  version: string | null;
  installedModels: OllamaInstalledModel[];
}

export interface OllamaInstalledModel {
  name: string;
  size: number;
  modifiedAt: string;
  digest: string;
}

// ---------------------------------------------------------------------------
// Binary Detection (macOS)
// ---------------------------------------------------------------------------

const BINARY_PATHS = [
  '/usr/local/bin/ollama',
  '/Applications/Ollama.app/Contents/Resources/ollama',
];

export function findOllamaBinary(): string | null {
  for (const p of BINARY_PATHS) {
    if (fs.existsSync(p)) return p;
  }

  // Fallback: `which ollama`
  try {
    const result = execSync('which ollama', { encoding: 'utf-8', timeout: 3000 }).trim();
    if (result && fs.existsSync(result)) return result;
  } catch {
    // not found
  }

  return null;
}

// ---------------------------------------------------------------------------
// Service Health Check
// ---------------------------------------------------------------------------

export const OLLAMA_BASE = 'http://localhost:11434';

async function ollamaFetch(path: string, timeoutMs: number = 3000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${OLLAMA_BASE}${path}`, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await ollamaFetch('/');
    const text = await res.text();
    return text.includes('Ollama is running');
  } catch {
    return false;
  }
}

async function fetchVersion(): Promise<string | null> {
  try {
    const res = await ollamaFetch('/api/version');
    if (!res.ok) return null;
    const data = await res.json() as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

async function fetchInstalledModels(): Promise<OllamaInstalledModel[]> {
  try {
    const res = await ollamaFetch('/api/tags', 5000);
    if (!res.ok) return [];
    const data = await res.json() as { models?: OllamaInstalledModel[] };
    return (data.models ?? []).map(m => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modifiedAt,
      digest: m.digest,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main Health Check
// ---------------------------------------------------------------------------

export async function checkOllamaHealth(): Promise<OllamaHealthResult> {
  const binaryPath = findOllamaBinary();

  if (!binaryPath) {
    return {
      status: 'not-installed',
      binaryPath: null,
      version: null,
      installedModels: [],
    };
  }

  const running = await isOllamaRunning();

  if (!running) {
    return {
      status: 'installed-not-running',
      binaryPath,
      version: null,
      installedModels: [],
    };
  }

  const [version, installedModels] = await Promise.all([
    fetchVersion(),
    fetchInstalledModels(),
  ]);

  return {
    status: 'running',
    binaryPath,
    version,
    installedModels,
  };
}
