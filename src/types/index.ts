// === Entidades Canônicas — Seven Gestão ===

export type StatusContrato =
  | 'ativo'
  | 'em_onboarding'
  | 'em_renovacao'
  | 'renovado'
  | 'bloqueado'
  | 'suspenso'
  | 'cancelado'
  | 'churn'
  | 'encerrado';
export type StatusReuniao = 'agendada' | 'realizada' | 'cancelada' | 'remarcada' | 'reagendada';
export type StatusTarefa = 'a_fazer' | 'em_andamento' | 'impedida' | 'concluida';
export type NivelRisco = 'baixo' | 'medio' | 'alto' | 'critico';
export type NivelEngajamento = 'em_dia' | 'atencao' | 'critico';
export type FaseMetodologica = 'diagnostico' | 'planejamento' | 'estruturacao' | 'monitoramento' | 'encerramento';
export type TipoDemanda = 'consultoria' | 'chamado' | 'interna';
export type OrigemDemanda = 'reuniao' | 'gestor' | 'rotina_automatica' | 'chamado';
export type Especialidade = 'gestao' | 'financeiro' | 'comercial' | 'processos' | 'pessoas' | 'estrategia';
export type Regiao = 'norte' | 'nordeste' | 'centro_oeste' | 'sudeste' | 'sul';
export type PerfilUsuario = 'admin' | 'consultor' | 'cliente';
export type PorteEmpresa = 'MEI' | 'Micro' | 'Pequena' | 'Média' | 'Grande';

export type StatusUsuario = 'ativo' | 'inativo';

export interface Consultor {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  especialidade: Especialidade;
  clientesAtivos: number;
  cargo: string;
  telefone: string;
  cidade: string;
  estado: string;
  dataEntrada: string;
  status: StatusUsuario;
}

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  segmento: string;
  regiao: Regiao;
  porte?: PorteEmpresa;
  consultorId: string;
  consultorNome: string;
  especialidade: Especialidade;
  faseMetodologica: FaseMetodologica;
  indiceSeven: number;
  potencialUpsell: boolean;
  dataInicio: string;
  ultimaInteracao: string;
  status: StatusContrato;
  faturamentoMensal: number;
  portal_access_enabled?: boolean;
  auth_user_id?: string;
  email?: string;
  institutional_email?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  pains?: string[];
  success_factors?: string[];
  current_objective?: string;
  briefing?: string;
  contact_name?: string;
  contact_phone?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface MethodologyPhase {
  id: string;
  phase_key?: string;
  name: string;
  order_index: number;
  average_duration?: string;
  duration_minutes?: number;
  executor_type?: 'consultor' | 'silvane';
  meetings_count?: number;
  purpose?: string;
  objectives?: any[];
  deliverables?: any[];
  tools?: any[];
  alerts?: string[];
  status?: string;
  subtitle?: string;
  updated_at?: string;
}

export interface MethodologyMaterial {
  id: string;
  phase_id?: string;
  title: string;
  type: string;
  description?: string;
  duration?: string;
  pages?: number;
  url?: string;
  tag?: string;
  is_general?: boolean;
  category?: string;
  updated_at: string;
}

export interface MethodologyTemplate {
  id: string;
  phase_id?: string;
  title: string;
  format?: string;
  description?: string;
  examples?: string[];
  url?: string;
}
 

export interface MethodologyQuestion {
  id: string;
  phase_id?: string;
  question: string;
  objective?: string;
}

export interface ClientAlert {
  id: string;
  client_id: string;
  consultant_id?: string;
  type: string;
  severity: 'alta' | 'media' | 'baixa';
  reason: string;
  next_action?: string;
  evidence?: string;
  status: 'active' | 'resolved' | 'ignored';
  created_at: string;
}

export interface Integration {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: string;
  description?: string;
  benefits?: string[];
  capabilities?: string[];
  scopes?: string[];
  connected_at?: string;
  linked_account?: string;
  last_sync?: string;
  synced_items_count?: number;
  documentation_url?: string;
}

export interface IntegrationEvent {
  id: string;
  integration_id: string;
  title: string;
  detail?: string;
  occurred_at: string;
}

export interface ClientIndicator {
  id: string;
  client_id: string;
  name: string;
  value: number;
  unit?: string;
  date: string;
  category?: string;
  is_baseline?: boolean;
}

export interface Contrato {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: string;
  valor: number;
  dataInicio: string;
  dataFim: string;
  status: StatusContrato;
  risco: NivelRisco;
  faseMetodologica: FaseMetodologica;
  consultorId: string;
  consultorNome: string;
  productId?: string;
  contractNumber?: string;
}

export interface Reuniao {
  id: string;
  clienteId: string;
  clienteNome: string;
  contractId?: string;
  contractProductId?: string;
  contractProductPhaseId?: string;
  consultorId: string;
  consultorNome: string;
  meetingDate: string;
  startTime: string;
  /** @deprecated use meetingDate */
  data?: string;
  /** @deprecated use startTime */
  hora?: string;
  duracao: number; // minutos
  tipo: string;
  title: string;
  /** @deprecated use title */
  pauta?: string;
  description?: string;
  status: StatusReuniao;
  ata?: string;
  participantes: string[];
  clientProductId?: string;
  source?: string;
  externalId?: string;
  meetingUrl?: string;
  location?: string;
  scheduledBy?: string;
  contractModuleMeetingId?: string;
}

export interface ContractModuleMeeting {
  id: string;
  contractId: string;
  clientId: string;
  productId: string;
  moduleId: string;
  meetingNumber: number;
  title: string;
  status: 'pendente' | 'agendado' | 'realizada' | 'cancelada' | 'reagendado';
  scheduledMeetingId?: string;
  consultantId?: string;
  scheduledAt?: string;
  completedAt?: string;
  orderIndex: number;
  consultantName?: string;
}

export interface ContractModuleDocument {
  id: string;
  clientId: string;
  contractId: string;
  productId: string;
  moduleId: string;
  title: string;
  description?: string;
  visibilityType: 'internal' | 'client';
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  contratoId: string;
  contractId?: string;
  consultorId: string;
  consultorNome: string;
  tipo: TipoDemanda;
  status: StatusTarefa;
  prioridade: NivelRisco;
  dataVencimento: string;
  dataCriacao: string;
  isAtrasada?: boolean;
  motivoImpedimento?: string;
  impedimentHistory?: Array<{ reason: string; created_at: string; created_by?: string; created_by_name?: string }>;
  origem?: OrigemDemanda;
  contratoNome?: string;
  clientProductId?: string;
  contractProductId?: string;
  contractProductPhaseId?: string;
  completedAt?: string;
}


export interface Chamado {
  id: string;
  clienteId: string;
  clienteNome: string;
  assunto: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'resolvido';
  prioridade: NivelRisco;
  dataCriacao: string;
  dataResolucao?: string;
}

export interface Relatorio {
  id: string;
  clienteId: string;
  tipo: string;
  titulo: string;
  dataCriacao: string;
  url?: string;
}

export interface Documento {
  id: string;
  clienteId: string;
  clienteNome: string;
  projectId?: string;
  contractId?: string;
  productId?: string;
  contractProductId?: string;
  contractProductPhaseId?: string;
  titulo: string;
  tipo: string;
  data: string;
  arquivo: string; // Mantido para compatibilidade, agora mapeado para file_name
  file_url?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  author_id?: string;
  uploaded_at?: string;
  status: 'aprovado' | 'pendente' | 'nao_conforme';
  visibility: 'internal' | 'client' | 'all';
  autor: string;
  feedbacks: DocumentFeedback[];
  fase?: string;
}

export interface DocumentFeedback {
  id: string;
  data: string;
  autor: string;
  texto: string;
  statusAplicado: 'aprovado' | 'pendente' | 'nao_conforme';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'ativo' | 'inativo';
  consultant_hours?: number; // Total em minutos
  silvane_hours?: number;    // Total em minutos
}

export interface Project {
  id: string;
  clientId: string;
  clientNome: string;
  consultantId: string;
  consultantNome: string;
  productId?: string;
  productNome?: string;
  contractId?: string;
  name: string;
  status: 'ativo' | 'atencao' | 'critico' | 'concluido';
  currentPhase: FaseMetodologica;
  startDate: string;
  endDate: string;
}

export interface TimelineEvent {
  id: string;
  data: string;
  tipo: 'reuniao' | 'tarefa' | 'chamado' | 'documento' | 'marco' | 'relatorio' | 'status_change' | 'bloqueio' | 'alteracao_contratual' | 'conquista';
  titulo: string;
  descricao: string;
  status?: string;
  resumoIA?: string;
  statusResumo?: 'gerado_ia' | 'revisado' | 'editado_manualmente' | 'pendente';
  contratoVinculado?: string;
  evidencias?: string[];
  tarefasGeradas?: string[];
  faseRelacionada?: string;
}

export interface ContractProduct {
  id: string;
  contractId: string;
  productId: string;
  productNome?: string;
  productName?: string;
  productDescription?: string;
  productCategory?: string;
  consultantHours?: number;
  silvaneHours?: number;
  status: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  currentPhaseId?: string;
  clientVisible: boolean;
  internalNotes?: string;
  clientNotes?: string;
}

export interface ContractProductPhase {
  id: string;
  contractProductId: string;
  methodologyPhaseId?: string;
  orderIndex: number;
  name: string;
  durationMinutes?: number;
  executorType?: string;
  meetingsCount?: number;
  startDate?: string;
  endDate?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'suspensa';
  responsibleConsultantId?: string;
  internalNotes?: string;
  clientNotes?: string;
  clientVisible: boolean;
  meetingsScheduled?: number;
}