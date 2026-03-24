/**
 * SimOffice Connections — Built from scratch. No ClawX UI.
 * Dark buddy panel + connections management matching SimOffice design.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChannelsStore } from '@/stores/channels';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { useChatStore } from '@/stores/chat';
import { StatusDot } from '@/components/common/StatusDot';
import { ChannelConfigModal } from '@/components/channels/ChannelConfigModal';
import { ChannelSetupWizard, hasSetupWizard } from '@/components/channels/ChannelSetupWizard';
import { CHANNEL_NAMES, CHANNEL_ICONS, type ChannelType } from '@/types/channel';

const INTEGRATION_TYPES: { type: ChannelType; name: string; icon: string; description: string }[] = [
  { type: 'hubspot', name: 'HubSpot', icon: '🟠', description: 'CRM — contacts, deals, companies' },
  { type: 'pandadoc', name: 'PandaDoc', icon: '🐼', description: 'Proposals, contracts, e-signatures' },
  { type: 'slack', name: 'Slack', icon: '💬', description: 'Post updates, respond in channels' },
  { type: 'google_workspace', name: 'Google Workspace', icon: '📧', description: 'Gmail, Calendar, Drive' },
  { type: 'notion', name: 'Notion', icon: '📝', description: 'Pages, databases, project boards' },
  { type: 'github', name: 'GitHub', icon: '🐙', description: 'Repos, PRs, issues, deploys' },
  { type: 'jira', name: 'Jira', icon: '📋', description: 'Tickets, sprints, project tracking' },
  { type: 'stripe_integration', name: 'Stripe', icon: '💳', description: 'Revenue, invoices, subscriptions' },
  { type: 'zapier', name: 'Zapier', icon: '⚡', description: 'Connect 6,000+ apps via webhooks' },
];

const ALL_CHANNEL_TYPES: { type: ChannelType; name: string; icon: string; description: string }[] = [
  { type: 'whatsapp', name: 'WhatsApp', icon: '\uD83D\uDCF1', description: 'Connect via QR code scan' },
  { type: 'telegram', name: 'Telegram', icon: '\u2708\uFE0F', description: 'Bot token connection' },
  { type: 'discord', name: 'Discord', icon: '\uD83C\uDFAE', description: 'Bot token connection' },
  { type: 'signal', name: 'Signal', icon: '\uD83D\uDD12', description: 'Private messaging' },
  { type: 'imessage', name: 'iMessage', icon: '\uD83D\uDCAC', description: 'Apple Messages' },
  { type: 'msteams', name: 'Microsoft Teams', icon: '\uD83D\uDC54', description: 'Workplace messaging' },
  { type: 'googlechat', name: 'Google Chat', icon: '\uD83D\uDCAD', description: 'Google workspace' },
  { type: 'matrix', name: 'Matrix', icon: '\uD83D\uDD17', description: 'Open protocol messaging' },
  { type: 'line', name: 'LINE', icon: '\uD83D\uDFE2', description: 'LINE messaging' },
  { type: 'mattermost', name: 'Mattermost', icon: '\uD83D\uDCA0', description: 'Open-source chat' },
  { type: 'dingtalk', name: 'DingTalk', icon: '\uD83D\uDCAC', description: 'Business messaging' },
  { type: 'feishu', name: 'Feishu / Lark', icon: '\uD83D\uDC26', description: 'Lark messaging' },
  { type: 'wecom', name: 'WeCom', icon: '\uD83D\uDCBC', description: 'Enterprise WeChat' },
  { type: 'qqbot', name: 'QQ Bot', icon: '\uD83D\uDC27', description: 'QQ messaging' },
];

const STATUS_COLORS: Record<string, string> = {
  connected: '#34d399',
  connecting: '#fbbf24',
  disconnected: '#94a3b8',
  error: '#f87171',
};

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',
  error: 'Error',
};

export function LobbyConnections() {
  const navigate = useNavigate();
  const channels = useChannelsStore((s) => s.channels);
  const loading = useChannelsStore((s) => s.loading);
  const fetchChannels = useChannelsStore((s) => s.fetchChannels);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);

  /* Modal state */
  const [configModalType, setConfigModalType] = useState<ChannelType | null>(null);
  const [wizardType, setWizardType] = useState<ChannelType | null>(null);

  useEffect(() => { void fetchChannels(); void fetchAgents(); }, [fetchChannels, fetchAgents]);

  // Which channel types are already connected
  const connectedTypes = new Set(channels.map((c) => c.type));
  const configuredTypesList = channels.map((c) => c.type);

  const handleChannelClick = (channelType: ChannelType) => {
    if (hasSetupWizard(channelType)) {
      setWizardType(channelType);
    } else {
      setConfigModalType(channelType);
    }
  };

  const handleModalClose = () => {
    setConfigModalType(null);
  };

  const handleChannelSaved = async () => {
    await fetchChannels();
    setConfigModalType(null);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* === BUDDY PANEL === */}
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
            &larr; <span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lobby</span>
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

      {/* === CONTENT AREA === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Section Header */}
        <div style={{
          padding: '32px 40px 24px 40px',
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)',
        }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            &larr; Back to Lobby
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Connections
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
            Connect your favorite apps
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px 40px' }}>

          {/* Active Connections */}
          {channels.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                Active Connections
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {channels.map((channel) => (
                  <div key={channel.id}
                    onClick={() => handleChannelClick(channel.type)}
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 16,
                      padding: 20,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'box-shadow 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(13,148,136,0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #0d9488, #5eead4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, flexShrink: 0,
                    }}>
                      {CHANNEL_ICONS[channel.type] || '\uD83D\uDCE1'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {channel.name || CHANNEL_NAMES[channel.type] || channel.type}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: STATUS_COLORS[channel.status] || '#94a3b8',
                        }} />
                        <span style={{ fontSize: 12, color: STATUS_COLORS[channel.status] || '#94a3b8', fontWeight: 500 }}>
                          {STATUS_LABELS[channel.status] || channel.status}
                        </span>
                      </div>
                      {channel.error && (
                        <div style={{ fontSize: 11, color: '#f87171', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {channel.error}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: '#0d9488',
                      background: 'rgba(13,148,136,0.1)', padding: '4px 10px', borderRadius: 6,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {CHANNEL_NAMES[channel.type] || channel.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && channels.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))' }}>
              Loading connections...
            </div>
          )}

          {/* Business Integrations */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 6 }}>
              Business Integrations
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
              Connect business tools so your agents can manage CRM, docs, and more
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
              {INTEGRATION_TYPES.map((ch) => {
                const isConnected = connectedTypes.has(ch.type);
                return (
                  <div key={ch.type}
                    onClick={() => handleChannelClick(ch.type)}
                    style={{
                      background: isConnected ? 'rgba(13,148,136,0.06)' : 'hsl(var(--card))',
                      border: `1px solid ${isConnected ? 'rgba(13,148,136,0.3)' : 'hsl(var(--border))'}`,
                      borderRadius: 12,
                      padding: '16px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = isConnected ? 'rgba(13,148,136,0.3)' : 'hsl(var(--border))'; }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{ch.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{ch.name}</div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{ch.description}</div>
                    {isConnected && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>● Connected</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Messaging Apps */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 6 }}>
              Messaging Apps
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
              Connect messaging apps so your agents can chat with people
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {ALL_CHANNEL_TYPES.map((ch) => {
                const isConnected = connectedTypes.has(ch.type);
                return (
                  <div key={ch.type}
                    onClick={() => handleChannelClick(ch.type)}
                    style={{
                      background: isConnected ? 'rgba(13,148,136,0.06)' : 'hsl(var(--card))',
                      border: `1px solid ${isConnected ? 'rgba(13,148,136,0.3)' : 'hsl(var(--border))'}`,
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: isConnected ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isConnected) {
                        e.currentTarget.style.borderColor = '#0d9488';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,148,136,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isConnected) {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{ch.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                        {ch.name}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
                      {isConnected ? 'Already connected' : ch.description}
                    </div>
                    {isConnected && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#34d399' }}>CONNECTED</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* === Channel Config Modal === */}
      {configModalType && (
        <ChannelConfigModal
          initialSelectedType={configModalType}
          configuredTypes={configuredTypesList}
          onClose={handleModalClose}
          onChannelSaved={handleChannelSaved}
        />
      )}

      {/* === Setup Wizard Modal === */}
      {wizardType && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setWizardType(null)}
        >
          <div style={{
            background: 'hsl(var(--card))', borderRadius: 20, padding: '8px 32px 32px',
            width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <ChannelSetupWizard
              channelType={wizardType}
              onTokenSubmit={(token) => {
                // After token is submitted, open the config modal with the token pre-filled
                setWizardType(null);
                setConfigModalType(wizardType);
              }}
              onComplete={() => {
                setWizardType(null);
                void fetchChannels();
              }}
              onBack={() => setWizardType(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
