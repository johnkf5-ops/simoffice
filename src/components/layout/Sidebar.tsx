/**
 * SimOffice Sidebar
 * Human language. AOL energy. AIM buddy vibes.
 */
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MessageCircle,
  Bot,
  Plug,
  Zap as Powers,
  Clock,
  Brain,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusDot } from '@/components/common/StatusDot';
import { useSettingsStore } from '@/stores/settings';
import { useChatStore } from '@/stores/chat';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTranslation } from 'react-i18next';

type SessionBucketKey = 'today' | 'yesterday' | 'withinWeek' | 'withinTwoWeeks' | 'withinMonth' | 'older';

function getSessionBucket(activityMs: number, nowMs: number): SessionBucketKey {
  if (!activityMs || activityMs <= 0) return 'older';
  const now = new Date(nowMs);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  if (activityMs >= startOfToday) return 'today';
  if (activityMs >= startOfYesterday) return 'yesterday';
  const daysAgo = (startOfToday - activityMs) / (24 * 60 * 60 * 1000);
  if (daysAgo <= 7) return 'withinWeek';
  if (daysAgo <= 14) return 'withinTwoWeeks';
  if (daysAgo <= 30) return 'withinMonth';
  return 'older';
}

function getAgentIdFromSessionKey(sessionKey: string): string {
  if (!sessionKey.startsWith('agent:')) return 'main';
  const [, agentId] = sessionKey.split(':');
  return agentId || 'main';
}

const INITIAL_NOW_MS = Date.now();

const NAV_ITEMS = [
  { section: '', items: [
    { to: '/', icon: Home, label: 'Lobby', color: 'text-orange-500', end: true },
    { to: '/chat', icon: MessageCircle, label: 'Chat', color: 'text-blue-500' },
  ]},
  { section: 'YOUR STUFF', items: [
    { to: '/assistants', icon: Bot, label: 'Assistants', color: 'text-violet-500' },
    { to: '/connections', icon: Plug, label: 'Connections', color: 'text-teal-500' },
    { to: '/powers', icon: Powers, label: 'Skills', color: 'text-rose-500' },
    { to: '/automations', icon: Clock, label: 'Automations', color: 'text-sky-500' },
  ]},
  { section: 'SETUP', items: [
    { to: '/ai-setup', icon: Brain, label: 'AI Setup', color: 'text-amber-500' },
  ]},
];

export function Sidebar() {
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useSettingsStore((state) => state.setSidebarCollapsed);

  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const sessionLastActivity = useChatStore((s) => s.sessionLastActivity);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const loadHistory = useChatStore((s) => s.loadHistory);

  const gatewayStatus = useGatewayStore((s) => s.status);
  const isGatewayRunning = gatewayStatus.state === 'running';

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const navigate = useNavigate();
  const location = useLocation();
  const isOnChat = location.pathname === '/chat';
  const { t } = useTranslation(['common', 'chat']);

  const [sessionToDelete, setSessionToDelete] = useState<{ key: string; label: string } | null>(null);
  const [nowMs, setNowMs] = useState(INITIAL_NOW_MS);

  useEffect(() => {
    if (!isGatewayRunning) return;
    let cancelled = false;
    const hasExistingMessages = useChatStore.getState().messages.length > 0;
    (async () => {
      await loadSessions();
      if (cancelled) return;
      await loadHistory(hasExistingMessages);
    })();
    return () => { cancelled = true; };
  }, [isGatewayRunning, loadHistory, loadSessions]);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const agentNameById = useMemo(
    () => Object.fromEntries((agents ?? []).map((agent) => [agent.id, agent.name])),
    [agents],
  );

  const getSessionLabel = (key: string, displayName?: string, label?: string) =>
    sessionLabels[key] ?? label ?? displayName ?? key;

  const sessionBuckets: Array<{ key: SessionBucketKey; label: string; sessions: typeof sessions }> = [
    { key: 'today', label: t('chat:historyBuckets.today'), sessions: [] },
    { key: 'yesterday', label: t('chat:historyBuckets.yesterday'), sessions: [] },
    { key: 'withinWeek', label: t('chat:historyBuckets.withinWeek'), sessions: [] },
    { key: 'withinTwoWeeks', label: t('chat:historyBuckets.withinTwoWeeks'), sessions: [] },
    { key: 'withinMonth', label: t('chat:historyBuckets.withinMonth'), sessions: [] },
    { key: 'older', label: t('chat:historyBuckets.older'), sessions: [] },
  ];

  const sessionBucketMap = Object.fromEntries(sessionBuckets.map((b) => [b.key, b])) as Record<
    SessionBucketKey, (typeof sessionBuckets)[number]
  >;

  for (const session of [...sessions].sort((a, b) =>
    (sessionLastActivity[b.key] ?? 0) - (sessionLastActivity[a.key] ?? 0)
  )) {
    const bucketKey = getSessionBucket(sessionLastActivity[session.key] ?? 0, nowMs);
    sessionBucketMap[bucketKey].sessions.push(session);
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col transition-all duration-300 relative',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
      style={{ background: 'hsl(var(--lobby-warm))' }}
    >
      {/* ── Brand ── */}
      <div className={cn('flex items-center h-14 px-4', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--gradient-lobby)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
            >
              <Powers className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">SimOffice</span>
              <span className="text-[10px] text-muted-foreground leading-none">for OpenClaw</span>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--gradient-lobby)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
          >
            <Powers className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-col gap-4 px-3 mt-1">
        {NAV_ITEMS.map((group) => (
          <div key={group.section || 'primary'}>
            {!sidebarCollapsed && group.section && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.section}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    cn('sidebar-item', isActive && 'active', sidebarCollapsed && 'justify-center px-0')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'flex shrink-0 items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                        isActive ? 'bg-white dark:bg-white/10 shadow-sm' : '',
                      )}>
                        <item.icon
                          className={cn('w-[18px] h-[18px]', isActive ? item.color : '')}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                      </div>
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Session history ── */}
      {!sidebarCollapsed && sessions.length > 0 && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 mt-4 pb-2">
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            History
          </div>
          {sessionBuckets.map((bucket) =>
            bucket.sessions.length > 0 ? (
              <div key={bucket.key} className="mb-3">
                <div className="px-3 pb-1 text-[10px] font-medium text-muted-foreground/40">{bucket.label}</div>
                {bucket.sessions.map((s) => {
                  const agentId = getAgentIdFromSessionKey(s.key);
                  const agentName = agentNameById[agentId] || agentId;
                  return (
                    <div key={s.key} className="group relative flex items-center">
                      <button
                        onClick={() => { switchSession(s.key); navigate('/chat'); }}
                        className={cn(
                          'w-full text-left rounded-lg px-3 py-1.5 text-[13px] transition-all duration-200 pr-8',
                          'hover:bg-black/5 dark:hover:bg-white/5',
                          isOnChat && currentSessionKey === s.key
                            ? 'bg-white/60 dark:bg-white/5 text-foreground font-medium shadow-sm'
                            : 'text-muted-foreground',
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                            style={{ background: 'hsl(var(--lobby-glow) / 0.1)', color: 'hsl(var(--lobby-glow))' }}
                          >
                            {agentName}
                          </span>
                          <span className="truncate">{getSessionLabel(s.key, s.displayName, s.label)}</span>
                        </div>
                      </button>
                      <button
                        aria-label="Delete session"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete({ key: s.key, label: getSessionLabel(s.key, s.displayName, s.label) });
                        }}
                        className={cn(
                          'absolute right-1 flex items-center justify-center rounded-md p-1 transition-all',
                          'opacity-0 group-hover:opacity-100',
                          'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-auto p-3 space-y-0.5">
        <div className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs', sidebarCollapsed && 'justify-center px-0')}>
          <StatusDot status={isGatewayRunning ? 'online' : 'error'} size="sm" />
          {!sidebarCollapsed && (
            <span className="text-muted-foreground font-medium">
              {isGatewayRunning ? 'Engine running' : 'Engine off'}
            </span>
          )}
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('sidebar-item', isActive && 'active', sidebarCollapsed && 'justify-center px-0')
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                'flex shrink-0 items-center justify-center w-8 h-8 rounded-lg transition-all',
                isActive ? 'bg-white dark:bg-white/10 shadow-sm' : '',
              )}>
                <SettingsIcon className={cn('w-[18px] h-[18px]', isActive ? 'text-gray-500' : '')} strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              {!sidebarCollapsed && <span className="truncate">Settings</span>}
            </>
          )}
        </NavLink>

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="absolute right-0 top-4 bottom-4 w-px bg-border/50" />

      <ConfirmDialog
        open={!!sessionToDelete}
        title={t('common:actions.confirm')}
        message={t('common:sidebar.deleteSessionConfirm', { label: sessionToDelete?.label })}
        confirmLabel={t('common:actions.delete')}
        cancelLabel={t('common:actions.cancel')}
        variant="destructive"
        onConfirm={async () => {
          if (!sessionToDelete) return;
          await deleteSession(sessionToDelete.key);
          if (currentSessionKey === sessionToDelete.key) navigate('/');
          setSessionToDelete(null);
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </aside>
  );
}
