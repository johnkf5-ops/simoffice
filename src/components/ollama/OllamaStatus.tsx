/**
 * OllamaStatus — Small status indicator for the AI Setup page.
 * Shows: model name, running/stopped status, quick actions.
 * Inline styles matching Lobby pages (Path A).
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Settings } from 'lucide-react';
import { invokeIpc } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthResult {
  status: 'not-installed' | 'installed-not-running' | 'running';
  version: string | null;
  installedModels: { name: string; size: number }[];
}

interface IpcResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OllamaStatusProps {
  modelTag?: string;
  onOpenWizard?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OllamaStatus({ modelTag, onOpenWizard }: OllamaStatusProps) {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await invokeIpc<IpcResult<HealthResult>>('ollama:check-status');
    if (result.success && result.data) {
      setHealth(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const statusColor = health?.status === 'running' ? '#22c55e'
    : health?.status === 'installed-not-running' ? '#f59e0b'
    : '#ef4444';

  const statusLabel = health?.status === 'running' ? 'Running'
    : health?.status === 'installed-not-running' ? 'Stopped'
    : 'Not installed';

  const activeModel = modelTag
    ?? health?.installedModels?.[0]?.name
    ?? null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 12,
      background: 'hsl(var(--muted))', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Status dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: loading ? 'hsl(var(--muted-foreground))' : statusColor,
        }} />

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loading ? 'Checking...' : activeModel ?? 'No brain selected'}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
            {loading ? '' : `Ollama ${statusLabel}${health?.version ? ` v${health.version}` : ''}`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {/* Refresh */}
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid hsl(var(--border))',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Refresh status"
        >
          {loading
            ? <Loader2 size={14} style={{ color: 'hsl(var(--muted-foreground))', animation: 'spin 1s linear infinite' }} />
            : <RefreshCw size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />}
        </button>

        {/* Open wizard */}
        {onOpenWizard && (
          <button
            onClick={onOpenWizard}
            style={{
              width: 30, height: 30, borderRadius: 8, border: '1px solid hsl(var(--border))',
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Configure local AI"
          >
            <Settings size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        )}
      </div>
    </div>
  );
}
