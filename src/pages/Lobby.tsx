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
    version: 'v2.0.4',
    title: 'Agentic Trading — Powered by MoonPay',
    description: 'Buy, sell, swap, and bridge crypto just by talking. Your AI agent handles the MoonPay CLI so you don\'t have to. No commands, no complexity.',
    icon: '🟣',
    link: '/trading',
    featured: true,
  },
  {
    version: 'v2.0.4',
    title: 'Team Chat Rooms',
    description: 'Create rooms with multiple agents. Team mode lets all agents respond in sequence. @Mention mode targets one agent. Same feed, no switching.',
    icon: '💬',
    link: '/chat',
  },
  {
    version: 'v2.0.4',
    title: 'Agent Customization',
    description: 'Upload custom avatars, pick colors, and rename your agents. Make your team yours.',
    icon: '🎨',
    link: '/assistants',
  },
  {
    version: 'v2.0.4',
    title: 'Dark & Light Mode',
    description: 'Full theme support across the entire app. Custom toolbar icons with glow effects. Switch in Settings.',
    icon: '🌗',
    link: '/settings',
  },
  {
    version: 'v2.0.4',
    title: '211 Pre-Built Agents',
    description: 'Browse the agent catalog — 28 categories from crypto trading to content creation. One click to add to your team.',
    icon: '🤖',
    link: '/assistants',
  },
  {
    version: 'v2.0.4',
    title: 'Redesigned Interface',
    description: 'New toolbar with custom icons, buddy list sidebar, inline rename for rooms and conversations, delete buttons everywhere.',
    icon: '✨',
    link: '/',
  },
  {
    version: 'v1.2',
    title: 'Local AI — Run Models on Your Mac',
    description: 'One-click Ollama setup. Run AI completely offline on your hardware. No API keys, no monthly fees, 100% private.',
    icon: '🖥️',
    link: '/ai-setup',
  },
  {
    version: 'v1.2',
    title: 'Smart Hardware Detection',
    description: 'Automatically detects your RAM and Apple Silicon. Recommends the best local model for your machine — no guesswork.',
    icon: '⚡',
    link: '/ai-setup',
  },
  {
    version: 'v1.2',
    title: 'Multi-Provider Support',
    description: 'Connect to Anthropic, OpenAI, Google, xAI, or run local. Switch providers anytime from the Brain page.',
    icon: '🧠',
    link: '/ai-setup',
  },
  {
    version: 'v1.2',
    title: '19 Career Templates',
    description: 'Pick your profession during onboarding — we build your AI team automatically. From crypto trading to content creation.',
    icon: '🎯',
    link: '/assistants',
  },
];

const QUICK_ACTIONS = [
  { label: 'Trading Desk', desc: 'Crypto powered by MoonPay', icon: '🟣', path: '/trading' },
  { label: 'Chat with Agents', desc: 'Team or 1-on-1', icon: '💬', path: '/chat' },
  { label: 'Manage Team', desc: 'Add, edit, customize', icon: '🤖', path: '/assistants' },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
                What's New in v2.0
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, color: 'white', padding: '3px 10px', borderRadius: 20,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                letterSpacing: '0.05em',
              }}>
                NEW
              </span>
            </div>

            {/* Featured item — MoonPay */}
            {WHATS_NEW.filter(i => i.featured).map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.link)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 18,
                  padding: '20px 22px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                  border: '1px solid rgba(124,58,237,0.3)',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(168,85,247,0.04))',
                  boxShadow: '0 0 24px rgba(124,58,237,0.08)',
                  transition: 'all 0.2s', marginBottom: 16,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 36, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>{item.title}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '2px 8px', borderRadius: 4 }}>{item.version}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4, lineHeight: 1.5 }}>{item.description}</div>
                </div>
              </button>
            ))}

            {/* Other features */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {WHATS_NEW.filter(i => !i.featured).map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.link)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px', borderRadius: 12, border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2, lineHeight: 1.4 }}>{item.description}</div>
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
