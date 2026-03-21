/**
 * OpenLobby Dashboard
 * The command center — everything at a glance, nothing buried.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Bot,
  Network,
  Puzzle,
  Clock,
  Cpu,
  ArrowRight,
  Zap,
  Activity,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGatewayStore } from '@/stores/gateway';
import { useAgentsStore } from '@/stores/agents';
import { useChatStore } from '@/stores/chat';
import { useChannelsStore } from '@/stores/channels';

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  gradient: string;
  onClick: () => void;
}

function QuickAction({ icon: Icon, label, description, color, gradient, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="lobby-card lobby-glow group text-left p-5 flex flex-col gap-3 cursor-pointer"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{
          background: gradient,
          boxShadow: `0 4px 14px ${color}33`,
        }}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
      </div>
      <div>
        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
          {label}
          <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200" />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
      </div>
    </button>
  );
}

function StatusCard({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="lobby-card p-5 col-span-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            isOnline
              ? 'bg-emerald-500/10'
              : 'bg-red-500/10',
          )}>
            <Activity
              className={cn(
                'w-6 h-6',
                isOnline ? 'text-emerald-500' : 'text-red-400',
              )}
              strokeWidth={2}
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-semibold text-foreground">Gateway Status</h3>
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide',
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-500',
              )}>
                <div className="relative">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isOnline ? 'bg-emerald-500' : 'bg-red-400',
                  )} />
                  {isOnline && (
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
                  )}
                </div>
                {isOnline ? 'Connected' : 'Offline'}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isOnline
                ? 'OpenClaw Gateway is running and ready for action.'
                : 'Gateway is not connected. Check your configuration.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const sessions = useChatStore((s) => s.sessions);
  const newSession = useChatStore((s) => s.newSession);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  const quickActions: QuickActionProps[] = [
    {
      icon: MessageCircle,
      label: 'Start Chatting',
      description: 'Open a new conversation with your AI assistant.',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      onClick: () => { newSession(); navigate('/'); },
    },
    {
      icon: Bot,
      label: 'Agents',
      description: `${agents?.length ?? 0} agent${(agents?.length ?? 0) !== 1 ? 's' : ''} configured. Create, edit, or deploy.`,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      onClick: () => navigate('/agents'),
    },
    {
      icon: Network,
      label: 'Channels',
      description: 'Connect WhatsApp, Discord, Telegram, and more.',
      color: '#14b8a6',
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      onClick: () => navigate('/channels'),
    },
    {
      icon: Puzzle,
      label: 'Skills',
      description: 'Browse and install skills from ClawHub.',
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      onClick: () => navigate('/skills'),
    },
    {
      icon: Cpu,
      label: 'Models',
      description: 'Configure AI providers and manage API keys.',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      onClick: () => navigate('/models'),
    },
    {
      icon: Clock,
      label: 'Cron Jobs',
      description: 'Schedule recurring tasks and automations.',
      color: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
      onClick: () => navigate('/cron'),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Welcome header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--lobby-glow)), hsl(var(--lobby-amber)))',
              boxShadow: '0 4px 14px hsl(var(--lobby-glow) / 0.2)',
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Welcome to the Lobby
            </h1>
            <p className="text-sm text-muted-foreground">
              Your OpenClaw command center. Everything starts here.
            </p>
          </div>
        </div>
      </div>

      {/* ── Gateway status ── */}
      <StatusCard isOnline={isOnline} />

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="lobby-card p-4 text-center">
          <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--lobby-glow))' }}>
            {agents?.length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-1">Active Agents</div>
        </div>
        <div className="lobby-card p-4 text-center">
          <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--lobby-glow))' }}>
            {sessions?.length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-1">Chat Sessions</div>
        </div>
        <div className="lobby-card p-4 text-center">
          <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--lobby-glow))' }}>
            <Zap className="w-6 h-6 inline" />
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-1">
            {isOnline ? 'Ready' : 'Standby'}
          </div>
        </div>
      </div>

      {/* ── Quick actions grid ── */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}
