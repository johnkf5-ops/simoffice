/**
 * RoomSidebar — Left panel for chat page.
 * Shows: Rooms (from career templates) + DMs (individual agents) + Conversations.
 * Replaces the old buddy-list-only sidebar in chat.
 */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useRoomsStore } from '@/stores/rooms';
import { useAgentsStore } from '@/stores/agents';
import { useChatStore } from '@/stores/chat';
import { useGatewayStore } from '@/stores/gateway';
import { useProviderStore } from '@/stores/providers';
import { StatusDot } from '@/components/common/StatusDot';

interface RoomSidebarProps {
  /** Currently active DM agent (when not in a room) */
  currentAgentId: string;
  onAgentClick: (agentId: string) => void;
}

export function RoomSidebar({ currentAgentId, onAgentClick }: RoomSidebarProps) {
  const navigate = useNavigate();

  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoomId = useRoomsStore((s) => s.activeRoomId);
  const setActiveRoom = useRoomsStore((s) => s.setActiveRoom);
  const createCustomRoom = useRoomsStore((s) => s.createCustomRoom);

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomAgents, setNewRoomAgents] = useState<Set<string>>(new Set());

  const agents = useAgentsStore((s) => s.agents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);

  const defaultAccountId = useProviderStore((s) => s.defaultAccountId);
  const providerAccounts = useProviderStore((s) => s.accounts);
  const activeAcct = providerAccounts.find((a) => a.id === defaultAccountId) || providerAccounts.find((a) => a.isDefault);
  const llmLabel = activeAcct
    ? (activeAcct.vendorId === 'ollama' ? `Local · ${activeAcct.model?.split(':')[0] || 'Ollama'}` : `API · ${activeAcct.label ?? activeAcct.vendorId}`)
    : null;

  const handleRoomClick = (roomId: string) => {
    setActiveRoom(roomId);
  };

  const handleDmClick = (agentId: string) => {
    setActiveRoom(null); // exit room mode
    onAgentClick(agentId);
  };

  // Agents that are NOT in any room → show as DMs
  const roomAgentIds = new Set(rooms.flatMap(r => r.agentIds));
  const dmAgents = agents.filter(a => !roomAgentIds.has(a.id));

  return (
    <div style={{
      width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #1a1a6e 0%, #0d0d3b 100%)',
      borderRight: '2px solid #333',
    }}>
      {/* Back to Lobby */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => navigate('/')}
          style={{ fontSize: 16, fontWeight: 900, color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
          ← <span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lobby</span>
        </button>
      </div>

      {/* New Chat */}
      <div style={{ padding: 8 }}>
        <button onClick={() => { setActiveRoom(null); newSession(); }}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          + New Chat
        </button>
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>

        {/* ── Rooms ── */}
        {rooms.length > 0 && (
          <>
            <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(251,191,36,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Rooms
            </div>
            {rooms.map((room) => {
              const isActive = room.id === activeRoomId;
              return (
                <button key={room.id} onClick={() => handleRoomClick(room.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
                    border: 'none', background: isActive ? 'rgba(251,191,36,0.15)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'rgba(251,191,36,0.15)' : 'transparent'; }}>
                  <span style={{ fontSize: 14 }}>{room.icon}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: isActive ? '#fbbf24' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.name}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                      {room.agentIds.length} agents
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {/* ── Create Room ── */}
        {!showCreateRoom ? (
          <button onClick={() => { setShowCreateRoom(true); setNewRoomAgents(new Set()); }}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              color: 'rgba(251,191,36,0.7)', background: 'none', border: '1px dashed rgba(251,191,36,0.3)',
              cursor: 'pointer', marginTop: rooms.length > 0 ? 4 : 0, marginBottom: 8,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; e.currentTarget.style.color = 'rgba(251,191,36,0.7)'; }}>
            + Create Room
          </button>
        ) : (
          <div style={{ padding: 6, marginBottom: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>Select agents:</div>
            {agents.map((agent) => {
              const checked = newRoomAgents.has(agent.id);
              return (
                <button key={agent.id}
                  onClick={() => {
                    const next = new Set(newRoomAgents);
                    if (checked) next.delete(agent.id); else next.add(agent.id);
                    setNewRoomAgents(next);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 6,
                    border: 'none', background: checked ? 'rgba(251,191,36,0.15)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, border: checked ? 'none' : '1px solid rgba(255,255,255,0.3)',
                    background: checked ? '#fbbf24' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#0d0d3b', fontWeight: 700,
                  }}>
                    {checked ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: 11, color: 'white' }}>{agent.name}</span>
                </button>
              );
            })}
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <button
                onClick={() => {
                  if (newRoomAgents.size >= 2) {
                    const room = createCustomRoom('team-chat', '💬', Array.from(newRoomAgents));
                    setShowCreateRoom(false);
                    setActiveRoom(room.id);
                  }
                }}
                disabled={newRoomAgents.size < 2}
                style={{
                  flex: 1, padding: '5px', borderRadius: 6, border: 'none', fontSize: 10, fontWeight: 700,
                  background: newRoomAgents.size >= 2 ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                  color: newRoomAgents.size >= 2 ? '#0d0d3b' : 'rgba(255,255,255,0.3)',
                  cursor: newRoomAgents.size >= 2 ? 'pointer' : 'default',
                }}>
                Create ({newRoomAgents.size})
              </button>
              <button onClick={() => setShowCreateRoom(false)}
                style={{ padding: '5px 8px', borderRadius: 6, border: 'none', fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── DMs ── */}
        <div style={{ padding: '4px 8px', marginTop: rooms.length > 0 ? 12 : 0, fontSize: 10, fontWeight: 700, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {rooms.length > 0 ? 'Direct Messages' : `Online (${isOnline ? (agents?.length ?? 0) : 0})`}
        </div>
        {isOnline && (dmAgents.length > 0 ? dmAgents : agents)?.map((agent) => {
          const isActive = !activeRoomId && agent.id === currentAgentId;
          return (
            <button key={agent.id} onClick={() => handleDmClick(agent.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
                border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'transparent'; }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {agent.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
              </div>
              <StatusDot status="online" size="sm" />
            </button>
          );
        })}

        {/* ── Conversations ── */}
        {!activeRoomId && sessions?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(147,197,253,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Conversations
            </div>
            {sessions.map((s) => {
              const label = sessionLabels[s.key] || s.label || s.displayName || 'Conversation';
              const isActive = s.key === currentSessionKey;
              return (
                <button key={s.key} onClick={() => { setActiveRoom(null); switchSession(s.key); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'transparent'; }}>
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
          {llmLabel
            ? (isOnline ? llmLabel : `${llmLabel} (offline)`)
            : isOnline
              ? (agents?.[0]?.modelDisplay ? `AI · ${agents[0].modelDisplay}` : 'Online')
              : 'Offline'}
        </span>
      </div>
    </div>
  );
}
