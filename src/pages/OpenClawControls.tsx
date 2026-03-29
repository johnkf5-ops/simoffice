/**
 * OpenClaw Controls — Session management, reset policies, maintenance settings.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import { useChatStore } from '@/stores/chat';
import { useGatewayStore } from '@/stores/gateway';
import { useOpenClawControlsStore } from '@/stores/openclawControls';
import { parseControlInput } from '@/lib/openclaw-controls/parser';
import { invokeIpc } from '@/lib/api-client';
import type { ParserPreview } from '../../shared/openclaw-controls';

// ── Styles (match LobbySettings) ──

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid hsl(var(--border))' };
const label: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' };
const desc: React.CSSProperties = { fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 };
const sectionTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginTop: 32, marginBottom: 8 };
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 13, outline: 'none',
};
const selectStyle: React.CSSProperties = { ...inputStyle, width: 240, cursor: 'pointer' };
const btnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const dangerBtn: React.CSSProperties = {
  ...btnStyle,
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: '#fff', border: 'none',
};
const primaryBtn: React.CSSProperties = {
  ...btnStyle,
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: '#fff', border: 'none',
};

// ── Accepted values ──

const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'adaptive', 'xhigh'] as const;
const SEND_POLICIES = ['allow', 'deny'] as const;
const GROUP_ACTIVATIONS = ['mention', 'always'] as const;

export function OpenClawControls() {
  const navigate = useNavigate();

  // ── Stores ──
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const rpc = useGatewayStore((s) => s.rpc);

  const {
    snapshot, loading, error,
    draftIdleMinutes, draftReset, draftMaintenance, dirty, saving,
    loadSnapshot, setDraftIdleMinutes, setDraftReset, setDraftMaintenance, resetDraft, saveGlobalConfig,
  } = useOpenClawControlsStore();

  // ── Local state ──
  const [selectedKey, setSelectedKey] = useState(currentSessionKey);
  const [sessionLabel, setSessionLabel] = useState('');
  const [sessionModel, setSessionModel] = useState('');
  const [sessionThinking, setSessionThinking] = useState('');
  const [sessionVerbose, setSessionVerbose] = useState('');
  const [sessionSendPolicy, setSessionSendPolicy] = useState('');
  const [sessionGroupActivation, setSessionGroupActivation] = useState('');
  const [askInput, setAskInput] = useState('');
  const [preview, setPreview] = useState<ParserPreview | null>(null);
  const [executing, setExecuting] = useState(false);

  // ── Init ──
  useEffect(() => {
    loadSnapshot();
    loadSessions();
  }, []);

  // Seed session fields when selection changes
  const selectedSession = sessions.find((s) => s.key === selectedKey);
  useEffect(() => {
    if (selectedSession) {
      setSessionLabel(selectedSession.displayName ?? selectedSession.label ?? '');
      setSessionModel(selectedSession.model ?? '');
      setSessionThinking(selectedSession.thinkingLevel ?? '');
      setSessionVerbose('');
      setSessionSendPolicy('');
      setSessionGroupActivation('');
    }
  }, [selectedKey, selectedSession?.key]);

  const isGroupSession = selectedKey.includes(':group:') || selectedKey.includes(':channel:');

  // ── Session patch helper ──
  const patchSession = useCallback(async (field: string, value: string | null) => {
    try {
      await rpc('sessions.patch', { key: selectedKey, [field]: value || null });
      await loadSessions();
      if (selectedKey === currentSessionKey) await loadHistory(true);
      toast.success(`Updated ${field}`);
    } catch (err) {
      toast.error(`Failed to update ${field}: ${String(err)}`);
    }
  }, [rpc, selectedKey, currentSessionKey, loadSessions, loadHistory]);

  // ── Session actions ──
  const handleResetSession = async () => {
    try {
      await rpc('sessions.reset', { key: selectedKey, reason: 'reset' });
      await loadSessions();
      if (selectedKey === currentSessionKey) await loadHistory();
      toast.success('Session reset');
    } catch (err) {
      toast.error(`Failed to reset session: ${String(err)}`);
    }
  };

  const handleDeleteSession = async () => {
    try {
      await deleteSession(selectedKey);
      toast.success('Session deleted');
      // Switch to whatever session the store selected
      setSelectedKey(useChatStore.getState().currentSessionKey);
    } catch (err) {
      toast.error(`Failed to delete session: ${String(err)}`);
    }
  };

  // ── Global config save ──
  const handleSave = async () => {
    const result = await saveGlobalConfig();
    if (result.success) {
      toast.success('Global config saved — gateway reloading');
    } else {
      toast.error(`Save failed: ${result.error}`);
    }
  };

  // ── Ask parser ──
  const handleAskChange = (text: string) => {
    setAskInput(text);
    if (text.trim()) {
      setPreview(parseControlInput(text, selectedKey));
    } else {
      setPreview(null);
    }
  };

  const handleExecute = async () => {
    if (!preview || !preview.supported) return;
    setExecuting(true);
    try {
      await preview.execute();
      toast.success(preview.summary);
      setAskInput('');
      setPreview(null);
      await loadSessions();
      await loadSnapshot();
    } catch (err) {
      toast.error(`Failed: ${String(err)}`);
    } finally {
      setExecuting(false);
    }
  };

  // ── Open Advanced Control UI ──
  const handleOpenControlUi = async () => {
    try {
      const url = await invokeIpc<string>('gateway:getControlUiUrl');
      if (url) window.open(url, '_blank');
      else toast.error('Control UI URL not available — is the gateway running?');
    } catch (err) {
      toast.error(`Failed to open control UI: ${String(err)}`);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <BuddyPanel currentPage="/settings" />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)',
          padding: '32px 40px 24px',
        }}>
          <button onClick={() => navigate('/settings')} style={{
            fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none',
            cursor: 'pointer', marginBottom: 8, fontFamily: 'Inter, sans-serif', padding: 0,
          }}>
            &larr; Back to Settings
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            OpenClaw Controls
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>
            Session management, reset policies, maintenance settings
          </p>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 40px 40px' }}>

          {loading && <div style={{ padding: '32px 0', color: 'hsl(var(--muted-foreground))' }}>Loading config...</div>}
          {error && <div style={{ padding: '32px 0', color: '#ef4444' }}>Error: {error}</div>}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Section 1: Selected Session Controls                   */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div style={sectionTitle}>Selected Session</div>

          {/* Session picker */}
          <div style={row}>
            <div>
              <div style={label}>Session</div>
              <div style={desc}>Pick a session to manage</div>
            </div>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              style={selectStyle}
            >
              {sessions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.displayName || s.label || s.key}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div style={row}>
            <div>
              <div style={label}>Label</div>
              <div style={desc}>Display name for this session</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                placeholder="Session label"
                style={{ ...inputStyle, width: 180 }}
              />
              <button onClick={() => patchSession('label', sessionLabel)} style={btnStyle}>Apply</button>
            </div>
          </div>

          {/* Model */}
          <div style={row}>
            <div>
              <div style={label}>Model</div>
              <div style={desc}>Override the default model for this session</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={sessionModel}
                onChange={(e) => setSessionModel(e.target.value)}
                placeholder="e.g. claude-sonnet-4-20250514"
                style={{ ...inputStyle, width: 240 }}
              />
              <button onClick={() => patchSession('model', sessionModel)} style={btnStyle}>Apply</button>
            </div>
          </div>

          {/* Thinking Level */}
          <div style={row}>
            <div>
              <div style={label}>Thinking Level</div>
              <div style={desc}>Controls how much reasoning the model does</div>
            </div>
            <select
              value={sessionThinking}
              onChange={(e) => { setSessionThinking(e.target.value); patchSession('thinkingLevel', e.target.value); }}
              style={selectStyle}
            >
              <option value="">Default</option>
              {THINKING_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Verbose Level */}
          <div style={row}>
            <div>
              <div style={label}>Verbose Level</div>
              <div style={desc}>Controls output verbosity</div>
            </div>
            <select
              value={sessionVerbose}
              onChange={(e) => { setSessionVerbose(e.target.value); patchSession('verboseLevel', e.target.value); }}
              style={selectStyle}
            >
              <option value="">Default (inherit)</option>
              <option value="off">off</option>
              <option value="on">on</option>
              <option value="full">full</option>
            </select>
          </div>

          {/* Send Policy */}
          <div style={row}>
            <div>
              <div style={label}>Send Policy</div>
              <div style={desc}>Allow or deny message sending for this session</div>
            </div>
            <select
              value={sessionSendPolicy}
              onChange={(e) => { setSessionSendPolicy(e.target.value); patchSession('sendPolicy', e.target.value); }}
              style={selectStyle}
            >
              <option value="">Default</option>
              {SEND_POLICIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Group Activation — only for group/channel sessions */}
          {isGroupSession && (
            <div style={row}>
              <div>
                <div style={label}>Group Activation</div>
                <div style={desc}>When the agent responds in group chats</div>
              </div>
              <select
                value={sessionGroupActivation}
                onChange={(e) => { setSessionGroupActivation(e.target.value); patchSession('groupActivation', e.target.value); }}
                style={selectStyle}
              >
                <option value="">Default</option>
                {GROUP_ACTIVATIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}

          {/* Reset / Delete */}
          <div style={{ ...row, borderBottom: 'none', gap: 12, justifyContent: 'flex-start' }}>
            <button onClick={handleResetSession} style={dangerBtn}>Reset Context</button>
            <button onClick={handleDeleteSession} style={dangerBtn}>Delete Session</button>
            <button onClick={handleOpenControlUi} style={btnStyle}>Open Advanced Control UI</button>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Section 2: Global Config Controls                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div style={sectionTitle}>Global Config</div>

          {snapshot && (
            <>
              {/* Idle Minutes */}
              <div style={row}>
                <div>
                  <div style={label}>Global Idle Timeout</div>
                  <div style={desc}>Reset sessions after this many minutes of inactivity (0 = disabled)</div>
                </div>
                <input
                  type="number"
                  min={0}
                  value={draftIdleMinutes ?? 0}
                  onChange={(e) => setDraftIdleMinutes(e.target.value ? parseInt(e.target.value, 10) : null)}
                  style={{ ...inputStyle, width: 120 }}
                />
              </div>

              {/* Reset Mode */}
              <div style={row}>
                <div>
                  <div style={label}>Reset Mode</div>
                  <div style={desc}>How sessions are automatically reset</div>
                </div>
                <select
                  value={draftReset?.mode ?? ''}
                  onChange={(e) => {
                    const mode = e.target.value as 'daily' | 'idle' | '';
                    if (!mode) { setDraftReset(null); return; }
                    setDraftReset({ ...draftReset, mode });
                  }}
                  style={selectStyle}
                >
                  <option value="">None</option>
                  <option value="daily">Daily</option>
                  <option value="idle">Idle</option>
                </select>
              </div>

              {/* Daily: atHour */}
              {draftReset?.mode === 'daily' && (
                <div style={row}>
                  <div>
                    <div style={label}>Daily Reset Hour</div>
                    <div style={desc}>Hour of day (0-23) for daily reset</div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={draftReset.atHour ?? 4}
                    onChange={(e) => setDraftReset({ ...draftReset, atHour: parseInt(e.target.value, 10) })}
                    style={{ ...inputStyle, width: 120 }}
                  />
                </div>
              )}

              {/* Idle: idleMinutes */}
              {draftReset?.mode === 'idle' && (
                <div style={row}>
                  <div>
                    <div style={label}>Reset Idle Minutes</div>
                    <div style={desc}>Minutes of inactivity before reset</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={draftReset.idleMinutes ?? 30}
                    onChange={(e) => setDraftReset({ ...draftReset, idleMinutes: parseInt(e.target.value, 10) })}
                    style={{ ...inputStyle, width: 120 }}
                  />
                </div>
              )}

              {/* Maintenance: pruneAfter */}
              <div style={row}>
                <div>
                  <div style={label}>Prune After</div>
                  <div style={desc}>Remove session entries older than this (e.g. "30d", "12h", "7d")</div>
                </div>
                <input
                  value={draftMaintenance?.pruneAfter ?? ''}
                  onChange={(e) => setDraftMaintenance({ ...draftMaintenance, pruneAfter: e.target.value || undefined })}
                  placeholder="30d"
                  style={{ ...inputStyle, width: 120 }}
                />
              </div>

              {/* Maintenance: maxEntries */}
              <div style={row}>
                <div>
                  <div style={label}>Max Entries</div>
                  <div style={desc}>Maximum session entries to keep</div>
                </div>
                <input
                  type="number"
                  min={1}
                  value={draftMaintenance?.maxEntries ?? ''}
                  onChange={(e) => setDraftMaintenance({ ...draftMaintenance, maxEntries: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  placeholder="500"
                  style={{ ...inputStyle, width: 120 }}
                />
              </div>

              {/* Maintenance: rotateBytes */}
              <div style={row}>
                <div>
                  <div style={label}>Rotate At Size</div>
                  <div style={desc}>Rotate sessions.json at this size (e.g. "10mb", "500mb")</div>
                </div>
                <input
                  value={draftMaintenance?.rotateBytes ?? ''}
                  onChange={(e) => setDraftMaintenance({ ...draftMaintenance, rotateBytes: e.target.value || undefined })}
                  placeholder="10mb"
                  style={{ ...inputStyle, width: 120 }}
                />
              </div>

              {/* Maintenance: mode */}
              <div style={row}>
                <div>
                  <div style={label}>Maintenance Mode</div>
                  <div style={desc}>Enforcement level for maintenance rules</div>
                </div>
                <select
                  value={draftMaintenance?.mode ?? ''}
                  onChange={(e) => {
                    const mode = e.target.value as 'enforce' | 'warn' | '';
                    setDraftMaintenance({ ...draftMaintenance, mode: mode || undefined });
                  }}
                  style={selectStyle}
                >
                  <option value="">Default (warn)</option>
                  <option value="warn">Warn</option>
                  <option value="enforce">Enforce</option>
                </select>
              </div>

              {/* Maintenance: resetArchiveRetention */}
              <div style={row}>
                <div>
                  <div style={label}>Archive Retention</div>
                  <div style={desc}>How long to keep *.reset.* archives (e.g. "30d", or empty to disable)</div>
                </div>
                <input
                  value={draftMaintenance?.resetArchiveRetention === false ? '' : (draftMaintenance?.resetArchiveRetention ?? '')}
                  onChange={(e) => setDraftMaintenance({
                    ...draftMaintenance,
                    resetArchiveRetention: e.target.value || undefined,
                  })}
                  placeholder="30d"
                  style={{ ...inputStyle, width: 120 }}
                />
              </div>

              {/* Enforced flags (read-only info) */}
              <div style={{ ...row, borderBottom: 'none' }}>
                <div>
                  <div style={label}>Enforced Flags</div>
                  <div style={desc}>
                    tools.profile = <strong>full</strong>, tools.sessions.visibility = <strong>all</strong> (managed by SimOffice)
                  </div>
                </div>
              </div>

              {/* Save / Discard */}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  style={{
                    ...primaryBtn,
                    opacity: (!dirty || saving) ? 0.5 : 1,
                    cursor: (!dirty || saving) ? 'default' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Global Config'}
                </button>
                {dirty && (
                  <button onClick={resetDraft} style={btnStyle}>Discard Changes</button>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Section 3: Ask OpenClaw Controls                       */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div style={sectionTitle}>Ask OpenClaw Controls</div>
          <div style={desc}>
            Type a plain-English command (e.g. "reset this session", "set thinking to high", "keep sessions for 7 days")
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input
              value={askInput}
              onChange={(e) => handleAskChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && preview?.supported) handleExecute(); }}
              placeholder="What would you like to do?"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div style={{
              marginTop: 12, padding: 16, borderRadius: 8,
              border: `1px solid ${preview.supported ? (preview.destructive ? '#ef4444' : 'hsl(var(--border))') : 'hsl(var(--border))'}`,
              background: 'hsl(var(--card))',
            }}>
              {preview.supported ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'hsl(var(--foreground))' }}>
                    {preview.summary}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                    {preview.operations.map((op, i) => <div key={i}><code>{op}</code></div>)}
                  </div>
                  {preview.destructive && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                      This action is destructive and cannot be undone.
                    </div>
                  )}
                  {preview.requiresGatewayReload && (
                    <div style={{ marginTop: 4, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                      This will reload the gateway after applying.
                    </div>
                  )}
                  <button
                    onClick={handleExecute}
                    disabled={executing}
                    style={{
                      ...(preview.destructive ? dangerBtn : primaryBtn),
                      marginTop: 12,
                      opacity: executing ? 0.5 : 1,
                    }}
                  >
                    {executing ? 'Executing...' : 'Confirm'}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', whiteSpace: 'pre-line' }}>
                  {preview.message}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
