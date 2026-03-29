/**
 * SimOffice Automations — Redesigned for everyone.
 * Grandma-friendly creation flow, plain English schedules, smart agent picker.
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCronStore } from '@/stores/cron';
import { useAgentsStore } from '@/stores/agents';
import { AgentAvatar } from '@/components/common/AgentAvatar';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import { hostApiFetch } from '@/lib/host-api';
import { invokeIpc } from '@/lib/api-client';
import { CHANNEL_ICONS, CHANNEL_NAMES, type ChannelType } from '@/types/channel';
import type { CronJob, CronRunEntry, CronSchedule } from '@/types/cron';
import { INSPIRATION_CARDS, type InspirationCard } from '@/lib/cron/templates';

// ─── Friendly schedule presets ──────────────────────────────────────────────

const FRIENDLY_SCHEDULES = [
  { label: 'Every morning at 8am', value: '0 8 * * *', group: 'daily' },
  { label: 'Every morning at 9am', value: '0 9 * * *', group: 'daily' },
  { label: 'Every afternoon at 12pm', value: '0 12 * * *', group: 'daily' },
  { label: 'Every evening at 6pm', value: '0 18 * * *', group: 'daily' },
  { label: 'Every weekday morning', value: '0 9 * * 1-5', group: 'daily' },
  { label: 'Every hour', value: '0 * * * *', group: 'frequent' },
  { label: 'Every 15 minutes', value: '*/15 * * * *', group: 'frequent' },
  { label: 'Every 30 minutes', value: '*/30 * * * *', group: 'frequent' },
  { label: 'Every Monday morning', value: '0 9 * * 1', group: 'weekly' },
  { label: 'Every Friday evening', value: '0 18 * * 5', group: 'weekly' },
  { label: 'Once a week (Sunday)', value: '0 10 * * 0', group: 'weekly' },
  { label: 'Every day at midnight', value: '0 0 * * *', group: 'daily' },
] as const;

const SCHEDULE_LABEL_MAP = new Map<string, string>(FRIENDLY_SCHEDULES.map((s) => [s.value, s.label]));
const PRESET_VALUES: Set<string> = new Set(FRIENDLY_SCHEDULES.map((s) => s.value));

// ─── Delivery prefix helpers ────────────────────────────────────────────────

const DELIVERY_PREFIX_TEMPLATE =
  '[IMPORTANT: After completing this task, you MUST send your full response to the user via {channel} using the message tool. Do not skip this step.]\n\n';

const EMAIL_DELIVERY_PREFIX_TEMPLATE =
  '[IMPORTANT: After completing this task, you MUST email your full response using the send_email tool. Send to: {email}. Integration: {integrationId}. Use a clear subject line summarizing the result. Do not skip this step.]\n\n';

function buildMessageWithDelivery(userPrompt: string, channelType?: string, emailAddress?: string): string {
  if (!channelType) return userPrompt;
  if (channelType.startsWith('email_')) {
    // Guard: if email integration was removed since job creation, skip delivery — don't
    // fall through to the message-tool path which would produce a wrong prefix.
    if (!emailAddress) return userPrompt;
    return EMAIL_DELIVERY_PREFIX_TEMPLATE
      .replace('{email}', emailAddress)
      .replace('{integrationId}', channelType)
      + userPrompt;
  }
  return DELIVERY_PREFIX_TEMPLATE.replace('{channel}', channelType) + userPrompt;
}

function stripDeliveryPrefix(message: string): string {
  return message
    .replace(/^\[IMPORTANT:[^\]]*\]\n\n/, '')   // Strip delivery first (outermost)
    .replace(/^\[Email account:[^\]]*\]\n\n/, ''); // Then strip account (now exposed at start)
}

function getDeliveryChannelFromMessage(message: string): string | undefined {
  // Check for email delivery prefix — extract integration ID (e.g. 'email_gmail')
  const emailMatch = message.match(/^\[IMPORTANT:.*?Integration: (email_\w+)\./);
  if (emailMatch) return emailMatch[1];
  // Check for messaging channel delivery prefix
  const match = message.match(/^\[IMPORTANT:.*?via (\w+) using the message tool/);
  return match?.[1];
}

// ─── Cron expression helpers (preserved from previous implementation) ───────

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function validateCron(expr: string): { valid: boolean; preview: string } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { valid: false, preview: 'Expected 5 fields: min hour day month weekday' };

  const fieldPattern = /^(\*|(\d+(-\d+)?(,\d+(-\d+)?)*))(\/\d+)?$/;
  for (const field of parts) {
    if (!fieldPattern.test(field)) return { valid: false, preview: `Invalid field: ${field}` };
  }

  const checkRange = (field: string, max: number): boolean => {
    const nums = field.replace(/\*|\/\d+/g, '').split(/[,-]/).filter(Boolean);
    return nums.every((n) => { const v = Number(n); return Number.isFinite(v) && v >= 0 && v <= max; });
  };
  if (!checkRange(parts[0], 59)) return { valid: false, preview: 'Minutes must be 0-59' };
  if (!checkRange(parts[1], 23)) return { valid: false, preview: 'Hours must be 0-23' };
  if (!checkRange(parts[2], 31)) return { valid: false, preview: 'Day of month must be 0-31' };
  if (!checkRange(parts[3], 12)) return { valid: false, preview: 'Month must be 0-12' };
  if (!checkRange(parts[4], 7)) return { valid: false, preview: 'Day of week must be 0-7' };

  return { valid: true, preview: describeCron(parts[0], parts[1], parts[2], parts[3], parts[4]) };
}

function describeCron(min: string, hour: string, _dom: string, _month: string, dow: string): string {
  if (min.startsWith('*/') && hour === '*' && dow === '*') {
    const interval = Number(min.slice(2));
    return `Every ${interval} minute${interval > 1 ? 's' : ''}`;
  }
  if (min === '0' && hour.startsWith('*/') && dow === '*') {
    const interval = Number(hour.slice(2));
    return `Every ${interval} hour${interval > 1 ? 's' : ''}`;
  }

  const hourNum = Number(hour);
  const minNum = Number(min);
  let timeStr = '';
  if (hour !== '*' && min !== '*' && !hour.includes('/') && !min.includes('/')) {
    const h = hourNum % 12 || 12;
    const ampm = hourNum < 12 ? 'AM' : 'PM';
    timeStr = `${h}:${String(minNum).padStart(2, '0')} ${ampm}`;
  }

  if (dow !== '*') {
    const dayNames = dow.split(',').map((d) => {
      if (d === '1-5') return 'Weekdays';
      if (d === '0,6' || d === '6,0') return 'Weekends';
      const name = DAYS_OF_WEEK[Number(d)];
      return name ? name + 's' : d;
    }).join(', ');
    return timeStr ? `${dayNames} at ${timeStr}` : `Every ${dayNames}`;
  }

  if (timeStr) return `Every day at ${timeStr}`;
  return `${min} ${hour} (custom)`;
}

// ─── Schedule display helpers ───────────────────────────────────────────────

function formatSchedule(schedule: string | CronSchedule): string {
  if (typeof schedule === 'string') {
    const preset = SCHEDULE_LABEL_MAP.get(schedule);
    if (preset) return preset;
    const { valid, preview } = validateCron(schedule);
    return valid ? preview : schedule;
  }
  if (schedule.kind === 'every') {
    const mins = Math.round(schedule.everyMs / 60000);
    if (mins < 60) return `Every ${mins} min${mins > 1 ? 's' : ''}`;
    const hrs = Math.round(mins / 60);
    return `Every ${hrs} hour${hrs > 1 ? 's' : ''}`;
  }
  if (schedule.kind === 'at') return `Once at ${schedule.at}`;
  if (schedule.kind === 'cron') {
    const preset = SCHEDULE_LABEL_MAP.get(schedule.expr);
    if (preset) return preset;
    const { valid, preview } = validateCron(schedule.expr);
    return valid ? preview : schedule.expr;
  }
  return String(schedule);
}

function extractCronExpr(schedule: string | CronSchedule): string {
  if (typeof schedule === 'string') return schedule;
  if (schedule.kind === 'cron') return schedule.expr;
  return '';
}

function extractTz(schedule: string | CronSchedule): string {
  if (typeof schedule === 'object' && schedule.kind === 'cron' && schedule.tz) return schedule.tz;
  return '';
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Never';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function getLocalTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// ─── Custom time picker helpers ─────────────────────────────────────────────

function buildCronFromPicker(hour24: number, minute: number, days: number[]): string {
  const allDays = days.length === 0 || days.length === 7;
  const dow = allDays ? '*' : days.join(',');
  return `${minute} ${hour24} * * ${dow}`;
}

function describePickerSchedule(hour24: number, minute: number, days: number[]): string {
  const h = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  const timeStr = `${h}:${String(minute).padStart(2, '0')} ${ampm}`;

  if (days.length === 0 || days.length === 7) return `Every day at ${timeStr}`;
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return `Weekdays at ${timeStr}`;
  if (days.length === 2 && days.includes(0) && days.includes(6)) return `Weekends at ${timeStr}`;

  const names = days.map((d) => DAYS_OF_WEEK[d]?.slice(0, 3) || String(d));
  return `${names.join(', ')} at ${timeStr}`;
}

// ─── Status dot ─────────────────────────────────────────────────────────────

function StatusDot({ job }: { job: CronJob }) {
  let color = 'hsl(var(--muted-foreground))';
  let title = 'Never run';
  if (job.lastRun) {
    if (job.lastRun.success) {
      color = '#22c55e'; title = 'Last run succeeded';
    } else {
      color = '#ef4444'; title = 'Last run failed';
    }
  }
  return (
    <div title={title} style={{
      width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
    }} />
  );
}

// ─── Run history formatting ─────────────────────────────────────────────────

function formatRunTimestamp(entry: CronRunEntry): string {
  const ms = entry.ts ?? entry.runAtMs;
  if (!ms) return 'Unknown';
  const d = new Date(ms < 1e12 ? ms * 1000 : ms);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDurationMs(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms)) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}

// ─── Shared styles ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
  border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 4,
};

// ─── Channel option type ────────────────────────────────────────────────────

interface ChannelOption {
  label: string;
  channelType: string;
  accountId: string;
}

interface ConnectedEmail {
  id: string;          // e.g. 'email_gmail'
  emailAddress: string; // e.g. 'you@gmail.com'
}

// ─── Component ──────────────────────────────────────────────────────────────

export function LobbyAutomations() {
  const navigate = useNavigate();
  const jobs = useCronStore((s) => s.jobs);
  const loading = useCronStore((s) => s.loading);
  const fetchJobs = useCronStore((s) => s.fetchJobs);
  const createJob = useCronStore((s) => s.createJob);
  const updateJob = useCronStore((s) => s.updateJob);
  const toggleJob = useCronStore((s) => s.toggleJob);
  const deleteJob = useCronStore((s) => s.deleteJob);
  const triggerJob = useCronStore((s) => s.triggerJob);
  const runHistory = useCronStore((s) => s.runHistory);
  const runHistoryLoading = useCronStore((s) => s.runHistoryLoading);
  const fetchRunHistory = useCronStore((s) => s.fetchRunHistory);

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);

  // ── Form state ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState('');
  const [formSchedule, setFormSchedule] = useState('0 9 * * *');
  const [formAgentId, setFormAgentId] = useState('');
  const [formDeliveryChannel, setFormDeliveryChannel] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // ── Custom time picker state ────────────────────────────────────────────
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(9);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerDays, setPickerDays] = useState<number[]>([]);

  // ── Advanced (raw cron + timezone) ──────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formCustomCron, setFormCustomCron] = useState('');
  const [formTz, setFormTz] = useState(getLocalTz());

  // ── Activity feed ────────────────────────────────────────────────────────
  const [recentRuns, setRecentRuns] = useState<Array<CronRunEntry & { jobName: string }>>([]);

  // ── Connected channels for delivery ─────────────────────────────────────
  const [connectedChannels, setConnectedChannels] = useState<ChannelOption[]>([]);
  const [connectedEmails, setConnectedEmails] = useState<ConnectedEmail[]>([]);
  const [formEmailAccountId, setFormEmailAccountId] = useState('');
  const [connectedIntegrationIds, setConnectedIntegrationIds] = useState<Set<string>>(new Set());

  // ── Agent search (for 6+ agents) ────────────────────────────────────────
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  useEffect(() => { void fetchJobs(); }, [fetchJobs]);
  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  // Fetch recent runs for activity feed
  useEffect(() => {
    if (jobs.length === 0) { setRecentRuns([]); return; }
    Promise.all(
      jobs.slice(0, 20).map(async (job) => {
        try {
          const data = await hostApiFetch<{ runs: CronRunEntry[] }>(
            `/api/cron/runs/${encodeURIComponent(job.id)}?limit=3`,
          );
          return data.runs.map((r) => ({ ...r, jobName: job.name }));
        } catch { return []; }
      }),
    ).then((results) => {
      const merged = results.flat().sort((a, b) => {
        const tsA = a.ts ?? a.runAtMs ?? 0;
        const tsB = b.ts ?? b.runAtMs ?? 0;
        return tsB - tsA;
      });
      setRecentRuns(merged.slice(0, 10));
    });
  }, [jobs]);

  // Fetch connected channels for delivery picker
  useEffect(() => {
    hostApiFetch<{ success: boolean; channels: Array<{
      channelType: string;
      accounts: Array<{ accountId: string; name: string; connected: boolean }>;
    }> }>('/api/channels/accounts')
      .then((data) => {
        const options: ChannelOption[] = [];
        for (const ch of data.channels) {
          for (const acc of ch.accounts) {
            if (acc.connected) {
              options.push({
                label: `${ch.channelType.charAt(0).toUpperCase() + ch.channelType.slice(1)}${acc.name ? ` \u2014 ${acc.name}` : ''}`,
                channelType: ch.channelType,
                accountId: acc.accountId,
              });
            }
          }
        }
        setConnectedChannels(options);
      })
      .catch(() => {});
  }, []);

  // Fetch connected email integrations for delivery picker + card gating
  useEffect(() => {
    invokeIpc<Record<string, { configured: boolean; emailAddress?: string }>>('integration:email-details')
      .then((details) => {
        const emails: ConnectedEmail[] = [];
        for (const [id, d] of Object.entries(details)) {
          if (d.configured && d.emailAddress) {
            emails.push({ id, emailAddress: d.emailAddress });
          }
        }
        setConnectedEmails(emails);
      })
      .catch(() => {});
  }, []);

  // Fetch all connected integrations for business card gating
  useEffect(() => {
    invokeIpc<Record<string, { configured: boolean }>>('integration:status-all')
      .then((statuses) => {
        const ids = new Set<string>();
        for (const [id, s] of Object.entries(statuses)) {
          if (s.configured && !id.startsWith('email_')) ids.add(id);
        }
        setConnectedIntegrationIds(ids);
      })
      .catch(() => {});
  }, []);

  // Auto-select agent if only 1
  useEffect(() => {
    if (agents.length === 1 && !formAgentId && showForm) {
      setFormAgentId(agents[0].id);
    }
  }, [agents, formAgentId, showForm]);

  // ── Derived data ────────────────────────────────────────────────────────

  const agentMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const a of agents) map.set(a.id, a);
    return map;
  }, [agents]);

  const agentUsageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      if (job.agentId) counts.set(job.agentId, (counts.get(job.agentId) ?? 0) + 1);
    }
    return counts;
  }, [jobs]);

  const topAgents = useMemo(() => {
    return [...agents].sort((a, b) => (agentUsageCounts.get(b.id) ?? 0) - (agentUsageCounts.get(a.id) ?? 0));
  }, [agents, agentUsageCounts]);

  const cronValidation = useMemo(() => {
    if (!showAdvanced || !formCustomCron.trim()) return null;
    return validateCron(formCustomCron.trim());
  }, [showAdvanced, formCustomCron]);

  const effectiveSchedule = showAdvanced && formCustomCron.trim()
    ? formCustomCron.trim()
    : showCustomPicker
      ? buildCronFromPicker(pickerHour, pickerMinute, pickerDays)
      : formSchedule;

  const visibleCards = useMemo(() => {
    return INSPIRATION_CARDS.filter((card) => {
      if (card.id.startsWith('email')) return connectedEmails.length > 0;
      if (card.integrationId) return connectedIntegrationIds.has(card.integrationId);
      return true;
    });
  }, [connectedEmails, connectedIntegrationIds]);

  const formName = useMemo(() => {
    // Auto-generate name from first few words of prompt
    const raw = stripDeliveryPrefix(formMessage).trim();
    if (!raw) return '';
    const words = raw.split(/\s+/).slice(0, 5).join(' ');
    return words.length > 40 ? words.slice(0, 40) + '\u2026' : words;
  }, [formMessage]);

  const formValid = formMessage.trim() && formAgentId
    && (!showAdvanced || !formCustomCron.trim() || cronValidation?.valid);

  const activeCount = jobs.filter((j) => j.enabled).length;

  // ── Form actions ────────────────────────────────────────────────────────

  function resetForm() {
    setShowForm(false);
    setEditingJobId(null);
    setFormMessage('');
    setFormSchedule('0 9 * * *');
    setFormAgentId('');
    setFormDeliveryChannel('');
    setFormEmailAccountId('');
    setSaving(false);
    setShowCustomPicker(false);
    setPickerHour(9);
    setPickerMinute(0);
    setPickerDays([]);
    setShowAdvanced(false);
    setFormCustomCron('');
    setFormTz(getLocalTz());
    setShowAllAgents(false);
    setAgentSearch('');
  }

  function openCreate(card?: InspirationCard) {
    resetForm();
    setShowForm(true);
    if (card) {
      setFormMessage(card.promptStart);
      setFormSchedule(card.defaultSchedule);
      // Auto-select email account if this is an email card
      if (card.id.startsWith('email') && connectedEmails.length > 0) {
        setFormEmailAccountId(connectedEmails[0].id);
      }
    }
    if (agents.length === 1) setFormAgentId(agents[0].id);
  }

  function openEdit(job: CronJob) {
    const cronExpr = extractCronExpr(job.schedule);
    const tz = extractTz(job.schedule);
    const delivery = getDeliveryChannelFromMessage(job.message);
    const rawMessage = stripDeliveryPrefix(job.message);

    // Extract email account binding — no ^ anchor because delivery prefix may precede it
    const emailAccountMatch = job.message.match(/\[Email account: (email_\w+)/);
    setFormEmailAccountId(emailAccountMatch?.[1] || '');

    setEditingJobId(job.id);
    setFormMessage(rawMessage);
    setFormAgentId(job.agentId || '');
    setFormDeliveryChannel(delivery || '');
    // Clear email delivery if that integration is no longer connected
    if (delivery?.startsWith('email_') && !connectedEmails.some((em) => em.id === delivery)) {
      setFormDeliveryChannel('');
    }
    setFormTz(tz || getLocalTz());

    if (cronExpr && PRESET_VALUES.has(cronExpr)) {
      setFormSchedule(cronExpr);
      setShowCustomPicker(false);
      setShowAdvanced(false);
    } else if (cronExpr) {
      // Non-preset: try to parse into the custom picker
      const parts = cronExpr.trim().split(/\s+/);
      if (parts.length === 5) {
        const min = Number(parts[0]);
        const hr = Number(parts[1]);
        const dow = parts[4];
        if (Number.isFinite(min) && Number.isFinite(hr) && parts[2] === '*' && parts[3] === '*') {
          setShowCustomPicker(true);
          setPickerHour(hr);
          setPickerMinute(min);
          if (dow === '*') {
            setPickerDays([]);
          } else {
            setPickerDays(dow.split(',').map(Number).filter(Number.isFinite));
          }
        } else {
          // Too complex for picker, show advanced
          setShowAdvanced(true);
          setFormCustomCron(cronExpr);
        }
      }
    }

    setShowForm(true);
  }

  async function handleSave() {
    if (!formValid) return;
    setSaving(true);
    try {
      const tz = formTz !== 'UTC' ? formTz : undefined;

      let prompt = formMessage.trim();

      // Prepend email account binding if an email account is selected
      if (formEmailAccountId) {
        const em = connectedEmails.find((e) => e.id === formEmailAccountId);
        if (em) {
          prompt = `[Email account: ${em.id} — ${em.emailAddress}. When this task involves email, use this account.]\n\n${prompt}`;
        }
      }

      // Look up email address if delivering via email
      const emailAddr = connectedEmails.find((em) => em.id === formDeliveryChannel)?.emailAddress;
      const finalMessage = buildMessageWithDelivery(prompt, formDeliveryChannel || undefined, emailAddr);
      const name = formName || 'Automation';

      if (editingJobId) {
        await updateJob(editingJobId, {
          name,
          message: finalMessage,
          schedule: effectiveSchedule,
          agentId: formAgentId,
          tz,
        });
      } else {
        await createJob({
          name,
          message: finalMessage,
          schedule: effectiveSchedule,
          enabled: true,
          agentId: formAgentId,
          tz,
        });
        toast.success('Automation created!');
      }
      resetForm();
    } catch { /* error handled by store */ }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this automation?')) return;
    try { await deleteJob(id); } catch { /* */ }
  }

  function handleScheduleChange(value: string) {
    if (value === '__custom__') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      setFormSchedule(value);
    }
  }

  function toggleDay(day: number) {
    setPickerDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  const toggleHistory = useCallback((jobId: string) => {
    if (expandedHistoryId === jobId) {
      setExpandedHistoryId(null);
    } else {
      setExpandedHistoryId(jobId);
      void fetchRunHistory(jobId);
    }
  }, [expandedHistoryId, fetchRunHistory]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <BuddyPanel currentPage="/automations" />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Section Header */}
        <div style={{
          padding: '32px 40px 24px 40px',
          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #7dd3fc 100%)',
        }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            &larr; Back to Lobby
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Automations
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
            Things that happen on their own
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px 40px' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))',
              background: 'hsl(var(--muted))', padding: '6px 14px', borderRadius: 8,
            }}>
              {activeCount} active / {jobs.length} total
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => openCreate()}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: 'white',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              }}>
              + New Automation
            </button>
          </div>

          {/* ═══ ACTIVITY FEED ═══ */}
          {recentRuns.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Recent Activity
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {recentRuns.map((run, i) => {
                  const isError = run.status === 'error';
                  const ms = run.ts ?? run.runAtMs ?? 0;
                  const ago = ms ? formatDate(new Date(ms < 1e12 ? ms * 1000 : ms).toISOString()) : '';
                  return (
                    <div key={run.sessionId ?? ms ?? i} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                      background: isError ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.04)',
                      border: `1px solid ${isError ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.08)'}`,
                      whiteSpace: 'nowrap', flexShrink: 0, fontSize: 12,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isError ? '#ef4444' : '#22c55e' }} />
                      <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{run.jobName}</span>
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{ago}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ CREATE / EDIT FORM ═══ */}
          {showForm && (
            <div style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 16, padding: 24, marginBottom: 24,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                {editingJobId ? 'Edit Automation' : 'New Automation'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* What should happen? */}
                <div>
                  <label style={labelStyle}>What should happen?</label>
                  <textarea
                    autoFocus
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Summarize my unread messages and highlight anything urgent..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* When? */}
                <div>
                  <label style={labelStyle}>When?</label>
                  {!showCustomPicker && !showAdvanced && (
                    <select
                      value={PRESET_VALUES.has(formSchedule) ? formSchedule : '__custom__'}
                      onChange={(e) => handleScheduleChange(e.target.value)}
                      style={inputStyle}
                    >
                      {FRIENDLY_SCHEDULES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                      <option value="__custom__">Custom time...</option>
                    </select>
                  )}

                  {/* Custom time picker */}
                  {showCustomPicker && !showAdvanced && (
                    <div style={{
                      background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
                      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select value={pickerHour % 12 || 12} onChange={(e) => {
                          const h12 = Number(e.target.value);
                          const isPM = pickerHour >= 12;
                          setPickerHour(isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12));
                        }} style={{ ...inputStyle, width: 70 }}>
                          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>:</span>
                        <select value={pickerMinute} onChange={(e) => setPickerMinute(Number(e.target.value))}
                          style={{ ...inputStyle, width: 70 }}>
                          {[0, 15, 30, 45].map((m) => (
                            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setPickerHour((h) => h < 12 ? h + 12 : h - 12)}
                          style={{
                            padding: '8px 14px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                            background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}>
                          {pickerHour >= 12 ? 'PM' : 'AM'}
                        </button>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>Which days?</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <button key={i} onClick={() => toggleDay(i)}
                              style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 700,
                                background: pickerDays.includes(i) || pickerDays.length === 0
                                  ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'hsl(var(--muted))',
                                color: pickerDays.includes(i) || pickerDays.length === 0 ? 'white' : 'hsl(var(--muted-foreground))',
                              }}>
                              {d}
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                          {pickerDays.length === 0 ? 'All days selected' : ''}
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>
                        {describePickerSchedule(pickerHour, pickerMinute, pickerDays)}
                      </div>

                      <button onClick={() => { setShowCustomPicker(false); setFormSchedule('0 9 * * *'); }}
                        style={{ alignSelf: 'flex-start', fontSize: 12, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Back to presets
                      </button>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                    Times are in {getLocalTz().replace(/_/g, ' ')}
                    {!showAdvanced && (
                      <button onClick={() => setShowAdvanced(true)}
                        style={{ marginLeft: 8, fontSize: 11, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Advanced
                      </button>
                    )}
                  </div>

                  {/* Advanced: raw cron + timezone */}
                  {showAdvanced && (
                    <div style={{
                      marginTop: 8, background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
                      borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <div>
                        <label style={labelStyle}>Cron expression</label>
                        <input value={formCustomCron} onChange={(e) => setFormCustomCron(e.target.value)}
                          placeholder="*/10 * * * *" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                        {cronValidation && (
                          <div style={{ fontSize: 11, marginTop: 4, color: cronValidation.valid ? '#38bdf8' : '#f87171' }}>
                            {cronValidation.preview}
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Timezone</label>
                        <input value={formTz} onChange={(e) => setFormTz(e.target.value)}
                          placeholder="America/New_York" style={inputStyle} />
                      </div>
                      <button onClick={() => { setShowAdvanced(false); setFormCustomCron(''); }}
                        style={{ alignSelf: 'flex-start', fontSize: 12, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Back to simple schedule
                      </button>
                    </div>
                  )}
                </div>

                {/* Which agent? */}
                <div>
                  <label style={labelStyle}>Which agent?</label>
                  {agents.length <= 5 ? (
                    /* Card picker for 1-5 agents */
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {agents.map((agent) => (
                        <button key={agent.id} onClick={() => setFormAgentId(agent.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
                            border: formAgentId === agent.id ? '2px solid #38bdf8' : '1px solid hsl(var(--border))',
                            background: formAgentId === agent.id ? 'rgba(56,189,248,0.08)' : 'hsl(var(--background))',
                            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))',
                          }}>
                          <AgentAvatar agentId={agent.id} name={agent.name} size={24} />
                          {agent.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Searchable list for 6+ agents */
                    <div>
                      {!showAllAgents ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {topAgents.slice(0, 3).map((agent) => (
                            <button key={agent.id} onClick={() => setFormAgentId(agent.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
                                border: formAgentId === agent.id ? '2px solid #38bdf8' : '1px solid hsl(var(--border))',
                                background: formAgentId === agent.id ? 'rgba(56,189,248,0.08)' : 'hsl(var(--background))',
                                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))',
                              }}>
                              <AgentAvatar agentId={agent.id} name={agent.name} size={24} />
                              {agent.name}
                            </button>
                          ))}
                          <button onClick={() => setShowAllAgents(true)}
                            style={{
                              padding: '8px 14px', borderRadius: 10, border: '1px dashed hsl(var(--border))',
                              background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              color: 'hsl(var(--muted-foreground))',
                            }}>
                            Browse all...
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)}
                            placeholder="Search agents..." style={inputStyle} autoFocus />
                          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {agents
                              .filter((a) => !agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()))
                              .map((agent) => (
                                <button key={agent.id} onClick={() => { setFormAgentId(agent.id); setShowAllAgents(false); setAgentSearch(''); }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
                                    border: formAgentId === agent.id ? '2px solid #38bdf8' : '1px solid hsl(var(--border))',
                                    background: formAgentId === agent.id ? 'rgba(56,189,248,0.08)' : 'transparent',
                                    cursor: 'pointer', fontSize: 13, color: 'hsl(var(--foreground))', textAlign: 'left',
                                  }}>
                                  <AgentAvatar agentId={agent.id} name={agent.name} size={22} />
                                  {agent.name}
                                </button>
                              ))}
                          </div>
                          <button onClick={() => { setShowAllAgents(false); setAgentSearch(''); }}
                            style={{ alignSelf: 'flex-start', fontSize: 12, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                            Back
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {formAgentId && (
                    <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                      Handled by: {agentMap.get(formAgentId)?.name || formAgentId}
                    </div>
                  )}
                </div>

                {/* Email account picker — only when email card + multiple accounts */}
                {connectedEmails.length > 1 && formEmailAccountId && (
                  <div>
                    <label style={labelStyle}>Which email account?</label>
                    <select
                      value={formEmailAccountId}
                      onChange={(e) => setFormEmailAccountId(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        fontSize: 13,
                      }}
                    >
                      {connectedEmails.map((em) => (
                        <option key={em.id} value={em.id}>
                          {CHANNEL_NAMES[em.id as ChannelType] || 'Email'} ({em.emailAddress})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* How do you want to hear back? (delivery) */}
                {(connectedChannels.length > 0 || connectedEmails.length > 0) && (
                  <div>
                    <label style={labelStyle}>How do you want to hear back?</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'hsl(var(--foreground))' }}>
                        <input type="radio" name="delivery" checked={!formDeliveryChannel}
                          onChange={() => setFormDeliveryChannel('')} />
                        In SimOffice
                      </label>
                      {connectedEmails.map((em) => (
                        <label key={em.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'hsl(var(--foreground))' }}>
                          <input type="radio" name="delivery"
                            checked={formDeliveryChannel === em.id}
                            onChange={() => setFormDeliveryChannel(em.id)} />
                          {CHANNEL_ICONS[em.id as ChannelType] || '\u{1F4E7}'} {CHANNEL_NAMES[em.id as ChannelType] || 'Email'} ({em.emailAddress})
                        </label>
                      ))}
                      {connectedChannels.map((ch) => (
                        <label key={`${ch.channelType}-${ch.accountId}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'hsl(var(--foreground))' }}>
                          <input type="radio" name="delivery" checked={formDeliveryChannel === ch.channelType}
                            onChange={() => setFormDeliveryChannel(ch.channelType)} />
                          {ch.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={handleSave} disabled={!formValid || saving}
                    style={{
                      padding: '10px 24px', borderRadius: 10, border: 'none',
                      cursor: formValid && !saving ? 'pointer' : 'default',
                      background: formValid && !saving
                        ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'hsl(var(--muted))',
                      color: 'white', fontSize: 13, fontWeight: 700,
                      opacity: formValid && !saving ? 1 : 0.5,
                    }}>
                    {saving ? (editingJobId ? 'Saving...' : 'Creating...') : (editingJobId ? 'Save Changes' : 'Create Automation')}
                  </button>
                  <button onClick={resetForm}
                    style={{
                      padding: '10px 20px', borderRadius: 10,
                      border: '1px solid hsl(var(--border))', background: 'transparent',
                      color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && jobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))' }}>
              Loading automations...
            </div>
          )}

          {/* ═══ EMPTY STATE — Inspiration Cards ═══ */}
          {!loading && jobs.length === 0 && !showForm && (
            <div style={{
              background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
              borderRadius: 16, padding: '40px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                What would you like to happen automatically?
              </div>
              <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 8, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                Pick an idea below or create your own. Your AI agent will handle it on a schedule.
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 10, marginTop: 24, textAlign: 'left',
              }}>
                {visibleCards.map((card) => (
                  <button key={card.id} onClick={() => openCreate(card)}
                    style={{
                      padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.background = 'rgba(56,189,248,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.background = 'hsl(var(--background))'; }}>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>{card.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', lineHeight: 1.3 }}>{card.description}</div>
                  </button>
                ))}
                <button onClick={() => openCreate()}
                  style={{
                    padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                    border: '1px dashed hsl(var(--border))', background: 'transparent',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>+</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Custom</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', lineHeight: 1.3 }}>Start from scratch</div>
                </button>
              </div>
            </div>
          )}

          {/* ═══ JOB CARDS ═══ */}
          {jobs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map((job) => {
                const agent = job.agentId ? agentMap.get(job.agentId) : undefined;
                const tz = extractTz(job.schedule);
                const isEditing = editingJobId === job.id;
                const historyExpanded = expandedHistoryId === job.id;
                const runs = runHistory[job.id] ?? [];
                const historyLoading = runHistoryLoading[job.id] ?? false;
                const deliveryChannel = getDeliveryChannelFromMessage(job.message);

                return (
                  <div key={job.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Card row */}
                    <div
                      style={{
                        background: isEditing ? 'hsl(var(--accent))' : 'hsl(var(--card))',
                        border: `1px solid ${isEditing ? '#38bdf8' : job.enabled ? 'rgba(2,132,199,0.25)' : 'hsl(var(--border))'}`,
                        borderRadius: historyExpanded ? '14px 14px 0 0' : 14,
                        padding: 20, display: 'flex', alignItems: 'center', gap: 16,
                        transition: 'all 0.2s',
                        opacity: job.enabled ? 1 : 0.6,
                      }}
                      onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.boxShadow = '0 3px 16px rgba(2,132,199,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {/* Avatar + status */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        {agent ? (
                          <AgentAvatar agentId={agent.id} name={agent.name} size={48} />
                        ) : (
                          <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: job.enabled ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'hsl(var(--muted))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, flexShrink: 0,
                          }}>
                            {'\u{1F504}'}
                          </div>
                        )}
                        <StatusDot job={job} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
                          color: 'hsl(var(--foreground))',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {job.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {stripDeliveryPrefix(job.message)}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                            {formatSchedule(job.schedule)}
                            {tz && tz !== 'UTC' ? ` (${tz.split('/').pop()?.replace(/_/g, ' ')})` : ''}
                          </span>
                          {deliveryChannel && (
                            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                              via {deliveryChannel.startsWith('email_')
                                ? (CHANNEL_NAMES[deliveryChannel as ChannelType] || 'Email')
                                : deliveryChannel.charAt(0).toUpperCase() + deliveryChannel.slice(1)}
                            </span>
                          )}
                          {job.lastRun && (
                            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                              Last: {formatDate(job.lastRun.time)}
                              {job.lastRun.success === false && (
                                <span style={{ color: '#f87171', marginLeft: 4 }}>failed</span>
                              )}
                            </span>
                          )}
                          {job.nextRun && (
                            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                              Next: {formatDate(job.nextRun)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => toggleHistory(job.id)} title="Run history"
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: `1px solid ${historyExpanded ? '#38bdf8' : 'hsl(var(--border))'}`,
                            background: historyExpanded ? 'rgba(56,189,248,0.1)' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: historyExpanded ? '#38bdf8' : 'hsl(var(--foreground))',
                          }}>
                          {historyExpanded ? '\u25BE' : '\u25B8'}
                        </button>
                        <button onClick={() => { if (!showForm) openEdit(job); }} title="Edit"
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: `1px solid ${isEditing ? '#38bdf8' : 'hsl(var(--border))'}`,
                            background: isEditing ? 'rgba(56,189,248,0.1)' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: isEditing ? '#38bdf8' : 'hsl(var(--foreground))',
                          }}>
                          {'\u270E'}
                        </button>
                        <button onClick={() => triggerJob(job.id)} title="Run now"
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: '1px solid hsl(var(--border))', background: 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13,
                          }}>
                          {'\u25B6'}
                        </button>
                        <button onClick={() => toggleJob(job.id, !job.enabled)}
                          style={{
                            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                            background: job.enabled
                              ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'hsl(var(--muted))',
                            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                          }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: 'white',
                            position: 'absolute', top: 3,
                            left: job.enabled ? 23 : 3, transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </button>
                        <button onClick={() => handleDelete(job.id)} title="Remove"
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: '1px solid hsl(var(--border))', background: 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: '#ef4444',
                          }}>
                          {'\u2715'}
                        </button>
                      </div>
                    </div>

                    {/* Run History Panel */}
                    {historyExpanded && (
                      <div style={{
                        background: 'hsl(var(--card))',
                        borderLeft: '1px solid rgba(2,132,199,0.25)',
                        borderRight: '1px solid rgba(2,132,199,0.25)',
                        borderBottom: '1px solid rgba(2,132,199,0.25)',
                        borderRadius: '0 0 14px 14px',
                        padding: '12px 20px 16px 20px',
                      }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))',
                          marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                          Run History
                        </div>

                        {historyLoading && (
                          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', padding: '8px 0' }}>
                            Loading...
                          </div>
                        )}

                        {!historyLoading && runs.length === 0 && (
                          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', padding: '8px 0' }}>
                            No runs yet. Trigger manually or wait for the next scheduled run.
                          </div>
                        )}

                        {!historyLoading && runs.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {runs.slice(0, 5).map((run, i) => {
                              const isError = run.status === 'error';
                              const ts = formatRunTimestamp(run);
                              const duration = formatDurationMs(run.durationMs);

                              return (
                                <div key={run.sessionId ?? run.ts ?? i} style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 10,
                                  padding: '8px 10px', borderRadius: 8,
                                  background: isError ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.04)',
                                  border: `1px solid ${isError ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)'}`,
                                }}>
                                  <div style={{
                                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                                    background: isError ? '#ef4444' : '#22c55e',
                                  }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{ts}</span>
                                      {duration && <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{duration}</span>}
                                    </div>
                                    {(run.summary || run.error) && (
                                      <div style={{
                                        fontSize: 12, marginTop: 3,
                                        color: isError ? '#f87171' : 'hsl(var(--muted-foreground))',
                                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                        maxHeight: 60, overflow: 'hidden',
                                      }}>
                                        {isError ? run.error : run.summary}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {runs.length > 5 && (
                              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 4 }}>
                                Showing 5 of {runs.length} runs
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Inspiration cards when jobs exist (shown below job list) */}
          {jobs.length > 0 && !showForm && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ideas
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {visibleCards.map((card) => (
                  <button key={card.id} onClick={() => openCreate(card)}
                    style={{
                      padding: '8px 14px', borderRadius: 10, border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))', cursor: 'pointer', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                      color: 'hsl(var(--foreground))', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}>
                    {card.icon} {card.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
