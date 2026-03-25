/**
 * Meeting Sequencer — orchestrates team meetings via direct Gateway RPC.
 * Bypasses the chat store to avoid session-switching conflicts.
 *
 * Flow:
 *  1. User asks a question
 *  2. For each agent in order: send question + prior responses, wait for reply
 *  3. Return completed MeetingRound
 */
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { useRoomsStore, type MeetingRound, type MeetingResponse } from '@/stores/rooms';
import type { RawMessage } from '@/stores/chat';
import { extractText } from '@/lib/message-utils';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RESPONSE_POLL_INTERVAL_MS = 2_000;
const RESPONSE_TIMEOUT_MS = 90_000;
const SEND_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSessionKey(agentId: string): string {
  const agent = useAgentsStore.getState().agents.find(a => a.id === agentId);
  return agent?.mainSessionKey || `agent:${agentId}:main`;
}

function buildMeetingPrompt(question: string, priorResponses: MeetingResponse[]): string {
  let prompt = `[TEAM MEETING]\n\nQuestion from the user: "${question}"`;

  if (priorResponses.length > 0) {
    prompt += '\n\nWhat your teammates have said so far:';
    for (const r of priorResponses) {
      prompt += `\n\n${r.agentName}: "${r.text}"`;
    }
  }

  prompt += '\n\nIt is now your turn. Respond with your perspective based on your role. If this topic is not relevant to your expertise, respond with just "pass".';

  return prompt;
}

async function fetchLatestAssistantMessage(
  sessionKey: string,
  afterTimestamp: number,
): Promise<string | null> {
  const deadline = Date.now() + RESPONSE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const data = await useGatewayStore.getState().rpc<Record<string, unknown>>(
        'chat.history',
        { sessionKey, limit: 20 },
      );

      const msgs = Array.isArray(data.messages) ? (data.messages as RawMessage[]) : [];

      // Find the latest assistant message after our send timestamp
      for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i];
        if (msg.role !== 'assistant') continue;

        const msgTime = msg.timestamp
          ? (msg.timestamp > 1e12 ? msg.timestamp : msg.timestamp * 1000)
          : 0;

        if (msgTime >= afterTimestamp - 5000) {
          const text = extractText(msg);
          if (text && text.length > 0) return text;
        }
      }
    } catch {
      // RPC failed, retry
    }

    await new Promise(r => setTimeout(r, RESPONSE_POLL_INTERVAL_MS));
  }

  return null; // Timed out
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function runMeeting(
  roomId: string,
  question: string,
  agentIds: string[],
  onUpdate: (round: MeetingRound) => void,
): Promise<MeetingRound> {
  const agents = useAgentsStore.getState().agents;

  const round: MeetingRound = {
    id: `meeting-${Date.now()}`,
    roomId,
    question,
    agentOrder: [...agentIds],
    responses: [],
    status: 'running',
    currentAgentIndex: 0,
    startedAt: Date.now(),
  };

  onUpdate({ ...round });

  for (let i = 0; i < agentIds.length; i++) {
    // Check if aborted
    const current = useRoomsStore.getState().meetingInProgress;
    if (!current || current.status === 'aborted') {
      round.status = 'aborted';
      onUpdate({ ...round });
      return round;
    }

    const agentId = agentIds[i];
    const agent = agents.find(a => a.id === agentId);
    const agentName = agent?.name || agentId;
    const sessionKey = resolveSessionKey(agentId);

    round.currentAgentIndex = i;
    onUpdate({ ...round });

    // Build prompt with accumulated context
    const prompt = buildMeetingPrompt(question, round.responses);
    const sendTime = Date.now();

    try {
      // Send via direct Gateway RPC
      await useGatewayStore.getState().rpc<{ runId?: string }>(
        'chat.send',
        {
          sessionKey,
          message: prompt,
          deliver: false,
          idempotencyKey: `meeting-${round.id}-${agentId}`,
        },
        SEND_TIMEOUT_MS,
      );

      // Wait for response
      const responseText = await fetchLatestAssistantMessage(sessionKey, sendTime);

      if (responseText && responseText.toLowerCase().trim() !== 'pass') {
        round.responses.push({
          agentId,
          agentName,
          text: responseText,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      // Agent failed — note it and continue
      round.responses.push({
        agentId,
        agentName,
        text: `(failed to respond: ${err instanceof Error ? err.message : 'unknown error'})`,
        timestamp: Date.now(),
      });
    }

    onUpdate({ ...round });
  }

  round.status = 'complete';
  onUpdate({ ...round });
  return round;
}
