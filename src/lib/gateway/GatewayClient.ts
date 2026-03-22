/**
 * Gateway Client types — adapted from Claw3D for SimOffice
 * Only the types and helpers that eventTriggers.ts needs
 */

export type GatewayStateVersion = number;

export type EventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: GatewayStateVersion;
};

export type GatewayStatus = "connecting" | "connected" | "disconnected" | "error";

export const parseAgentIdFromSessionKey = (sessionKey: string): string | null => {
  const match = sessionKey.match(/^agent:([^:]+):/);
  return match ? match[1] : null;
};

export const isSameSessionKey = (a: string, b: string) => {
  return a === b;
};

export const buildAgentMainSessionKey = (agentId: string, mainKey: string) => {
  const trimmedAgent = agentId.trim();
  const trimmedKey = mainKey.trim() || "main";
  return `agent:${trimmedAgent}:${trimmedKey}`;
};

export function isGatewayDisconnectLikeError(_error: unknown): boolean {
  return false;
}
