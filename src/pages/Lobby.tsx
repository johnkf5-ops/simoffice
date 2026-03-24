/**
 * SimOffice — The Lobby
 * Full-screen 3D office. Your agents working. That's it.
 * Navigation lives in the toolbar.
 */
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2, X } from 'lucide-react';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';
import { useProviderStore } from '@/stores/providers';
import { useChatStore, type RawMessage } from '@/stores/chat';
import { StatusDot } from '@/components/common/StatusDot';
import { extractText } from '@/lib/message-utils';
import { OfficeAdapter } from '@/components/lobby/OfficeAdapter';

export function Lobby() {
  const navigate = useNavigate();
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const messages = useChatStore((s) => s.messages);
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const currentAgentId = useChatStore((s) => s.currentAgentId);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const sending = useChatStore((s) => s.sending);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isOnline = gatewayStatus.state === 'running';

  const defaultAccountId = useProviderStore((s) => s.defaultAccountId);
  const providerAccounts = useProviderStore((s) => s.accounts);
  const activeAcct = providerAccounts.find((a) => a.id === defaultAccountId) || providerAccounts.find((a) => a.isDefault);
  const llmLabel = activeAcct
    ? (activeAcct.vendorId === 'ollama' ? `Local · ${activeAcct.model?.split(':')[0] || 'Ollama'}` : `API · ${activeAcct.label ?? activeAcct.vendorId}`)
    : null;

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);



  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChatSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed || sending) return;
    sendMessage(trimmed);
    setChatInput('');
  };

  const handleAgentClick = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent?.mainSessionKey) {
      switchSession(agent.mainSessionKey);
    }
    setChatOpen(true);
  };

  const currentAgent = agents.find(a => a.id === currentAgentId);

  // Dedupe messages by ID + consecutive content
  const displayMessages = useMemo(() => {
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
  }, [messages]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Buddy panel */}
      <div style={{
        width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1a1a6e 0%, #0d0d3b 100%)',
        borderRight: '2px solid #333',
      }}>
        <div style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>
            Sim<span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Office</span>
          </div>
        </div>
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Online ({isOnline ? (agents?.length ?? 0) : 0})
          </div>
          {isOnline && agents?.map((agent) => (
            <button key={agent.id} onClick={() => handleAgentClick(agent.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                {agent.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
                <div style={{ fontSize: 9, color: 'rgba(191,219,254,0.4)' }}>{agent.modelDisplay || 'Ready'}</div>
              </div>
              <StatusDot status="online" size="sm" />
            </button>
          ))}

          {/* Conversations */}
          {!chatOpen && sessions?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(147,197,253,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Conversations
              </div>
              {sessions.slice(0, 5).map((s) => {
                const label = sessionLabels[s.key] || s.label || s.displayName || 'Conversation';
                return (
                  <button key={s.key} onClick={() => { switchSession(s.key); setChatOpen(true); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize: 10 }}>💬</span>
                    <span style={{ fontSize: 10, color: 'rgba(191,219,254,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* ═══ INLINE CHAT PANEL ═══ */}
        {chatOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', flexDirection: 'column',
            flex: 1, minHeight: 0,
            background: 'rgba(0,0,0,0.2)',
          }}>
            {/* Chat header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white' }}>
                  {currentAgent?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{currentAgent?.name || 'Chat'}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => navigate('/chat')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 9, textDecoration: 'underline' }}>
                  Full
                </button>
                <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2 }}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {displayMessages.length === 0 && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0' }}>
                  Say something...
                </div>
              )}
              {displayMessages.slice(-20).map((msg, i) => {
                const text = extractText(msg);
                if (!text) return null;
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || `m-${i}`} style={{ marginBottom: 6 }}>
                    <div style={{
                      fontSize: 11, lineHeight: 1.4, padding: '6px 8px', borderRadius: 8,
                      background: isUser ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
                      color: isUser ? '#93c5fd' : 'rgba(255,255,255,0.8)',
                      wordBreak: 'break-word',
                    }}>
                      {text}
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div style={{ padding: '4px 8px' }}>
                  <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.4)' }} />
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '6px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
                  placeholder="Message..."
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none',
                    background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 11, outline: 'none',
                  }}
                />
                <button onClick={handleChatSend} disabled={!chatInput.trim() || sending}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: chatInput.trim() && !sending ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: chatInput.trim() && !sending ? 1 : 0.3,
                  }}>
                  <Send style={{ width: 10, height: 10, color: 'white' }} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusDot status={isOnline ? 'online' : 'error'} size="sm" />
          <span style={{ fontSize: 10, fontWeight: 500, color: isOnline ? '#86efac' : '#fca5a5' }}>
            {llmLabel ? (isOnline ? llmLabel : `${llmLabel} (offline)`) : (isOnline ? 'No AI configured' : 'Offline')}
          </span>
        </div>
      </div>

      {/* 3D Office */}
      <div style={{ flex: 1 }}>
        <OfficeAdapter />
      </div>
    </div>
  );
}
