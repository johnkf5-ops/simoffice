import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock fetch globally for Ollama HTTP tests
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock fs and child_process for binary detection
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      existsSync: vi.fn(() => false),
    },
    existsSync: vi.fn(() => false),
  };
});

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  const mock = {
    ...actual,
    execSync: vi.fn(() => { throw new Error('not found'); }),
    spawn: vi.fn(() => ({
      unref: vi.fn(),
      pid: 12345,
    })),
  };
  return { ...mock, default: mock };
});

describe('Ollama Health Check', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
  });

  it('returns not-installed when binary not found', async () => {
    const fs = await import('node:fs');
    vi.mocked(fs.default.existsSync).mockReturnValue(false);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { checkOllamaHealth } = await import('@electron/services/ollama/health');
    const result = await checkOllamaHealth();

    expect(result.status).toBe('not-installed');
    expect(result.binaryPath).toBeNull();
  });

  it('returns installed-not-running when binary found but service down', async () => {
    const fs = await import('node:fs');
    vi.mocked(fs.default.existsSync).mockImplementation((p) =>
      p === '/usr/local/bin/ollama'
    );
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      p === '/usr/local/bin/ollama'
    );

    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const { checkOllamaHealth } = await import('@electron/services/ollama/health');
    const result = await checkOllamaHealth();

    expect(result.status).toBe('installed-not-running');
    expect(result.binaryPath).toBe('/usr/local/bin/ollama');
  });

  it('returns running with models when service is up', async () => {
    const fs = await import('node:fs');
    vi.mocked(fs.default.existsSync).mockImplementation((p) =>
      p === '/usr/local/bin/ollama'
    );
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      p === '/usr/local/bin/ollama'
    );

    mockFetch.mockImplementation(async (input: string | URL | Request) => {
      const u = typeof input === 'string' ? input : input.toString();
      if (u.endsWith(':11434/')) {
        return new Response('Ollama is running', { status: 200 });
      }
      if (u.includes('/api/version')) {
        return new Response(JSON.stringify({ version: '0.17.2' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (u.includes('/api/tags')) {
        return new Response(
          JSON.stringify({
            models: [
              { name: 'qwen3:8b', size: 5200000000, modifiedAt: '2026-03-01', digest: 'abc123' },
              { name: 'llama3.1:8b', size: 4900000000, modifiedAt: '2026-02-15', digest: 'def456' },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('', { status: 404 });
    });

    const { checkOllamaHealth } = await import('@electron/services/ollama/health');
    const result = await checkOllamaHealth();

    expect(result.status).toBe('running');
    expect(result.binaryPath).toBe('/usr/local/bin/ollama');
    expect(result.version).toBe('0.17.2');
    expect(result.installedModels).toHaveLength(2);
    expect(result.installedModels[0].name).toBe('qwen3:8b');
  });
});

describe('Ollama Models API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('listModels parses /api/tags response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          models: [
            { name: 'qwen3.5:9b', size: 6600000000, modifiedAt: '2026-03-20', digest: 'aaa' },
          ],
        }),
        { status: 200 }
      )
    );

    const { listModels } = await import('@electron/services/ollama/models');
    const models = await listModels();

    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('qwen3.5:9b');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
  });

  it('listModels throws on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 500 }));

    const { listModels } = await import('@electron/services/ollama/models');
    await expect(listModels()).rejects.toThrow('Ollama /api/tags failed: 500');
  });

  it('deleteModel sends DELETE to /api/delete', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

    const { deleteModel } = await import('@electron/services/ollama/models');
    await deleteModel('qwen3:8b');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/delete',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ model: 'qwen3:8b' }),
      })
    );
  });

  it('showModel sends POST to /api/show and returns details', async () => {
    const mockDetails = {
      modelfile: 'FROM qwen3:8b',
      parameters: 'stop "<|im_end|>"',
      template: '{{ .Prompt }}',
      modelInfo: { 'general.architecture': 'qwen2' },
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockDetails), { status: 200 })
    );

    const { showModel } = await import('@electron/services/ollama/models');
    const details = await showModel('qwen3:8b');

    expect(details.modelfile).toBe('FROM qwen3:8b');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/show',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ model: 'qwen3:8b' }),
      })
    );
  });

  it('pullModel streams NDJSON progress events', async () => {
    const ndjson = [
      JSON.stringify({ status: 'pulling manifest' }),
      JSON.stringify({ status: 'downloading', digest: 'sha256:abc', total: 1000, completed: 500 }),
      JSON.stringify({ status: 'downloading', digest: 'sha256:abc', total: 1000, completed: 1000 }),
      JSON.stringify({ status: 'success' }),
    ].join('\n') + '\n';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ndjson));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce(new Response(stream, { status: 200 }));

    const sentEvents: any[] = [];
    const mockWindow = {
      webContents: {
        send: (_channel: string, data: any) => sentEvents.push(data),
      },
    } as any;

    const { pullModel } = await import('@electron/services/ollama/models');
    await pullModel('qwen3.5:9b', mockWindow);

    expect(sentEvents.length).toBeGreaterThanOrEqual(3);
    // Last meaningful progress should be 100%
    const completedEvent = sentEvents.find(e => e.status === 'downloading' && e.percent === 100);
    expect(completedEvent).toBeDefined();
  });

  it('preloadModel sends empty chat request with think: false', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const { preloadModel } = await import('@electron/services/ollama/models');
    await preloadModel('qwen3.5:9b');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'qwen3.5:9b',
          messages: [],
          think: false,
          stream: false,
        }),
      })
    );
  });
});
