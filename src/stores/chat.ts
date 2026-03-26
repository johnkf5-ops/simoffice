/**
 * Chat State Store — Clean rewrite.
 *
 * Replaces the 2078-line ClawX monolith. Fixes the duplicate message bug
 * (OpenClaw Issue #5964) by making loadHistory() the ONLY source of messages.
 * Events update streamingText for animation but NEVER touch messages[].
 *
 * Public API is identical — no component changes needed.
 */
import { create } from 'zustand';
import { hostApiFetch } from '@/lib/host-api';
import { useGatewayStore } from './gateway';
import { useAgentsStore } from './agents';

// ── Types (exported — used by LobbyChat, OfficeAdapter, message-utils, meeting-sequencer) ──

export interface AttachedFileMeta {
  fileName: string;
  mimeType: string;
  fileSize: number;
  preview: string | null;
  filePath?: string;
}

export interface RawMessage {
  role: 'user' | 'assistant' | 'system' | 'toolresult';
  content: unknown;
  timestamp?: number;
  id?: string;
  toolCallId?: string;
  toolName?: string;
  details?: unknown;
  isError?: boolean;
  _attachedFiles?: AttachedFileMeta[];
}

export interface ContentBlock {
  type: 'text' | 'image' | 'thinking' | 'tool_use' | 'tool_result' | 'toolCall' | 'toolResult';
  text?: string;
  thinking?: string;
  source?: { type: string; media_type?: string; data?: string; url?: string };
  data?: string;
  mimeType?: string;
  id?: string;
  name?: string;
  input?: unknown;
  arguments?: unknown;
  content?: unknown;
}

export interface ChatSession {
  key: string;
  label?: string;
  displayName?: string;
  thinkingLevel?: string;
  model?: string;
  updatedAt?: number;
}

export interface ToolStatus {
  id?: string;
  toolCallId?: string;
  name: string;
  status: 'running' | 'completed' | 'error';
  durationMs?: number;
  summary?: string;
  updatedAt: number;
}

// ── Helpers ──

function toMs(ts: number): number {
  return ts < 1e12 ? ts * 1000 : ts;
}

function getMessageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((b: any) => b.type === 'text' && b.text)
      .map((b: any) => b.text)
      .join('\n');
  }
  return '';
}

function getAgentIdFromKey(sessionKey: string): string {
  if (!sessionKey.startsWith('agent:')) return '';
  const [, agentId] = sessionKey.split(':');
  return agentId || '';
}

function isToolResultRole(role: unknown): boolean {
  if (typeof role !== 'string') return false;
  const n = role.toLowerCase();
  return n === 'toolresult' || n === 'tool_result';
}

const DEFAULT_SESSION_KEY = 'agent:main:main';

// ── State ──

interface ChatState {
  messages: RawMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  activeRunId: string | null;
  streamingText: string;
  streamingMessage: unknown | null;
  streamingTools: ToolStatus[];
  pendingFinal: boolean;
  lastUserMessageAt: number | null;
  pendingToolImages: AttachedFileMeta[];
  sessions: ChatSession[];
  currentSessionKey: string;
  currentAgentId: string;
  sessionLabels: Record<string, string>;
  sessionLastActivity: Record<string, number>;
  showThinking: boolean;
  thinkingLevel: string | null;

  // Actions
  loadSessions: () => Promise<void>;
  switchSession: (key: string) => void;
  newSession: () => void;
  deleteSession: (key: string) => Promise<void>;
  cleanupEmptySession: () => void;
  loadHistory: (quiet?: boolean) => Promise<void>;
  sendMessage: (
    text: string,
    attachments?: Array<{ fileName: string; mimeType: string; fileSize: number; stagedPath: string; preview: string | null }>,
    targetAgentId?: string | null,
  ) => Promise<void>;
  abortRun: () => Promise<void>;
  handleChatEvent: (event: Record<string, unknown>) => void;
  toggleThinking: () => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ── Module-level state for polling/coalescing ──

let _pollTimer: ReturnType<typeof setTimeout> | null = null;
let _historyInFlight: Promise<void> | null = null;
let _lastHistoryLoadAt = 0;

function clearPoll() {
  if (_pollTimer) { clearTimeout(_pollTimer); _pollTimer = null; }
}

// ── Store ──

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  sending: false,
  activeRunId: null,
  streamingText: '',
  streamingMessage: null,
  streamingTools: [],
  pendingFinal: false,
  lastUserMessageAt: null,
  pendingToolImages: [],
  sessions: [],
  currentSessionKey: DEFAULT_SESSION_KEY,
  currentAgentId: '',
  sessionLabels: {},
  sessionLastActivity: {},
  showThinking: true,
  thinkingLevel: null,

  // ── Load sessions ──

  loadSessions: async () => {
    try {
      const data = await useGatewayStore.getState().rpc<Record<string, unknown>>('sessions.list', {});
      if (!data) return;

      const rawSessions = Array.isArray(data.sessions) ? data.sessions : [];
      const sessions: ChatSession[] = rawSessions
        .map((s: any) => ({
          key: String(s.key || ''),
          label: s.label ? String(s.label) : undefined,
          displayName: s.displayName ? String(s.displayName) : undefined,
          thinkingLevel: s.thinkingLevel ? String(s.thinkingLevel) : undefined,
          model: s.model ? String(s.model) : undefined,
          updatedAt: s.updatedAt ? toMs(typeof s.updatedAt === 'string' ? Date.parse(s.updatedAt) : s.updatedAt) : undefined,
        }))
        .filter((s: ChatSession) => s.key);

      // Dedupe by key
      const seen = new Set<string>();
      const deduped = sessions.filter((s) => {
        if (seen.has(s.key)) return false;
        seen.add(s.key);
        return true;
      });

      set({ sessions: deduped });
    } catch (err) {
      console.error('[chat] Failed to load sessions:', err);
    }
  },

  // ── Switch session ──

  switchSession: (key: string) => {
    const { currentSessionKey } = get();
    if (key === currentSessionKey) return;

    clearPoll();
    set({
      currentSessionKey: key,
      currentAgentId: getAgentIdFromKey(key),
      messages: [],
      streamingText: '',
      streamingMessage: null,
      streamingTools: [],
      error: null,
      sending: false,
      activeRunId: null,
      pendingFinal: false,
      lastUserMessageAt: null,
    });

    get().loadHistory();
  },

  // ── New session ──

  newSession: () => {
    const { defaultAgentId, agents } = useAgentsStore.getState();
    const agentId = defaultAgentId || agents[0]?.id || 'main';
    const key = `agent:${agentId}:session-${Date.now()}`;
    const session: ChatSession = { key, displayName: key };

    set((s) => ({
      sessions: [...s.sessions, session],
      currentSessionKey: key,
      currentAgentId: agentId,
      messages: [],
      streamingText: '',
      streamingMessage: null,
      error: null,
      sending: false,
    }));
  },

  // ── Delete session ──

  deleteSession: async (key: string) => {
    try {
      await hostApiFetch<{ success: boolean; error?: string }>('/api/sessions/delete', {
        method: 'POST',
        body: JSON.stringify({ sessionKey: key }),
      });
    } catch (err) {
      console.warn('[chat] Delete session IPC failed:', err);
    }

    const { currentSessionKey, sessions } = get();
    const remaining = sessions.filter((s) => s.key !== key);

    if (currentSessionKey === key) {
      const next = remaining[0]?.key || DEFAULT_SESSION_KEY;
      set({
        sessions: remaining,
        currentSessionKey: next,
        currentAgentId: getAgentIdFromKey(next),
        messages: [],
        sessionLabels: Object.fromEntries(Object.entries(get().sessionLabels).filter(([k]) => k !== key)),
        sessionLastActivity: Object.fromEntries(Object.entries(get().sessionLastActivity).filter(([k]) => k !== key)),
      });
      get().loadHistory();
    } else {
      set({
        sessions: remaining,
        sessionLabels: Object.fromEntries(Object.entries(get().sessionLabels).filter(([k]) => k !== key)),
        sessionLastActivity: Object.fromEntries(Object.entries(get().sessionLastActivity).filter(([k]) => k !== key)),
      });
    }
  },

  // ── Cleanup empty session (no-op for compatibility) ──
  cleanupEmptySession: () => {},

  // ── Load history — THE ONLY SOURCE OF MESSAGES ──

  loadHistory: async (quiet = false) => {
    const { currentSessionKey } = get();

    // Coalesce: if already loading, await it
    if (_historyInFlight) {
      await _historyInFlight;
      return;
    }

    // Throttle quiet loads
    if (quiet && Date.now() - _lastHistoryLoadAt < 800) return;

    if (!quiet) set({ loading: true });

    const load = async () => {
      try {
        const data = await useGatewayStore.getState().rpc<Record<string, unknown>>(
          'chat.history',
          { sessionKey: currentSessionKey, limit: 200 },
        );

        const rawMessages = Array.isArray(data?.messages) ? (data.messages as RawMessage[]) : [];
        const filtered = rawMessages.filter((msg) => !isToolResultRole(msg.role));

        // Preserve optimistic user message if sending and not yet in history
        let finalMessages = filtered;
        const userMsgAt = get().lastUserMessageAt;
        if (get().sending && userMsgAt) {
          const userMsMs = toMs(userMsgAt);
          const hasRecentUser = filtered.some(
            (m) => m.role === 'user' && m.timestamp && Math.abs(toMs(m.timestamp) - userMsMs) < 5000,
          );
          if (!hasRecentUser) {
            const optimistic = [...get().messages].reverse().find(
              (m) => m.role === 'user' && m.timestamp && Math.abs(toMs(m.timestamp) - userMsMs) < 5000,
            );
            if (optimistic) {
              finalMessages = [...filtered, optimistic];
            }
          }
        }

        // Only update if still on the same session
        if (get().currentSessionKey !== currentSessionKey) return;

        set({ messages: finalMessages, loading: false });

        // Auto-generate session label from first user message
        const isMainSession = currentSessionKey.endsWith(':main');
        if (!isMainSession) {
          const firstUser = finalMessages.find((m) => m.role === 'user');
          if (firstUser) {
            const text = getMessageText(firstUser.content).trim();
            if (text && !get().sessionLabels[currentSessionKey]) {
              const truncated = text.length > 50 ? `${text.slice(0, 50)}…` : text;
              set((s) => ({ sessionLabels: { ...s.sessionLabels, [currentSessionKey]: truncated } }));
            }
          }
        }

        // Update last activity
        const lastMsg = finalMessages[finalMessages.length - 1];
        if (lastMsg?.timestamp) {
          set((s) => ({ sessionLastActivity: { ...s.sessionLastActivity, [currentSessionKey]: toMs(lastMsg.timestamp!) } }));
        }

        // Check if assistant responded (stop polling)
        if (get().sending && userMsgAt) {
          const userMsMs = toMs(userMsgAt);
          const hasNewAssistant = finalMessages.some(
            (m) => m.role === 'assistant' && m.timestamp && toMs(m.timestamp) > userMsMs - 2000,
          );
          if (hasNewAssistant) {
            clearPoll();
            set({ sending: false, activeRunId: null, pendingFinal: false, lastUserMessageAt: null, streamingText: '', streamingMessage: null });
          }
        }
      } catch (err) {
        console.error('[chat] loadHistory failed:', err);
        set({ loading: false });
      }

      _lastHistoryLoadAt = Date.now();
    };

    _historyInFlight = load();
    await _historyInFlight;
    _historyInFlight = null;
  },

  // ── Send message ──

  sendMessage: async (text, attachments, targetAgentId) => {
    const trimmed = text.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;
    if (get().sending) return;

    // Resolve target session
    let targetSessionKey = get().currentSessionKey;
    if (targetAgentId) {
      const agent = useAgentsStore.getState().agents.find((a) => a.id === targetAgentId);
      if (agent?.mainSessionKey) {
        targetSessionKey = agent.mainSessionKey;
      }
    }

    // Switch session if needed
    if (targetSessionKey !== get().currentSessionKey) {
      set({
        currentSessionKey: targetSessionKey,
        currentAgentId: getAgentIdFromKey(targetSessionKey),
        messages: [],
        streamingText: '',
        streamingMessage: null,
        error: null,
      });
      await get().loadHistory(true);
    }

    const currentSessionKey = targetSessionKey;
    const nowMs = Date.now();
    const hasMedia = attachments && attachments.length > 0;

    // Optimistic user message
    const userMsg: RawMessage = {
      role: 'user',
      content: trimmed || (hasMedia ? '(file attached)' : ''),
      timestamp: nowMs / 1000,
      id: crypto.randomUUID(),
      _attachedFiles: attachments?.map((a) => ({
        fileName: a.fileName,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        preview: a.preview,
        filePath: a.stagedPath,
      })),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      sending: true,
      error: null,
      activeRunId: null,
      streamingText: '',
      streamingMessage: null,
      lastUserMessageAt: nowMs,
    }));

    // Session label from first message
    const { sessionLabels, messages } = get();
    const isFirst = !messages.slice(0, -1).some((m) => m.role === 'user');
    if (!currentSessionKey.endsWith(':main') && isFirst && !sessionLabels[currentSessionKey] && trimmed) {
      const truncated = trimmed.length > 50 ? `${trimmed.slice(0, 50)}…` : trimmed;
      set((s) => ({ sessionLabels: { ...s.sessionLabels, [currentSessionKey]: truncated } }));
    }

    // Activity timestamp
    set((s) => ({ sessionLastActivity: { ...s.sessionLastActivity, [currentSessionKey]: nowMs } }));

    // Start history polling BEFORE the RPC (it may block)
    clearPoll();
    const pollHistory = () => {
      if (!get().sending) { clearPoll(); return; }
      get().loadHistory(true);
      _pollTimer = setTimeout(pollHistory, 2000);
    };
    _pollTimer = setTimeout(pollHistory, 2000);

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (!get().sending) return;
      clearPoll();
      set({
        error: 'No response received. The provider may be unavailable.',
        sending: false,
        activeRunId: null,
        lastUserMessageAt: null,
      });
    }, 90_000);

    try {
      const idempotencyKey = crypto.randomUUID();
      let result: { success: boolean; result?: { runId?: string }; error?: string };

      if (hasMedia) {
        result = await hostApiFetch<{ success: boolean; result?: { runId?: string }; error?: string }>(
          '/api/chat/send-with-media',
          {
            method: 'POST',
            body: JSON.stringify({
              sessionKey: currentSessionKey,
              message: trimmed || 'Process the attached file(s).',
              deliver: false,
              idempotencyKey,
              media: attachments!.map((a) => ({
                filePath: a.stagedPath,
                mimeType: a.mimeType,
                fileName: a.fileName,
              })),
            }),
          },
        );
      } else {
        const rpcResult = await useGatewayStore.getState().rpc<{ runId?: string }>(
          'chat.send',
          { sessionKey: currentSessionKey, message: trimmed, deliver: false, idempotencyKey },
          120_000,
        );
        result = { success: true, result: rpcResult };
      }

      if (result.result?.runId) {
        set({ activeRunId: result.result.runId });
      }

      if (!result.success) {
        clearPoll();
        clearTimeout(safetyTimeout);
        set({ error: result.error || 'Send failed', sending: false, activeRunId: null, lastUserMessageAt: null });
      }
    } catch (err) {
      clearPoll();
      clearTimeout(safetyTimeout);
      set({ error: String(err), sending: false, activeRunId: null, lastUserMessageAt: null });
    }
  },

  // ── Abort run ──

  abortRun: async () => {
    clearPoll();
    const { currentSessionKey } = get();
    set({
      sending: false,
      activeRunId: null,
      streamingText: '',
      streamingMessage: null,
      streamingTools: [],
      pendingFinal: false,
      lastUserMessageAt: null,
    });

    try {
      await useGatewayStore.getState().rpc('chat.abort', { sessionKey: currentSessionKey });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  // ── Handle chat events from Gateway ──
  // ONLY updates streaming state for animation. NEVER touches messages[].

  handleChatEvent: (event: Record<string, unknown>) => {
    const state = (event.state as string) || '';
    const sessionKey = event.sessionKey as string | undefined;

    // Ignore events for other sessions
    if (sessionKey && sessionKey !== get().currentSessionKey) return;

    switch (state) {
      case 'delta': {
        // Update streaming text for typing animation
        const msg = event.message as RawMessage | undefined;
        if (msg) {
          const text = getMessageText(msg.content);
          set({ streamingText: text, streamingMessage: msg });
        }
        break;
      }

      case 'final': {
        // Clear streaming, trigger history load to get the real message
        set({ streamingText: '', streamingMessage: null });
        get().loadHistory(true);
        break;
      }

      case 'error': {
        const errorMsg = (event.errorMessage as string) || (event.error as string) || 'Unknown error';
        clearPoll();
        set({
          error: errorMsg,
          sending: false,
          activeRunId: null,
          streamingText: '',
          streamingMessage: null,
          lastUserMessageAt: null,
        });
        break;
      }

      case 'started': {
        const runId = event.runId as string | undefined;
        if (!get().sending && runId) {
          set({ sending: true, activeRunId: runId, error: null });
        }
        break;
      }

      case 'aborted': {
        clearPoll();
        set({
          sending: false,
          activeRunId: null,
          streamingText: '',
          streamingMessage: null,
          lastUserMessageAt: null,
        });
        get().loadHistory(true);
        break;
      }
    }
  },

  // ── Misc ──

  toggleThinking: () => set((s) => ({ showThinking: !s.showThinking })),
  refresh: async () => { await get().loadSessions(); await get().loadHistory(); },
  clearError: () => set({ error: null }),
}));
