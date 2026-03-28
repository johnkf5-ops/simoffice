/**
 * IntegrationSetupModal — Generic setup modal for MCP business integrations.
 *
 * 4 steps: Instructions → Credentials → Connecting (spinner) → Result
 *
 * Reuses CHANNEL_META data for instructions, fields, and docs URL.
 * Follows MoonPaySetupModal pattern: dark card, teal gradient header.
 */
import { useState } from 'react';
import { CHANNEL_META, CHANNEL_NAMES, type ChannelType } from '@/types/channel';
import { invokeIpc } from '@/lib/api-client';
import { useGatewayStore } from '@/stores/gateway';

interface IntegrationSetupModalProps {
  type: ChannelType;
  onClose: () => void;
  onConnected: () => void;
}

export function IntegrationSetupModal({ type, onClose, onConnected }: IntegrationSetupModalProps) {
  const meta = CHANNEL_META[type];
  const restartGateway = useGatewayStore((s) => s.restart);

  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState('');

  const handleConnect = async () => {
    // Validate required fields
    for (const field of meta.configFields) {
      if (field.required && !credentials[field.key]?.trim()) {
        setError(`Please fill in: ${field.label}`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setStep(3);
    setSetupStatus('Installing integration package...');

    try {
      const result = await invokeIpc<{ success: boolean; error?: string }>(
        'integration:configure',
        { integrationId: type, credentials },
      );

      if (!result.success) {
        setError(result.error || 'Failed to configure integration');
        setStep(2); // back to credentials
        setLoading(false);
        return;
      }

      setSetupStatus('Restarting AI gateway...');
      try {
        await restartGateway();
      } catch {
        // Gateway restart can fail transiently — not fatal
      }

      setStep(4);
      onConnected();
    } catch (e) {
      setError(String(e));
      setStep(2);
    }
    setLoading(false);
  };

  const TOTAL_STEPS = 4;
  const name = CHANNEL_NAMES[type] || meta.name;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={step === 3 ? undefined : onClose}
    >
      <div style={{
        background: 'hsl(var(--card))', borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        border: '1px solid rgba(13,148,136,0.2)',
      }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — hide close button during step 3 (connecting) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: 'hsl(var(--foreground))',
              fontFamily: 'Space Grotesk, sans-serif', margin: 0,
            }}>
              Connect {name}
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
              {meta.description}
            </p>
          </div>
          {step !== 3 && (
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))',
              fontSize: 20, cursor: 'pointer', padding: 4,
            }}>&#x2715;</button>
          )}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step
                ? 'linear-gradient(135deg, #0d9488, #5eead4)'
                : 'hsl(var(--border))',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1: Instructions */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 12 }}>
              Before you start
            </h3>
            <div style={{ marginBottom: 20 }}>
              {meta.instructions.map((instruction, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 10,
                  fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(13,148,136,0.15)', color: '#14b8a6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {i + 1}
                  </span>
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
            {meta.docsUrl && (
              <button
                onClick={() => invokeIpc('shell:openExternal', meta.docsUrl)}
                style={{
                  width: '100%', padding: 10, borderRadius: 8,
                  border: '1px solid rgba(13,148,136,0.3)', background: 'transparent',
                  color: '#14b8a6', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  marginBottom: 12,
                }}
              >
                Open {name} docs &rarr;
              </button>
            )}
            <button onClick={() => setStep(2)} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              I have my credentials &rarr;
            </button>
          </div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>
              Enter your credentials
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
              Your keys are stored locally and never sent to our servers.
            </p>
            {meta.configFields.map((field) => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'hsl(var(--foreground))', marginBottom: 4,
                }}>
                  {field.label} {field.required && <span style={{ color: '#f87171' }}>*</span>}
                </label>
                {field.description && (
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
                    {field.description}
                  </div>
                )}
                <input
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={credentials[field.key] || ''}
                  onChange={(e) => {
                    setCredentials({ ...credentials, [field.key]: e.target.value });
                    setError(null);
                  }}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid rgba(13,148,136,0.3)',
                    background: 'rgba(0,0,0,0.2)', color: 'hsl(var(--foreground))',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    fontFamily: field.type === 'password' ? 'monospace' : 'inherit',
                  }}
                />
              </div>
            ))}
            {error && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{error}</p>}
            <button onClick={handleConnect} disabled={loading} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: loading ? 'rgba(13,148,136,0.3)' : 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              Save and Connect
            </button>
            <button onClick={() => { setStep(1); setError(null); }} style={{
              width: '100%', padding: 8, border: 'none', background: 'none',
              color: 'hsl(var(--muted-foreground))', fontSize: 12, cursor: 'pointer', marginTop: 8,
            }}>
              &larr; Back to instructions
            </button>
          </div>
        )}

        {/* Step 3: Connecting (spinner) */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, margin: '0 auto 16px',
              border: '3px solid rgba(13,148,136,0.3)', borderTop: '3px solid #0d9488',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 8 }}>
              Connecting {name}...
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
              {setupStatus || 'Setting up integration...'}
            </p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
            }}>
              &#x2713;
            </div>
            <h3 style={{
              fontSize: 20, fontWeight: 800, color: 'hsl(var(--foreground))',
              fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8,
            }}>
              {name} Connected!
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 24, lineHeight: 1.6 }}>
              Your agents now have access to {name} tools.
              Try asking an agent to interact with your {name} account.
            </p>
            <button onClick={onClose} style={{
              padding: '12px 32px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
