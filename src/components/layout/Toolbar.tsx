/**
 * SimOffice Toolbar — Always visible at the top of every page.
 * AOL-style icon navigation.
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useGatewayStore } from '@/stores/gateway';
import { StatusDot } from '@/components/common/StatusDot';

const TOOLBAR_ITEMS = [
  { icon: '🏢', label: 'Office', path: '/' },
  { icon: '💬', label: 'Chat', path: '/chat' },
  { icon: '🤖', label: 'Assistants', path: '/assistants' },
  { icon: '🔌', label: 'Connections', path: '/connections' },
  { icon: '⚡', label: 'Skills', path: '/powers' },
  { icon: '⏰', label: 'Automations', path: '/automations' },
  { icon: '🧠', label: 'AI Setup', path: '/ai-setup' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
];

export function Toolbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, padding: '4px 12px',
      background: 'hsl(var(--card))',
      borderBottom: '1px solid hsl(var(--border))', flexShrink: 0,
    }}>
      {TOOLBAR_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: isActive ? 'hsl(var(--accent))' : 'transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'hsl(var(--accent))' : 'transparent'; }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, transition: 'transform 0.15s' }}>{item.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{item.label}</span>
          </button>
        );
      })}

      {/* Status on far right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
        <StatusDot status={isOnline ? 'online' : 'error'} size="sm" />
        <span style={{ fontSize: 10, fontWeight: 600, color: isOnline ? '#16a34a' : '#dc2626' }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
