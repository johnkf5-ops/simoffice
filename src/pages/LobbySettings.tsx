/**
 * SimOffice Settings — Built from scratch. No ClawX UI.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settings';
import { useGatewayStore } from '@/stores/gateway';
import { useUpdateStore } from '@/stores/update';

export function LobbySettings() {
  const navigate = useNavigate();

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

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const handleRestart = async () => {
    setRestarting(true);
    try { await restartGateway(); } catch {}
    setTimeout(() => setRestarting(false), 2000);
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

          {/* Office */}
          <div style={sectionTitle}>Office</div>

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

          {/* Updates */}
          <div style={sectionTitle}>Updates</div>

          <div style={row}>
            <div>
              <div style={label}>Version {currentVersion}</div>
              <div style={desc}>
                {updateStatus === 'checking' ? 'Checking...' :
                 updateStatus === 'available' ? 'Update available!' :
                 updateStatus === 'downloaded' ? 'Ready to install' :
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
                Install & Restart
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
            </>
          )}

          {/* About */}
          <div style={sectionTitle}>About</div>
          <div style={{ padding: '14px 0', fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.8 }}>
            <strong style={{ color: 'hsl(var(--foreground))', fontSize: 15 }}>SimOffice</strong> · v{currentVersion}<br />
            Copyright © 2026 CrashOverride LLC. All rights reserved.<br />
            <span style={{ fontSize: 11, opacity: 0.6 }}>This software is proprietary. Unauthorized use, reproduction, or distribution is prohibited.</span>
          </div>

        </div>
      </div>
    </div>
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
