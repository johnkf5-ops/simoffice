/**
 * SimOffice — The Lobby
 * Hero: 3D office with agents working
 * Below: What's New, feature highlights, quick actions
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentsStore } from '@/stores/agents';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import { OfficeAdapter } from '@/components/lobby/OfficeAdapter';

const WHATS_NEW = [
  {
    version: 'v1.3.0',
    title: 'MoonPay Trading Desk',
    description: 'Buy, sell, swap, and bridge crypto — just by talking. No commands to memorize.',
    icon: '💜',
    link: '/trading',
  },
  {
    version: 'v1.3.0',
    title: 'Team Chat Rooms',
    description: 'Create rooms with multiple agents. Use Team mode for group discussions or @mention for 1-on-1.',
    icon: '💬',
    link: '/chat',
  },
  {
    version: 'v1.3.0',
    title: 'Agent Customization',
    description: 'Upload custom avatars, pick colors, and rename your agents from the Assistants page.',
    icon: '🎨',
    link: '/assistants',
  },
];

const QUICK_ACTIONS = [
  { label: 'Chat with Agents', desc: 'Start a conversation', icon: '💬', path: '/chat' },
  { label: 'Trading Desk', desc: 'MoonPay crypto trading', icon: '📈', path: '/trading' },
  { label: 'Manage Team', desc: 'Add or edit agents', icon: '🤖', path: '/assistants' },
  { label: 'Connect Apps', desc: 'Slack, Discord, more', icon: '🔌', path: '/connections' },
];

export function Lobby() {
  const navigate = useNavigate();
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const agents = useAgentsStore((s) => s.agents);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <BuddyPanel hideBackButton currentPage="/" />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero: 3D Office */}
        <div style={{ height: '60vh', minHeight: 400, position: 'relative' }}>
          <OfficeAdapter />
          {/* Gradient fade at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            background: 'linear-gradient(transparent, hsl(var(--background)))',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Content below office */}
        <div style={{ padding: '0 40px 60px', maxWidth: 900, margin: '0 auto' }}>

          {/* Status line */}
          <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 24 }}>
            {agents.length} agent{agents.length !== 1 ? 's' : ''} online · Your office is running
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                style={{
                  padding: '16px 14px', borderRadius: 14, border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{a.desc}</div>
              </button>
            ))}
          </div>

          {/* What's New */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 14 }}>
              What's New
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {WHATS_NEW.map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.link)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                >
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{item.title}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '2px 6px', borderRadius: 4 }}>{item.version}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
