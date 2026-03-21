/**
 * ChatShell — AIM-style chat with buddy list panel
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';
import { useChatStore } from '@/stores/chat';
import { StatusDot } from '@/components/common/StatusDot';
import { Chat } from '@/pages/Chat';

export function ChatShell() {
  const navigate = useNavigate();
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>

      {/* BUDDY LIST */}
      <div style={{
        width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1a1a6e 0%, #0d0d3b 100%)',
        borderRight: '2px solid #333',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 16, fontWeight: 900, color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
            ← <span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lobby</span>
          </button>
        </div>

        <div style={{ padding: '8px' }}>
          <button onClick={() => newSession()}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            + New Chat
          </button>
        </div>

        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Online ({isOnline ? (agents?.length ?? 0) : 0})
          </div>
          {isOnline && agents?.map((agent) => (
            <button key={agent.id} onClick={() => newSession()}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {agent.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
                <div style={{ fontSize: 9, color: 'rgba(191,219,254,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.modelDisplay || 'Ready'}</div>
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
                  <button key={s.key} onClick={() => switchSession(s.key)}
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

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status={isOnline ? 'online' : 'error'} size="sm" />
          <span style={{ fontSize: 10, fontWeight: 500, color: isOnline ? '#86efac' : '#fca5a5' }}>
            {isOnline ? 'Engine running' : 'Engine offline'}
          </span>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 24, position: 'relative' }}>
        <Chat />
      </div>
    </div>
  );
}
