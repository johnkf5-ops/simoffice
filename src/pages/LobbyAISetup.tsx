/**
 * SimOffice AI Setup — Built from scratch. No ClawX UI.
 * Dark buddy panel + AI provider management matching SimOffice design.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { OllamaSetupWizard } from '@/components/ollama/OllamaSetupWizard';
import { OllamaStatus } from '@/components/ollama/OllamaStatus';
import { useProviderStore } from '@/stores/providers';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { useChatStore } from '@/stores/chat';
import { StatusDot } from '@/components/common/StatusDot';
import {
  PROVIDER_TYPE_INFO, getProviderIconUrl, getProviderDocsUrl,
  type ProviderType, type ProviderAccount,
  resolveProviderApiKeyForSave, resolveProviderModelForSave,
} from '@/lib/providers';
import { buildProviderAccountId, fetchProviderSnapshot } from '@/lib/provider-accounts';
import { PROVIDER_MODELS } from '@/lib/provider-models';
import { invokeIpc } from '@/lib/api-client';
import { hostApiFetch } from '@/lib/host-api';
import { toast } from 'sonner';

/** Human-friendly names for provider types — no jargon */
const FRIENDLY_NAMES: Partial<Record<ProviderType, { name: string; brain: string; description: string; emoji: string }>> = {
  anthropic: { name: 'Anthropic', brain: 'Claude', description: 'Thoughtful, nuanced AI from Anthropic', emoji: '🧠' },
  openai: { name: 'OpenAI', brain: 'ChatGPT', description: 'The popular ChatGPT models from OpenAI', emoji: '💚' },
  google: { name: 'Google', brain: 'Gemini', description: 'Multimodal AI from Google DeepMind', emoji: '🔷' },
  ollama: { name: 'Ollama', brain: 'Local AI', description: 'Run AI on your own machine, no cloud needed', emoji: '🦙' },
  openrouter: { name: 'OpenRouter', brain: 'Multi-Model', description: 'Access many AI models through one service', emoji: '🌐' },
  moonshot: { name: 'Moonshot', brain: 'Kimi', description: 'Advanced AI from Moonshot (China)', emoji: '🌙' },
  siliconflow: { name: 'SiliconFlow', brain: 'Multi-Model', description: 'Chinese AI model marketplace', emoji: '🌊' },
  ark: { name: 'ByteDance Ark', brain: 'Doubao', description: 'AI from ByteDance (China)', emoji: '🏔️' },
  'minimax-portal': { name: 'MiniMax', brain: 'MiniMax', description: 'MiniMax AI (Global)', emoji: '☁️' },
  'minimax-portal-cn': { name: 'MiniMax CN', brain: 'MiniMax', description: 'MiniMax AI (China)', emoji: '☁️' },
  'qwen-portal': { name: 'Qwen', brain: 'Qwen', description: 'Alibaba Cloud AI models', emoji: '☁️' },
  xai: { name: 'xAI', brain: 'Grok', description: "Elon's AI — fast, uncensored, powerful", emoji: '✖️' },
  custom: { name: 'Custom', brain: 'Custom AI', description: 'Connect any OpenAI-compatible service', emoji: '⚙️' },
};

export function LobbyAISetup() {
  const navigate = useNavigate();
  const statuses = useProviderStore((s) => s.statuses);
  const accounts = useProviderStore((s) => s.accounts);
  const vendors = useProviderStore((s) => s.vendors);
  const defaultAccountId = useProviderStore((s) => s.defaultAccountId);
  const loading = useProviderStore((s) => s.loading);
  const refreshProviderSnapshot = useProviderStore((s) => s.refreshProviderSnapshot);
  const setDefaultAccount = useProviderStore((s) => s.setDefaultAccount);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);

  // Setup modal state
  const [setupProvider, setSetupProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [modelId, setModelId] = useState('');
  const [showOllamaWizard, setShowOllamaWizard] = useState(false);

  useEffect(() => { void refreshProviderSnapshot(); void fetchAgents(); }, [refreshProviderSnapshot, fetchAgents]);

  // Ollama wizard completion — save provider using the same flow as manual setup
  const handleOllamaWizardComplete = useCallback(async (ollamaModel: string, baseUrl: string) => {
    setShowOllamaWizard(false);
    setSaving(true);
    try {
      const snapshot = await fetchProviderSnapshot();

      // Reuse existing Ollama account if one exists, otherwise create new one
      // using the same buildProviderAccountId the manual path uses.
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
      setSetupProvider(null);
      await refreshProviderSnapshot();
    } catch {
      toast.error('Failed to save Ollama provider');
    }
    setSaving(false);
  }, [refreshProviderSnapshot]);

  const setupProviderData = PROVIDER_TYPE_INFO.find(p => p.id === setupProvider);
  const setupFriendly = setupProvider ? FRIENDLY_NAMES[setupProvider as ProviderType] : undefined;
  const needsKey = setupProviderData?.requiresApiKey ?? true;
  const docsUrl = setupProviderData ? getProviderDocsUrl(setupProviderData, 'en') : null;

  const handleValidate = async () => {
    if (!setupProvider || (!apiKey && needsKey)) return;
    setValidating(true);
    setKeyValid(null);
    try {
      const result = await invokeIpc('provider:validateKey', setupProvider, apiKey, {
        baseUrl: setupProviderData?.defaultBaseUrl || undefined,
      }) as { valid: boolean; error?: string };
      setKeyValid(result.valid);
      if (!result.valid) toast.error(result.error || 'Invalid — check and try again');
    } catch {
      setKeyValid(false);
      toast.error('Connection failed');
    }
    setValidating(false);
  };

  const handleSaveProvider = async () => {
    if (!setupProvider) return;
    setSaving(true);
    try {
      const snapshot = await fetchProviderSnapshot();
      const accountId = buildProviderAccountId(setupProvider as ProviderType, undefined, snapshot.vendors);
      const effectiveApiKey = resolveProviderApiKeyForSave(setupProvider, apiKey);
      const effectiveModel = modelId.trim() || resolveProviderModelForSave(setupProviderData, '', false);

      const accountPayload: ProviderAccount = {
        id: accountId,
        vendorId: setupProvider as ProviderType,
        label: setupProviderData?.name || setupProvider,
        authMode: setupProvider === 'ollama' ? 'local' : 'api_key',
        baseUrl: setupProviderData?.defaultBaseUrl,
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

      toast.success(`${setupFriendly?.brain || setupProvider} connected!`);
      setSetupProvider(null);
      setApiKey('');
      setKeyValid(null);
      await refreshProviderSnapshot();
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  // Find the active/default account
  const defaultAccount = accounts.find((a) => a.id === defaultAccountId) || accounts.find((a) => a.isDefault) || accounts[0];
  const defaultFriendly = defaultAccount ? FRIENDLY_NAMES[defaultAccount.vendorId] : undefined;

  // Build grid of available provider types with status
  const providerGrid = PROVIDER_TYPE_INFO.map((info) => {
    const friendly = FRIENDLY_NAMES[info.id];
    const configured = accounts.filter((a) => a.vendorId === info.id);
    const isActive = configured.some((a) => a.id === defaultAccountId || a.isDefault);
    return { info, friendly, configured, isActive };
  });

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ═══ BUDDY PANEL ═══ */}
      <div
        style={{
          width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #1a1a6e 0%, #0d0d3b 100%)',
          borderRight: '2px solid #333',
        }}
      >
        {/* Back to Lobby */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 16, fontWeight: 900, color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
            ← <span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lobby</span>
          </button>
        </div>

        {/* New Chat */}
        <div style={{ padding: 8 }}>
          <button onClick={() => { newSession(); navigate('/chat'); }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            + New Chat
          </button>
        </div>

        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />

        {/* Buddies + Conversations */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Online ({isOnline ? (agents?.length ?? 0) : 0})
          </div>
          {isOnline && agents?.map((agent) => (
            <button key={agent.id} onClick={() => { newSession(); navigate('/chat'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {agent.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
              </div>
              <StatusDot status="online" size="sm" />
            </button>
          ))}

          {sessions?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(147,197,253,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Conversations
              </div>
              {sessions.map((s) => {
                const label = sessionLabels[s.key] || s.label || s.displayName || 'Conversation';
                const isActive = s.key === currentSessionKey;
                return (
                  <button key={s.key} onClick={() => { switchSession(s.key); navigate('/chat'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ fontSize: 10 }}>💬</span>
                    <span style={{ fontSize: 10, color: isActive ? 'white' : 'rgba(191,219,254,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status footer */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status={isOnline ? 'online' : 'error'} size="sm" />
          <span style={{ fontSize: 10, fontWeight: 500, color: isOnline ? '#86efac' : '#fca5a5' }}>
            {isOnline ? 'Engine running' : 'Engine offline'}
          </span>
        </div>
      </div>

      {/* ═══ CONTENT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Section Header */}
        <div style={{
          padding: '32px 40px 24px 40px',
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
        }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            ← Back to Lobby
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Brain
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
            Choose the AI that powers your office
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px 40px' }}>

          {loading && accounts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))' }}>
              Loading AI setup...
            </div>
          )}

          {/* Current Provider — Hero Card */}
          {defaultAccount && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                Your Active AI
              </h2>
              <div style={{
                background: 'linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)',
                borderRadius: 20,
                padding: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                boxShadow: '0 8px 32px rgba(217,119,6,0.2)',
              }}>
                {/* Logo */}
                <div style={{
                  width: 72, height: 72, borderRadius: 18,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {(() => {
                    const iconUrl = getProviderIconUrl(defaultAccount.vendorId);
                    if (iconUrl) {
                      return <img src={iconUrl} alt="" style={{ width: 40, height: 40, filter: 'brightness(0) invert(1)' }} />;
                    }
                    return <span style={{ fontSize: 36 }}>{defaultFriendly?.emoji || '🧠'}</span>;
                  })()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {defaultFriendly?.brain || defaultAccount.label || defaultAccount.vendorId}
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
                    {defaultFriendly?.description || `Connected via ${defaultFriendly?.name || defaultAccount.vendorId}`}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
                      background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 6,
                    }}>
                      {defaultAccount.label}
                    </span>
                    {defaultAccount.model && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                        background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 6,
                      }}>
                        Model: {defaultAccount.model}
                      </span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                      background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 6,
                    }}>
                      {defaultAccount.authMode === 'local' ? 'Running locally' :
                       defaultAccount.authMode === 'oauth_device' || defaultAccount.authMode === 'oauth_browser' ? 'Signed in' :
                       'Connected'}
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.25)',
                  padding: '8px 16px', borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: 'white',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  Active
                </div>
              </div>
            </div>
          )}

          {/* All Configured Accounts */}
          {accounts.length > 1 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                Your AI Accounts
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {accounts.map((acct) => {
                  const friendly = FRIENDLY_NAMES[acct.vendorId];
                  const isDefault = acct.id === defaultAccountId || acct.isDefault;
                  const iconUrl = getProviderIconUrl(acct.vendorId);
                  return (
                    <div key={acct.id}
                      style={{
                        background: 'hsl(var(--card))',
                        border: `1px solid ${isDefault ? 'rgba(217,119,6,0.4)' : 'hsl(var(--border))'}`,
                        borderRadius: 14,
                        padding: 18,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        transition: 'all 0.2s',
                        cursor: isDefault ? 'default' : 'pointer',
                      }}
                      onClick={() => { if (!isDefault) setDefaultAccount(acct.id); }}
                      onMouseEnter={(e) => { if (!isDefault) e.currentTarget.style.boxShadow = '0 3px 16px rgba(217,119,6,0.12)'; }}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: isDefault
                          ? 'linear-gradient(135deg, #d97706, #fbbf24)'
                          : 'hsl(var(--muted))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, overflow: 'hidden',
                      }}>
                        {iconUrl ? (
                          <img src={iconUrl} alt="" style={{
                            width: 24, height: 24,
                            filter: isDefault ? 'brightness(0) invert(1)' : 'none',
                          }} />
                        ) : (
                          <span style={{ fontSize: 20 }}>{friendly?.emoji || '🧠'}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
                          color: 'hsl(var(--foreground))',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {acct.label || friendly?.brain || acct.vendorId}
                        </div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                          {friendly?.name || acct.vendorId}
                          {acct.model && ` / ${acct.model}`}
                        </div>
                      </div>
                      {isDefault ? (
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: '#d97706',
                          background: 'rgba(217,119,6,0.1)', padding: '3px 8px', borderRadius: 5,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}>
                          Active
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))',
                        }}>
                          Set as active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Local AI — Hero Card */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => { setSetupProvider('ollama'); setShowOllamaWizard(true); }}
              style={{
                width: '100%', padding: '20px 24px', borderRadius: 16, cursor: 'pointer',
                border: '2px solid rgba(34,197,94,0.4)',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.04) 100%)',
                textAlign: 'left', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; }}
            >
              <div style={{
                position: 'absolute', top: 12, right: 16,
                padding: '4px 12px', borderRadius: 20,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
              }}>
                FREE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(34,197,94,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontSize: 28,
                }}>
                  🦙
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Run AI on your computer
                  </div>
                  <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                    No account needed. No monthly fees. Your data stays private.
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Cloud AI Providers */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 6 }}>
              Cloud AI Brains
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
              Connect a cloud AI service with your API key.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {providerGrid.filter(({ info }) => info.id !== 'ollama').map(({ info, friendly, configured, isActive }) => {
                const hasAccount = configured.length > 0;
                const iconUrl = getProviderIconUrl(info.id);
                return (
                  <div key={info.id}
                    style={{
                      background: hasAccount ? 'rgba(217,119,6,0.04)' : 'hsl(var(--card))',
                      border: `1px solid ${hasAccount ? 'rgba(217,119,6,0.2)' : 'hsl(var(--border))'}`,
                      borderRadius: 12,
                      padding: 16,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!hasAccount) {
                        e.currentTarget.style.borderColor = '#d97706';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(217,119,6,0.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!hasAccount) {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: hasAccount ? 'linear-gradient(135deg, #d97706, #fbbf24)' : 'hsl(var(--muted))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, overflow: 'hidden',
                      }}>
                        {iconUrl ? (
                          <img src={iconUrl} alt="" style={{
                            width: 20, height: 20,
                            filter: hasAccount ? 'brightness(0) invert(1)' : 'none',
                          }} />
                        ) : (
                          <span style={{ fontSize: 18 }}>{friendly?.emoji || info.icon}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                          {friendly?.brain || info.model || info.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                          {friendly?.name || info.name}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.4, marginBottom: 10 }}>
                      {friendly?.description || `AI from ${info.name}`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {hasAccount ? (
                          <>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#34d399' : '#fbbf24' }} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? '#34d399' : '#fbbf24' }}>
                              {isActive ? 'ACTIVE' : `${configured.length} account${configured.length > 1 ? 's' : ''}`}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                            {info.requiresApiKey ? 'Needs setup' : info.id === 'ollama' ? 'Free — runs locally' : 'Available'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => { setSetupProvider(info.id); setApiKey(''); setKeyValid(null); setShowKey(false); setModelId(info.defaultModelId || ''); }}
                        style={{
                          padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: hasAccount ? 'hsl(var(--muted))' : 'linear-gradient(135deg, #d97706, #fbbf24)',
                          color: hasAccount ? 'hsl(var(--foreground))' : 'white',
                          fontSize: 11, fontWeight: 700,
                        }}>
                        {hasAccount ? 'Edit' : 'Set Up'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SETUP MODAL ═══ */}
      {setupProvider && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setSetupProvider(null)}
        >
          <div style={{
            background: 'hsl(var(--card))', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {setupFriendly?.emoji || '🧠'}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                  Set up {setupFriendly?.brain || setupProvider}
                </div>
                <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                  {setupFriendly?.name || setupProvider}
                </div>
              </div>
            </div>

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
                      placeholder={setupProviderData?.placeholder || 'Paste your secret code...'}
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
                    <XCircle style={{ width: 16, height: 16 }} /> Invalid — check your code
                  </div>
                )}
              </>
            ) : null}

            {/* Ollama: wizard only, no manual config */}
            {setupProvider === 'ollama' ? (
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
                <button onClick={() => setSetupProvider(null)}
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
                {/* Model selector — cloud providers only */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                    Model
                  </label>
                  {setupProvider && PROVIDER_MODELS[setupProvider] ? (
                    <select
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {PROVIDER_MODELS[setupProvider].map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                      placeholder={setupProviderData?.modelIdPlaceholder || 'Model ID'}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
                      }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={handleSaveProvider}
                    disabled={needsKey && !keyValid || saving}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                      background: (keyValid || !needsKey) && !saving ? 'linear-gradient(135deg, #d97706, #fbbf24)' : 'hsl(var(--muted))',
                      color: (keyValid || !needsKey) && !saving ? 'white' : 'hsl(var(--muted-foreground))',
                      fontSize: 14, fontWeight: 700, cursor: (keyValid || !needsKey) && !saving ? 'pointer' : 'default',
                    }}>
                    {saving ? 'Saving...' : 'Save & Activate'}
                  </button>
                  <button onClick={() => setSetupProvider(null)}
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
      )}

      {/* Ollama Setup Wizard Modal */}
      {showOllamaWizard && (
        <OllamaSetupWizard
          onComplete={handleOllamaWizardComplete}
          onCancel={() => setShowOllamaWizard(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
