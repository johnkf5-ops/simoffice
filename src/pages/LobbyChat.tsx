/**
 * SimOffice Chat — Built from scratch. No ClawX UI.
 * Buddy panel + chat area. Properly handles agent switching and message dedup.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import { useChatStore, type RawMessage } from '@/stores/chat';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { StatusDot } from '@/components/common/StatusDot';
import { extractText } from '@/pages/Chat/message-utils';

function MessageBubble({ message }: { message: RawMessage }) {
  const isUser = message.role === 'user';
  const text = extractText(message);
  if (!text) return null;

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '70%', borderRadius: 16, padding: '12px 16px',
        fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        background: isUser ? '#3b82f6' : 'hsl(var(--card))',
        color: isUser ? 'white' : 'hsl(var(--foreground))',
        border: isUser ? 'none' : '1px solid hsl(var(--border))',
        borderBottomRightRadius: isUser ? 4 : 16,
        borderBottomLeftRadius: isUser ? 16 : 4,
      }}>
        {text}
      </div>
    </div>
  );
}

/** Deduplicate messages — by ID and by assistant content text */
function dedupeMessages(messages: RawMessage[]): RawMessage[] {
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  const result: RawMessage[] = [];
  for (const msg of messages) {
    if (msg.role === 'toolresult') continue;
    if (msg.id && seenIds.has(msg.id)) continue;
    if (msg.id) seenIds.add(msg.id);
    if (msg.role === 'assistant') {
      const text = extractText(msg);
      if (text && seenTexts.has(text)) continue;
      if (text) seenTexts.add(text);
    }
    result.push(msg);
  }
  return result;
}

export function LobbyChat() {
  const navigate = useNavigate();
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const messages = useChatStore((s) => s.messages);
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const currentAgentId = useChatStore((s) => s.currentAgentId);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const sending = useChatStore((s) => s.sending);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);
  const abortRun = useChatStore((s) => s.abortRun);

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    // Send to the current agent — the store handles session routing
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** Click an agent in buddy list — switch to that agent's session */
  const handleAgentClick = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    console.log('[handleAgentClick]', { agentId, mainSessionKey: agent?.mainSessionKey, currentSessionKey, currentAgentId });
    if (agent?.mainSessionKey) {
      switchSession(agent.mainSessionKey);
      console.log('[handleAgentClick] switched to', agent.mainSessionKey, 'new agentId:', useChatStore.getState().currentAgentId);
    }
  };

  // Current agent info
  const currentAgent = agents.find(a => a.id === currentAgentId);
  const displayedMessages = dedupeMessages(messages);
  const isEmpty = displayedMessages.length === 0 && !sending;

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ═══ BUDDY PANEL ═══ */}
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

        <div style={{ padding: 8 }}>
          <button onClick={() => newSession()}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            + New Chat
          </button>
        </div>

        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Online ({isOnline ? (agents?.length ?? 0) : 0})
          </div>
          {isOnline && agents?.map((agent) => {
            const isActive = agent.id === currentAgentId;
            return (
              <button key={agent.id} onClick={() => handleAgentClick(agent.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
                  border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'transparent'; }}>
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
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'transparent'; }}>
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

      {/* ═══ CHAT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Agent header */}
        {currentAgent && (
          <div style={{ padding: '12px 32px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
              {currentAgent.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{currentAgent.name}</div>
              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                {currentAgent.modelDisplay || 'Online'}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {isEmpty ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                {currentAgent ? `Chat with ${currentAgent.name}` : 'Start a conversation'}
              </div>
              <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>
                Type a message below
              </div>
            </div>
          ) : (
            <>
              {displayedMessages.map((msg, i) => (
                <MessageBubble key={msg.id || `msg-${i}`} message={msg} />
              ))}
              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                  <div style={{ borderRadius: 16, padding: '12px 16px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderBottomLeftRadius: 4 }}>
                    <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 32px 24px 32px', borderTop: '1px solid hsl(var(--border))' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
            borderRadius: 16, padding: '8px 12px',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isOnline ? `Message ${currentAgent?.name || 'your assistant'}...` : 'Engine offline'}
              disabled={!isOnline}
              rows={1}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'hsl(var(--foreground))',
                maxHeight: 120, lineHeight: '1.5',
              }}
            />
            {sending ? (
              <button onClick={() => abortRun()}
                style={{ width: 36, height: 36, borderRadius: 12, background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, background: 'white', borderRadius: 2 }} />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim() || !isOnline}
                style={{
                  width: 36, height: 36, borderRadius: 12, border: 'none',
                  cursor: input.trim() && isOnline ? 'pointer' : 'default',
                  background: input.trim() && isOnline ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'hsl(var(--muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: input.trim() && isOnline ? 1 : 0.4,
                }}>
                <Send style={{ width: 16, height: 16, color: 'white' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
