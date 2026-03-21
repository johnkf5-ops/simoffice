/**
 * OpenLobby Assistants — Built from scratch. No ClawX UI.
 * Dark buddy panel + assistants management matching OpenLobby design.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';
import { useChatStore } from '@/stores/chat';
import { StatusDot } from '@/components/common/StatusDot';
import { CATEGORY_LABELS } from '@/lib/career-templates';

export function LobbyAssistants() {
  const navigate = useNavigate();
  const agents = useAgentsStore((s) => s.agents);
  const loading = useAgentsStore((s) => s.loading);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const createAgent = useAgentsStore((s) => s.createAgent);
  const deleteAgent = useAgentsStore((s) => s.deleteAgent);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const chatAgents = useAgentsStore((s) => s.agents);
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);

  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Template catalog
  const [catalog, setCatalog] = useState<Array<{ id: string; category: string; name: string; role: string; path: string }>>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    fetch('/agent-templates.json')
      .then(r => r.json())
      .then(data => setCatalog(data.agents || []))
      .catch(() => {});
  }, []);

  const categories = [...new Set(catalog.map(a => a.category))].sort();

  const filteredCatalog = catalog.filter(a => {
    const matchesSearch = !search ||
      (a.name || a.id).toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddFromCatalog = async (agent: { id: string; name: string }) => {
    const name = agent.name || agent.id.replace(/-/g, ' ');
    try {
      await createAgent(name.charAt(0).toUpperCase() + name.slice(1));
      await fetchAgents();
    } catch { /* handled by store */ }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await createAgent(trimmed);
      setNewName('');
      setShowCreate(false);
    } catch { /* error handled by store */ }
    setCreating(false);
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Remove this assistant?')) return;
    try { await deleteAgent(agentId); } catch { /* error handled by store */ }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ═══ BUDDY PANEL ═══ */}
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
            ← <span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lobby</span>
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
            Online ({isOnline ? (chatAgents?.length ?? 0) : 0})
          </div>
          {isOnline && chatAgents?.map((agent) => (
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

      {/* ═══ CONTENT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Section Header */}
        <div style={{
          padding: '32px 40px 24px 40px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)',
        }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            ← Back to Lobby
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Your Assistants
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
            Your AI workers, ready when you are
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px 40px' }}>

          {loading && agents.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))' }}>
              Loading assistants...
            </div>
          )}

          {!loading && agents.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                No assistants yet
              </div>
              <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
                Create your first assistant to get started
              </div>
            </div>
          )}

          {/* Agent Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {agents.map((agent) => (
              <div key={agent.id}
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {agent.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                      {agent.modelDisplay || 'Default model'}
                    </div>
                  </div>
                  {agent.isDefault && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Default
                    </span>
                  )}
                </div>

                {/* Channels */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    Connected apps
                  </div>
                  {agent.channelTypes && agent.channelTypes.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {agent.channelTypes.map((ch) => (
                        <span key={ch} style={{
                          fontSize: 11, fontWeight: 500, color: 'hsl(var(--foreground))',
                          background: 'hsl(var(--muted))', padding: '3px 10px', borderRadius: 6,
                        }}>
                          {ch.charAt(0).toUpperCase() + ch.slice(1)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>No apps connected</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => { newSession(); navigate('/chat'); }}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
                      fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                    }}>
                    Chat Now
                  </button>
                  {!agent.isDefault && (
                    <button
                      onClick={() => handleDelete(agent.id)}
                      style={{
                        padding: '10px 16px', borderRadius: 10,
                        border: '1px solid hsl(var(--border))', background: 'transparent',
                        color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Create New Card */}
            <div
              style={{
                background: showCreate ? 'hsl(var(--card))' : 'transparent',
                border: '2px dashed hsl(var(--border))',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: showCreate ? 'stretch' : 'center',
                justifyContent: 'center',
                gap: 16,
                minHeight: 200,
                cursor: showCreate ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => { if (!showCreate) setShowCreate(true); }}
              onMouseEnter={(e) => { if (!showCreate) e.currentTarget.style.borderColor = '#7c3aed'; }}
              onMouseLeave={(e) => { if (!showCreate) e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
            >
              {!showCreate ? (
                <>
                  <div style={{ fontSize: 36, opacity: 0.5 }}>+</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--muted-foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Create New Assistant
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                    New Assistant
                  </div>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setNewName(''); } }}
                    placeholder="Give it a name..."
                    style={{
                      padding: '10px 14px', borderRadius: 10,
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim() || creating}
                      style={{
                        flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: newName.trim() && !creating ? 'pointer' : 'default',
                        background: newName.trim() && !creating ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'hsl(var(--muted))',
                        color: 'white', fontSize: 13, fontWeight: 700, opacity: newName.trim() && !creating ? 1 : 0.5,
                      }}>
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => { setShowCreate(false); setNewName(''); }}
                      style={{
                        padding: '10px 16px', borderRadius: 10,
                        border: '1px solid hsl(var(--border))', background: 'transparent',
                        color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ═══ AGENT TEMPLATE CATALOG ═══ */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', margin: 0 }}>
                  Agent Catalog
                </h2>
                <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                  174 pre-built agents ready to add to your team
                </p>
              </div>
              <button onClick={() => setShowCatalog(!showCatalog)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: showCatalog ? 'hsl(var(--muted))' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  color: showCatalog ? 'hsl(var(--foreground))' : 'white',
                  fontSize: 13, fontWeight: 700,
                }}>
                {showCatalog ? 'Hide Catalog' : 'Browse Catalog'}
              </button>
            </div>

            {showCatalog && (
              <>
                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search agents..."
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10,
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
                    }}
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                      padding: '10px 14px', borderRadius: 10,
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))', fontSize: 13, outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>
                  {filteredCatalog.length} agents found
                </div>

                {/* Catalog Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {filteredCatalog.map(agent => {
                    const displayName = agent.name || agent.id.replace(/-/g, ' ');
                    const alreadyAdded = agents.some(a => a.name.toLowerCase() === displayName.toLowerCase());
                    return (
                      <div key={agent.id}
                        style={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12, padding: 14,
                          display: 'flex', alignItems: 'center', gap: 12,
                          opacity: alreadyAdded ? 0.5 : 1,
                        }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                          background: 'linear-gradient(135deg, #7c3aed22, #a78bfa22)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16,
                        }}>
                          🤖
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))',
                            textTransform: 'capitalize',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
                            {CATEGORY_LABELS[agent.category] || agent.category}
                            {agent.role ? ` · ${agent.role}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => !alreadyAdded && handleAddFromCatalog(agent)}
                          disabled={alreadyAdded}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            background: alreadyAdded ? 'hsl(var(--muted))' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                            color: alreadyAdded ? 'hsl(var(--muted-foreground))' : 'white',
                            fontSize: 11, fontWeight: 700, cursor: alreadyAdded ? 'default' : 'pointer',
                            flexShrink: 0,
                          }}>
                          {alreadyAdded ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
