/**
 * StatusBanner — Engine online/offline indicator
 * Human language only. No "Gateway" terminology.
 */
import { StatusDot } from '@/components/common/StatusDot';
import { cn } from '@/lib/utils';

interface StatusBannerProps {
  isOnline: boolean;
  onStartEngine?: () => void;
}

export function StatusBanner({ isOnline, onStartEngine }: StatusBannerProps) {
  return (
    <div
      onClick={!isOnline ? onStartEngine : undefined}
      className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300',
        isOnline
          ? 'bg-emerald-500/10 dark:bg-emerald-500/5'
          : 'bg-red-500/10 dark:bg-red-500/5 cursor-pointer hover:bg-red-500/15',
      )}
    >
      <StatusDot status={isOnline ? 'online' : 'error'} size="md" />
      <span className={cn(
        'text-sm font-medium',
        isOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      )}>
        {isOnline ? "Everything's running" : 'Engine is offline — click to start'}
      </span>
    </div>
  );
}
