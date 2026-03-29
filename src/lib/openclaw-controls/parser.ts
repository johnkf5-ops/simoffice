/**
 * Deterministic parser for "Ask OpenClaw Controls" text input.
 * No LLM — pure regex matching. Maps user text to previewed actions.
 */
import type { ParserPreview } from '../../../shared/openclaw-controls';
import type { OpenClawGlobalPatch } from '../../../shared/openclaw-controls';
import { useGatewayStore } from '@/stores/gateway';
import { useChatStore } from '@/stores/chat';
import { invokeIpc } from '@/lib/api-client';

// ── Synonyms ──

const RESET_VERBS = /^(?:reset|clear|wipe|flush)\b/i;
const DELETE_VERBS = /^(?:delete|remove|destroy|drop)\b/i;
const RENAME_VERBS = /^(?:rename|relabel|name|label|call)\b/i;

// ── Thinking levels ──

const THINKING_LEVELS: Record<string, string> = {
  off: 'off', none: 'off', disable: 'off', disabled: 'off',
  minimal: 'minimal', min: 'minimal',
  low: 'low',
  medium: 'medium', med: 'medium', moderate: 'medium',
  high: 'high',
  adaptive: 'adaptive', auto: 'adaptive',
  xhigh: 'xhigh', 'extra high': 'xhigh', 'extra-high': 'xhigh',
};

// ── Verbose levels ──

const VERBOSE_LEVELS: Record<string, string> = {
  off: 'off', none: 'off', disable: 'off', disabled: 'off', quiet: 'off',
  on: 'on', yes: 'on', enable: 'on', enabled: 'on',
  full: 'full', verbose: 'full', all: 'full',
};

const HELP_MESSAGE = `I can help with:
• Reset or delete this session
• Rename this session to <name>
• Set thinking to <level> (off, minimal, low, medium, high, adaptive, xhigh)
• Set verbose to <level> (off, on, full)
• Set model to <model-name>
• Set send policy to allow/deny
• Set group activation to mention/always
• Keep sessions for <N> days
• Reset sessions daily at <hour>
• Reset sessions after <N> minutes idle`;

export function parseControlInput(
  text: string,
  sessionKey: string,
): ParserPreview {
  const input = text.trim();
  if (!input) {
    return { supported: false, message: HELP_MESSAGE };
  }

  const lower = input.toLowerCase();

  // ── Session reset ──
  if (RESET_VERBS.test(lower) && /\b(?:this|current|the)?\s*(?:session|context|conversation|chat)\b/i.test(lower)) {
    return {
      supported: true,
      summary: `Reset session "${sessionKey}"`,
      operations: [`sessions.reset({ key: "${sessionKey}", reason: "reset" })`],
      destructive: true,
      requiresGatewayReload: false,
      execute: async () => {
        await useGatewayStore.getState().rpc('sessions.reset', { key: sessionKey, reason: 'reset' });
        await useChatStore.getState().loadSessions();
        if (useChatStore.getState().currentSessionKey === sessionKey) {
          await useChatStore.getState().loadHistory();
        }
      },
    };
  }

  // ── Session delete ──
  if (DELETE_VERBS.test(lower) && /\b(?:this|current|the)?\s*(?:session|conversation|chat)\b/i.test(lower)) {
    return {
      supported: true,
      summary: `Delete session "${sessionKey}"`,
      operations: [`deleteSession("${sessionKey}")`],
      destructive: true,
      requiresGatewayReload: false,
      execute: async () => {
        await useChatStore.getState().deleteSession(sessionKey);
      },
    };
  }

  // ── Session rename ──
  const renameMatch = input.match(
    /(?:rename|relabel|name|label|call)\b.*?(?:to|as)\s+(.+)/i,
  );
  if (renameMatch && RENAME_VERBS.test(lower)) {
    const newLabel = renameMatch[1].trim().replace(/^["']|["']$/g, '');
    if (newLabel) {
      return {
        supported: true,
        summary: `Rename session to "${newLabel}"`,
        operations: [`sessions.patch({ key: "${sessionKey}", label: "${newLabel}" })`],
        destructive: false,
        requiresGatewayReload: false,
        execute: async () => {
          await useGatewayStore.getState().rpc('sessions.patch', { key: sessionKey, label: newLabel });
          await useChatStore.getState().loadSessions();
        },
      };
    }
  }

  // ── Set thinking ──
  const thinkingMatch = lower.match(
    /(?:set|change|switch|update|make|use)\s+(?:the\s+)?thinking\s+(?:level\s+)?(?:to\s+)?(\S+)/,
  );
  if (thinkingMatch) {
    const level = THINKING_LEVELS[thinkingMatch[1]];
    if (level) {
      return {
        supported: true,
        summary: `Set thinking level to "${level}"`,
        operations: [`sessions.patch({ key: "${sessionKey}", thinkingLevel: "${level}" })`],
        destructive: false,
        requiresGatewayReload: false,
        execute: async () => {
          await useGatewayStore.getState().rpc('sessions.patch', { key: sessionKey, thinkingLevel: level });
          await useChatStore.getState().loadSessions();
        },
      };
    }
  }

  // ── Set verbose ──
  const verboseMatch = lower.match(
    /(?:set|change|switch|update|make|use)\s+(?:the\s+)?verbose\s+(?:level\s+)?(?:to\s+)?(\S+)/,
  );
  if (verboseMatch) {
    const level = VERBOSE_LEVELS[verboseMatch[1]];
    if (level) {
      return {
        supported: true,
        summary: `Set verbose level to "${level}"`,
        operations: [`sessions.patch({ key: "${sessionKey}", verboseLevel: "${level}" })`],
        destructive: false,
        requiresGatewayReload: false,
        execute: async () => {
          await useGatewayStore.getState().rpc('sessions.patch', { key: sessionKey, verboseLevel: level });
          await useChatStore.getState().loadSessions();
        },
      };
    }
  }

  // ── Set model ──
  const modelMatch = input.match(
    /(?:set|change|switch|update|make|use)\s+(?:the\s+)?model\s+(?:to\s+)?(\S+)/i,
  );
  if (modelMatch) {
    const model = modelMatch[1];
    return {
      supported: true,
      summary: `Set model to "${model}"`,
      operations: [`sessions.patch({ key: "${sessionKey}", model: "${model}" })`],
      destructive: false,
      requiresGatewayReload: false,
      execute: async () => {
        await useGatewayStore.getState().rpc('sessions.patch', { key: sessionKey, model });
        await useChatStore.getState().loadSessions();
      },
    };
  }

  // ── Set send policy ──
  const sendMatch = lower.match(
    /(?:set|change|switch|update|make|use)\s+(?:the\s+)?send\s*policy\s+(?:to\s+)?(allow|deny)/,
  );
  if (sendMatch) {
    const policy = sendMatch[1] as 'allow' | 'deny';
    return {
      supported: true,
      summary: `Set send policy to "${policy}"`,
      operations: [`sessions.patch({ key: "${sessionKey}", sendPolicy: "${policy}" })`],
      destructive: false,
      requiresGatewayReload: false,
      execute: async () => {
        await useGatewayStore.getState().rpc('sessions.patch', { key: sessionKey, sendPolicy: policy });
        await useChatStore.getState().loadSessions();
      },
    };
  }

  // ── Set group activation ──
  const groupMatch = lower.match(
    /(?:set|change|switch|update|make|use)\s+(?:the\s+)?group\s*activation\s+(?:to\s+)?(mention|always)/,
  );
  if (groupMatch) {
    const activation = groupMatch[1] as 'mention' | 'always';
    return {
      supported: true,
      summary: `Set group activation to "${activation}"`,
      operations: [`sessions.patch({ key: "${sessionKey}", groupActivation: "${activation}" })`],
      destructive: false,
      requiresGatewayReload: false,
      execute: async () => {
        await useGatewayStore.getState().rpc('sessions.patch', { key: sessionKey, groupActivation: activation });
        await useChatStore.getState().loadSessions();
      },
    };
  }

  // ── Keep sessions for N days ──
  const keepMatch = lower.match(
    /(?:keep|retain|store|save)\s+(?:the\s+)?sessions?\s+(?:for\s+)?(\d+)\s*(day|week|hour|minute|min)s?/,
  );
  if (keepMatch) {
    const n = parseInt(keepMatch[1], 10);
    const unit = keepMatch[2];
    const suffix = unit.startsWith('day') ? 'd' : unit.startsWith('week') ? 'w' : unit.startsWith('hour') ? 'h' : 'm';
    const value = `${n}${suffix}`;
    const patch: OpenClawGlobalPatch = {
      sessionConfig: { maintenance: { pruneAfter: value } },
    };
    return {
      supported: true,
      summary: `Keep sessions for ${n} ${unit}${n !== 1 ? 's' : ''}`,
      operations: [`session.maintenance.pruneAfter = "${value}"`],
      destructive: false,
      requiresGatewayReload: true,
      execute: async () => {
        await invokeIpc('openclawControls:applyGlobalPatch', patch);
      },
    };
  }

  // ── Daily reset ──
  const dailyMatch = lower.match(
    /reset\s+sessions?\s+(?:every\s+day|daily)\s+(?:at\s+)?(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?/,
  );
  if (dailyMatch) {
    let hour = parseInt(dailyMatch[1], 10);
    const ampm = dailyMatch[3];
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    const patch: OpenClawGlobalPatch = {
      sessionConfig: { reset: { mode: 'daily', atHour: hour } },
    };
    return {
      supported: true,
      summary: `Reset sessions daily at ${hour}:00`,
      operations: [`session.reset = { mode: "daily", atHour: ${hour} }`],
      destructive: false,
      requiresGatewayReload: true,
      execute: async () => {
        await invokeIpc('openclawControls:applyGlobalPatch', patch);
      },
    };
  }

  // ── Idle reset ──
  const idleMatch = lower.match(
    /reset\s+sessions?\s+(?:after\s+)?(\d+)\s*(?:min(?:utes?)?|m)\s*(?:idle|of\s+inactivity)?/,
  );
  if (idleMatch) {
    const minutes = parseInt(idleMatch[1], 10);
    const patch: OpenClawGlobalPatch = {
      sessionConfig: { idleMinutes: minutes },
    };
    return {
      supported: true,
      summary: `Reset sessions after ${minutes} minutes idle`,
      operations: [`session.idleMinutes = ${minutes}`],
      destructive: false,
      requiresGatewayReload: true,
      execute: async () => {
        await invokeIpc('openclawControls:applyGlobalPatch', patch);
      },
    };
  }

  return { supported: false, message: HELP_MESSAGE };
}
