// === Bloco 9 — Integrações Seven ===
// Estrutura preparatória para integrações externas.

export type StatusIntegracao = 'conectado' | 'configuracao';
export type CategoriaIntegracao = 'agenda' | 'reuniao' | 'mensageria' | 'conhecimento';

export interface Integracao {
  id: string;
  nome: string;
  fornecedor: string;
  categoria: CategoriaIntegracao;
  status: StatusIntegracao;
  descricao: string;
  beneficios: string[];
  capacidades: string[];
  escopos: string[];
  conectadoEm?: string;
  contaVinculada?: string;
  ultimaSincronizacao?: string;
  itensSincronizados?: number;
  documentacaoUrl?: string;
}

export const INTEGRACOES: Integracao[] = [
  {
    id: 'google_calendar',
    nome: 'Google Calendar / Meet',
    fornecedor: 'Google',
    categoria: 'agenda',
    status: 'configuracao',
    descricao: 'Sincronização de calendário e criação automática de reuniões Google Meet.',
    beneficios: [
      'Criação automática de links Google Meet',
      'Sincronização de eventos na agenda',
      'Integração nativa com Google Calendar',
    ],
    capacidades: ['Criar eventos', 'Gerar link Meet', 'Atualizar eventos', 'Cancelar reuniões'],
    escopos: ['openid', 'email', 'profile', 'calendar.events'],
    documentacaoUrl: 'https://developers.google.com/calendar/api/v3/reference/events',
  },
  {
    id: 'calendly',
    nome: 'Calendly',
    fornecedor: 'Calendly',
    categoria: 'agenda',
    status: 'configuracao',
    descricao: 'Permite que clientes agendem reuniões diretamente na agenda do consultor.',
    beneficios: [
      'Autoatendimento de agendamento',
      'Validação automática de SLA por contrato',
      'Buffer inteligente entre reuniões',
    ],
    capacidades: ['Webhook de novo agendamento', 'Sincronização de slots', 'Bloqueio de horários'],
    escopos: ['scheduling:read', 'scheduling:write', 'webhooks:write'],
    documentacaoUrl: 'https://developer.calendly.com',
  },
];

export const labelStatus: Record<StatusIntegracao, string> = {
  conectado: 'Conectado',
  configuracao: 'Configuração',
};

export const labelCategoria: Record<CategoriaIntegracao, string> = {
  agenda: 'Agenda',
  reuniao: 'Reuniões',
  mensageria: 'Mensageria',
  conhecimento: 'Conhecimento',
};

// Eventos recentes consolidados (timeline de integrações)
export interface EventoIntegracao {
  id: string;
  integracaoId: string;
  data: string;
  titulo: string;
  detalhe: string;
}

export const EVENTOS_INTEGRACAO: EventoIntegracao[] = [];
