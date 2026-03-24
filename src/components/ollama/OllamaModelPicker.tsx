/**
 * OllamaModelPicker — Advanced model selection for the wizard.
 * Shows all compatible models filtered by hardware.
 * Inline styles matching Lobby pages (Path A).
 */
import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { invokeIpc } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelRecommendation {
  model: {
    ollamaTag: string;
    name: string;
    params: string;
    downloadGB: number;
    bestFor: string[];
    description: string;
    hasVision: boolean;
  };
  speed: {
    humanSpeed: string;
  };
  capabilityTier: string;
}

interface IpcResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface InstalledModel {
  name: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OllamaModelPickerProps {
  selectedTag: string | null;
  onSelect: (tag: string) => void;
  onClose: () => void;
  preloadedInstalled?: Set<string>;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pillColors: Record<string, string> = {
  'all-rounder': '#3b82f6',
  'coding': '#8b5cf6',
  'reasoning': '#f59e0b',
  'math': '#ef4444',
  'vision': '#10b981',
  'assistant': '#6366f1',
  'conversation': '#06b6d4',
  'writing': '#ec4899',
  'data': '#14b8a6',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OllamaModelPicker({ selectedTag, onSelect, onClose, preloadedInstalled }: OllamaModelPickerProps) {
  const [models, setModels] = useState<ModelRecommendation[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(preloadedInstalled ?? new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const modelsRes = await invokeIpc<IpcResult<ModelRecommendation[]>>('ollama:get-compatible-models');
      if (cancelled) return;

      if (modelsRes.success && modelsRes.data) {
        setModels(modelsRes.data);
      }

      // Only fetch installed models if not preloaded from parent
      if (!preloadedInstalled) {
        const installedRes = await invokeIpc<IpcResult<InstalledModel[]>>('ollama:list-models').catch(() => ({ success: false }));
        if (!cancelled && installedRes.success && (installedRes as IpcResult<InstalledModel[]>).data) {
          setInstalled(new Set(
            ((installedRes as IpcResult<InstalledModel[]>).data ?? []).map(m => m.name)
          ));
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [preloadedInstalled]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <Loader2 size={20} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Group by capability tier
  const tiers = new Map<string, ModelRecommendation[]>();
  for (const m of models) {
    const tier = m.capabilityTier;
    if (!tiers.has(tier)) tiers.set(tier, []);
    tiers.get(tier)!.push(m);
  }

  return (
    <div style={{
      borderRadius: 12, border: '1px solid hsl(var(--border))',
      background: 'hsl(var(--background))', padding: '16px',
      marginBottom: 16, maxHeight: 360, overflow: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          All compatible AI brains
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      {[...tiers.entries()].map(([tier, tierModels]) => (
        <div key={tier} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
          }}>
            {tier}
          </div>

          {tierModels.map(rec => {
            const isSelected = selectedTag === rec.model.ollamaTag;
            const isInstalled = installed.has(rec.model.ollamaTag) ||
              installed.has(rec.model.ollamaTag.replace(/:latest$/, ''));

            return (
              <button
                key={rec.model.ollamaTag}
                onClick={() => onSelect(rec.model.ollamaTag)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                  border: isSelected ? '2px solid #3b82f6' : '1px solid hsl(var(--border))',
                  background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                    {rec.model.name}
                    {isInstalled && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 700,
                        padding: '2px 6px', borderRadius: 8,
                        background: '#22c55e22', color: '#22c55e',
                      }}>
                        Downloaded
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                    <Download size={10} />
                    {rec.model.downloadGB} GB
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                  {rec.model.description}
                </div>

                <div style={{ marginTop: 6 }}>
                  {rec.model.bestFor.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-block', padding: '1px 7px', borderRadius: 10,
                        fontSize: 10, fontWeight: 600, marginRight: 4,
                        background: `${pillColors[tag] ?? '#6b7280'}18`,
                        color: pillColors[tag] ?? '#6b7280',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
