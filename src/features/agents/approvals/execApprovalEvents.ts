/**
 * Exec Approval Events — stub for OpenLobby
 * These handle tool execution approval workflows which we skip for MVP
 */
import type { EventFrame } from "@/lib/gateway/GatewayClient";

type RequestedPayload = {
  approvalId: string;
  agentId: string;
  toolName: string;
  input: unknown;
};

type ResolvedPayload = {
  approvalId: string;
  resolution: "approved" | "denied";
};

export const parseExecApprovalRequested = (_event: EventFrame): RequestedPayload | null => {
  return null; // Skip for MVP
};

export const parseExecApprovalResolved = (_event: EventFrame): ResolvedPayload | null => {
  return null; // Skip for MVP
};

export const resolveExecApprovalAgentId = (_params: {
  agents: Array<{ agentId: string; sessionKey: string }>;
  approvalId: string;
  sessionKey?: string;
}): string | null => {
  return null; // Skip for MVP
};
