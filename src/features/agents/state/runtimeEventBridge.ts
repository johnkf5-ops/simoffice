/**
 * Runtime Event Bridge — adapted from Claw3D for SimOffice
 * Types and classifiers for gateway events
 */

export type ChatEventPayload = {
  runId: string;
  sessionKey: string;
  state: "delta" | "final" | "aborted" | "error";
  seq?: number;
  stopReason?: string;
  message?: unknown;
  errorMessage?: string;
};

export type AgentEventPayload = {
  runId: string;
  seq?: number;
  stream?: string;
  data?: Record<string, unknown>;
  sessionKey?: string;
};

export type SummaryPreviewSnapshot = {
  ts: number;
  previews: Array<{
    key: string;
    status: "ok" | "empty" | "missing" | "error";
    items: Array<{ role: string; text: string; timestamp?: number | string }>;
  }>;
};

export type GatewayEventKind =
  | "summary-refresh"
  | "runtime-chat"
  | "runtime-agent"
  | "ignore";

export type ChatHistoryMessage = Record<string, unknown>;

export type HistoryLinesResult = {
  lines: string[];
  lastAssistant: string | null;
  lastAssistantAt: number | null;
  lastRole: string | null;
  lastUser: string | null;
  lastUserAt: number | null;
};

export const classifyGatewayEventKind = (event: string): GatewayEventKind => {
  if (event === "presence" || event === "heartbeat") return "summary-refresh";
  if (event === "chat") return "runtime-chat";
  if (event === "agent") return "runtime-agent";
  return "ignore";
};

const REASONING_STREAM_NAME_HINTS = ["reason", "think", "analysis", "trace"];

export const isReasoningRuntimeAgentStream = (stream: string): boolean => {
  const normalized = stream.trim().toLowerCase();
  return REASONING_STREAM_NAME_HINTS.some((hint) => normalized.includes(hint));
};

export const buildHistoryLines = (messages: ChatHistoryMessage[]): HistoryLinesResult => {
  const lines: string[] = [];
  let lastAssistant: string | null = null;
  let lastAssistantAt: number | null = null;
  let lastRole: string | null = null;
  let lastUser: string | null = null;
  let lastUserAt: number | null = null;

  for (const msg of messages) {
    const role = String(msg.role || "");
    const text = String(msg.content || msg.text || "");
    if (!text) continue;
    lines.push(text);
    lastRole = role;
    if (role === "assistant") {
      lastAssistant = text;
      lastAssistantAt = typeof msg.timestamp === "number" ? msg.timestamp : null;
    }
    if (role === "user") {
      lastUser = text;
      lastUserAt = typeof msg.timestamp === "number" ? msg.timestamp : null;
    }
  }

  return { lines, lastAssistant, lastAssistantAt, lastRole, lastUser, lastUserAt };
};
