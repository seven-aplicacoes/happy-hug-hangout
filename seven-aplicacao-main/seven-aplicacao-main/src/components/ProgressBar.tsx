import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  className?: string;
}

const barColors: Record<string, string> = {
  default: 'bg-primary',
  success: 'bg-seven-success',
  warning: 'bg-seven-warning',
  danger: 'bg-seven-danger',
};

export const ProgressBar = ({ value, label, variant = 'default', showValue = true, className }: ProgressBarProps) => (
  <div className={cn('space-y-1', className)}>
    {(label || showValue) && (
      <div className="flex items-center justify-between text-xs">
        {label && <span className="text-muted-foreground">{label}</span>}
        {showValue && <span className="font-medium">{Math.round(value)}%</span>}
      </div>
    )}
    <div className="h-2 w-full rounded-full bg-muted">
      <div className={cn('h-2 rounded-full transition-all', barColors[variant])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  </div>
);
