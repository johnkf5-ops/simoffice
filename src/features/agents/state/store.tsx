/**
 * AgentState type — adapted from Claw3D for SimOffice
 * Minimal interface matching what eventTriggers.ts uses
 */

export type AgentStatus = "idle" | "running" | "error";

export type AgentState = {
  agentId: string;
  name: string;
  sessionKey: string;
  status: AgentStatus;
  runId: string | null;
  runStartedAt: number | null;
  lastUserMessage: string | null;
  lastActivityAt: number | null;
  lastAssistantMessageAt: number | null;
  thinkingTrace: string | null;
  streamText: string | null;
  latestPreview: string | null;
  outputLines: string[];
  transcriptEntries?: TranscriptEntry[];
  // Fields needed by mapAgentToOffice
  avatarSeed?: string | null;
  model?: string | null;
  // Minimal extras
  sessionCreated: boolean;
  awaitingUserInput: boolean;
  hasUnseenActivity: boolean;
  lastResult: string | null;
  lastDiff: string | null;
  latestOverride: string | null;
  latestOverrideKind: "heartbeat" | "cron" | null;
  draft: string;
};

import type { TranscriptEntry } from "./transcript";
