export const labelStatus: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  remarcada: 'Remarcada',
};

export const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  agendada: 'info',
  realizada: 'success',
  cancelada: 'danger',
  remarcada: 'warning',
};

export const meetingTypes = [
  'Check-in Semanal',
  'Alinhamento Estratégico',
  'Apresentação de Resultados',
  'Workshop / Treinamento',
  'Outro'
];
