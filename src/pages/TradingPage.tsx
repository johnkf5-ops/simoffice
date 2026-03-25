/**
 * Trading Desk — MoonPay CLI via natural language.
 *
 * No SimOffice agents. No pipeline. Just the user talking to
 * MoonPay's tools through the LLM. We're the friendly window
 * that makes crypto accessible to non-technical people.
 *
 * "swap my SOL to USDC" → LLM translates → MoonPay CLI executes
 */
import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Wallet, ArrowRightLeft, TrendingUp, DollarSign, Link2, HelpCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import { useGatewayStore } from '@/stores/gateway';

// ---------------------------------------------------------------------------
// Suggested prompts for non-technical users
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  { icon: <Wallet style={{ width: 14, height: 14 }} />, label: 'Check my balance', prompt: 'What are my wallet balances?' },
  { icon: <TrendingUp style={{ width: 14, height: 14 }} />, label: 'Trending tokens', prompt: 'Show me trending tokens on Solana' },
  { icon: <ArrowRightLeft style={{ width: 14, height: 14 }} />, label: 'Swap tokens', prompt: 'I want to swap some tokens' },
  { icon: <DollarSign style={{ width: 14, height: 14 }} />, label: 'Buy crypto', prompt: 'How do I buy crypto with my card?' },
  { icon: <Link2 style={{ width: 14, height: 14 }} />, label: 'Bridge tokens', prompt: 'I want to move tokens to another chain' },
  { icon: <HelpCircle style={{ width: 14, height: 14 }} />, label: 'What can you do?', prompt: 'What can MoonPay help me with?' },
];

const SUPPORTED_CHAINS = ['Solana', 'Ethereum', 'Polygon', 'Base', 'Arbitrum', 'Bitcoin', 'Avalanche', 'Optimism', 'BNB', 'Linea', 'Sei', 'Tron', 'Celo'];

// ---------------------------------------------------------------------------
// Message types for the trading chat
// ---------------------------------------------------------------------------

interface TradingMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function TradingPage() {
  const [messages, setMessages] = useState<TradingMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';
  const theme = useSettingsStore((s) => s.theme);
  const moonpayLogo = theme === 'dark' ? '/moonpay-logo-white.png' : '/moonpay-logo.png';

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSend = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || sending) return;
    setInput('');

    const userMsg: TradingMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      // Send to the default agent's session via Gateway
      // The agent has MoonPay MCP tools available
      const rpc = useGatewayStore.getState().rpc;
      if (!rpc) throw new Error('Not connected');

      const sendResult = await rpc<{ runId?: string }>('chat.send', {
        sessionKey: 'agent:moonpay-trader:main',
        message: trimmed,
        deliver: false,
      }, 120_000);

      // Poll for response
      const deadline = Date.now() + 90_000;
      let responseText: string | null = null;

      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2000));

        const history = await rpc<{ messages?: Array<{ role: string; content: unknown; timestamp?: number }> }>('chat.history', {
          sessionKey: 'agent:moonpay-trader:main',
          limit: 5,
        });

        const msgs = history.messages ?? [];
        for (let i = msgs.length - 1; i >= 0; i--) {
          const msg = msgs[i];
          if (msg.role !== 'assistant') continue;
          const ts = msg.timestamp ? (msg.timestamp > 1e12 ? msg.timestamp : msg.timestamp * 1000) : 0;
          if (ts >= userMsg.timestamp - 5000) {
            const content = msg.content;
            if (typeof content === 'string' && content.length > 0) {
              responseText = content;
            } else if (Array.isArray(content)) {
              const textBlock = content.find((b: any) => b.type === 'text' && b.text);
              if (textBlock) responseText = textBlock.text;
            }
            if (responseText) break;
          }
        }
        if (responseText) break;
      }

      if (responseText) {
        setMessages(prev => [...prev, {
          id: `mp-${Date.now()}`,
          role: 'assistant',
          text: responseText!,
          timestamp: Date.now(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `mp-${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I didn\'t get a response. Please try again.',
          timestamp: Date.now(),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}. Make sure the engine is running.`,
        timestamp: Date.now(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const isEmpty = messages.length === 0 && !sending;

  return (
    <div style={{ height: '100%', display: 'flex', background: 'hsl(var(--background))' }}>

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{
          padding: '14px 32px', borderBottom: '1px solid hsl(var(--border))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#7c3aed',
            }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
                MoonPay Trading Desk
              </div>
              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                Talk naturally · MoonPay handles the rest
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isOnline ? '#22c55e' : '#ef4444',
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: isOnline ? '#22c55e' : '#ef4444' }}>
              {isOnline ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* Chat Feed */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {isEmpty ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 20, maxWidth: 500, margin: '0 auto',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowRightLeft style={{ width: 32, height: 32, color: 'white' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
                  Welcome to Trading Desk
                </div>
                <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 6, lineHeight: 1.6 }}>
                  Buy, sell, swap, and bridge crypto — just by asking.
                  No commands to memorize. Just tell me what you want to do.
                </div>
              </div>

              {/* Suggestion chips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginTop: 8 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.prompt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 14px', borderRadius: 12,
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = 'hsl(var(--accent))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.background = 'hsl(var(--card))'; }}
                  >
                    <div style={{ color: '#7c3aed', flexShrink: 0 }}>{s.icon}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{s.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                Powered by <img src={moonpayLogo} alt="MoonPay" style={{ height: 14, objectFit: 'contain' }} />
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    {!isUser && (
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ArrowRightLeft style={{ width: 14, height: 14, color: 'white' }} />
                      </div>
                    )}
                    <div>
                      {!isUser && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 2, paddingLeft: 2 }}>
                          MoonPay
                        </div>
                      )}
                      <div style={{
                        maxWidth: 520, borderRadius: 16, padding: '12px 16px',
                        fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        background: isUser ? '#7c3aed' : 'hsl(var(--card))',
                        color: isUser ? 'white' : 'hsl(var(--foreground))',
                        border: isUser ? 'none' : '1px solid hsl(var(--border))',
                        borderBottomRightRadius: isUser ? 4 : 16,
                        borderBottomLeftRadius: isUser ? 16 : 4,
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {sending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowRightLeft style={{ width: 14, height: 14, color: 'white' }} />
                  </div>
                  <div style={{ borderRadius: 16, padding: '12px 16px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderBottomLeftRadius: 4 }}>
                    <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: '#7c3aed' }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 32px 24px', borderTop: '1px solid hsl(var(--border))' }}>
          {/* Quick suggestion chips when chat has messages */}
          {!isEmpty && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.prompt)}
                  disabled={sending}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    border: '1px solid hsl(var(--border))', background: 'transparent',
                    color: 'hsl(var(--muted-foreground))', cursor: sending ? 'default' : 'pointer',
                    opacity: sending ? 0.5 : 1,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
            borderRadius: 16, padding: '8px 12px',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isOnline ? 'Ask anything about crypto...' : 'Engine offline — start it in Settings'}
              disabled={!isOnline || sending}
              rows={1}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'hsl(var(--foreground))',
                maxHeight: 120, lineHeight: '1.5',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || !isOnline || sending}
              style={{
                width: 36, height: 36, borderRadius: 12, border: 'none',
                cursor: input.trim() && isOnline && !sending ? 'pointer' : 'default',
                background: input.trim() && isOnline && !sending ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'hsl(var(--muted))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: input.trim() && isOnline && !sending ? 1 : 0.4,
              }}
            >
              <Send style={{ width: 16, height: 16, color: 'white' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT SIDEBAR ═══ */}
      <div style={{
        width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
        padding: 16,
      }}>
        {/* MoonPay branding */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={moonpayLogo} alt="MoonPay" style={{ height: 28, objectFit: 'contain' }} />
          <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Trading Partner
          </div>
        </div>

        <div style={{ width: '100%', height: 1, background: 'hsl(var(--border))', marginBottom: 16 }} />

        {/* What you can do */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          What you can do
        </div>
        {[
          { label: 'Check balances', desc: 'See what you hold' },
          { label: 'Swap tokens', desc: 'Trade one token for another' },
          { label: 'Bridge chains', desc: 'Move tokens cross-chain' },
          { label: 'Buy with card', desc: 'Fiat on-ramp' },
          { label: 'Trending tokens', desc: 'See what\'s hot' },
          { label: 'Token research', desc: 'Look up any token' },
        ].map((item) => (
          <div key={item.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{item.label}</div>
            <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{item.desc}</div>
          </div>
        ))}

        <div style={{ width: '100%', height: 1, background: 'hsl(var(--border))', margin: '12px 0' }} />

        {/* Supported chains */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Supported Chains
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {SUPPORTED_CHAINS.map((chain) => (
            <span key={chain} style={{
              fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
              background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))',
            }}>
              {chain}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, textAlign: 'center' }}>
            Trades are executed by MoonPay.
            SimOffice does not hold funds or execute transactions.
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
