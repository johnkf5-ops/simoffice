/**
 * OfficeAdapter — Bridges ClawX stores to Claw3D's RetroOffice3D
 *
 * This is the equivalent of Claw3D's OfficeScreen.tsx but minimal:
 * - Subscribes to ClawX gateway events
 * - Feeds them through eventTriggers state machine
 * - Passes resulting animation state to RetroOffice3D
 * - Manages desk assignments
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RetroOffice3D } from '@/features/retro-office/RetroOffice3D';
import type { OfficeAgent } from '@/features/retro-office/core/types';
import type { AgentState } from '@/features/agents/state/store';
import type { EventFrame } from '@/lib/gateway/GatewayClient';
import {
  createOfficeAnimationTriggerState,
  reduceOfficeAnimationTriggerEvent,
  reconcileOfficeAnimationTriggerState,
  buildOfficeAnimationState,
  clearOfficeAnimationTriggerHold,
  type OfficeAnimationTriggerState,
} from '@/lib/office/eventTriggers';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';
import { useChatStore, type RawMessage } from '@/stores/chat';
import { subscribeHostEvent } from '@/lib/host-events';

/**
 * Convert ClawX AgentSummary to Claw3D's AgentState (minimal)
 */
function toAgentState(agent: { id: string; name: string; mainSessionKey: string }, sending: boolean, currentAgentId: string): AgentState {
  const isRunning = sending && agent.id === currentAgentId;
  return {
    agentId: agent.id,
    name: agent.name || 'Unknown',
    sessionKey: agent.mainSessionKey || `agent:${agent.id}:main`,
    status: isRunning ? 'running' : 'idle',
    runId: isRunning ? `run-${agent.id}` : null,
    runStartedAt: null,
    lastUserMessage: null,
    lastActivityAt: null,
    lastAssistantMessageAt: null,
    thinkingTrace: null,
    streamText: null,
    latestPreview: null,
    outputLines: [],
    transcriptEntries: [],
    sessionCreated: true,
    awaitingUserInput: false,
    hasUnseenActivity: false,
    lastResult: null,
    lastDiff: null,
    latestOverride: null,
    latestOverrideKind: null,
    draft: '',
  };
}

/**
 * Convert AgentState to OfficeAgent for the 3D scene
 */
function toOfficeAgent(agent: AgentState): OfficeAgent {
  const isWorking = agent.status === 'running' || Boolean(agent.runId);
  // Deterministic color from ID
  let hash = 0;
  for (let i = 0; i < agent.agentId.length; i++) {
    hash = agent.agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = '#' + ('00000' + (hash & 0x00ffffff).toString(16).toUpperCase()).slice(-6);
  // Deterministic item from ID
  const items = ['globe', 'books', 'coffee', 'palette', 'camera', 'waveform', 'shield', 'fire', 'plant', 'laptop'];
  const item = items[Math.abs(hash) % items.length];

  return {
    id: agent.agentId,
    name: agent.name || 'Unknown',
    status: agent.status === 'error' ? 'error' : isWorking ? 'working' : 'idle',
    color,
    item,
  };
}

/**
 * Convert ClawX gateway notification to Claw3D EventFrame
 */
function toEventFrame(notification: Record<string, unknown>): EventFrame | null {
  const params = notification.params as Record<string, unknown> | undefined;
  if (!params) return null;

  const data = (params.data && typeof params.data === 'object')
    ? params.data as Record<string, unknown>
    : {};

  const state = params.state ?? data.state;
  const message = params.message ?? data.message;
  const runId = params.runId ?? data.runId;
  const sessionKey = params.sessionKey ?? data.sessionKey;

  // Determine event type
  const phase = data.phase ?? params.phase;
  const hasChat = state || message;

  let eventName = 'agent'; // default
  if (hasChat) {
    eventName = 'chat'; // runtime-chat
  }

  return {
    type: 'event',
    event: eventName,
    payload: {
      runId: runId ? String(runId) : undefined,
      sessionKey: sessionKey ? String(sessionKey) : undefined,
      state: state ? String(state) : undefined,
      message,
      phase: phase ? String(phase) : undefined,
      data,
      stream: params.stream ? String(params.stream) : undefined,
      seq: typeof params.seq === 'number' ? params.seq : undefined,
    },
  };
}

export function OfficeAdapter() {
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const sending = useChatStore((s) => s.sending);
  const currentAgentId = useChatStore((s) => s.currentAgentId);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const isOnline = gatewayStatus.state === 'running';

  // Trigger state machine
  const [triggerState, setTriggerState] = useState<OfficeAnimationTriggerState>(
    createOfficeAnimationTriggerState
  );

  // Desk assignments: deskUid → agentId (persisted in localStorage)
  const [deskAssignments, setDeskAssignments] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('openlobby:desk-assignments');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Clock tick for time-based latch expiry
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setClockTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  // Convert ClawX agents to AgentState for the state machine
  const agentStates = useMemo(
    () => (agents ?? []).map(agent => toAgentState(agent, sending, currentAgentId)),
    [agents, sending, currentAgentId],
  );
  const agentStatesRef = useRef(agentStates);
  agentStatesRef.current = agentStates;

  // Track the last user message to detect new sends
  const messages = useChatStore((s) => s.messages);
  const lastUserMsgRef = useRef<string | null>(null);

  // Watch for new user messages and feed them into the trigger state machine
  // This is needed because the gateway doesn't echo user messages back as notifications
  useEffect(() => {
    const userMsgs = messages.filter(m => m.role === 'user');
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    if (!lastUserMsg) return;

    const msgId = lastUserMsg.id || '';
    if (msgId === lastUserMsgRef.current) return;
    lastUserMsgRef.current = msgId;

    // Extract text from the user message
    const content = lastUserMsg.content;
    const text = typeof content === 'string' ? content : '';
    if (!text) return;

    // Create a synthetic "chat" event with the user's message
    const syntheticFrame: EventFrame = {
      type: 'event',
      event: 'chat',
      payload: {
        runId: `user-${Date.now()}`,
        sessionKey: currentSessionKey,
        state: 'final',
        message: { role: 'user', content: text },
      },
    };

    console.log('[OfficeAdapter] User message detected:', text);
    console.log('[OfficeAdapter] Session key:', currentSessionKey);
    console.log('[OfficeAdapter] Agents:', agentStatesRef.current.map(a => a.agentId));

    const prevState = triggerState;
    const nextState = reduceOfficeAnimationTriggerEvent({
      state: prevState,
      event: syntheticFrame,
      agents: agentStatesRef.current,
    });

    console.log('[OfficeAdapter] Trigger state after reduce:', {
      deskHold: nextState.deskHoldByAgentId,
      gymUntil: nextState.manualGymUntilByAgentId,
      workingUntil: nextState.workingUntilByAgentId,
    });

    setTriggerState(nextState);
  }, [messages, currentSessionKey]);

  // Subscribe to gateway events (assistant responses) and feed through the trigger state machine
  useEffect(() => {
    if (!isOnline) return;

    const unsub = subscribeHostEvent<Record<string, unknown>>(
      'gateway:notification',
      (notification) => {
        const frame = toEventFrame(notification);
        if (!frame) return;

        setTriggerState(prev =>
          reduceOfficeAnimationTriggerEvent({
            state: prev,
            event: frame,
            agents: agentStatesRef.current,
          })
        );
      },
    );

    return unsub;
  }, [isOnline]);

  // Reconcile trigger state when agents change (recover durable holds)
  useEffect(() => {
    if (agentStates.length === 0) return;
    setTriggerState(prev =>
      reconcileOfficeAnimationTriggerState({
        state: prev,
        agents: agentStates,
      })
    );
  }, [agentStates]);

  // Build final animation state from triggers
  const animationState = useMemo(() => {
    void clockTick; // dependency for time-based expiry
    return buildOfficeAnimationState({
      state: triggerState,
      agents: agentStates,
      nowMs: Date.now(),
    });
  }, [triggerState, agentStates, clockTick]);

  // Build OfficeAgent array with latched working status
  const officeAgents = useMemo(() => {
    void clockTick;
    const now = Date.now();
    return agentStates.map(agent => {
      const latchedWorking = (animationState.workingUntilByAgentId[agent.agentId] ?? 0) > now;
      const deskHeld = Boolean(animationState.deskHoldByAgentId[agent.agentId]);
      const gymHeld = Boolean(animationState.gymHoldByAgentId[agent.agentId]);

      const effectiveAgent: AgentState =
        (latchedWorking || deskHeld || gymHeld) && agent.status !== 'error'
          ? { ...agent, status: 'running', runId: agent.runId ?? `hold-${agent.agentId}` }
          : agent;

      return toOfficeAgent(effectiveAgent);
    });
  }, [agentStates, animationState, clockTick]);

  // Desk assignment callbacks
  const handleDeskAssignmentChange = useCallback((deskUid: string, agentId: string) => {
    setDeskAssignments(prev => {
      const next = { ...prev, [deskUid]: agentId };
      localStorage.setItem('openlobby:desk-assignments', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleDeskAssignmentsReset = useCallback(() => {
    setDeskAssignments({});
    localStorage.removeItem('openlobby:desk-assignments');
  }, []);

  // Room hold release callbacks
  const handleGithubReviewDismiss = useCallback(() => {
    setTriggerState(prev => clearOfficeAnimationTriggerHold({ state: prev, hold: 'github', agentId: '' }));
  }, []);

  const handleQaLabDismiss = useCallback(() => {
    setTriggerState(prev => clearOfficeAnimationTriggerHold({ state: prev, hold: 'qa', agentId: '' }));
  }, []);

  const handlePhoneCallComplete = useCallback((agentId: string) => {
    setTriggerState(prev => clearOfficeAnimationTriggerHold({ state: prev, hold: 'call', agentId }));
  }, []);

  const handleTextMessageComplete = useCallback((agentId: string) => {
    setTriggerState(prev => clearOfficeAnimationTriggerHold({ state: prev, hold: 'text', agentId }));
  }, []);

  return (
    <RetroOffice3D
      agents={officeAgents}
      animationState={animationState}
      deskAssignmentByDeskUid={deskAssignments}
      gatewayStatus={isOnline ? 'connected' : 'disconnected'}
      onDeskAssignmentChange={handleDeskAssignmentChange}
      onDeskAssignmentsReset={handleDeskAssignmentsReset}
      onGithubReviewDismiss={handleGithubReviewDismiss}
      onQaLabDismiss={handleQaLabDismiss}
      onPhoneCallComplete={handlePhoneCallComplete}
      onTextMessageComplete={handleTextMessageComplete}
    />
  );
}
