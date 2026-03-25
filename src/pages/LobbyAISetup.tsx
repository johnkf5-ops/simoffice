/**
 * SimOffice AI Setup — Built from scratch. No ClawX UI.
 * Dark buddy panel + AI provider management matching SimOffice design.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProviderSetupModal, FRIENDLY_NAMES } from '@/components/providers/ProviderSetupModal';
import { useProviderStore } from '@/stores/providers';
import { PROVIDER_TYPE_INFO, getProviderIconUrl } from '@/lib/providers';
import { BuddyPanel } from '@/components/common/BuddyPanel';

export function LobbyAISetup() {
  const navigate = useNavigate();
  const accounts = useProviderStore((s) => s.accounts);
  const defaultAccountId = useProviderStore((s) => s.defaultAccountId);
  const loading = useProviderStore((s) => s.loading);
  const refreshProviderSnapshot = useProviderStore((s) => s.refreshProviderSnapshot);
  const setDefaultAccount = useProviderStore((s) => s.setDefaultAccount);

  const [setupProvider, setSetupProvider] = useState<string | null>(null);

  useEffect(() => { void refreshProviderSnapshot(); }, [refreshProviderSnapshot]);

  // Find the active/default account
  const defaultAccount = accounts.find((a) => a.id === defaultAccountId) || accounts.find((a) => a.isDefault) || accounts[0];
  const defaultFriendly = defaultAccount ? FRIENDLY_NAMES[defaultAccount.vendorId] : undefined;

  // Popular providers shown first with badge
  const POPULAR_PROVIDERS = new Set(['anthropic', 'openai', 'google', 'openrouter', 'xai']);

  // Build grid of available provider types with status, popular first
  const providerGrid = PROVIDER_TYPE_INFO.map((info) => {
    const friendly = FRIENDLY_NAMES[info.id];
    const configured = accounts.filter((a) => a.vendorId === info.id);
    const isActive = configured.some((a) => a.id === defaultAccountId || a.isDefault);
    const isPopular = POPULAR_PROVIDERS.has(info.id);
    return { info, friendly, configured, isActive, isPopular };
  }).sort((a, b) => {
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ═══ BUDDY PANEL ═══ */}
      <BuddyPanel currentPage="/ai-setup" />

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
              onClick={() => setSetupProvider('ollama')}
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
              {providerGrid.filter(({ info }) => info.id !== 'ollama').map(({ info, friendly, configured, isActive, isPopular }) => {
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
                      position: 'relative',
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
                    {isPopular && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        padding: '2px 8px', borderRadius: 6,
                        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                        color: 'white', fontSize: 9, fontWeight: 800,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        Popular
                      </div>
                    )}
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
                        onClick={() => setSetupProvider(info.id)}
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
        <ProviderSetupModal
          providerId={setupProvider}
          onSave={() => { setSetupProvider(null); void refreshProviderSnapshot(); }}
          onClose={() => setSetupProvider(null)}
        />
      )}
    </div>
  );
}
