/**
 * WhosHerePanel — Right panel showing agents in the current room.
 * Click an agent to target them in the chat input.
 */
import type { RoomDefinition } from '@/stores/rooms';
import { useAgentsStore } from '@/stores/agents';
import { StatusDot } from '@/components/common/StatusDot';
import { AgentAvatar } from '@/components/common/AgentAvatar';

interface WhosHerePanelProps {
  room: RoomDefinition;
  targetAgentId: string | null;
  onTargetAgent: (agentId: string) => void;
}

export function WhosHerePanel({ room, targetAgentId, onTargetAgent }: WhosHerePanelProps) {
  const agents = useAgentsStore((s) => s.agents);

  const roomAgents = room.agentIds
    .map(id => agents.find(a => a.id === id))
    .filter(Boolean) as typeof agents;

  return (
    <div style={{
      width: 170, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Who's Here
        </div>
        <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
          {roomAgents.length} agent{roomAgents.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {/* You */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
          marginBottom: 4,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            U
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>You</div>
          <StatusDot status="online" size="sm" />
        </div>

        <div style={{ width: '100%', height: 1, background: 'hsl(var(--border))', margin: '4px 0 8px 0' }} />

        {/* Agents */}
        {roomAgents.map((agent) => {
          const isTarget = agent.id === targetAgentId;
          return (
            <button key={agent.id} onClick={() => onTargetAgent(agent.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
                border: isTarget ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                background: isTarget ? 'rgba(59,130,246,0.08)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', marginBottom: 2,
              }}
              onMouseEnter={(e) => { if (!isTarget) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={(e) => { if (!isTarget) e.currentTarget.style.background = 'transparent'; }}>
              <AgentAvatar agentId={agent.id} name={agent.name} size={24} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 11, fontWeight: isTarget ? 700 : 600,
                  color: isTarget ? '#3b82f6' : 'hsl(var(--foreground))',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {agent.name}
                </div>
              </div>
              <StatusDot status="online" size="sm" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
