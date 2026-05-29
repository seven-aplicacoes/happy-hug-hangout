import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  overline?: string;
  titulo: string;
  descricao?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Editorial section header — overline + serif title + sutil divider.
 * Cria ritmo e ancoragem em telas analíticas com múltiplas seções.
 */
export const SectionHeader = ({ overline, titulo, descricao, action, className }: SectionHeaderProps) => (
  <div className={cn('flex items-end justify-between gap-4 pb-3 mb-5 border-b border-border/60', className)}>
    <div className="space-y-0.5 min-w-0">
      {overline && <p className="ui-overline">{overline}</p>}
      <h2 className="font-editorial text-[22px] leading-tight text-foreground tracking-tight">{titulo}</h2>
      {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
