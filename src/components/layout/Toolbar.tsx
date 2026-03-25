/**
 * SimOffice Toolbar — Dark mode, custom icons, glow effect on active.
 * Matches the toolbar mockup design.
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useGatewayStore } from '@/stores/gateway';
import { StatusDot } from '@/components/common/StatusDot';

const TOOLBAR_ITEMS = [
  { icon: '/toolbar/office.png', label: 'Office', path: '/' },
  { icon: '/toolbar/chat.png', label: 'Chat', path: '/chat' },
  { icon: '/toolbar/assistants.png', label: 'Assistants', path: '/assistants' },
  { icon: '/toolbar/connections.png', label: 'Connections', path: '/connections' },
  { icon: '/toolbar/skills.png', label: 'Skills', path: '/powers' },
  { icon: '/toolbar/automations.png', label: 'Automations', path: '/automations' },
  { icon: '/toolbar/trading.png', label: 'Trading', path: '/chat' },
  { icon: '/toolbar/brain.png', label: 'Brain', path: '/ai-setup' },
  { icon: '/toolbar/settings.png', label: 'Settings', path: '/settings' },
];

export function Toolbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0, padding: '0 8px',
      background: 'hsl(var(--card))',
      borderBottom: '1px solid hsl(var(--border))', flexShrink: 0,
      height: 64,
    }}>
      {TOOLBAR_ITEMS.map((item) => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: isActive ? 'hsl(var(--accent))' : 'transparent',
              boxShadow: isActive ? '0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1)' : 'none',
              transition: 'all 0.2s ease',
              position: 'relative',
              height: 56,
              minWidth: 64,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(139,92,246,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <img
              src={item.icon}
              alt={item.label}
              style={{
                width: 32, height: 32, objectFit: 'contain',
                filter: isActive ? 'brightness(1.2) drop-shadow(0 0 8px rgba(139,92,246,0.5))' : 'brightness(0.85)',
                transition: 'filter 0.2s ease',
              }}
            />
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              transition: 'color 0.2s ease',
            }}>{item.label}</span>
          </button>
        );
      })}

      {/* Status indicator on far right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
        <StatusDot status={isOnline ? 'online' : 'error'} size="sm" />
      </div>
    </div>
  );
}
