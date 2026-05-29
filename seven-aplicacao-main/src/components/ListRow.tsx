import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ListRowProps {
  onClick?: () => void;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
  tone?: 'default' | 'danger' | 'success' | 'warning';
}

const toneStyles: Record<NonNullable<ListRowProps['tone']>, string> = {
  default: 'hover:bg-muted/50',
  danger: 'hover:bg-seven-danger/5',
  success: 'hover:bg-seven-success/5',
  warning: 'hover:bg-seven-warning/5',
};

/**
 * Linha de lista navegacional padronizada.
 * Affordance única: hover suave + chevron-right indicando navegação.
 * Use `trailing` para tags/status; o chevron é adicionado automaticamente quando há onClick.
 */
export const ListRow = ({ onClick, children, trailing, className, tone = 'default' }: ListRowProps) => {
  const isClickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-3 py-2.5 px-3 rounded-md border-b last:border-0 transition-colors',
        isClickable && `cursor-pointer ${toneStyles[tone]}`,
        className,
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {(trailing || isClickable) && (
        <div className="flex items-center gap-2 shrink-0">
          {trailing}
          {isClickable && <ChevronRight className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />}
        </div>
      )}
    </div>
  );
};
