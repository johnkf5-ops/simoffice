/**
 * MoonPay Setup Wizard — fully in-app, no terminal needed.
 * Step 1: Enter email → sends OTP via mp login
 * Step 2: Enter OTP code → verifies via mp verify
 * Step 3: Connected
 */
import { useState, useEffect, useCallback } from 'react';
import { invokeIpc } from '@/lib/api-client';

interface MoonPaySetupModalProps {
  onClose: () => void;
  onConnected?: () => void;
}

export function MoonPaySetupModal({ onClose, onConnected }: MoonPaySetupModalProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated on mount
  const checkAuth = useCallback(async () => {
    try {
      const result = await invokeIpc<{ authenticated: boolean }>('moonpay:check-auth');
      if (result.authenticated) {
        setStep(3);
        onConnected?.();
      }
    } catch { /* not authenticated */ }
  }, [onConnected]);

  useEffect(() => { void checkAuth(); }, [checkAuth]);

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await invokeIpc<{ success: boolean; error?: string }>('moonpay:login', { email: email.trim() });
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Enter the code from your email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await invokeIpc<{ success: boolean; error?: string }>('moonpay:verify', { email: email.trim(), code: code.trim() });
      if (result.success) {
        setStep(3);
        onConnected?.();
      } else {
        setError(result.error || 'Invalid code. Check your email and try again.');
      }
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={onClose}
    >
      <div style={{
        background: 'hsl(var(--card))', borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 440,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        border: '1px solid rgba(123,63,228,0.2)',
      }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
              🟣 Connect MoonPay
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
              Crypto swaps, on-ramps, and DCA for your agents
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))',
            fontSize: 20, cursor: 'pointer', padding: 4,
          }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step
                ? 'linear-gradient(135deg, #7B3FE4, #a78bfa)'
                : 'hsl(var(--border))',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1: Enter email */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>
              Sign in to MoonPay
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
              We'll send a verification code to your email
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              placeholder="you@example.com"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: error ? '1px solid #f87171' : '1px solid rgba(123,63,228,0.3)',
                background: 'rgba(0,0,0,0.2)', color: 'hsl(var(--foreground))',
                fontSize: 14, outline: 'none', marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{error}</p>
            )}
            <button onClick={handleSendCode} disabled={loading} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: loading ? 'rgba(123,63,228,0.3)' : 'linear-gradient(135deg, #7B3FE4, #a855f7)',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>
            <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 10, textAlign: 'center' }}>
              Don't have an account? One will be created automatically.
            </p>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>
              Check your email
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
              Enter the code we sent to <strong style={{ color: '#c4b5fd' }}>{email}</strong>
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="123456"
              autoFocus
              maxLength={8}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: error ? '1px solid #f87171' : '1px solid rgba(123,63,228,0.3)',
                background: 'rgba(0,0,0,0.2)', color: 'hsl(var(--foreground))',
                fontSize: 20, fontWeight: 700, letterSpacing: '0.2em', textAlign: 'center',
                outline: 'none', marginBottom: 12,
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{error}</p>
            )}
            <button onClick={handleVerify} disabled={loading} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: loading ? 'rgba(123,63,228,0.3)' : 'linear-gradient(135deg, #7B3FE4, #a855f7)',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button onClick={() => { setStep(1); setCode(''); setError(null); }} style={{
              width: '100%', padding: 8, borderRadius: 8, border: 'none',
              background: 'none', color: 'hsl(var(--muted-foreground))',
              fontSize: 12, cursor: 'pointer', marginTop: 8,
            }}>
              ← Use a different email
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>
              MoonPay Connected
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 24 }}>
              Your agents can now execute crypto swaps, purchases, and bridges.
            </p>
            <button onClick={onClose} style={{
              padding: '12px 32px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #7B3FE4, #a855f7)',
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
