/**
 * OpenLobby Onboarding — 3 steps, 90 seconds, done.
 * No ClawX UI. Pure OpenLobby design.
 * Step 1: Welcome
 * Step 2: Pick your AI + paste secret code
 * Step 3: Done — enter the lobby
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { invokeIpc } from '@/lib/api-client';
import { hostApiFetch } from '@/lib/host-api';
import {
  SETUP_PROVIDERS,
  type ProviderAccount,
  type ProviderType,
  resolveProviderApiKeyForSave,
  resolveProviderModelForSave,
  getProviderDocsUrl,
} from '@/lib/providers';
import {
  buildProviderAccountId,
  fetchProviderSnapshot,
} from '@/lib/provider-accounts';
import { toast } from 'sonner';
import { CAREERS, CATEGORY_LABELS, type CareerTemplate } from '@/lib/career-templates';
import { PROVIDER_MODELS } from '@/lib/provider-models';

const TOP_PROVIDERS = SETUP_PROVIDERS.filter(p =>
  ['anthropic', 'openai', 'google', 'xai', 'ollama'].includes(p.id)
);
const OTHER_PROVIDERS = SETUP_PROVIDERS.filter(p =>
  !['anthropic', 'openai', 'google', 'ollama'].includes(p.id)
);

export function Onboarding() {
  const navigate = useNavigate();
  const markSetupComplete = useSettingsStore((s) => s.markSetupComplete);
  const startGateway = useGatewayStore((s) => s.start);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const [step, setStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [modelId, setModelId] = useState('');
  const createAgent = useAgentsStore((s) => s.createAgent);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [buildingTeam, setBuildingTeam] = useState(false);
  const [agentCatalog, setAgentCatalog] = useState<Array<{ id: string; category: string; name: string; role: string; path: string }>>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [soulTemplates, setSoulTemplates] = useState<Record<string, string>>({});

  const providerData = SETUP_PROVIDERS.find(p => p.id === selectedProvider);
  const needsKey = providerData?.requiresApiKey ?? true;
  const docsUrl = providerData ? getProviderDocsUrl(providerData, 'en') : null;

  // Load agent catalog + soul templates
  useEffect(() => {
    fetch('/agent-templates.json')
      .then(r => r.json())
      .then(data => setAgentCatalog(data.agents || []))
      .catch(() => {});
    fetch('/agent-souls.json')
      .then(r => r.json())
      .then(data => setSoulTemplates(data || {}))
      .catch(() => {});
  }, []);

  // Auto-start gateway on final step
  useEffect(() => {
    if (step === 4 && !isOnline) {
      startGateway();
    }
  }, [step, isOnline, startGateway]);

  // When career is selected, pre-select recommended agents
  const handleCareerSelect = (careerId: string) => {
    setSelectedCareer(careerId);
    const career = CAREERS.find(c => c.id === careerId);
    if (career) {
      setSelectedAgents(new Set(career.recommended));
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const handleValidate = async () => {
    if (!selectedProvider || (!apiKey && needsKey)) return;
    setValidating(true);
    setKeyValid(null);
    try {
      const result = await invokeIpc('provider:validateKey', selectedProvider, apiKey, {
        baseUrl: providerData?.defaultBaseUrl || undefined,
      }) as { valid: boolean; error?: string };
      setKeyValid(result.valid);
      if (!result.valid) {
        toast.error(result.error || 'Invalid key — check and try again');
      }
    } catch (err) {
      setKeyValid(false);
      toast.error('Connection failed — check your key');
    }
    setValidating(false);
  };

  const handleSaveAndContinue = async () => {
    if (!selectedProvider) return;
    setSaving(true);
    try {
      const snapshot = await fetchProviderSnapshot();
      const accountId = buildProviderAccountId(selectedProvider as ProviderType, undefined, snapshot.vendors);
      const effectiveApiKey = resolveProviderApiKeyForSave(selectedProvider, apiKey);
      const effectiveModel = modelId.trim() || resolveProviderModelForSave(providerData, '', false);

      const accountPayload: ProviderAccount = {
        id: accountId,
        vendorId: selectedProvider as ProviderType,
        label: providerData?.name || selectedProvider,
        authMode: selectedProvider === 'ollama' ? 'local' : 'api_key',
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

      setStep(2); // Go to career picker
    } catch (err) {
      toast.error('Failed to save — try again');
    }
    setSaving(false);
  };

  const handleFinish = () => {
    markSetupComplete();
    navigate('/');
  };

  const handleSkip = () => {
    markSetupComplete();
    navigate('/');
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d0d3b 0%, #1a1a6e 40%, #2d1b69 100%)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 560, padding: 32 }}>

        {/* ═══ STEP 0: WELCOME ═══ */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #f97316, #fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(249,115,22,0.3)',
              fontSize: 36,
            }}>
              ⚡
            </div>

            <h1 style={{ fontSize: 40, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Welcome to OpenLobby
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(191,219,254,0.6)', marginBottom: 40, lineHeight: 1.6 }}>
              Your personal AI assistant, right on your computer.<br />
              Private. Powerful. Yours.
            </p>

            <button onClick={() => setStep(1)} style={{
              padding: '16px 48px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f97316, #f59e0b)',
              color: 'white', fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
              boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Let's Go →
            </button>

            <div style={{ marginTop: 32 }}>
              <button onClick={handleSkip} style={{ background: 'none', border: 'none', color: 'rgba(191,219,254,0.3)', fontSize: 12, cursor: 'pointer' }}>
                Skip setup
              </button>
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === step ? '#f97316' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 1: PICK YOUR AI ═══ */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', color: 'rgba(191,219,254,0.5)', fontSize: 14, cursor: 'pointer', marginBottom: 16, fontWeight: 600 }}>
              ← Back
            </button>

            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
              Pick your AI
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(191,219,254,0.5)', marginBottom: 24 }}>
              Choose an AI service and enter your secret code
            </p>

            {/* Provider grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {TOP_PROVIDERS.map(p => (
                <button key={p.id} onClick={() => { setSelectedProvider(p.id); setApiKey(''); setKeyValid(null); setModelId(p.defaultModelId || ''); }}
                  style={{
                    padding: '16px', borderRadius: 12, border: selectedProvider === p.id ? '2px solid #f97316' : '2px solid rgba(255,255,255,0.1)',
                    background: selectedProvider === p.id ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.05)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{p.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(191,219,254,0.4)', marginTop: 2 }}>
                    {p.id === 'ollama' ? 'Free · runs locally' : p.model || 'AI'}
                  </div>
                </button>
              ))}
            </div>

            {/* Show more toggle */}
            <button onClick={() => setShowOthers(!showOthers)} style={{
              background: 'none', border: 'none', color: 'rgba(191,219,254,0.4)', fontSize: 12, cursor: 'pointer', marginBottom: 12, width: '100%', textAlign: 'center',
            }}>
              {showOthers ? '▲ Less options' : '▼ More options'}
            </button>

            {showOthers && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {OTHER_PROVIDERS.map(p => (
                  <button key={p.id} onClick={() => { setSelectedProvider(p.id); setApiKey(''); setKeyValid(null); setModelId(p.defaultModelId || ''); }}
                    style={{
                      padding: '10px 12px', borderRadius: 8, border: selectedProvider === p.id ? '2px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                      background: selectedProvider === p.id ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                    }}>
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
            )}

            {/* Secret code input */}
            {selectedProvider && needsKey && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    Secret code
                  </label>
                  {docsUrl && (
                    <a href="#" onClick={(e) => { e.preventDefault(); window.electron.openExternal(docsUrl); }}
                      style={{ fontSize: 11, color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Where do I get one? <ExternalLink style={{ width: 10, height: 10 }} />
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setKeyValid(null); }}
                      placeholder={providerData?.placeholder || 'Paste your secret code...'}
                      style={{
                        width: '100%', padding: '12px 40px 12px 14px', borderRadius: 10,
                        border: keyValid === true ? '2px solid #22c55e' : keyValid === false ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14, outline: 'none',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button onClick={() => setShowKey(!showKey)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                    }}>
                      {showKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  <button onClick={handleValidate} disabled={!apiKey || validating}
                    style={{
                      padding: '12px 20px', borderRadius: 10, border: 'none', cursor: apiKey && !validating ? 'pointer' : 'default',
                      background: apiKey && !validating ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                      color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                      opacity: apiKey && !validating ? 1 : 0.4,
                    }}>
                    {validating ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : 'Test'}
                  </button>
                </div>
                {keyValid === true && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle2 style={{ width: 16, height: 16 }} /> Connected!
                  </div>
                )}
                {keyValid === false && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                    <XCircle style={{ width: 16, height: 16 }} /> Invalid — check your code
                  </div>
                )}
              </div>
            )}

            {/* Ollama message */}
            {selectedProvider === 'ollama' && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  Make sure Ollama is running on your computer. No secret code needed — it's free and local.
                </div>
              </div>
            )}

            {/* Model selector */}
            {selectedProvider && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                  Model
                </label>
                {PROVIDER_MODELS[selectedProvider] ? (
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 14, outline: 'none',
                      cursor: 'pointer', appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                  >
                    {PROVIDER_MODELS[selectedProvider].map(m => (
                      <option key={m.id} value={m.id} style={{ background: '#1a1a3e', color: 'white' }}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder={providerData?.modelIdPlaceholder || 'Model ID'}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14, outline: 'none',
                    }}
                  />
                )}
              </div>
            )}

            {/* Continue button */}
            <button
              onClick={handleSaveAndContinue}
              disabled={!selectedProvider || (needsKey && !keyValid) || saving}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: selectedProvider && (keyValid || !needsKey) && !saving ? 'linear-gradient(135deg, #f97316, #f59e0b)' : 'rgba(255,255,255,0.05)',
                color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
                cursor: selectedProvider && (keyValid || !needsKey) && !saving ? 'pointer' : 'default',
                opacity: selectedProvider && (keyValid || !needsKey) && !saving ? 1 : 0.4,
                boxShadow: selectedProvider && (keyValid || !needsKey) ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
              }}
            >
              {saving ? 'Setting up...' : 'Almost Done →'}
            </button>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === step ? '#f97316' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: WHAT DO YOU DO? ═══ */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'rgba(191,219,254,0.5)', fontSize: 14, cursor: 'pointer', marginBottom: 16, fontWeight: 600 }}>
              ← Back
            </button>

            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
              What do you do?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(191,219,254,0.5)', marginBottom: 24 }}>
              We'll recommend an AI team based on your work
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CAREERS.map(career => (
                <button key={career.id} onClick={() => { handleCareerSelect(career.id); setStep(3); }}
                  style={{
                    padding: '16px', borderRadius: 12,
                    border: '2px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.border = '2px solid rgba(249,115,22,0.5)'; e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.border = '2px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{career.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{career.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(191,219,254,0.4)', marginTop: 2 }}>{career.description}</div>
                </button>
              ))}
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === step ? '#f97316' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: YOUR TEAM ═══ */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'rgba(191,219,254,0.5)', fontSize: 14, cursor: 'pointer', marginBottom: 16, fontWeight: 600 }}>
              ← Back
            </button>

            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
              Your Team
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(191,219,254,0.5)', marginBottom: 8 }}>
              We picked these for you. Uncheck any you don't need, or add more.
            </p>
            <div style={{ fontSize: 12, color: 'rgba(191,219,254,0.3)', marginBottom: 20 }}>
              {selectedAgents.size} selected
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 20, paddingRight: 8 }}>
              {/* Recommended first */}
              {agentCatalog
                .filter(a => selectedAgents.has(a.id))
                .map(agent => (
                  <button key={agent.id} onClick={() => toggleAgent(agent.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                      border: '2px solid rgba(249,115,22,0.3)',
                      background: 'rgba(249,115,22,0.1)',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      background: '#f97316',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: 'white', fontWeight: 700,
                    }}>✓</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>
                        {agent.name || agent.id.replace(/-/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(191,219,254,0.4)' }}>
                        {CATEGORY_LABELS[agent.category] || agent.category}
                        {agent.role ? ` · ${agent.role}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              }

              {/* Available (not selected) */}
              {agentCatalog
                .filter(a => !selectedAgents.has(a.id))
                .slice(0, 20)
                .map(agent => (
                  <button key={agent.id} onClick={() => toggleAgent(agent.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      border: '2px solid rgba(255,255,255,0.2)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
                        {agent.name || agent.id.replace(/-/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(191,219,254,0.3)' }}>
                        {CATEGORY_LABELS[agent.category] || agent.category}
                      </div>
                    </div>
                  </button>
                ))
              }
            </div>

            <button onClick={async () => {
                setBuildingTeam(true);
                try {
                  for (const agentId of selectedAgents) {
                    const agent = agentCatalog.find(a => a.id === agentId);
                    if (agent) {
                      const name = agent.name || agent.id.replace(/-/g, ' ');
                      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                      try {
                        await createAgent(displayName);
                        // Find the newly created agent to get its actual ID
                        const updatedAgents = useAgentsStore.getState().agents;
                        const created = updatedAgents.find(a => a.name === displayName);
                        // Write SOUL.md template if available
                        const soul = soulTemplates[agentId];
                        if (soul && created) {
                          await hostApiFetch(`/api/agents/${encodeURIComponent(created.id)}/soul`, {
                            method: 'PUT',
                            body: JSON.stringify({ content: soul }),
                          });
                        }
                      } catch { /* skip if already exists */ }
                    }
                  }
                } catch { /* continue */ }
                setBuildingTeam(false);
                setStep(4);
              }}
              disabled={buildingTeam}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: buildingTeam ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f97316, #f59e0b)',
                color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
                cursor: buildingTeam ? 'default' : 'pointer',
                boxShadow: buildingTeam ? 'none' : '0 4px 20px rgba(249,115,22,0.3)',
              }}>
              {buildingTeam ? `Creating ${selectedAgents.size} agents...` : 'Build My Team →'}
            </button>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === step ? '#f97316' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 4: DONE ═══ */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: isOnline ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isOnline ? '0 8px 32px rgba(34,197,94,0.3)' : '0 8px 32px rgba(245,158,11,0.3)',
              fontSize: 36,
            }}>
              {isOnline ? '✓' : '⏳'}
            </div>

            <h2 style={{ fontSize: 40, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>
              {isOnline ? "You're all set!" : 'Starting up...'}
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(191,219,254,0.6)', marginBottom: 8 }}>
              {isOnline
                ? 'Your AI assistant is ready. Welcome to the future.'
                : 'The engine is warming up. This only takes a moment.'}
            </p>

            {!isOnline && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, color: 'rgba(251,191,36,0.7)', fontSize: 14 }}>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Engine starting...
              </div>
            )}

            {isOnline && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, color: '#22c55e', fontSize: 14, fontWeight: 600 }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                Engine running
              </div>
            )}

            <button onClick={handleFinish} disabled={!isOnline}
              style={{
                padding: '16px 48px', borderRadius: 16, border: 'none',
                background: isOnline ? 'linear-gradient(135deg, #f97316, #f59e0b)' : 'rgba(255,255,255,0.05)',
                color: 'white', fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
                cursor: isOnline ? 'pointer' : 'default',
                opacity: isOnline ? 1 : 0.4,
                boxShadow: isOnline ? '0 4px 20px rgba(249,115,22,0.4)' : 'none',
              }}>
              Enter the Lobby →
            </button>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === step ? '#22c55e' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
