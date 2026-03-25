/**
 * SimOffice Onboarding — 3 steps, 90 seconds, done.
 * No ClawX UI. Pure SimOffice design.
 * Step 1: Welcome
 * Step 2: Pick your AI + paste secret code
 * Step 3: Done — enter the lobby
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Cpu, Shield } from 'lucide-react';
import { ProviderSetupModal } from '@/components/providers/ProviderSetupModal';
import { useSettingsStore } from '@/stores/settings';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { invokeIpc } from '@/lib/api-client';
import { hostApiFetch } from '@/lib/host-api';
import { SETUP_PROVIDERS } from '@/lib/providers';
import { CAREERS, CATEGORY_LABELS } from '@/lib/career-templates';
import { MoonPaySetupModal } from '@/components/moonpay/MoonPaySetupModal';

const CLOUD_PROVIDERS = SETUP_PROVIDERS.filter(p =>
  ['anthropic', 'openai', 'google', 'xai'].includes(p.id)
);
const OTHER_PROVIDERS = SETUP_PROVIDERS.filter(p =>
  !['anthropic', 'openai', 'google', 'xai', 'ollama'].includes(p.id)
);

export function Onboarding() {
  const navigate = useNavigate();
  const markSetupComplete = useSettingsStore((s) => s.markSetupComplete);
  const setupComplete = useSettingsStore((s) => s.setupComplete);
  const businessName = useSettingsStore((s) => s.businessName);
  const setBusinessName = useSettingsStore((s) => s.setBusinessName);
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';
  const startGateway = useGatewayStore((s) => s.start);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const [step, setStep] = useState(0);
  const [setupProvider, setSetupProvider] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const createAgent = useAgentsStore((s) => s.createAgent);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [buildingTeam, setBuildingTeam] = useState(false);
  const [installingSkills, setInstallingSkills] = useState(false);
  const [showMoonPaySetup, setShowMoonPaySetup] = useState(false);
  const [agentCatalog, setAgentCatalog] = useState<Array<{ id: string; category: string; name: string; role: string; path: string }>>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [soulTemplates, setSoulTemplates] = useState<Record<string, string>>({});
  const [showCloudProviders, setShowCloudProviders] = useState(false);
  const [canRunLocal, setCanRunLocal] = useState<boolean | null>(null); // null = checking

  // Loading screen state
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadDone, setLoadDone] = useState(false);

  // Simple 5-second loading bar, then show continue button
  useEffect(() => {
    if (step !== 0) return;

    // Check if hardware supports local AI
    invokeIpc<{ success: boolean; data?: { hardware: { totalRamGB: number; isAppleSilicon: boolean } } }>('ollama:get-recommendation')
      .then(res => {
        const hw = res.data?.hardware;
        setCanRunLocal(!!hw && hw.isAppleSilicon && hw.totalRamGB >= 16);
      })
      .catch(() => setCanRunLocal(false));

    // Load data in background
    fetch('/agent-templates.json')
      .then(r => r.json())
      .then(data => setAgentCatalog(data.agents || []))
      .catch(() => {});
    fetch('/agent-souls.json')
      .then(r => r.json())
      .then(data => setSoulTemplates(data || {}))
      .catch(() => {});

    // Animate progress over 5 seconds
    const steps = [
      { time: 0, progress: 5 },
      { time: 500, progress: 15 },
      { time: 1200, progress: 30 },
      { time: 2000, progress: 50 },
      { time: 3000, progress: 70 },
      { time: 3800, progress: 85 },
      { time: 4500, progress: 95 },
      { time: 5000, progress: 100 },
    ];

    const timers = steps.map(s =>
      setTimeout(() => setLoadProgress(s.progress), s.time)
    );
    const doneTimer = setTimeout(() => setLoadDone(true), 5400);
    const autoAdvance = setTimeout(() => {
      if (setupComplete) { navigate('/'); } else { setStep(1); }
    }, 5500);

    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer); clearTimeout(autoAdvance); };
  }, [step]);

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


  const handleFinish = () => {
    markSetupComplete();
    navigate('/');
  };

  const handleSkip = () => {
    setStep(2);
  };


  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: step === 0 ? '#0a0a1a' : 'linear-gradient(135deg, #0d0d3b 0%, #1a1a6e 40%, #2d1b69 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
    }}>
      {/* Splash background for loading & welcome screen */}
      {step === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: isDark ? 'url(/splash-loading-dark.png)' : 'url(/splash-loading-light.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}>
          {/* Gradient overlay for readability */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.55) 100%)',
          }} />
        </div>
      )}

      {/* Powered by MoonPay — top right corner */}
      {step === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, calc(-50% - 33px))', zIndex: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#000000', letterSpacing: '0.05em' }}>Powered by</span>
          <img src="/moonpay-logo.png" alt="MoonPay" style={{ height: 30, objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ width: '100%', maxWidth: step === 2 ? 960 : 560, padding: 32, position: 'relative', zIndex: 1, transition: 'max-width 0.3s' }}>

        {/* ═══ STEP 0: LOADING SCREEN ═══ */}
        {step === 0 && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(30% + 10px)',
            transform: 'translateX(-50%)',
            width: '40%',
            zIndex: 2,
            textAlign: 'center',
          }}>
            {/* Progress bar — visible while loading */}
            {!loadDone && (
              <div style={{
                width: '100%', height: 20, borderRadius: 10,
                background: 'rgba(0,0,0,0.35)',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                marginTop: 48,
              }}>
                <div style={{
                  height: '100%',
                  width: `${loadProgress}%`,
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #22c55e, #34d399, #3b82f6)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s ease-in-out infinite',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 16px rgba(34,197,94,0.6)',
                }} />
              </div>
            )}

          </div>
        )}

        {/* ═══ STEP 1: PICK YOUR AI ═══ */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', color: 'rgba(191,219,254,0.5)', fontSize: 14, cursor: 'pointer', marginBottom: 16, fontWeight: 600 }}>
              ← Back
            </button>

            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
              Set up your office
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(191,219,254,0.5)', marginBottom: 24 }}>
              Name your office and choose an AI service
            </p>

            {/* Business name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                Office name
              </label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Headquarters"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14, outline: 'none',
                }}
              />
            </div>

            {/* ═══ HERO: Local AI (Free) — only if hardware supports it ═══ */}
            {canRunLocal && <button
              onClick={() => setSetupProvider('ollama')}
              style={{
                width: '100%', padding: '20px 24px', borderRadius: 16, cursor: 'pointer',
                border: '2px solid rgba(34,197,94,0.4)',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)',
                textAlign: 'left', marginBottom: 24, transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; }}
            >
              {/* FREE badge */}
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
                  background: 'rgba(34,197,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Cpu size={24} style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Run AI on your computer
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(191,219,254,0.6)', marginTop: 2 }}>
                    No account needed. No monthly fees. Your data stays private.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', gap: 12, marginTop: 14, fontSize: 11, color: 'rgba(191,219,254,0.45)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={11} /> 100% private
                </span>
                <span>No API key</span>
                <span>Works offline</span>
                <span>We set it all up for you</span>
              </div>
            </button>}

            {/* ═══ Cloud providers ═══ */}
            <button
              onClick={() => setShowCloudProviders(!showCloudProviders)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(191,219,254,0.4)', fontSize: 13, fontWeight: 600,
                marginBottom: 12, textAlign: 'center', padding: '8px 0',
              }}
            >
              {canRunLocal === false
                ? 'Connect a cloud AI service'
                : (showCloudProviders ? '▲ Hide cloud options' : 'Or connect a cloud AI service ▼')}
            </button>

            {(showCloudProviders || canRunLocal === false) && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  {CLOUD_PROVIDERS.map(p => (
                    <button key={p.id} onClick={() => setSetupProvider(p.id)}
                      style={{
                        padding: '16px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{p.icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(191,219,254,0.4)', marginTop: 2 }}>
                        {p.model || 'AI'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Show more toggle */}
                <button onClick={() => setShowOthers(!showOthers)} style={{
                  background: 'none', border: 'none', color: 'rgba(191,219,254,0.3)', fontSize: 11, cursor: 'pointer', marginBottom: 12, width: '100%', textAlign: 'center',
                }}>
                  {showOthers ? '▲ Less' : '▼ More providers'}
                </button>

                {showOthers && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {OTHER_PROVIDERS.map(p => (
                      <button key={p.id} onClick={() => setSetupProvider(p.id)}
                        style={{
                          padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.03)',
                          cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                        }}>
                        {p.icon} {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}



            {/* Skip button */}
            <button
              onClick={handleSkip}
              style={{
                background: 'none', border: 'none', color: 'rgba(191,219,254,0.35)',
                fontSize: 12, cursor: 'pointer', marginTop: 16, width: '100%', textAlign: 'center',
              }}
            >
              Skip for now
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
              {CAREERS.map(career => {
                const hasPartner = !!career.partner;
                return (
                  <button key={career.id} onClick={() => { handleCareerSelect(career.id); setStep(3); }}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      border: hasPartner
                        ? '2px solid rgba(123,63,228,0.4)'
                        : '2px solid rgba(255,255,255,0.1)',
                      background: hasPartner
                        ? 'rgba(123,63,228,0.08)'
                        : 'rgba(255,255,255,0.05)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s',
                      boxShadow: hasPartner ? '0 0 20px rgba(123,63,228,0.15)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (hasPartner) {
                        e.currentTarget.style.border = '2px solid rgba(123,63,228,0.7)';
                        e.currentTarget.style.boxShadow = '0 0 28px rgba(123,63,228,0.3)';
                      } else {
                        e.currentTarget.style.border = '2px solid rgba(249,115,22,0.5)';
                        e.currentTarget.style.background = 'rgba(249,115,22,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasPartner) {
                        e.currentTarget.style.border = '2px solid rgba(123,63,228,0.4)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(123,63,228,0.15)';
                      } else {
                        e.currentTarget.style.border = '2px solid rgba(255,255,255,0.1)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{career.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{career.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(191,219,254,0.4)', marginTop: 2, lineHeight: 1.3 }}>{career.description}</div>
                    {career.partner && (
                      <div style={{
                        marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20,
                        background: 'linear-gradient(135deg, rgba(123,63,228,0.3), rgba(168,85,247,0.2))',
                        border: '1px solid rgba(123,63,228,0.3)',
                        fontSize: 10, fontWeight: 700, color: 'rgba(196,181,253,0.9)',
                        letterSpacing: '0.02em',
                      }}>
                        ⚡ {career.partner.label}
                      </div>
                    )}
                  </button>
                );
              })}
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

            {/* MoonPay connection prompt for partner careers */}
            {selectedCareer && CAREERS.find(c => c.id === selectedCareer)?.partner && (
              <div style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 12,
                background: 'rgba(123,63,228,0.1)',
                border: '1px solid rgba(123,63,228,0.25)',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(196,181,253,0.85)', marginBottom: 8 }}>
                  ⚡ This team is powered by <strong style={{ color: '#c4b5fd' }}>MoonPay</strong>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowMoonPaySetup(true)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 6, border: 'none',
                    background: 'linear-gradient(135deg, #7B3FE4, #a855f7)',
                    color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}>
                    Connect Now
                  </button>
                  <button onClick={() => {}} style={{
                    flex: 1, padding: '6px 0', borderRadius: 6,
                    border: '1px solid rgba(123,63,228,0.3)', background: 'none',
                    color: 'rgba(196,181,253,0.7)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Connect Later in Settings
                  </button>
                </div>
              </div>
            )}

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

                  // Install required skills for partner careers (e.g. MoonPay)
                  const career = CAREERS.find(c => c.id === selectedCareer);
                  if (career?.requiredSkills?.length) {
                    setInstallingSkills(true);
                    for (const slug of career.requiredSkills) {
                      try {
                        await invokeIpc('clawhub:install', { slug });
                      } catch { /* skill may not be available yet — non-blocking */ }
                    }
                    setInstallingSkills(false);
                  }
                  // Auto-create a group chat room for multi-agent careers
                  if (career && career.recommended.length > 1) {
                    const roomsStore = await import('@/stores/rooms').then(m => m.useRoomsStore);
                    const { createRoomFromCareer } = roomsStore.getState();
                    const room = createRoomFromCareer(career);
                    // Patch room agentIds to use actual server-assigned IDs
                    const actualAgents = useAgentsStore.getState().agents;
                    const normalize = (s: string) => s.toLowerCase().replace(/[-_\s]+/g, '');
                    const actualIds = career.recommended
                      .map(tid => actualAgents.find(a => normalize(a.name || '') === normalize(tid.replace(/-/g, ' '))))
                      .filter(Boolean)
                      .map(a => a!.id);
                    if (actualIds.length > 0) {
                      roomsStore.setState((s) => ({
                        rooms: s.rooms.map(r => r.id === room.id ? { ...r, agentIds: actualIds } : r),
                      }));
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
              {installingSkills
                ? 'Installing MoonPay skills...'
                : buildingTeam
                  ? `Creating ${selectedAgents.size} agents...`
                  : 'Build My Team →'}
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

      {/* Animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Provider Setup Modal (cloud or Ollama) */}
      {setupProvider && (
        <ProviderSetupModal
          providerId={setupProvider}
          onSave={() => { setSetupProvider(null); setStep(2); }}
          onClose={() => setSetupProvider(null)}
        />
      )}

      {/* MoonPay Setup Modal */}
      {showMoonPaySetup && (
        <MoonPaySetupModal
          onClose={() => setShowMoonPaySetup(false)}
        />
      )}
    </div>
  );
}
