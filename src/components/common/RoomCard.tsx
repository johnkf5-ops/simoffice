/**
 * RoomCard — Content card with optional section accent color
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  children: ReactNode;
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

export function RoomCard({ children, accentColor, onClick, className }: RoomCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'lobby-card p-5',
        onClick && 'cursor-pointer',
        className,
      )}
      style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
    >
      {children}
    </div>
  );
}
