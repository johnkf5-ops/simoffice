/**
 * LobbyDoor — Big, bold, AOL-style room button
 * Each door has its own color world and personality.
 */
import { cn } from '@/lib/utils';

interface LobbyDoorProps {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  gradient: string;
  onClick: () => void;
}

export function LobbyDoor({ icon: Icon, label, subtitle, gradient, onClick }: LobbyDoorProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'lobby-card lobby-glow group text-left p-6 flex flex-col items-center justify-center gap-3',
        'min-h-[140px] cursor-pointer',
      )}
    >
      {/* Icon container with section gradient */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{
          background: gradient,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
      >
        <Icon className="w-7 h-7 text-white" strokeWidth={2} />
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="font-bold text-[15px] tracking-tight">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}
