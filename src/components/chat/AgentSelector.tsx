/**
 * AgentSelector — Dropdown to pick which agent you're talking to in a room.
 */
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAgentsStore } from '@/stores/agents';
import { AgentAvatar } from '@/components/common/AgentAvatar';

interface AgentSelectorProps {
  agentIds: string[];
  selectedAgentId: string | null;
  onSelect: (agentId: string) => void;
}

export function AgentSelector({ agentIds, selectedAgentId, onSelect }: AgentSelectorProps) {
  const agents = useAgentsStore((s) => s.agents);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const roomAgents = agentIds
    .map(id => agents.find(a => a.id === id))
    .filter(Boolean) as typeof agents;

  const selected = roomAgents.find(a => a.id === selectedAgentId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 8px', borderRadius: 8,
          border: '1px solid hsl(var(--border))',
          background: selected ? 'rgba(59,130,246,0.08)' : 'transparent',
          cursor: 'pointer', fontSize: 12, fontWeight: 600,
          color: selected ? '#3b82f6' : 'hsl(var(--muted-foreground))',
          whiteSpace: 'nowrap',
        }}>
        {selected ? (
          <>
            <AgentAvatar agentId={selected.id} name={selected.name} size={18} />
            {selected.name}
          </>
        ) : (
          '@everyone'
        )}
        <ChevronDown style={{ width: 12, height: 12 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: 10, padding: 4, minWidth: 180, zIndex: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {roomAgents.map((agent) => (
            <button key={agent.id}
              onClick={() => { onSelect(agent.id); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 6, border: 'none',
                background: agent.id === selectedAgentId ? 'rgba(59,130,246,0.1)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = agent.id === selectedAgentId ? 'rgba(59,130,246,0.1)' : 'transparent'; }}>
              <AgentAvatar agentId={agent.id} name={agent.name} size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                {agent.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
