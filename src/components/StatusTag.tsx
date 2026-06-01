import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusTagProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

// Editorial status — refined dot + label, no chip noise
const variantDot: Record<StatusVariant, string> = {
  success: 'bg-seven-success',
  warning: 'bg-seven-warning',
  danger: 'bg-seven-danger',
  info: 'bg-primary',
  neutral: 'bg-seven-silver',
};

const variantText: Record<StatusVariant, string> = {
  success: 'text-seven-success',
  warning: 'text-seven-warning',
  danger: 'text-seven-danger',
  info: 'text-primary',
  neutral: 'text-muted-foreground',
};

const variantBg: Record<StatusVariant, string> = {
  success: 'bg-seven-success/8 border-seven-success/20',
  warning: 'bg-seven-warning/8 border-seven-warning/20',
  danger: 'bg-seven-danger/8 border-seven-danger/20',
  info: 'bg-primary/8 border-primary/20',
  neutral: 'bg-secondary border-border',
};

// Auto-map common statuses to variants
const autoVariant = (label: string): StatusVariant => {
  const l = label.toLowerCase().trim();
  if (['ativo', 'concluída', 'concluida', 'realizada', 'resolvido', 'baixo', 'em dia', 'renovado'].includes(l)) return 'success';
  if (['em risco', 'médio', 'medio', 'em andamento', 'remarcada', 'alerta', 'atenção', 'atencao', 'em renovação', 'em renovacao', 'suspenso'].includes(l)) return 'warning';
  if (['crítico', 'critico', 'alto', 'impedida', 'cancelada', 'pausado', 'bloqueado', 'com impedimento', 'churn'].includes(l)) return 'danger';
  if (['agendada', 'aberto', 'a fazer', 'para fazer', 'onboarding', 'em onboarding'].includes(l)) return 'info';
  if (['encerrado', 'encerramento', 'cancelado'].includes(l)) return 'neutral';
  return 'neutral';
};

export const StatusTag = ({ label, variant, className }: StatusTagProps) => {
  const v = variant || autoVariant(label);
  
  // Custom display mapping
  let displayLabel = label;
  const lowerLabel = label.toLowerCase().trim();
  if (['realizada', 'realizado', 'concluida', 'concluido', 'completed', 'done'].includes(lowerLabel)) {
    displayLabel = 'Concluído';
  } else if (['agendada', 'agendado'].includes(lowerLabel)) {
    displayLabel = 'Agendado';
  } else if (['cancelada', 'cancelado'].includes(lowerLabel)) {
    displayLabel = 'Cancelado';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide',
        variantBg[v],
        variantText[v],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', variantDot[v])} />
      {displayLabel}
    </span>
  );
};
