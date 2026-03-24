/**
 * Shared provider setup modal — used by both Brain page and Onboarding.
 * Handles API key validation, model selection, cloud save, and Ollama wizard.
 * No ClawX UI. Built from scratch.
 */
import { useState, useCallback } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { OllamaSetupWizard } from '@/components/ollama/OllamaSetupWizard';
import {
  PROVIDER_TYPE_INFO, getProviderDocsUrl,
  type ProviderType, type ProviderAccount,
  resolveProviderApiKeyForSave, resolveProviderModelForSave,
} from '@/lib/providers';
import { buildProviderAccountId, fetchProviderSnapshot } from '@/lib/provider-accounts';
import { PROVIDER_MODELS } from '@/lib/provider-models';
import { invokeIpc } from '@/lib/api-client';
import { hostApiFetch } from '@/lib/host-api';
import { toast } from 'sonner';

/** Human-friendly names for provider types */
export const FRIENDLY_NAMES: Partial<Record<ProviderType, { name: string; brain: string; description: string; emoji: string }>> = {
  anthropic: { name: 'Anthropic', brain: 'Claude', description: 'Thoughtful, nuanced AI from Anthropic', emoji: '\u{1F9E0}' },
  openai: { name: 'OpenAI', brain: 'ChatGPT', description: 'The popular ChatGPT models from OpenAI', emoji: '\u{1F49A}' },
  google: { name: 'Google', brain: 'Gemini', description: 'Multimodal AI from Google DeepMind', emoji: '\u{1F537}' },
  ollama: { name: 'Ollama', brain: 'Local AI', description: 'Run AI on your own machine, no cloud needed', emoji: '\u{1F999}' },
  openrouter: { name: 'OpenRouter', brain: 'Multi-Model', description: 'Access many AI models through one service', emoji: '\u{1F310}' },
  moonshot: { name: 'Moonshot', brain: 'Kimi', description: 'Advanced AI from Moonshot (China)', emoji: '\u{1F319}' },
  siliconflow: { name: 'SiliconFlow', brain: 'Multi-Model', description: 'Chinese AI model marketplace', emoji: '\u{1F30A}' },
  ark: { name: 'ByteDance Ark', brain: 'Doubao', description: 'AI from ByteDance (China)', emoji: '\u{1F3D4}\uFE0F' },
  'minimax-portal': { name: 'MiniMax', brain: 'MiniMax', description: 'MiniMax AI (Global)', emoji: '\u{2601}\uFE0F' },
  'minimax-portal-cn': { name: 'MiniMax CN', brain: 'MiniMax', description: 'MiniMax AI (China)', emoji: '\u{2601}\uFE0F' },
  'qwen-portal': { name: 'Qwen', brain: 'Qwen', description: 'Alibaba Cloud AI models', emoji: '\u{2601}\uFE0F' },
  custom: { name: 'Custom', brain: 'Custom AI', description: 'Connect any OpenAI-compatible service', emoji: '\u{2699}\uFE0F' },
};

interface ProviderSetupModalProps {
  providerId: string;
  /** Called after provider is successfully saved */
  onSave: () => void;
  /** Called when modal is dismissed without saving */
  onClose: () => void;
}

export function ProviderSetupModal({ providerId, onSave, onClose }: ProviderSetupModalProps) {
  const providerData = PROVIDER_TYPE_INFO.find(p => p.id === providerId);
  const friendly = FRIENDLY_NAMES[providerId as ProviderType];
  const needsKey = providerData?.requiresApiKey ?? true;
  const docsUrl = providerData ? getProviderDocsUrl(providerData, 'en') : null;

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [modelId, setModelId] = useState(providerData?.defaultModelId || '');
  const [showOllamaWizard, setShowOllamaWizard] = useState(providerId === 'ollama');

  const handleValidate = async () => {
    if (!providerId || (!apiKey && needsKey)) return;
    setValidating(true);
    setKeyValid(null);
    try {
      const result = await invokeIpc('provider:validateKey', providerId, apiKey, {
        baseUrl: providerData?.defaultBaseUrl || undefined,
      }) as { valid: boolean; error?: string };
      setKeyValid(result.valid);
      if (!result.valid) toast.error(result.error || 'Invalid \u2014 check and try again');
    } catch {
      setKeyValid(false);
      toast.error('Connection failed');
    }
    setValidating(false);
  };

  const handleSaveCloud = async () => {
    setSaving(true);
    try {
      const snapshot = await fetchProviderSnapshot();
      const accountId = buildProviderAccountId(providerId as ProviderType, null, snapshot.vendors);
      const effectiveApiKey = resolveProviderApiKeyForSave(providerId, apiKey);
      const effectiveModel = modelId.trim() || resolveProviderModelForSave(providerData, '', false);

      const accountPayload: ProviderAccount = {
        id: accountId,
        vendorId: providerId as ProviderType,
        label: providerData?.name || providerId,
        authMode: providerId === 'ollama' ? 'local' : 'api_key',
        baseUrl: providerData?.defaultBaseUrl,
        model: effectiveModel,
        enabled: true,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await hostApiFetch('/api/provider-accounts', {
        method: 'POST',
        body: JSON.stringify({ account: accountPayload, apiKey: effectiveApiKey }),
      });

      await hostApiFetch('/api/provider-accounts/default', {
        method: 'PUT',
        body: JSON.stringify({ accountId }),
      });

      toast.success(`${friendly?.brain || providerId} connected!`);
      onSave();
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handleOllamaComplete = useCallback(async (ollamaModel: string, baseUrl: string) => {
    setShowOllamaWizard(false);
    setSaving(true);
    try {
      const snapshot = await fetchProviderSnapshot();
      const existingOllama = snapshot.accounts?.find(
        (a: ProviderAccount) => a.vendorId === 'ollama'
      );
      const accountId = existingOllama?.id
        ?? buildProviderAccountId('ollama' as ProviderType, null, snapshot.vendors);

      const accountPayload: ProviderAccount = {
        id: accountId,
        vendorId: 'ollama' as ProviderType,
        label: 'Ollama',
        authMode: 'local',
        baseUrl,
        model: ollamaModel,
        enabled: true,
        isDefault: false,
        createdAt: existingOllama?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const effectiveApiKey = resolveProviderApiKeyForSave('ollama', '');

      await hostApiFetch('/api/provider-accounts', {
        method: 'POST',
        body: JSON.stringify({ account: accountPayload, apiKey: effectiveApiKey }),
      });

      await hostApiFetch('/api/provider-accounts/default', {
        method: 'PUT',
        body: JSON.stringify({ accountId }),
      });

      toast.success('Local AI is ready!');
      onSave();
    } catch {
      toast.error('Failed to save Ollama provider');
    }
    setSaving(false);
  }, [onSave]);

  // Ollama: show wizard directly when active
  if (providerId === 'ollama' && showOllamaWizard) {
    return (
      <OllamaSetupWizard
        onComplete={handleOllamaComplete}
        onCancel={() => setShowOllamaWizard(false)}
      />
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'hsl(var(--card))', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #d97706, #fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {friendly?.emoji || '\u{1F9E0}'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                Set up {friendly?.brain || providerId}
              </div>
              <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                {friendly?.name || providerId}
              </div>
            </div>
          </div>

          {/* API key input (cloud providers that need a key) */}
          {needsKey ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Secret code</label>
                {docsUrl && (
                  <a href="#" onClick={(e) => { e.preventDefault(); window.electron.openExternal(docsUrl); }}
                    style={{ fontSize: 11, color: '#d97706', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Where do I get one? <ExternalLink style={{ width: 10, height: 10 }} />
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setKeyValid(null); }}
                    placeholder={providerData?.placeholder || 'Paste your secret code...'}
                    style={{
                      width: '100%', padding: '12px 40px 12px 14px', borderRadius: 10,
                      border: keyValid === true ? '2px solid #22c55e' : keyValid === false ? '2px solid #ef4444' : '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button onClick={() => setShowKey(!showKey)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))',
                  }}>
                    {showKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                <button onClick={handleValidate} disabled={!apiKey || validating}
                  style={{
                    padding: '12px 20px', borderRadius: 10, border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
                    fontSize: 13, fontWeight: 600, cursor: apiKey && !validating ? 'pointer' : 'default',
                    opacity: apiKey && !validating ? 1 : 0.4,
                  }}>
                  {validating ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : 'Test'}
                </button>
              </div>
              {keyValid === true && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} /> Connected!
                </div>
              )}
              {keyValid === false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                  <XCircle style={{ width: 16, height: 16 }} /> Invalid \u2014 check your code
                </div>
              )}
            </>
          ) : null}

          {/* Ollama: wizard-only, no manual config */}
          {providerId === 'ollama' ? (
            <div>
              <button
                onClick={() => setShowOllamaWizard(true)}
                style={{
                  width: '100%', padding: '16px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  marginBottom: 10,
                }}
              >
                Set up Local AI
              </button>
              <button onClick={onClose}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: '1px solid hsl(var(--border))', background: 'transparent',
                  color: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Model selector — cloud providers */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                  Model
                </label>
                {PROVIDER_MODELS[providerId] ? (
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {PROVIDER_MODELS[providerId].map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder={providerData?.modelIdPlaceholder || 'Model ID'}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={handleSaveCloud}
                  disabled={needsKey && !keyValid || saving}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                    background: (keyValid || !needsKey) && !saving ? 'linear-gradient(135deg, #d97706, #fbbf24)' : 'hsl(var(--muted))',
                    color: (keyValid || !needsKey) && !saving ? 'white' : 'hsl(var(--muted-foreground))',
                    fontSize: 14, fontWeight: 700, cursor: (keyValid || !needsKey) && !saving ? 'pointer' : 'default',
                  }}>
                  {saving ? 'Saving...' : 'Save & Activate'}
                </button>
                <button onClick={onClose}
                  style={{
                    padding: '12px 20px', borderRadius: 10,
                    border: '1px solid hsl(var(--border))', background: 'transparent',
                    color: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
