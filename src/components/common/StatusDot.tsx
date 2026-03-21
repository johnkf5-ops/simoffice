/**
 * StatusDot — Animated online/offline/error indicator
 */
import { cn } from '@/lib/utils';

interface StatusDotProps {
  status: 'online' | 'away' | 'offline' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const SIZE_MAP = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-3 h-3' };
const COLOR_MAP = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  offline: 'bg-gray-400',
  error: 'bg-red-500',
};

export function StatusDot({ status, size = 'md', animate = true }: StatusDotProps) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={cn('rounded-full', SIZE_MAP[size], COLOR_MAP[status])} />
      {animate && status === 'online' && (
        <div className={cn(
          'absolute rounded-full animate-ping opacity-40',
          SIZE_MAP[size],
          COLOR_MAP[status],
        )} />
      )}
    </div>
  );
}
