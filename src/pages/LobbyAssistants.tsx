/**
 * SimOffice Assistants — Built from scratch. No ClawX UI.
 * Dark buddy panel + assistants management matching SimOffice design.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentsStore } from '@/stores/agents';
import { useChatStore } from '@/stores/chat';
import { CATEGORY_LABELS } from '@/lib/career-templates';
import { hostApiFetch } from '@/lib/host-api';
import { BuddyPanel } from '@/components/common/BuddyPanel';

export function LobbyAssistants() {
  const navigate = useNavigate();
  const agents = useAgentsStore((s) => s.agents);
  const loading = useAgentsStore((s) => s.loading);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const createAgent = useAgentsStore((s) => s.createAgent);
  const deleteAgent = useAgentsStore((s) => s.deleteAgent);
  const newSession = useChatStore((s) => s.newSession);

  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Template catalog
  const [catalog, setCatalog] = useState<Array<{ id: string; category: string; name: string; role: string; path: string; description?: string; emoji?: string; tags?: string[]; popular?: boolean; quote?: string }>>([]);
  const [soulTemplates, setSoulTemplates] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    fetch('/agent-templates.json')
      .then(r => r.json())
      .then(data => setCatalog(data.agents || []))
      .catch(() => {});
    fetch('/agent-souls.json')
      .then(r => r.json())
      .then(data => setSoulTemplates(data || {}))
      .catch(() => {});
  }, []);

  const categories = [...new Set(catalog.map(a => a.category))].sort();

  const filteredCatalog = catalog.filter(a => {
    const matchesSearch = !search ||
      (a.name || a.id).toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all'
      || (categoryFilter === '_popular' ? a.popular === true : a.category === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const handleAddFromCatalog = async (agent: { id: string; name: string }) => {
    const name = agent.name || agent.id.replace(/-/g, ' ');
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    try {
      await createAgent(displayName);
      // Find the newly created agent to get its actual ID
      const updatedAgents = useAgentsStore.getState().agents;
      const created = updatedAgents.find(a => a.name === displayName);
      // Write SOUL.md template if available
      const soul = soulTemplates[agent.id];
      if (soul && created) {
        await hostApiFetch(`/api/agents/${encodeURIComponent(created.id)}/soul`, {
          method: 'PUT',
          body: JSON.stringify({ content: soul }),
        });
      }
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
      <BuddyPanel currentPage="/assistants" />

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
                  {catalog.length || 211} pre-built agents ready to add to your team
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
                    <option value="_popular">⭐ Popular</option>
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
                          border: agent.popular ? '1px solid rgba(124,58,237,0.3)' : '1px solid hsl(var(--border))',
                          borderRadius: 14, padding: 16,
                          display: 'flex', flexDirection: 'column', gap: 10,
                          opacity: alreadyAdded ? 0.5 : 1,
                          position: 'relative',
                        }}>
                        {/* Popular badge */}
                        {agent.popular && !alreadyAdded && (
                          <div style={{
                            position: 'absolute', top: -6, right: 12,
                            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                            color: 'white', fontSize: 9, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 4,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>
                            Popular
                          </div>
                        )}
                        {/* Header: emoji + name + category */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg, #7c3aed11, #a78bfa11)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20,
                          }}>
                            {agent.emoji || '🤖'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))',
                              textTransform: 'capitalize',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {displayName}
                            </div>
                            <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
                              {CATEGORY_LABELS[agent.category] || agent.category}
                            </div>
                          </div>
                        </div>
                        {/* Description */}
                        {(agent.description || agent.role) && (
                          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                            {agent.description || agent.role}
                          </div>
                        )}
                        {/* Tags */}
                        {agent.tags && agent.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {agent.tags.map(tag => (
                              <span key={tag} style={{
                                fontSize: 9, fontWeight: 600, color: 'hsl(var(--muted-foreground))',
                                background: 'hsl(var(--muted))', padding: '2px 7px', borderRadius: 4,
                                textTransform: 'lowercase',
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Add button */}
                        <button
                          onClick={() => !alreadyAdded && handleAddFromCatalog(agent)}
                          disabled={alreadyAdded}
                          style={{
                            padding: '8px 12px', borderRadius: 8, border: 'none', width: '100%',
                            background: alreadyAdded ? 'hsl(var(--muted))' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                            color: alreadyAdded ? 'hsl(var(--muted-foreground))' : 'white',
                            fontSize: 12, fontWeight: 700, cursor: alreadyAdded ? 'default' : 'pointer',
                            marginTop: 'auto',
                          }}>
                          {alreadyAdded ? 'Added' : '+ Add to Team'}
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
