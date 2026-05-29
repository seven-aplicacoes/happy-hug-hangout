import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusTag } from '@/components/StatusTag';
import { cn } from '@/lib/utils';
import type { IaInsight } from '@/data/iaInsights';
import { labelTipoIA } from '@/data/iaInsights';

interface Props {
  insight: IaInsight;
  onDismiss?: (id: string) => void;
  className?: string;
}

const variantBorder: Record<IaInsight['variant'], string> = {
  success: 'border-l-seven-success',
  warning: 'border-l-seven-warning',
  danger: 'border-l-seven-danger',
  info: 'border-l-primary',
};

export function IaInsightCard({ insight, onDismiss, className }: Props) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div
      className={cn(
        'group relative bg-card border border-border/70 border-l-4 rounded-lg p-4 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all',
        variantBorder[insight.variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Sparkles className="h-3 w-3" strokeWidth={1.8} /> IA
          </span>
          <StatusTag label={labelTipoIA[insight.tipo]} variant={insight.variant} />
        </div>
        <button
          aria-label="Dispensar"
          onClick={() => { setHidden(true); onDismiss?.(insight.id); }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">{insight.titulo}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{insight.descricao}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Confiança {insight.confianca}%
        </span>
        {insight.acaoHref && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => navigate(insight.acaoHref!)}
          >
            {insight.acaoLabel} <ArrowRight className="h-3 w-3 ml-1" strokeWidth={1.5} />
          </Button>
        )}
      </div>
    </div>
  );
}
