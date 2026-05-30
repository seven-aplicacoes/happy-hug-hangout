// === Bloco 9 — Integrações Seven ===
// Estrutura preparatória para integrações externas.

export type StatusIntegracao = 'conectado' | 'disponivel' | 'em_breve' | 'beta';
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
    id: 'calendly',
    nome: 'Calendly',
    fornecedor: 'Calendly',
    categoria: 'agenda',
    status: 'em_breve',
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
  disponivel: 'Disponível',
  em_breve: 'Em breve',
  beta: 'Beta',
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
