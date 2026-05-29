import { StatusTarefa } from "@/types";

export interface TaskStatusConfig {
  value: StatusTarefa;
  label: string;
  color: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const TASK_STATUS_CONFIG: Record<StatusTarefa, TaskStatusConfig> = {
  a_fazer: {
    value: 'a_fazer',
    label: 'A Fazer',
    color: 'border-t-seven-info',
    variant: 'info'
  },
  em_andamento: {
    value: 'em_andamento',
    label: 'Em Andamento',
    color: 'border-t-seven-warning',
    variant: 'warning'
  },
  impedida: {
    value: 'impedida',
    label: 'Impedida',
    color: 'border-t-seven-danger',
    variant: 'danger'
  },
  concluida: {
    value: 'concluida',
    label: 'Concluída',
    color: 'border-t-seven-success',
    variant: 'success'
  },
};

export const TASK_STATUS_OPTIONS = Object.values(TASK_STATUS_CONFIG);

export const getTaskStatusLabel = (status: string): string => {
  const s = status?.toLowerCase() as StatusTarefa;
  return TASK_STATUS_CONFIG[s]?.label || status || 'Desconhecido';
};

export const getTaskStatusVariant = (status: string): TaskStatusConfig['variant'] => {
  const s = status?.toLowerCase() as StatusTarefa;
  return TASK_STATUS_CONFIG[s]?.variant || 'neutral';
};

/**
 * Normalizes status strings from the database to the canonical values.
 */
export const normalizeTaskStatus = (status: string | null | undefined): StatusTarefa => {
  if (!status) return 'a_fazer';
  
  const s = status.toLowerCase().trim();
  
  if (['a fazer', 'a_fazer', 'para fazer', 'pendente'].includes(s)) return 'a_fazer';
  if (['em andamento', 'em_andamento', 'andamento', 'executando'].includes(s)) return 'em_andamento';
  if (['concluida', 'concluída', 'concluido', 'concluído', 'finalizada', 'feito'].includes(s)) return 'concluida';
  if (['atrasada', 'atrasado', 'vencida'].includes(s)) return 'a_fazer';
  if (['impedida', 'impedimento', 'bloqueada', 'pausada'].includes(s)) return 'impedida';
  
  return 'a_fazer';
};
