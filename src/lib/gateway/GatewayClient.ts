/**
 * Gateway Client types — adapted from Claw3D for SimOffice
 * Types, helpers, and a client factory that wraps useGatewayStore.rpc()
 */

export interface GatewayClient {
  call<T = unknown>(method: string, params?: unknown): Promise<T>;
}

export function createGatewayClient(): GatewayClient {
  return {
    async call<T = unknown>(method: string, params?: unknown): Promise<T> {
      const { useGatewayStore } = await import('@/stores/gateway');
      return useGatewayStore.getState().rpc<T>(method, params);
    },
  };
}

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
