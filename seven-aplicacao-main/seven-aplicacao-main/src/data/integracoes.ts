// === Bloco 9 — Integrações Seven ===
// Estrutura preparatória para integrações externas. Mock determinístico.

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
    id: 'ms-calendar',
    nome: 'Microsoft Calendar',
    fornecedor: 'Microsoft 365',
    categoria: 'agenda',
    status: 'conectado',
    descricao: 'Sincroniza reuniões da agenda do consultor com a plataforma Seven.',
    beneficios: [
      'Visão única de compromissos',
      'Lembretes automáticos vinculados ao cliente',
      'Detecção de conflitos antes do agendamento',
    ],
    capacidades: ['Leitura de eventos', 'Criação de eventos', 'Atualização de status'],
    escopos: ['Calendars.ReadWrite', 'User.Read'],
    conectadoEm: '2025-02-14',
    contaVinculada: 'consultor@seven.com.br',
    ultimaSincronizacao: '2026-05-15T08:42:00',
    itensSincronizados: 184,
    documentacaoUrl: 'https://learn.microsoft.com/graph/api/resources/calendar',
  },
  {
    id: 'ms-teams',
    nome: 'Microsoft Teams',
    fornecedor: 'Microsoft 365',
    categoria: 'reuniao',
    status: 'beta',
    descricao: 'Cria salas Teams automaticamente e importa transcrições de reunião.',
    beneficios: [
      'Link de reunião gerado em 1 clique',
      'Transcrição importada para a ata',
      'IA Seven analisa engajamento da fala',
    ],
    capacidades: ['Criar reunião', 'Importar transcrição', 'Detectar participantes'],
    escopos: ['OnlineMeetings.ReadWrite', 'CallRecords.Read.All'],
    conectadoEm: '2026-04-02',
    contaVinculada: 'consultor@seven.com.br',
    ultimaSincronizacao: '2026-05-14T17:10:00',
    itensSincronizados: 27,
    documentacaoUrl: 'https://learn.microsoft.com/graph/api/resources/onlinemeeting',
  },
  {
    id: 'calendly',
    nome: 'Calendly',
    fornecedor: 'Calendly',
    categoria: 'agenda',
    status: 'disponivel',
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
  {
    id: 'whatsapp',
    nome: 'WhatsApp Business',
    fornecedor: 'Meta Cloud API',
    categoria: 'mensageria',
    status: 'em_breve',
    descricao: 'Estrutura futura para registrar conversas e enviar lembretes via WhatsApp.',
    beneficios: [
      'Registro automático no histórico do cliente',
      'Lembretes de reunião e tarefas',
      'NPS via WhatsApp ao final do ciclo',
    ],
    capacidades: ['Envio de templates', 'Inbox compartilhada', 'Disparo programado'],
    escopos: ['messages:send', 'messages:receive', 'business_management'],
    documentacaoUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
  },
  {
    id: 'google-calendar',
    nome: 'Google Calendar',
    fornecedor: 'Google Workspace',
    categoria: 'agenda',
    status: 'disponivel',
    descricao: 'Alternativa para consultores que utilizam Google Workspace.',
    beneficios: ['Sincronização bidirecional', 'Convites automáticos para clientes'],
    capacidades: ['Leitura', 'Escrita', 'Webhooks'],
    escopos: ['calendar.events', 'calendar.readonly'],
    documentacaoUrl: 'https://developers.google.com/calendar',
  },
  {
    id: 'metodologia-hub',
    nome: 'Hub de Metodologia Seven',
    fornecedor: 'Seven Gestão',
    categoria: 'conhecimento',
    status: 'conectado',
    descricao: 'Centraliza todos os materiais, templates e perguntas-chave da metodologia.',
    beneficios: [
      'Fonte única de verdade para todos os consultores',
      'Versionamento de templates',
      'Atualização contínua pela equipe de metodologia',
    ],
    capacidades: ['Biblioteca por fase', 'Materiais transversais', 'Templates baixáveis'],
    escopos: ['interno'],
    conectadoEm: '2024-09-01',
    ultimaSincronizacao: '2026-05-12T10:00:00',
    itensSincronizados: 86,
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

export const EVENTOS_INTEGRACAO: EventoIntegracao[] = [
  { id: 'e1', integracaoId: 'ms-calendar', data: '2026-05-15T08:42:00', titulo: 'Sincronização concluída', detalhe: '12 novos eventos importados.' },
  { id: 'e2', integracaoId: 'ms-teams', data: '2026-05-14T17:10:00', titulo: 'Transcrição importada', detalhe: 'Reunião Cliente Aurora — 47 min processados.' },
  { id: 'e3', integracaoId: 'metodologia-hub', data: '2026-05-12T10:00:00', titulo: 'Novo template publicado', detalhe: 'Template Ata de Comitê v3.2 disponível.' },
  { id: 'e4', integracaoId: 'ms-calendar', data: '2026-05-10T07:30:00', titulo: 'Conflito detectado', detalhe: 'Reagendamento sugerido para reunião com Cliente Polaris.' },
];
