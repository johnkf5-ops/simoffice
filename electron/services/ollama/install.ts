import { spawn, execSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import { app, shell } from 'electron';
import { findOllamaBinary } from './health';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OllamaProcess {
  pid: number;
  owned: boolean; // true = we spawned it, false = user-managed
}

// ---------------------------------------------------------------------------
// Installation
// ---------------------------------------------------------------------------

const OLLAMA_DOWNLOAD_URL = 'https://ollama.com/download/Ollama-darwin.zip';

/**
 * Download and install Ollama automatically.
 *
 * 1. Downloads Ollama-darwin.zip to a temp directory
 * 2. Unzips it
 * 3. Moves Ollama.app to /Applications
 * 4. Launches it once to create the /usr/local/bin/ollama symlink
 *
 * Falls back to opening the download page in the browser if anything fails.
 */
export async function downloadAndInstallOllama(): Promise<string | null> {
  const tmpDir = join(app.getPath('temp'), 'ollama-install');
  const zipPath = join(tmpDir, 'Ollama-darwin.zip');
  const appDest = '/Applications/Ollama.app';

  try {
    // Create temp dir
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

    // Download the zip
    const res = await fetch(OLLAMA_DOWNLOAD_URL);
    if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status}`);

    const fileStream = createWriteStream(zipPath);
    await pipeline(Readable.fromWeb(res.body as never), fileStream);

    // Unzip — ditto preserves macOS app bundle metadata better than unzip
    execSync(`ditto -xk "${zipPath}" "${tmpDir}"`, { timeout: 30_000 });

    // Move to Applications (overwrite if exists)
    const extractedApp = join(tmpDir, 'Ollama.app');
    if (existsSync(extractedApp)) {
      execSync(`rm -rf "${appDest}" && mv "${extractedApp}" "${appDest}"`, { timeout: 10_000 });
    }

    // Remove macOS quarantine flag so Gatekeeper doesn't block execution
    try {
      execSync(`xattr -rd com.apple.quarantine "${appDest}"`, { timeout: 5_000 });
    } catch {
      // Non-fatal
    }

    // Create /usr/local/bin/ollama symlink ourselves (normally Ollama.app does this on first launch)
    const bundledBinary = '/Applications/Ollama.app/Contents/Resources/ollama';
    const symlinkPath = '/usr/local/bin/ollama';
    if (existsSync(bundledBinary) && !existsSync(symlinkPath)) {
      try {
        execSync(`ln -sf "${bundledBinary}" "${symlinkPath}"`, { timeout: 5_000 });
      } catch {
        // May fail without admin rights — bundled binary still works directly
      }
    }

    // Start headless (no menu bar icon) — SimOffice owns the process
    const binaryPath = existsSync(symlinkPath) ? symlinkPath : bundledBinary;
    startOllamaService(binaryPath);

    // Wait for the service to be ready
    const ready = await waitForOllamaReady(30_000, 1500);
    return ready ? binaryPath : null;
  } catch (err) {
    console.error('[ollama] Auto-install failed, falling back to browser:', err);
    return null;
  }
}

/**
 * Open the Ollama download page in the user's browser (fallback).
 */
export async function openOllamaDownloadPage(): Promise<void> {
  await shell.openExternal('https://ollama.com/download');
}

/**
 * Poll for Ollama binary to appear after user installs it.
 * Returns the binary path once found, or null on timeout.
 */
export async function waitForOllamaInstall(
  timeoutMs: number = 120_000,
  pollIntervalMs: number = 2000,
): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const path = findOllamaBinary();
    if (path) return path;
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Service Start
// ---------------------------------------------------------------------------

/**
 * Start the Ollama service.
 *
 * Strategy:
 * 1. Try `ollama serve` directly (preferred — we own the process)
 * 2. Fallback: `open -a Ollama` to launch the Ollama.app (user-managed)
 *
 * Environment variables are set when WE own the process for optimal perf.
 */
export function startOllamaService(binaryPath: string): OllamaProcess {
  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    OLLAMA_KEEP_ALIVE: '-1',
    OLLAMA_FLASH_ATTENTION: '1',
    OLLAMA_MAX_LOADED_MODELS: '1',
    OLLAMA_KV_CACHE_TYPE: 'q8_0',
  };

  const child = spawn(binaryPath, ['serve'], {
    detached: true,
    stdio: 'ignore',
    env,
  });

  child.unref();

  return {
    pid: child.pid ?? 0,
    owned: true,
  };
}

/**
 * Start Ollama headlessly using the app bundle binary.
 * Never launches Ollama.app (no menu bar icon) — SimOffice owns the process.
 */
export function launchOllamaApp(): OllamaProcess {
  const bundledBinary = '/Applications/Ollama.app/Contents/Resources/ollama';
  if (existsSync(bundledBinary)) {
    return startOllamaService(bundledBinary);
  }

  // Last resort — shouldn't happen if install succeeded
  const child = spawn('open', ['-a', 'Ollama'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return { pid: child.pid ?? 0, owned: false };
}

/**
 * Wait for Ollama service to respond on localhost:11434.
 */
export async function waitForOllamaReady(
  timeoutMs: number = 30_000,
  pollIntervalMs: number = 1000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('http://localhost:11434/', { signal: controller.signal });
      clearTimeout(timeout);
      const text = await res.text();
      if (text.includes('Ollama is running')) return true;
    } catch {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  return false;
}
