/**
 * TranscriptEntry type — adapted from Claw3D for SimOffice
 */

export type TranscriptEntry = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
  timestamp: number;
  runId?: string | null;
  toolName?: string | null;
};

export const TRANSCRIPT_V2_ENABLED = false;

export function buildOutputLinesFromTranscriptEntries(entries: TranscriptEntry[]): string[] {
  return entries.map(e => e.text).filter(Boolean);
}

export function buildTranscriptEntriesFromLines(lines: string[]): TranscriptEntry[] {
  return lines.map((text, i) => ({
    id: `line-${i}`,
    role: "assistant" as const,
    text,
    timestamp: Date.now(),
  }));
}

export function createTranscriptEntryFromLine(line: string): TranscriptEntry {
  return { id: `line-${Date.now()}`, role: "assistant", text: line, timestamp: Date.now() };
}

export function sortTranscriptEntries(entries: TranscriptEntry[]): TranscriptEntry[] {
  return [...entries].sort((a, b) => a.timestamp - b.timestamp);
}

export function areTranscriptEntriesEqual(a: TranscriptEntry[], b: TranscriptEntry[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((entry, i) => entry.id === b[i].id);
}

export type TranscriptAppendMeta = {
  runId?: string;
  sessionKey?: string;
};

export function logTranscriptDebugMetric(_label: string, _data: unknown): void {}
