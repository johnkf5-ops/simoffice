import type { BrowserWindow } from 'electron';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
}

export interface OllamaModelDetails {
  modelfile: string;
  parameters: string;
  template: string;
  modelInfo: Record<string, unknown>;
}

export interface PullProgress {
  model: string;
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  percent: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OLLAMA_BASE = 'http://localhost:11434';

// ---------------------------------------------------------------------------
// List Installed Models
// ---------------------------------------------------------------------------

export async function listModels(): Promise<OllamaModelInfo[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/tags`);
  if (!res.ok) throw new Error(`Ollama /api/tags failed: ${res.status}`);
  const data = await res.json() as { models?: OllamaModelInfo[] };
  return data.models ?? [];
}

// ---------------------------------------------------------------------------
// Pull Model (streaming progress)
// ---------------------------------------------------------------------------

/**
 * Pull a model from the Ollama registry with streaming progress events.
 *
 * Sends `ollama:pull-progress` events to the renderer via the provided BrowserWindow.
 * Ollama's /api/pull returns NDJSON — one JSON object per line.
 *
 * The pull is resumable: if interrupted, calling pull again resumes
 * from where it left off (Ollama handles this natively).
 */
export async function pullModel(
  modelTag: string,
  mainWindow: BrowserWindow | null,
): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelTag }),
  });

  if (!res.ok) {
    throw new Error(`Ollama pull failed: ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error('Ollama pull returned no body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line) as {
            status?: string;
            digest?: string;
            total?: number;
            completed?: number;
          };

          const percent = event.total && event.completed
            ? Math.round((event.completed / event.total) * 100)
            : 0;

          const progress: PullProgress = {
            model: modelTag,
            status: event.status ?? 'unknown',
            digest: event.digest,
            total: event.total,
            completed: event.completed,
            percent,
          };

          mainWindow?.webContents?.send('ollama:pull-progress', progress);
        } catch {
          // Malformed line, skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer) as { status?: string };
      const progress: PullProgress = {
        model: modelTag,
        status: event.status ?? 'complete',
        percent: 100,
      };
      mainWindow?.webContents?.send('ollama:pull-progress', progress);
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Delete Model
// ---------------------------------------------------------------------------

export async function deleteModel(modelTag: string): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/api/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelTag }),
  });

  if (!res.ok) {
    throw new Error(`Ollama delete failed: ${res.status} ${res.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// Show Model Info
// ---------------------------------------------------------------------------

export async function showModel(modelTag: string): Promise<OllamaModelDetails> {
  const res = await fetch(`${OLLAMA_BASE}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelTag }),
  });

  if (!res.ok) {
    throw new Error(`Ollama show failed: ${res.status} ${res.statusText}`);
  }

  return await res.json() as OllamaModelDetails;
}

// ---------------------------------------------------------------------------
// Preload Model (warm into memory)
// ---------------------------------------------------------------------------

/**
 * Send an empty chat request to warm the model into memory.
 * Uses the native /api/chat endpoint with think: false for speed.
 */
export async function preloadModel(modelTag: string): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelTag,
      messages: [],
      think: false,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama preload failed: ${res.status}`);
  }

  // Consume response body to complete the request
  await res.text();
}
