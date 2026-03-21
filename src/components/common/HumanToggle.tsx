/**
 * HumanToggle — Switch with human-readable labels ("Active" / "Off")
 */
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface HumanToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  labelOn?: string;
  labelOff?: string;
  disabled?: boolean;
}

export function HumanToggle({
  checked,
  onCheckedChange,
  labelOn = 'Active',
  labelOff = 'Off',
  disabled = false,
}: HumanToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'text-xs font-medium transition-colors',
        checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
      )}>
        {checked ? labelOn : labelOff}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
