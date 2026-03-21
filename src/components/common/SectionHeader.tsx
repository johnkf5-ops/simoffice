/**
 * SectionHeader — Reusable page header with colored icon, title, subtitle
 */
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  gradient: string;
  actions?: ReactNode;
}

export function SectionHeader({ icon: Icon, title, subtitle, gradient, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: gradient, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
        >
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
