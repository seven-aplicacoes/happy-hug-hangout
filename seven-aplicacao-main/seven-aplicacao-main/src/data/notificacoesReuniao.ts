// === Notificações de reunião — Bloco 7 (mock estado em memória) ===

export interface RegraNotificacao {
  id: string;
  diasAntes: number; // 5, 3, 1
  horasAntes?: number; // 1
  ativa: boolean;
  canais: ('email' | 'sms' | 'push')[];
  template: string;
}

export const regrasNotificacaoPadrao: RegraNotificacao[] = [
  { id: 'r5d', diasAntes: 5, ativa: true, canais: ['email'], template: 'Lembrete: reunião em 5 dias.' },
  { id: 'r3d', diasAntes: 3, ativa: true, canais: ['email'], template: 'Faltam 3 dias para nossa reunião.' },
  { id: 'r1d', diasAntes: 1, ativa: true, canais: ['email', 'sms'], template: 'Sua reunião é amanhã.' },
  { id: 'r1h', diasAntes: 0, horasAntes: 1, ativa: true, canais: ['email', 'sms', 'push'], template: 'Sua reunião começa em 1 hora.' },
];

export const labelCanal: Record<'email' | 'sms' | 'push', string> = {
  email: 'E-mail',
  sms: 'SMS',
  push: 'Push',
};

export function descreveJanela(r: RegraNotificacao): string {
  if (r.horasAntes) return `${r.horasAntes}h antes`;
  return `${r.diasAntes} dia${r.diasAntes > 1 ? 's' : ''} antes`;
}