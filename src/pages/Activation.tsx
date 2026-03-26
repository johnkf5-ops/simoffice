/**
 * Activation Screen
 * Full-screen license key entry — no navigation, no sidebar
 */
import { useState } from 'react';
import { useLicenseStore } from '@/stores/license';

export function Activation() {
  const [key, setKey] = useState('');
  const activate = useLicenseStore((s) => s.activate);
  const checking = useLicenseStore((s) => s.checking);
  const error = useLicenseStore((s) => s.error);

  const handleActivate = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    await activate(trimmed);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'hsl(var(--background))',
      padding: 24,
    }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{
          fontSize: 36, fontWeight: 800,
          fontFamily: 'Space Grotesk, sans-serif',
          color: 'hsl(var(--foreground))',
          marginBottom: 8,
        }}>
          SimOffice
        </div>

        <p style={{
          fontSize: 15,
          color: 'hsl(var(--muted-foreground))',
          marginBottom: 32,
          lineHeight: 1.6,
        }}>
          Enter your license key to get started
        </p>

        {/* Key input */}
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleActivate(); }}
          placeholder="SO_a1b2c3d4e5f6..."
          autoFocus
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${error ? '#ef4444' : 'hsl(var(--border))'}`,
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 14,
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        />

        {/* Error */}
        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        {/* Activate button */}
        <button
          onClick={handleActivate}
          disabled={checking || !key.trim()}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 8,
            border: 'none',
            background: checking ? 'hsl(var(--muted))' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            cursor: checking ? 'wait' : 'pointer',
            marginTop: 16,
            transition: 'opacity 0.15s',
            opacity: !key.trim() ? 0.5 : 1,
          }}
        >
          {checking ? 'Verifying...' : 'Activate'}
        </button>

        {/* Links */}
        <div style={{
          marginTop: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 13,
          color: 'hsl(var(--muted-foreground))',
        }}>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.electron.openExternal('https://simoffice.xyz'); }}
            style={{ color: '#3b82f6', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          >
            Get SimOffice
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.electron.openExternal('https://simoffice.xyz/recover.html'); }}
            style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          >
            Lost your key?
          </a>
        </div>
      </div>
    </div>
  );
}
