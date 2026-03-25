/**
 * SimOffice Automations — Built from scratch. No ClawX UI.
 * Dark buddy panel + automations management matching SimOffice design.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCronStore } from '@/stores/cron';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import type { CronSchedule } from '@/types/cron';

/** Format a schedule for human display */
function formatSchedule(schedule: string | CronSchedule): string {
  if (typeof schedule === 'string') {
    // Try to humanize common cron patterns
    if (schedule === '0 * * * *') return 'Every hour';
    if (schedule === '*/30 * * * *') return 'Every 30 minutes';
    if (schedule === '*/15 * * * *') return 'Every 15 minutes';
    if (schedule === '*/5 * * * *') return 'Every 5 minutes';
    if (schedule === '0 0 * * *') return 'Every day at midnight';
    if (schedule === '0 9 * * *') return 'Every day at 9am';
    if (schedule === '0 9 * * 1-5') return 'Weekdays at 9am';
    if (schedule === '0 0 * * 0') return 'Every Sunday at midnight';
    return schedule;
  }
  if (schedule.kind === 'every') {
    const mins = Math.round(schedule.everyMs / 60000);
    if (mins < 60) return `Every ${mins} min${mins > 1 ? 's' : ''}`;
    const hrs = Math.round(mins / 60);
    return `Every ${hrs} hour${hrs > 1 ? 's' : ''}`;
  }
  if (schedule.kind === 'at') return `Once at ${schedule.at}`;
  if (schedule.kind === 'cron') return schedule.expr;
  return String(schedule);
}

/** Format a date for human display */
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

export function LobbyAutomations() {
  const navigate = useNavigate();
  const jobs = useCronStore((s) => s.jobs);
  const loading = useCronStore((s) => s.loading);
  const fetchJobs = useCronStore((s) => s.fetchJobs);
  const createJob = useCronStore((s) => s.createJob);
  const toggleJob = useCronStore((s) => s.toggleJob);
  const deleteJob = useCronStore((s) => s.deleteJob);
  const triggerJob = useCronStore((s) => s.triggerJob);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newSchedule, setNewSchedule] = useState('0 * * * *');
  const [creating, setCreating] = useState(false);

  useEffect(() => { void fetchJobs(); }, [fetchJobs]);

  const handleCreate = async () => {
    if (!newName.trim() || !newMessage.trim()) return;
    setCreating(true);
    try {
      await createJob({ name: newName.trim(), message: newMessage.trim(), schedule: newSchedule, enabled: true });
      setNewName('');
      setNewMessage('');
      setNewSchedule('0 * * * *');
      setShowCreate(false);
    } catch { /* error handled by store */ }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this automation?')) return;
    try { await deleteJob(id); } catch { /* error handled by store */ }
  };

  const activeCount = jobs.filter((j) => j.enabled).length;

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ═══ BUDDY PANEL ═══ */}
      <BuddyPanel currentPage="/automations" />

      {/* ═══ CONTENT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Section Header */}
        <div style={{
          padding: '32px 40px 24px 40px',
          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #7dd3fc 100%)',
        }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            ← Back to Lobby
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
              onClick={() => setShowCreate(true)}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: 'white',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              }}>
              + New Automation
            </button>
          </div>

          {/* Create Form */}
          {showCreate && (
            <div style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                New Automation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 4 }}>
                    Name
                  </label>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Daily summary, Morning briefing..."
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 4 }}>
                    What should the AI do?
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Summarize my unread messages and highlight anything urgent..."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none', resize: 'vertical',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 4 }}>
                    Schedule
                  </label>
                  <select
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <option value="*/5 * * * *">Every 5 minutes</option>
                    <option value="*/15 * * * *">Every 15 minutes</option>
                    <option value="*/30 * * * *">Every 30 minutes</option>
                    <option value="0 * * * *">Every hour</option>
                    <option value="0 9 * * *">Every day at 9am</option>
                    <option value="0 9 * * 1-5">Weekdays at 9am</option>
                    <option value="0 0 * * *">Every day at midnight</option>
                    <option value="0 0 * * 0">Every Sunday at midnight</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || !newMessage.trim() || creating}
                    style={{
                      padding: '10px 24px', borderRadius: 10, border: 'none',
                      cursor: newName.trim() && newMessage.trim() && !creating ? 'pointer' : 'default',
                      background: newName.trim() && newMessage.trim() && !creating
                        ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'hsl(var(--muted))',
                      color: 'white', fontSize: 13, fontWeight: 700,
                      opacity: newName.trim() && newMessage.trim() && !creating ? 1 : 0.5,
                    }}>
                    {creating ? 'Creating...' : 'Create Automation'}
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setNewName(''); setNewMessage(''); setNewSchedule('0 * * * *'); }}
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

          {!loading && jobs.length === 0 && !showCreate && (
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

          {/* Job Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.map((job) => (
              <div key={job.id}
                style={{
                  background: 'hsl(var(--card))',
                  border: `1px solid ${job.enabled ? 'rgba(2,132,199,0.25)' : 'hsl(var(--border))'}`,
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all 0.2s',
                  opacity: job.enabled ? 1 : 0.6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 3px 16px rgba(2,132,199,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Icon */}
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
                    {job.message}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                      {formatSchedule(job.schedule)}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
