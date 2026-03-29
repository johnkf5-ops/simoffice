/**
 * SimOffice Settings — Built from scratch. No ClawX UI.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settings';
import { useGatewayStore } from '@/stores/gateway';
import { useUpdateStore } from '@/stores/update';
import { useLicenseStore, type LicenseStatus } from '@/stores/license';

export function LobbySettings() {
  const navigate = useNavigate();

  const displayName = useSettingsStore((s) => s.displayName);
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const businessName = useSettingsStore((s) => s.businessName);
  const setBusinessName = useSettingsStore((s) => s.setBusinessName);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const launchAtStartup = useSettingsStore((s) => s.launchAtStartup);
  const setLaunchAtStartup = useSettingsStore((s) => s.setLaunchAtStartup);
  const gatewayAutoStart = useSettingsStore((s) => s.gatewayAutoStart);
  const setGatewayAutoStart = useSettingsStore((s) => s.setGatewayAutoStart);
  const devModeUnlocked = useSettingsStore((s) => s.devModeUnlocked);
  const setDevModeUnlocked = useSettingsStore((s) => s.setDevModeUnlocked);
  const telemetryEnabled = useSettingsStore((s) => s.telemetryEnabled);
  const setTelemetryEnabled = useSettingsStore((s) => s.setTelemetryEnabled);
  const proxyEnabled = useSettingsStore((s) => s.proxyEnabled);
  const setProxyEnabled = useSettingsStore((s) => s.setProxyEnabled);
  const proxyServer = useSettingsStore((s) => s.proxyServer);
  const setProxyServer = useSettingsStore((s) => s.setProxyServer);

  const gatewayStatus = useGatewayStore((s) => s.status);
  const restartGateway = useGatewayStore((s) => s.restart);
  const isOnline = gatewayStatus.state === 'running';

  const rawVersion = useUpdateStore((s) => s.currentVersion);
  const currentVersion = rawVersion && rawVersion !== '0.0.0' ? rawVersion : __APP_VERSION__;
  const updateStatus = useUpdateStore((s) => s.status);
  const checkForUpdates = useUpdateStore((s) => s.checkForUpdates);
  const downloadUpdate = useUpdateStore((s) => s.downloadUpdate);
  const installUpdate = useUpdateStore((s) => s.installUpdate);
  const setAutoDownload = useUpdateStore((s) => s.setAutoDownload);
  const autoDownloadUpdate = useSettingsStore((s) => s.autoDownloadUpdate);
  const setAutoDownloadUpdate = useSettingsStore((s) => s.setAutoDownloadUpdate);

  const licenseKey = useLicenseStore((s) => s.key);
  const licenseStatus = useLicenseStore((s) => s.status);
  const licenseEmail = useLicenseStore((s) => s.email);
  const licenseValidUntil = useLicenseStore((s) => s.validUntil);
  const openPortal = useLicenseStore((s) => s.openPortal);
  const deactivate = useLicenseStore((s) => s.deactivate);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(false);

  const handleRestart = async () => {
    setRestarting(true);
    try { await restartGateway(); } catch {}
    setTimeout(() => setRestarting(false), 2000);
  };

  useEffect(() => {
    window.electron.ipcRenderer.invoke('memory:status')
      .then((result) => setMemoryEnabled((result as { enabled: boolean })?.enabled ?? false))
      .catch(() => {});
  }, []);

  const handleMemoryToggle = async (on: boolean) => {
    // Show confirmation when enabling — memory injects context into every turn,
    // which increases token usage for paid API providers.
    if (on) {
      const confirmed = window.confirm(
        'Agent memory adds extra context to each message. If you use a paid AI provider, this may slightly increase costs.\n\nEnable agent memory?'
      );
      if (!confirmed) return;
    }
    setMemoryEnabled(on);
    try {
      const result = await window.electron.ipcRenderer.invoke(on ? 'memory:enable' : 'memory:disable') as { success?: boolean; error?: string };
      if (!result?.success) throw new Error(result?.error || 'Unknown error');
    } catch {
      setMemoryEnabled(!on); // revert on failure
    }
  };

  // Styles
  const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid hsl(var(--border))' };
  const label: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' };
  const desc: React.CSSProperties = { fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 };
  const sectionTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginTop: 32, marginBottom: 8 };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
        {/* Header */}
        <div style={{ padding: '32px 40px 24px', background: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>Customize your experience</p>
        </div>

        {/* Settings list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 40px 40px' }}>

          {/* Profile */}
          <div style={sectionTitle}>Profile</div>

          <div style={row}>
            <div>
              <div style={label}>Your Name</div>
              <div style={desc}>How your AI agents address you. Restart the app for changes to take effect.</div>
            </div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John"
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 13,
                width: 200, outline: 'none',
              }}
            />
          </div>

          <div style={row}>
            <div>
              <div style={label}>Office Name</div>
              <div style={desc}>Shown at the top of your 3D office</div>
            </div>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 13,
                width: 200, outline: 'none',
              }}
            />
          </div>

          {/* Look & Feel */}
          <div style={sectionTitle}>Look & Feel</div>

          <div style={row}>
            <div>
              <div style={label}>Theme</div>
              <div style={desc}>Choose light, dark, or match your system</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['light', 'dark', 'system'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: theme === t ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'hsl(var(--muted))',
                  color: theme === t ? 'white' : 'hsl(var(--foreground))',
                  fontSize: 13, fontWeight: 600,
                }}>
                  {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '🖥️ Auto'}
                </button>
              ))}
            </div>
          </div>

          <div style={row}>
            <div>
              <div style={label}>Language</div>
              <div style={desc}>Choose your preferred language</div>
            </div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer',
            }}>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          {/* Startup */}
          <div style={sectionTitle}>Startup</div>

          <div style={row}>
            <div>
              <div style={label}>Launch when computer starts</div>
              <div style={desc}>Automatically open SimOffice on login</div>
            </div>
            <Toggle on={launchAtStartup} onChange={setLaunchAtStartup} />
          </div>

          <div style={row}>
            <div>
              <div style={label}>Start engine automatically</div>
              <div style={desc}>Connect to AI when the app opens</div>
            </div>
            <Toggle on={gatewayAutoStart} onChange={setGatewayAutoStart} />
          </div>

          {/* Engine */}
          <div style={sectionTitle}>Engine</div>

          <div style={row}>
            <div>
              <div style={label}>Status</div>
              <div style={desc}>
                <span style={{ color: isOnline ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {isOnline ? '● Running' : '● Stopped'}
                </span>
                {' · Port ' + (gatewayStatus.port || 18789)}
              </div>
            </div>
            <button onClick={handleRestart} disabled={restarting} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
              fontSize: 13, fontWeight: 600, cursor: restarting ? 'default' : 'pointer',
              opacity: restarting ? 0.5 : 1,
            }}>
              {restarting ? 'Restarting...' : 'Restart Engine'}
            </button>
          </div>

          {/* Agent Memory */}
          <div style={sectionTitle}>Agent Memory</div>

          <div style={row}>
            <div>
              <div style={label}>Enable memory</div>
              <div style={desc}>Give agents persistent memory across sessions</div>
            </div>
            <Toggle on={memoryEnabled} onChange={handleMemoryToggle} />
          </div>

          {/* Updates */}
          <div style={sectionTitle}>Updates</div>

          <div style={row}>
            <div>
              <div style={label}>Version {currentVersion}</div>
              <div style={desc}>
                {updateStatus === 'checking' ? 'Checking...' :
                 updateStatus === 'available' ? 'Update available!' :
                 updateStatus === 'downloaded' ? 'Update ready' :
                 updateStatus === 'not-available' ? 'Up to date' :
                 updateStatus === 'error' ? 'Check failed' : ''}
              </div>
            </div>
            {updateStatus === 'available' ? (
              <button onClick={() => downloadUpdate()} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #d97706, #fbbf24)', color: 'white',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                Download Update
              </button>
            ) : updateStatus === 'downloaded' ? (
              <button onClick={() => installUpdate()} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                Open Update
              </button>
            ) : (
              <button onClick={() => checkForUpdates()} disabled={updateStatus === 'checking' || updateStatus === 'downloading'} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
                fontSize: 13, fontWeight: 600, cursor: updateStatus === 'checking' || updateStatus === 'downloading' ? 'default' : 'pointer',
                opacity: updateStatus === 'checking' || updateStatus === 'downloading' ? 0.5 : 1,
              }}>
                {updateStatus === 'checking' ? 'Checking...' : updateStatus === 'downloading' ? 'Downloading...' : 'Check for Updates'}
              </button>
            )}
          </div>

          <div style={row}>
            <div>
              <div style={label}>Auto-update</div>
              <div style={desc}>Automatically download and install updates</div>
            </div>
            <button
              onClick={() => {
                const next = !autoDownloadUpdate;
                setAutoDownloadUpdate(next);
                void setAutoDownload(next);
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: autoDownloadUpdate ? '#22c55e' : 'hsl(var(--muted))',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 9,
                background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                position: 'absolute', top: 3,
                left: autoDownloadUpdate ? 23 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Subscription */}
          <div style={sectionTitle}>Subscription</div>

          <div style={row}>
            <div>
              <div style={label}>Status</div>
              <div style={desc}>Your current subscription status</div>
            </div>
            <StatusBadge status={licenseStatus} />
          </div>

          {licenseEmail && (
            <div style={row}>
              <div>
                <div style={label}>Email</div>
                <div style={desc}>{licenseEmail}</div>
              </div>
            </div>
          )}

          {licenseValidUntil && licenseValidUntil > 0 && (
            <div style={row}>
              <div>
                <div style={label}>{licenseStatus === 'trialing' ? 'Trial ends' : licenseStatus === 'canceling' ? 'Access until' : 'Next renewal'}</div>
                <div style={desc}>{new Date(licenseValidUntil * 1000).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {licenseKey && (
            <div style={row}>
              <div>
                <div style={label}>License Key</div>
                <div style={desc}>
                  <code style={{ fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>
                    {licenseKey.slice(0, 10)}{'····'}{licenseKey.slice(-4)}
                  </code>
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(licenseKey)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={openPortal}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                fontSize: 13, fontWeight: 600,
              }}
            >
              Manage Subscription
            </button>
            <button
              onClick={deactivate}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                background: 'transparent', color: 'hsl(var(--muted-foreground))',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Deactivate This Device
            </button>
          </div>

          {/* Advanced */}
          <div style={{ ...sectionTitle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setAdvancedOpen(!advancedOpen)}>
            Advanced {advancedOpen ? '▲' : '▼'}
          </div>

          {advancedOpen && (
            <>
              <div style={row}>
                <div>
                  <div style={label}>Developer mode</div>
                  <div style={desc}>Show advanced options and diagnostics</div>
                </div>
                <Toggle on={devModeUnlocked} onChange={setDevModeUnlocked} />
              </div>

              <div style={row}>
                <div>
                  <div style={label}>Telemetry</div>
                  <div style={desc}>Help improve SimOffice with anonymous usage data</div>
                </div>
                <Toggle on={telemetryEnabled} onChange={setTelemetryEnabled} />
              </div>

              <div style={row}>
                <div>
                  <div style={label}>Proxy</div>
                  <div style={desc}>Route traffic through a proxy server</div>
                </div>
                <Toggle on={proxyEnabled} onChange={setProxyEnabled} />
              </div>

              {proxyEnabled && (
                <div style={row}>
                  <div>
                    <div style={label}>Proxy server</div>
                    <div style={desc}>e.g. http://proxy.example.com:8080</div>
                  </div>
                  <input value={proxyServer} onChange={(e) => setProxyServer(e.target.value)}
                    placeholder="http://proxy:8080"
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
                      fontSize: 13, width: 240,
                    }}
                  />
                </div>
              )}

              <div style={row}>
                <div>
                  <div style={label}>OpenClaw Controls</div>
                  <div style={desc}>Session management, reset policies, maintenance settings</div>
                </div>
                <button onClick={() => navigate('/settings/openclaw-controls')} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  Open
                </button>
              </div>
            </>
          )}

          {/* About */}
          <div style={sectionTitle}>About</div>
          <div style={{ padding: '14px 0', fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.8 }}>
            <strong style={{ color: 'hsl(var(--foreground))', fontSize: 15 }}>SimOffice</strong> · v{currentVersion}<br />
            Copyright © 2026 CrashOverride LLC. All rights reserved.<br />
            <span style={{ fontSize: 11, opacity: 0.6 }}>This software is proprietary. Unauthorized use, reproduction, or distribution is prohibited.</span><br />
            <a href="#" onClick={(e) => { e.preventDefault(); window.electron?.ipcRenderer.invoke('shell:openExternal', 'https://simoffice.xyz/notices.html'); }} style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textDecoration: 'underline', opacity: 0.7 }}>Open Source Notices</a>
            {' · '}
            <a href="#" onClick={(e) => { e.preventDefault(); window.electron?.ipcRenderer.invoke('shell:openExternal', 'https://simoffice.xyz/terms.html'); }} style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textDecoration: 'underline', opacity: 0.7 }}>Terms</a>
            {' · '}
            <a href="#" onClick={(e) => { e.preventDefault(); window.electron?.ipcRenderer.invoke('shell:openExternal', 'https://simoffice.xyz/privacy.html'); }} style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textDecoration: 'underline', opacity: 0.7 }}>Privacy</a>
          </div>

        </div>
      </div>
    </div>
  );
}

/* Subscription status badge */
function StatusBadge({ status }: { status: LicenseStatus }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    active: { label: 'Active', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    valid: { label: 'Active', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    trialing: { label: 'Trial', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    past_due: { label: 'Past Due', bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
    canceling: { label: 'Canceling', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    expired: { label: 'Expired', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    invalid: { label: 'Not Activated', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    loading: { label: 'Checking...', bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  };
  const c = config[status] || config.loading;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {c.label}
    </span>
  );
}

/* Simple toggle */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'hsl(var(--muted))',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: on ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}
