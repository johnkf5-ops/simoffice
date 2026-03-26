/**
 * SimOffice Connections — Built from scratch. No ClawX UI.
 * Dark buddy panel + connections management matching SimOffice design.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChannelsStore } from '@/stores/channels';
import { ChannelConfigModal } from '@/components/channels/ChannelConfigModal';
import { ChannelSetupWizard, hasSetupWizard } from '@/components/channels/ChannelSetupWizard';
import { CHANNEL_NAMES, CHANNEL_ICONS, type ChannelType } from '@/types/channel';
import { MoonPaySetupModal } from '@/components/moonpay/MoonPaySetupModal';
import { invokeIpc } from '@/lib/api-client';
import { BuddyPanel } from '@/components/common/BuddyPanel';

const INTEGRATION_TYPES: { type: ChannelType; name: string; icon: string; description: string }[] = [
  { type: 'hubspot', name: 'HubSpot', icon: '🟠', description: 'CRM — contacts, deals, companies' },
  { type: 'pandadoc', name: 'PandaDoc', icon: '🐼', description: 'Proposals, contracts, e-signatures' },
  { type: 'google_workspace', name: 'Google Workspace', icon: '📧', description: 'Gmail, Calendar, Drive' },
  { type: 'notion', name: 'Notion', icon: '📝', description: 'Pages, databases, project boards' },
  { type: 'github', name: 'GitHub', icon: '🐙', description: 'Repos, PRs, issues, deploys' },
  { type: 'jira', name: 'Jira', icon: '📋', description: 'Tickets, sprints, project tracking' },
  { type: 'stripe_integration', name: 'Stripe', icon: '💳', description: 'Revenue, invoices, subscriptions' },
  { type: 'zapier', name: 'Zapier', icon: '⚡', description: 'Connect 6,000+ apps via webhooks' },
  { type: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'Leads, opportunities, accounts' },
  { type: 'mailchimp', name: 'Mailchimp', icon: '🐵', description: 'Email campaigns, audiences' },
  { type: 'sendgrid', name: 'SendGrid', icon: '📨', description: 'Transactional email, templates' },
  { type: 'calendly', name: 'Calendly', icon: '📅', description: 'Scheduling, events, availability' },
  { type: 'intercom', name: 'Intercom', icon: '💬', description: 'Customer chat, conversations' },
  { type: 'gitlab', name: 'GitLab', icon: '🦊', description: 'Repos, merge requests, CI/CD' },
  { type: 'linear', name: 'Linear', icon: '🔷', description: 'Issue tracking, projects, cycles' },
  { type: 'sentry', name: 'Sentry', icon: '🛡️', description: 'Error tracking, alerts, releases' },
  { type: 'datadog', name: 'Datadog', icon: '🐕', description: 'Metrics, monitors, dashboards' },
  { type: 'vercel', name: 'Vercel', icon: '▲', description: 'Deployments, domains, projects' },
  { type: 'airtable', name: 'Airtable', icon: '📊', description: 'Bases, tables, records' },
  { type: 'monday', name: 'Monday.com', icon: '🟣', description: 'Boards, items, project management' },
  { type: 'asana', name: 'Asana', icon: '🔺', description: 'Tasks, projects, workspaces' },
  { type: 'trello', name: 'Trello', icon: '📌', description: 'Boards, cards, lists' },
  { type: 'confluence', name: 'Confluence', icon: '📘', description: 'Pages, spaces, team wiki' },
  { type: 'quickbooks', name: 'QuickBooks', icon: '💰', description: 'Invoices, expenses, reports' },
  { type: 'docusign', name: 'DocuSign', icon: '✍️', description: 'Envelopes, signatures, templates' },
  { type: 'xero', name: 'Xero', icon: '📗', description: 'Invoices, contacts, bank transactions' },
  { type: 'twilio', name: 'Twilio', icon: '📞', description: 'SMS, voice calls, phone numbers' },
  { type: 'zendesk', name: 'Zendesk', icon: '🎧', description: 'Support tickets, users, orgs' },
];

const ALL_CHANNEL_TYPES: { type: ChannelType; name: string; icon: string; description: string; popular?: boolean }[] = [
  { type: 'telegram', name: 'Telegram', icon: '✈️', description: 'Bot token connection', popular: true },
  { type: 'imessage', name: 'iMessage', icon: '💬', description: 'Apple Messages', popular: true },
  { type: 'discord', name: 'Discord', icon: '🎮', description: 'Bot token connection', popular: true },
  { type: 'slack', name: 'Slack', icon: '💬', description: 'Post updates, respond in channels', popular: true },
  { type: 'whatsapp', name: 'WhatsApp', icon: '📱', description: 'Linked Devices connection' },
  { type: 'signal', name: 'Signal', icon: '🔒', description: 'Private messaging' },
  { type: 'msteams', name: 'Microsoft Teams', icon: '👔', description: 'Workplace messaging' },
  { type: 'googlechat', name: 'Google Chat', icon: '💭', description: 'Google workspace' },
  { type: 'matrix', name: 'Matrix', icon: '🔗', description: 'Open protocol messaging' },
  { type: 'line', name: 'LINE', icon: '🟢', description: 'LINE messaging' },
  { type: 'mattermost', name: 'Mattermost', icon: '💠', description: 'Open-source chat' },
  { type: 'dingtalk', name: 'DingTalk', icon: '💬', description: 'Business messaging' },
  { type: 'feishu', name: 'Feishu / Lark', icon: '🐦', description: 'Lark messaging' },
  { type: 'wecom', name: 'WeCom', icon: '💼', description: 'Enterprise WeChat' },
  { type: 'qqbot', name: 'QQ Bot', icon: '🐧', description: 'QQ messaging' },
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

  /* Modal state */
  const [configModalType, setConfigModalType] = useState<ChannelType | null>(null);
  const [wizardType, setWizardType] = useState<ChannelType | null>(null);
  const [showMoonPaySetup, setShowMoonPaySetup] = useState(false);
  const [moonPayConnected, setMoonPayConnected] = useState(false);

  useEffect(() => { void fetchChannels(); }, [fetchChannels]);

  // Check MoonPay connection on mount
  useEffect(() => {
    invokeIpc<{ authenticated: boolean }>('moonpay:check-auth')
      .then((r) => setMoonPayConnected(r.authenticated))
      .catch(() => {});
  }, []);

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
      <BuddyPanel currentPage="/connections" />

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

          {/* Partners — MoonPay at the very top */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 6 }}>
              Partners
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
              Premium integrations from our partners
            </p>
            <div
              onClick={() => setShowMoonPaySetup(true)}
              style={{
                background: moonPayConnected ? 'rgba(123,63,228,0.06)' : 'hsl(var(--card))',
                border: `2px solid ${moonPayConnected ? 'rgba(123,63,228,0.4)' : 'rgba(123,63,228,0.2)'}`,
                borderRadius: 16, padding: 20,
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 0 20px rgba(123,63,228,0.08)',
                maxWidth: 480,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(123,63,228,0.6)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(123,63,228,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = moonPayConnected ? 'rgba(123,63,228,0.4)' : 'rgba(123,63,228,0.2)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(123,63,228,0.08)'; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #7B3FE4, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🟣</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>MoonPay</div>
                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Buy, sell, and trade crypto with your AI agents. No experience needed.</div>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: 8, background: moonPayConnected ? 'rgba(34,211,153,0.1)' : 'linear-gradient(135deg, #7B3FE4, #a855f7)', color: moonPayConnected ? '#34d399' : 'white', fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                {moonPayConnected ? 'Connected' : 'Connect →'}
              </div>
            </div>
          </div>

          {/* Messaging Apps */}
          <div style={{ marginBottom: 32 }}>
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
                      border: `1px solid ${isConnected ? 'rgba(13,148,136,0.3)' : ch.popular ? 'rgba(124,58,237,0.2)' : 'hsl(var(--border))'}`,
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,58,237,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = isConnected ? 'rgba(13,148,136,0.3)' : ch.popular ? 'rgba(124,58,237,0.2)' : 'hsl(var(--border))'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {ch.popular && !isConnected && (
                      <div style={{
                        position: 'absolute', top: -6, right: 12,
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: 'white', fontSize: 8, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        Popular
                      </div>
                    )}
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

        </div>
      </div>

      {/* === MoonPay Setup Modal === */}
      {showMoonPaySetup && (
        <MoonPaySetupModal
          onClose={() => setShowMoonPaySetup(false)}
          onConnected={() => setMoonPayConnected(true)}
        />
      )}

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
