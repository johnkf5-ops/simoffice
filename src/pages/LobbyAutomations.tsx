/**
 * SimOffice Automations — Built from scratch. No ClawX UI.
 * Dark buddy panel + automations management matching SimOffice design.
 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCronStore } from '@/stores/cron';
import { useAgentsStore } from '@/stores/agents';
import { AgentAvatar } from '@/components/common/AgentAvatar';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import type { CronJob, CronSchedule } from '@/types/cron';

// ─── Schedule presets ────────────────────────────────────────────────────────

const SCHEDULE_PRESETS = [
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9am', value: '0 9 * * *' },
  { label: 'Weekdays at 9am', value: '0 9 * * 1-5' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every Sunday at midnight', value: '0 0 * * 0' },
] as const;

const PRESET_VALUES: Set<string> = new Set(SCHEDULE_PRESETS.map((p) => p.value));

// ─── Common timezones ────────────────────────────────────────────────────────

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Zurich',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'UTC',
];

function getLocalTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function formatTzLabel(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
    const parts = formatter.formatToParts(now);
    const abbr = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    return `${tz.replace(/_/g, ' ')} (${abbr})`;
  } catch {
    return tz;
  }
}

// ─── Cron validation & human-readable preview ────────────────────────────────

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function validateCron(expr: string): { valid: boolean; preview: string } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { valid: false, preview: 'Expected 5 fields: min hour day month weekday' };

  const [min, hour, dom, month, dow] = parts;
  // Basic field validation: each field should match cron syntax
  const fieldPattern = /^(\*|(\d+(-\d+)?(,\d+(-\d+)?)*))(\/\d+)?$/;
  for (const field of parts) {
    if (!fieldPattern.test(field)) return { valid: false, preview: `Invalid field: ${field}` };
  }

  // Range checks
  const checkRange = (field: string, max: number): boolean => {
    const nums = field.replace(/\*|\/\d+/g, '').split(/[,-]/).filter(Boolean);
    return nums.every((n) => { const v = Number(n); return Number.isFinite(v) && v >= 0 && v <= max; });
  };
  if (!checkRange(min, 59)) return { valid: false, preview: 'Minutes must be 0-59' };
  if (!checkRange(hour, 23)) return { valid: false, preview: 'Hours must be 0-23' };
  if (!checkRange(dom, 31)) return { valid: false, preview: 'Day of month must be 0-31' };
  if (!checkRange(month, 12)) return { valid: false, preview: 'Month must be 0-12' };
  if (!checkRange(dow, 7)) return { valid: false, preview: 'Day of week must be 0-7' };

  // Build human-readable preview
  return { valid: true, preview: describeCron(min, hour, dom, month, dow) };
}

function describeCron(min: string, hour: string, _dom: string, _month: string, dow: string): string {
  // Handle common interval patterns
  if (min.startsWith('*/') && hour === '*' && dow === '*') {
    const interval = Number(min.slice(2));
    return `Every ${interval} minute${interval > 1 ? 's' : ''}`;
  }
  if (min === '0' && hour.startsWith('*/') && dow === '*') {
    const interval = Number(hour.slice(2));
    return `Every ${interval} hour${interval > 1 ? 's' : ''}`;
  }

  // Time string
  const hourNum = Number(hour);
  const minNum = Number(min);
  let timeStr = '';
  if (hour !== '*' && min !== '*' && !hour.includes('/') && !min.includes('/')) {
    const h = hourNum % 12 || 12;
    const ampm = hourNum < 12 ? 'AM' : 'PM';
    timeStr = `${h}:${String(minNum).padStart(2, '0')} ${ampm}`;
  }

  // Weekday handling
  if (dow !== '*') {
    const dayNames = dow.split(',').map((d) => {
      if (d === '1-5') return 'Weekdays';
      if (d === '0,6' || d === '6,0') return 'Weekends';
      return DAYS_OF_WEEK[Number(d)] || d;
    }).join(', ');
    return timeStr ? `${dayNames} at ${timeStr}` : `${dayNames}`;
  }

  if (timeStr) return `Every day at ${timeStr}`;
  return `${min} ${hour} (custom)`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSchedule(schedule: string | CronSchedule): string {
  if (typeof schedule === 'string') {
    const preset = SCHEDULE_PRESETS.find((p) => p.value === schedule);
    if (preset) return preset.label;
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
    const preset = SCHEDULE_PRESETS.find((p) => p.value === schedule.expr);
    if (preset) return preset.label;
    const { valid, preview } = validateCron(schedule.expr);
    return valid ? preview : schedule.expr;
  }
  return String(schedule);
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

function extractCronExpr(schedule: string | CronSchedule): string {
  if (typeof schedule === 'string') return schedule;
  if (schedule.kind === 'cron') return schedule.expr;
  return '';
}

function extractTz(schedule: string | CronSchedule): string {
  if (typeof schedule === 'object' && schedule.kind === 'cron' && schedule.tz) return schedule.tz;
  return '';
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
  border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 4,
};

// ─── Component ───────────────────────────────────────────────────────────────

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

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);

  // Form state — shared between create and edit modes
  const [showForm, setShowForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSchedule, setFormSchedule] = useState('0 * * * *');
  const [formCustomCron, setFormCustomCron] = useState('');
  const [isCustomSchedule, setIsCustomSchedule] = useState(false);
  const [formAgentId, setFormAgentId] = useState('');
  const [formTz, setFormTz] = useState(getLocalTz());
  const [saving, setSaving] = useState(false);

  useEffect(() => { void fetchJobs(); }, [fetchJobs]);
  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  // Build timezone list: local tz first, then common, deduped
  const timezones = useMemo(() => {
    const localTz = getLocalTz();
    const seen = new Set<string>();
    const result: string[] = [];
    for (const tz of [localTz, ...COMMON_TIMEZONES]) {
      if (!seen.has(tz)) { seen.add(tz); result.push(tz); }
    }
    return result;
  }, []);

  // Cron validation for custom input
  const cronValidation = useMemo(() => {
    if (!isCustomSchedule || !formCustomCron.trim()) return null;
    return validateCron(formCustomCron.trim());
  }, [isCustomSchedule, formCustomCron]);

  const effectiveSchedule = isCustomSchedule ? formCustomCron.trim() : formSchedule;
  const agentValid = formAgentId !== '';
  const formValid = formName.trim() && formMessage.trim() && agentValid
    && (!isCustomSchedule || (cronValidation?.valid ?? false));

  // Agent lookup for job cards
  const agentMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const a of agents) map.set(a.id, a);
    return map;
  }, [agents]);

  // ─── Form actions ──────────────────────────────────────────────────────────

  function resetForm() {
    setShowForm(false);
    setEditingJobId(null);
    setFormName('');
    setFormMessage('');
    setFormSchedule('0 * * * *');
    setFormCustomCron('');
    setIsCustomSchedule(false);
    setFormAgentId('');
    setFormTz(getLocalTz());
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(job: CronJob) {
    const cronExpr = extractCronExpr(job.schedule);
    const tz = extractTz(job.schedule);
    const isCustom = cronExpr ? !PRESET_VALUES.has(cronExpr) : false;

    setEditingJobId(job.id);
    setFormName(job.name);
    setFormMessage(job.message);
    setFormAgentId(job.agentId || '');
    setFormTz(tz || getLocalTz());
    if (isCustom) {
      setIsCustomSchedule(true);
      setFormCustomCron(cronExpr);
      setFormSchedule('0 * * * *');
    } else {
      setIsCustomSchedule(false);
      setFormSchedule(cronExpr || '0 * * * *');
      setFormCustomCron('');
    }
    setShowForm(true);
  }

  async function handleSave() {
    if (!formValid) return;
    setSaving(true);
    try {
      const tz = formTz !== 'UTC' ? formTz : undefined;
      if (editingJobId) {
        await updateJob(editingJobId, {
          name: formName.trim(),
          message: formMessage.trim(),
          schedule: effectiveSchedule,
          agentId: formAgentId,
          tz,
        });
      } else {
        await createJob({
          name: formName.trim(),
          message: formMessage.trim(),
          schedule: effectiveSchedule,
          enabled: true,
          agentId: formAgentId,
          tz,
        });
      }
      resetForm();
    } catch { /* error handled by store */ }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this automation?')) return;
    try { await deleteJob(id); } catch { /* error handled by store */ }
  }

  function handleScheduleChange(value: string) {
    if (value === '__custom__') {
      setIsCustomSchedule(true);
    } else {
      setIsCustomSchedule(false);
      setFormSchedule(value);
    }
  }

  const activeCount = jobs.filter((j) => j.enabled).length;

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* BUDDY PANEL */}
      <BuddyPanel currentPage="/automations" />

      {/* CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

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
              onClick={openCreate}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: 'white',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              }}>
              + New Automation
            </button>
          </div>

          {/* ═══ CREATE / EDIT FORM ═══ */}
          {showForm && (
            <div style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                {editingJobId ? 'Edit Automation' : 'New Automation'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Name */}
                <div>
                  <label style={labelStyle}>Name</label>
                  <input
                    autoFocus
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Daily summary, Morning briefing..."
                    style={inputStyle}
                  />
                </div>

                {/* Agent Picker */}
                <div>
                  <label style={labelStyle}>Agent</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formAgentId}
                      onChange={(e) => setFormAgentId(e.target.value)}
                      style={{
                        ...inputStyle,
                        appearance: 'none',
                        paddingLeft: formAgentId ? 42 : 14,
                      }}
                    >
                      <option value="">Select an agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                    {formAgentId && (() => {
                      const agent = agentMap.get(formAgentId);
                      return agent ? (
                        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <AgentAvatar agentId={agent.id} name={agent.name} size={22} />
                        </div>
                      ) : null;
                    })()}
                  </div>
                  {!formAgentId && formName.trim() && (
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>
                      An agent is required
                    </div>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <label style={labelStyle}>What should the AI do?</label>
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Summarize my unread messages and highlight anything urgent..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label style={labelStyle}>Schedule</label>
                  <select
                    value={isCustomSchedule ? '__custom__' : formSchedule}
                    onChange={(e) => handleScheduleChange(e.target.value)}
                    style={inputStyle}
                  >
                    {SCHEDULE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                    <option value="__custom__">Custom cron expression...</option>
                  </select>

                  {/* Custom cron input */}
                  {isCustomSchedule && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        value={formCustomCron}
                        onChange={(e) => setFormCustomCron(e.target.value)}
                        placeholder="*/10 * * * *"
                        style={{
                          ...inputStyle,
                          fontFamily: 'monospace',
                          borderColor: cronValidation
                            ? (cronValidation.valid ? 'hsl(var(--border))' : '#f87171')
                            : 'hsl(var(--border))',
                        }}
                      />
                      {cronValidation && (
                        <div style={{
                          fontSize: 11, marginTop: 4,
                          color: cronValidation.valid ? '#38bdf8' : '#f87171',
                        }}>
                          {cronValidation.preview}
                        </div>
                      )}
                      {!cronValidation && formCustomCron.trim() === '' && (
                        <div style={{ fontSize: 11, marginTop: 4, color: 'hsl(var(--muted-foreground))' }}>
                          Format: minute hour day-of-month month day-of-week
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Timezone */}
                <div>
                  <label style={labelStyle}>Timezone</label>
                  <select
                    value={formTz}
                    onChange={(e) => setFormTz(e.target.value)}
                    style={inputStyle}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{formatTzLabel(tz)}</option>
                    ))}
                  </select>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={handleSave}
                    disabled={!formValid || saving}
                    style={{
                      padding: '10px 24px', borderRadius: 10, border: 'none',
                      cursor: formValid && !saving ? 'pointer' : 'default',
                      background: formValid && !saving
                        ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'hsl(var(--muted))',
                      color: 'white', fontSize: 13, fontWeight: 700,
                      opacity: formValid && !saving ? 1 : 0.5,
                    }}>
                    {saving
                      ? (editingJobId ? 'Saving...' : 'Creating...')
                      : (editingJobId ? 'Save Changes' : 'Create Automation')}
                  </button>
                  <button
                    onClick={resetForm}
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

          {!loading && jobs.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                No automations yet
              </div>
              <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
                Create your first automation to have your AI do things on a schedule
              </div>
            </div>
          )}

          {/* ═══ JOB CARDS ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.map((job) => {
              const agent = job.agentId ? agentMap.get(job.agentId) : undefined;
              const tz = extractTz(job.schedule);
              const isEditing = editingJobId === job.id;

              return (
                <div key={job.id}
                  onClick={() => { if (!isEditing && !showForm) openEdit(job); }}
                  style={{
                    background: isEditing ? 'hsl(var(--accent))' : 'hsl(var(--card))',
                    border: `1px solid ${isEditing ? '#38bdf8' : job.enabled ? 'rgba(2,132,199,0.25)' : 'hsl(var(--border))'}`,
                    borderRadius: 14,
                    padding: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.2s',
                    opacity: job.enabled ? 1 : 0.6,
                    cursor: (!isEditing && !showForm) ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.boxShadow = '0 3px 16px rgba(2,132,199,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Agent avatar or generic icon */}
                  {agent ? (
                    <AgentAvatar agentId={agent.id} name={agent.name} size={48} />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: job.enabled
                        ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                        : 'hsl(var(--muted))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                    }}>
                      🔄
                    </div>
                  )}

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
                      {agent ? <span style={{ fontWeight: 600 }}>{agent.name}</span> : null}
                      {agent ? ' — ' : ''}{job.message}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                        {formatSchedule(job.schedule)}
                        {tz && tz !== 'UTC' ? ` (${tz.split('/').pop()?.replace(/_/g, ' ')})` : ''}
                      </span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => triggerJob(job.id)}
                      title="Run now"
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        border: '1px solid hsl(var(--border))', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14,
                      }}>
                      ▶
                    </button>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleJob(job.id, !job.enabled)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none',
                        cursor: 'pointer',
                        background: job.enabled
                          ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                          : 'hsl(var(--muted))',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: 3,
                        left: job.enabled ? 23 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      title="Remove"
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        border: '1px solid hsl(var(--border))', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#ef4444',
                      }}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
