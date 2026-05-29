import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** Visual hierarchy: hero = grande/herói, default = primário, compact = secundário menor */
  size?: 'hero' | 'default' | 'compact';
  className?: string;
  onClick?: () => void;
}

const accentBar: Record<string, string> = {
  default: 'before:bg-foreground',
  success: 'before:bg-seven-success',
  warning: 'before:bg-seven-warning',
  danger: 'before:bg-seven-danger',
  info: 'before:bg-primary',
};

const iconStyles: Record<string, string> = {
  default: 'text-foreground',
  success: 'text-seven-success',
  warning: 'text-seven-warning',
  danger: 'text-seven-danger',
  info: 'text-primary',
};

export const StatCard = ({
  titulo, valor, subtitulo, icon: Icon, trend, trendValue, variant = 'default', size = 'default', className, onClick,
}: StatCardProps) => {
  const isHero = size === 'hero';
  const isCompact = size === 'compact';
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/70 shadow-xs transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 hover:border-border',
        'before:absolute before:left-0 before:top-0 before:bottom-0',
        isHero ? 'before:w-[4px]' : 'before:w-[3px]',
        accentBar[variant],
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className={cn(isHero ? 'p-6 pl-7' : isCompact ? 'p-4 pl-5' : 'p-5 pl-6')}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className={cn('ui-overline', isHero && 'text-[11px]')}>{titulo}</p>
            <p className={cn(
              'font-thin text-foreground leading-none tracking-tight tabular-nums',
              isHero ? 'text-5xl' : isCompact ? 'text-2xl' : 'text-3xl',
            )}>{valor}</p>
            {subtitulo && <p className={cn('text-muted-foreground pt-1', isCompact ? 'text-[11px]' : 'text-xs')}>{subtitulo}</p>}
            {trendValue && (
              <p className={cn(
                'text-xs font-medium pt-0.5',
                trend === 'up' ? 'text-seven-success' : trend === 'down' ? 'text-seven-danger' : 'text-muted-foreground',
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn('shrink-0 rounded-md bg-secondary/60', isHero ? 'p-2.5' : 'p-2')}>
              <Icon className={cn(isHero ? 'h-5 w-5' : 'h-4 w-4', iconStyles[variant])} strokeWidth={1.5} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
