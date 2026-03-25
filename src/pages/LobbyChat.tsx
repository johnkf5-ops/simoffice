/**
 * SimOffice Chat — Built from scratch. No ClawX UI.
 * 3-column layout for Rooms (group chat), 2-column for DMs (1:1).
 * Rooms sidebar | Chat feed | Who's Here panel
 */
import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Users } from 'lucide-react';
import { useChatStore, type RawMessage } from '@/stores/chat';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { useProviderStore } from '@/stores/providers';
import { useRoomsStore, type MeetingRound } from '@/stores/rooms';
import { extractText } from '@/lib/message-utils';
import { CAREERS } from '@/lib/career-templates';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import { WhosHerePanel } from '@/components/chat/WhosHerePanel';
import { AgentSelector } from '@/components/chat/AgentSelector';
import { runMeeting } from '@/lib/meeting-sequencer';

// ---------------------------------------------------------------------------
// Message Bubble — now shows agent name in room mode
// ---------------------------------------------------------------------------

function MessageBubble({ message, agentName }: { message: RawMessage; agentName?: string }) {
  const isUser = message.role === 'user';
  const text = extractText(message);
  if (!text) return null;

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && agentName && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2,
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: 'white',
        }}>
          {agentName.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        {!isUser && agentName && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 2, paddingLeft: 2 }}>
            {agentName}
          </div>
        )}
        <div style={{
          maxWidth: '100%', borderRadius: 16, padding: '12px 16px',
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
    </div>
  );
}

/** Deduplicate messages — by ID only (no text dedup; different agents may give the same answer) */
function dedupeMessages(messages: RawMessage[]): RawMessage[] {
  const seenIds = new Set<string>();
  const result: RawMessage[] = [];
  for (const msg of messages) {
    if (msg.role === 'toolresult') continue;
    if (msg.id && seenIds.has(msg.id)) continue;
    if (msg.id) seenIds.add(msg.id);
    result.push(msg);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Meeting Block — renders a team meeting in the feed
// ---------------------------------------------------------------------------

function MeetingBlock({ meeting }: { meeting: { question: string; responses: Array<{ agentName: string; text: string }>; status: string } }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      margin: '16px 0', borderRadius: 14, overflow: 'hidden',
      border: '1px solid rgba(251,191,36,0.3)',
      background: 'rgba(251,191,36,0.04)',
    }}>
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(251,191,36,0.08)', borderBottom: expanded ? '1px solid rgba(251,191,36,0.2)' : 'none',
        cursor: 'pointer',
      }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users style={{ width: 14, height: 14, color: '#fbbf24' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>Team Meeting</span>
          {meeting.status === 'running' && (
            <Loader2 style={{ width: 12, height: 12, color: '#fbbf24', animation: 'spin 1s linear infinite' }} />
          )}
        </div>
        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
          {expanded ? '▾' : '▸'} {meeting.responses.length} responses
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 12 }}>
            "{meeting.question}"
          </div>
          {meeting.responses.map((r, i) => (
            <div key={i} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: '2px solid rgba(167,139,250,0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>{r.agentName}</div>
              <div style={{ fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.text}</div>
            </div>
          ))}
          {meeting.status === 'running' && (
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
              Waiting for next agent...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LobbyChat() {
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const refreshProviders = useProviderStore((s) => s.refreshProviderSnapshot);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const messages = useChatStore((s) => s.messages);
  const currentAgentId = useChatStore((s) => s.currentAgentId);
  const sending = useChatStore((s) => s.sending);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const abortRun = useChatStore((s) => s.abortRun);

  const activeRoomId = useRoomsStore((s) => s.activeRoomId);
  const rooms = useRoomsStore((s) => s.rooms);
  const targetAgentId = useRoomsStore((s) => s.targetAgentId);
  const setTargetAgent = useRoomsStore((s) => s.setTargetAgent);
  const meetingInProgress = useRoomsStore((s) => s.meetingInProgress);
  const setMeeting = useRoomsStore((s) => s.setMeeting);
  const addCompletedMeeting = useRoomsStore((s) => s.addCompletedMeeting);
  const meetings = useRoomsStore((s) => s.meetings);

  // Get active room — will re-render when activeRoomId or rooms changes
  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) ?? null : null;
  const isRoomMode = !!activeRoom;

  const [input, setInput] = useState('');
  const [meetingMode, setMeetingMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void fetchAgents(); void refreshProviders(); }, [fetchAgents, refreshProviders]);

  // Auto-create rooms for existing agents that match multi-agent career templates
  useEffect(() => {
    if (!agents.length) return;
    const { rooms, createRoomFromCareer, updateRoomAgentIds, createCustomRoom } = useRoomsStore.getState();

    for (const career of CAREERS) {
      if (career.recommended.length < 2) continue;
      // Skip if room already exists for this career
      if (rooms.some(r => r.careerId === career.id)) continue;

      // Match template agent IDs to actual agents by normalized name
      const normalize = (s: string) => s.toLowerCase().replace(/[-_\s]+/g, '');
      const matched = career.recommended.filter(templateId => {
        const templateName = normalize(templateId);
        return agents.some(a => normalize(a.name || '') === normalize(templateId.replace(/-/g, ' ')) || normalize(a.id) === templateName);
      });

      // If user has at least 2 matching agents, create the room
      if (matched.length >= 2) {
        // Map to actual agent IDs
        const actualIds = career.recommended
          .map(templateId => {
            const templateName = normalize(templateId.replace(/-/g, ' '));
            return agents.find(a => normalize(a.name || '') === templateName || normalize(a.id) === normalize(templateId));
          })
          .filter(Boolean)
          .map(a => a!.id);

        if (actualIds.length >= 2) {
          // Create room with actual agent IDs
          const room = createRoomFromCareer(career);
          // Update the room's agentIds with actual IDs (will be persisted)
          updateRoomAgentIds(room.id, actualIds);
        }
      }
    }
    // Fallback: if no rooms were created but user has 2+ agents, make a #general room
    const currentRooms = useRoomsStore.getState().rooms;
    if (agents.length >= 2 && !currentRooms.length) {
      createCustomRoom('general', '🏢', agents.map(a => a.id));
    }
  }, [agents]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, meetingInProgress]);

  // ── Send handler ──
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    if (isRoomMode) {
      // Parse @mention from input
      const mentionMatch = trimmed.match(/^@([\w-]+)\s+/);
      let resolvedTarget = targetAgentId;
      let cleanText = trimmed;

      if (mentionMatch) {
        const mentionName = mentionMatch[1].toLowerCase();
        const matchedAgent = agents.find(a =>
          a.id.toLowerCase() === mentionName ||
          a.name?.toLowerCase().replace(/\s+/g, '-') === mentionName
        );
        if (matchedAgent && activeRoom!.agentIds.includes(matchedAgent.id)) {
          resolvedTarget = matchedAgent.id;
          cleanText = trimmed.slice(mentionMatch[0].length);
        }
      }

      if (resolvedTarget) {
        // Send to targeted agent
        sendMessage(cleanText, undefined, resolvedTarget);
      } else {
        // No target — send to first agent in room as default
        sendMessage(cleanText, undefined, activeRoom!.agentIds[0]);
      }
    } else {
      // DM mode — existing behavior
      sendMessage(trimmed);
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (meetingMode) {
        handleStartMeeting();
      } else {
        handleSend();
      }
    }
  };

  // ── Meeting handler ──
  const handleStartMeeting = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeRoom || meetingInProgress) return;

    setInput('');
    setMeetingMode(false);

    const onUpdate = (round: MeetingRound) => {
      setMeeting(round);
    };

    const completed = await runMeeting(
      activeRoom.id,
      trimmed,
      activeRoom.agentIds,
      onUpdate,
    );

    if (completed.status === 'complete') {
      addCompletedMeeting(completed);
    }
  };

  // Current state
  const currentAgent = agents.find(a => a.id === currentAgentId);
  const displayedMessages = dedupeMessages(messages);
  const isEmpty = displayedMessages.length === 0 && !sending;
  const targetAgent = agents.find(a => a.id === targetAgentId);

  // Completed meetings for this room
  const roomMeetings = activeRoom ? meetings.filter(m => m.roomId === activeRoom.id) : [];

  // Placeholder text
  const placeholderText = meetingMode
    ? 'Ask your team a question...'
    : isRoomMode
      ? (targetAgent ? `Message @${targetAgent.name}...` : `Message ${activeRoom?.name}...`)
      : (isOnline ? `Message ${currentAgent?.name || 'your assistant'}...` : 'Engine offline');

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ═══ LEFT: BUDDY PANEL ═══ */}
      <BuddyPanel currentPage="/chat" />

      {/* ═══ CENTER: CHAT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Header */}
        {isRoomMode ? (
          <div style={{ padding: '12px 32px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{activeRoom!.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{activeRoom!.name}</div>
              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                {activeRoom!.agentIds.length} agents
              </div>
            </div>
          </div>
        ) : currentAgent ? (
          <div style={{ padding: '12px 32px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
              {currentAgent.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{currentAgent.name}</div>
              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{currentAgent.modelDisplay || 'Online'}</div>
            </div>
          </div>
        ) : null}

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {isEmpty ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div style={{ fontSize: 48 }}>{isRoomMode ? '🏠' : '💬'}</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                {isRoomMode ? `Welcome to ${activeRoom!.name}` : currentAgent ? `Chat with ${currentAgent.name}` : 'Start a conversation'}
              </div>
              <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>
                {isRoomMode ? 'Use the @agent selector to talk to specific agents' : 'Type a message below'}
              </div>
            </div>
          ) : (
            <>
              {/* Completed meetings */}
              {roomMeetings.map((m) => (
                <MeetingBlock key={m.id} meeting={m} />
              ))}

              {/* Messages */}
              {displayedMessages.map((msg, i) => (
                <MessageBubble
                  key={msg.id || `msg-${i}`}
                  message={msg}
                  agentName={isRoomMode && msg.role === 'assistant' ? currentAgent?.name : undefined}
                />
              ))}

              {/* In-progress meeting */}
              {meetingInProgress && <MeetingBlock meeting={meetingInProgress} />}

              {/* Typing indicator */}
              {sending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {isRoomMode && currentAgent && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {currentAgent.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
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
            {/* Agent selector — room mode only */}
            {isRoomMode && (
              <AgentSelector
                agentIds={activeRoom!.agentIds}
                selectedAgentId={targetAgentId}
                onSelect={setTargetAgent}
              />
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              disabled={!isOnline}
              rows={1}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'hsl(var(--foreground))',
                maxHeight: 120, lineHeight: '1.5',
              }}
            />

            {/* Meeting button — room mode only */}
            {isRoomMode && (
              <button
                onClick={() => setMeetingMode(!meetingMode)}
                title={meetingMode ? 'Cancel meeting' : 'Start a team meeting'}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: meetingMode ? '1px solid rgba(251,191,36,0.5)' : '1px solid hsl(var(--border))',
                  background: meetingMode ? 'rgba(251,191,36,0.15)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: meetingMode ? '#fbbf24' : 'hsl(var(--muted-foreground))',
                }}
                onMouseEnter={(e) => { if (!meetingMode) { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; e.currentTarget.style.color = '#fbbf24'; } }}
                onMouseLeave={(e) => { if (!meetingMode) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; } }}>
                <Users style={{ width: 14, height: 14 }} />
              </button>
            )}

            {/* Send / Stop */}
            {sending ? (
              <button onClick={() => abortRun()}
                style={{ width: 36, height: 36, borderRadius: 12, background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, background: 'white', borderRadius: 2 }} />
              </button>
            ) : (
              <button onClick={meetingMode ? handleStartMeeting : handleSend} disabled={!input.trim() || !isOnline}
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

      {/* ═══ RIGHT: WHO'S HERE (room mode only) ═══ */}
      {isRoomMode && activeRoom && (
        <WhosHerePanel
          room={activeRoom}
          targetAgentId={targetAgentId}
          onTargetAgent={setTargetAgent}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
