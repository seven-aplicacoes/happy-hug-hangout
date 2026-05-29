// === Indicadores expandidos do Consultor — Bloco 1+2 ===
// CSAT/NPS, prioridade automática, novos campos de cliente, benchmarks.

import { labelStatus, labelFase, labelEngajamento, variantEngajamento, calcularEngajamento, diasDesdeUltimaReuniao } from './mockData';
import { getProdutoAtualCliente } from './contratoExtras';
import type { Cliente, Contrato, Reuniao, Tarefa } from '@/types';

// ---------- CSAT / NPS (mock determinístico) ----------

export interface CSATResposta {
  reuniaoId: string;
  clienteId: string;
  data: string;
  nota: number; // 1-5
  comentario?: string;
}

export interface NPSResposta {
  id: string;
  clienteId: string;
  consultorId: string;
  data: string;
  nota: number; // 0-10
  comentario?: string;
  status: 'em_andamento' | 'concluida' | 'sem_resposta';
  responsavel: string;
}

// hash determinístico simples
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Mock CSAT: ~60% das reuniões realizadas têm resposta
// Note: This logic might need to be adapted to fetch real data from Supabase in the future.
// For now, it stays as a helper that would ideally take data as input.
export const getCsatRespostas = (reunioes: Reuniao[]) => reunioes
  .filter(r => r.status === 'realizada')
  .filter(r => hash(r.id) % 10 < 6)
  .map(r => {
    const seed = hash(r.id);
    const nota = 3 + (seed % 30) / 10; // 3.0 - 5.9 → cap 5
    return {
      reuniaoId: r.id,
      clienteId: r.clienteId,
      data: r.meetingDate,
      nota: Math.min(5, Math.round(nota * 10) / 10),
      comentario: seed % 3 === 0 ? 'Reunião muito produtiva, consultor preparado.' : undefined,
    };
  });

// Mock NPS: 4x ano por cliente — gera 1-3 respostas anteriores
export const getNpsRespostas = (clientes: Cliente[]) => (clientes || []).flatMap(c => {
  const seed = hash(c.id);
  const qtd = 1 + (seed % 3);
  return Array.from({ length: qtd }, (_, i) => {
    const dias = 90 * (i + 1) + (seed % 30);
    const data = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
    const baseNota = 6 + ((seed >> i) % 5); // 6-10
    const nota = c.indiceSeven >= 80 ? Math.min(10, baseNota + 1) : baseNota;
    const statusOpts: NPSResposta['status'][] = ['concluida', 'em_andamento', 'sem_resposta'];
    return {
      id: `nps-${c.id}-${i}`,
      clienteId: c.id,
      consultorId: c.consultorId,
      data,
      nota,
      comentario: nota >= 9 ? 'Recomendaria sem hesitar.' : nota >= 7 ? 'Boa experiência geral.' : 'Esperava resultados mais rápidos.',
      status: statusOpts[(seed + i) % 3],
      responsavel: c.consultorNome,
    };
  });
});

// ---------- Filtros e métricas por período ----------

export type PeriodoPreset = '7d' | '30d' | 'mes_atual' | 'mes_anterior' | 'custom';

export interface Periodo {
  preset: PeriodoPreset;
  from: Date;
  to: Date;
}

export function getPeriodo(preset: PeriodoPreset, custom?: { from?: Date; to?: Date }): Periodo {
  const hoje = new Date();
  const to = new Date(hoje); to.setHours(23, 59, 59, 999);
  let from = new Date(hoje); from.setHours(0, 0, 0, 0);
  
  if (preset === '7d') {
    // Esta semana (segunda a hoje)
    const day = from.getDay();
    const diff = from.getDate() - day + (day === 0 ? -6 : 1);
    from.setDate(diff);
  } else if (preset === '30d') {
    // Semana passada (segunda a domingo da anterior)
    const day = from.getDay();
    const diff = from.getDate() - day + (day === 0 ? -6 : 1) - 7;
    from.setDate(diff);
    const sunday = new Date(from);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { preset, from, to: sunday };
  } else if (preset === 'mes_atual') {
    from = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  } else if (preset === 'mes_anterior') {
    from = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const lastDay = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59, 999);
    return { preset, from, to: lastDay };
  } else if (preset === 'custom' && custom) {
    return { preset, from: custom.from || from, to: custom.to || to };
  }
  return { preset, from, to };
}

export const labelPreset: Record<PeriodoPreset, string> = {
  '7d': 'Esta semana',
  '30d': 'Semana passada',
  'mes_atual': 'Este mês',
  'mes_anterior': 'Mês passado',
  'custom': 'Personalizado',
};

// ---------- Métricas do Consultor no período ----------

export interface MetricasConsultor {
  reunioesRealizadas: number;
  csatRespostas: number;
  csatTaxaAdesao: number; // %
  csatNotaMedia: number;
  npsAtual: number;
  encontrosPorClienteAtivo: number;
  clientesAtivos: number;
}

export function calcularMetricasConsultor(
  consultorId: string, 
  periodo: Periodo, 
  reunioes: Reuniao[] = [], 
  clientes: Cliente[] = [],
  csatRespostas: any[] = [],
  npsRespostas: any[] = []
): MetricasConsultor {
  const dentro = (data: string) => {
    const d = new Date(data);
    return d >= periodo.from && d <= periodo.to;
  };

  const reunsCons = reunioes.filter(r => r.consultorId === consultorId);
  const realizadas = reunsCons.filter(r => r.status === 'realizada' && dentro(r.meetingDate));
  const realizadaIds = new Set(realizadas.map(r => r.id));
  
  // Usar dados reais se fornecidos, caso contrário mock (para compatibilidade temporária)
  const csats = csatRespostas.length > 0 
    ? csatRespostas.filter(c => realizadaIds.has(c.meeting_id) && dentro(c.date))
    : getCsatRespostas(realizadas);

  const npsCons = npsRespostas.length > 0
    ? npsRespostas.filter(n => (n.consultant_id || n.consultorId) === consultorId && dentro(n.date || n.data))
    : getNpsRespostas(clientes).filter(n => n.consultorId === consultorId && dentro(n.data));

  const npsConcluidos = npsCons.filter(n => n.status === 'concluida' && n.score !== undefined);

  const promotores = npsConcluidos.filter(n => (n.score || n.nota) >= 9).length;
  const detratores = npsConcluidos.filter(n => (n.score || n.nota) <= 6).length;
  const total = npsConcluidos.length;
  const npsAtual = total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0;

  const clientesAtivos = clientes.filter(c => c.consultorId === consultorId && ['ativo', 'em_onboarding', 'em_renovacao'].includes(c.status)).length;

  return {
    reunioesRealizadas: realizadas.length,
    csatRespostas: csats.length,
    csatTaxaAdesao: realizadas.length > 0 ? Math.round((csats.length / realizadas.length) * 100) : 0,
    csatNotaMedia: csats.length > 0 ? Number((csats.reduce((a, c) => a + (c.score || c.nota), 0) / csats.length).toFixed(1)) : 0,
    npsAtual: total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0,
    encontrosPorClienteAtivo: clientesAtivos > 0 ? Number((realizadas.length / clientesAtivos).toFixed(1)) : 0,
    clientesAtivos,
  };
}

// ---------- Benchmarks e Metas ----------

export type BenchmarkStatus = 'acima' | 'dentro' | 'abaixo' | 'acima_limite' | 'informativo';

export interface Benchmark {
  esperado: number;
  tolerancia: number; // ±
  unidade?: string;
  descricao: string;
  goal_type?: 'minimum' | 'maximum' | 'target' | 'informational';
  comparison_operator?: 'greater_or_equal' | 'less_or_equal' | 'equal' | 'none';
  is_proportional?: boolean;
}

export const BENCHMARKS = {
  meetings_completed: { esperado: 32, tolerancia: 6, goal_type: 'minimum', comparison_operator: 'greater_or_equal', descricao: 'Esperado: ~32 reuniões/mês (8 por cliente ativo médio).' },
  csat_adherence: { esperado: 70, tolerancia: 10, unidade: '%', goal_type: 'minimum', comparison_operator: 'greater_or_equal', descricao: 'Esperado: 70% dos clientes respondem o CSAT após cada encontro.' },
  csat_score: { esperado: 4.5, tolerancia: 0.3, goal_type: 'minimum', comparison_operator: 'greater_or_equal', descricao: 'Esperado: nota média ≥ 4.5/5.' },
  nps: { esperado: 60, tolerancia: 15, goal_type: 'minimum', comparison_operator: 'greater_or_equal', descricao: 'Esperado: NPS ≥ 60 (zona de excelência).' },
  meetings_per_client: { esperado: 4, tolerancia: 1, goal_type: 'minimum', comparison_operator: 'greater_or_equal', descricao: 'Esperado: 4 encontros/mês por cliente ativo.' },
  critical_clinics: { esperado: 0, tolerancia: 0, goal_type: 'maximum', comparison_operator: 'less_or_equal', descricao: 'Limite: no máximo 0 ou 1 clínica crítica.' },
  attention_clinics: { esperado: 3, tolerancia: 0, goal_type: 'maximum', comparison_operator: 'less_or_equal', descricao: 'Limite: no máximo 3 clínicas em atenção.' },
  upsell_potential: { esperado: 5, tolerancia: 0, goal_type: 'minimum', comparison_operator: 'greater_or_equal', descricao: 'Meta: 5 oportunidades/mês.' },
} satisfies Record<string, Benchmark>;

export function avaliarBenchmark(valor: number, bench: Benchmark): BenchmarkStatus {
  if (bench.goal_type === 'informational' || bench.comparison_operator === 'none') return 'informativo';
  
  if (bench.goal_type === 'maximum' || bench.comparison_operator === 'less_or_equal') {
    if (valor > bench.esperado) return 'acima_limite';
    return 'dentro';
  }

  if (bench.goal_type === 'minimum' || bench.comparison_operator === 'greater_or_equal') {
    if (valor < bench.esperado) return 'abaixo';
    return 'dentro';
  }

  // Fallback para lógica original se necessário
  if (valor >= bench.esperado + bench.tolerancia) return 'acima';
  if (valor < bench.esperado - bench.tolerancia) return 'abaixo';
  return 'dentro';
}

// ---------- Novos campos de cliente (briefing, dores, objetivos) ----------

export interface ClienteContexto {
  dores: string[];
  fatoresSucesso: string[];
  objetivoAtual: string;
  briefing: string;
}

const DORES_POOL = [
  'Margem operacional reduzida',
  'Alta rotatividade da equipe',
  'Concentração em poucos clientes',
  'Falta de previsibilidade financeira',
  'Processos comerciais informais',
  'Indicadores não acompanhados',
  'Atendimento inconsistente',
];

const FATORES_POOL = [
  'Equipe engajada com cultura de dados',
  'Sócios com perfil empreendedor',
  'Marca consolidada na região',
  'Carteira de clientes recorrente',
  'Operação digitalizada',
  'Estrutura física adequada',
];

const OBJETIVOS_POOL = [
  'Profissionalizar a gestão para escalar a operação',
  'Estruturar processo comercial e dobrar conversão',
  'Recuperar margem e organizar fluxo de caixa',
  'Implementar metodologia de gestão por indicadores',
  'Preparar a empresa para receber investimento',
  'Estruturar a sucessão familiar',
];

export function getClienteContexto(cliente: Cliente): ClienteContexto {
  const seed = hash(cliente.id);
  const dores = [
    DORES_POOL[seed % DORES_POOL.length],
    DORES_POOL[(seed >> 2) % DORES_POOL.length],
    DORES_POOL[(seed >> 4) % DORES_POOL.length],
  ].filter((v, i, a) => a.indexOf(v) === i);
  const fatores = [
    FATORES_POOL[seed % FATORES_POOL.length],
    FATORES_POOL[(seed >> 3) % FATORES_POOL.length],
  ].filter((v, i, a) => a.indexOf(v) === i);
  const objetivo = OBJETIVOS_POOL[seed % OBJETIVOS_POOL.length];
  const produto = getProdutoAtualCliente(cliente.id) || 'Consultoria';
  return {
    dores,
    fatoresSucesso: fatores,
    objetivoAtual: objetivo,
    briefing: `${cliente.nomeFantasia} (${cliente.segmento}, região ${cliente.regiao}) contratou ${produto} para ${objetivo.toLowerCase()}. Faturamento mensal declarado: R$ ${(cliente.faturamentoMensal/1000).toFixed(0)}k. Especialidade focal: ${cliente.especialidade}.`,
  };
}

// ---------- Prioridade automática do cliente ----------

export type NivelPrioridade = 'critica' | 'alta' | 'media' | 'baixa';

export const labelPrioridade: Record<NivelPrioridade, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa',
};

export const variantPrioridade: Record<NivelPrioridade, 'danger' | 'warning' | 'info' | 'success'> = {
  critica: 'danger', alta: 'warning', media: 'info', baixa: 'success',
};

export const ordemPrioridade: Record<NivelPrioridade, number> = {
  critica: 0, alta: 1, media: 2, baixa: 3,
};

export function calcularPrioridade(cliente: Cliente, contratos: Contrato[] = [], tarefas: Tarefa[] = []): { nivel: NivelPrioridade; score: number; fatores: string[] } {
  let score = 0;
  const fatores: string[] = [];

  const eng = calcularEngajamento(cliente.id);
  const dias = diasDesdeUltimaReuniao(cliente.id);
  if (eng === 'critico') { score += 40; fatores.push(`${dias}d sem reunião`); }
  else if (eng === 'atencao') { score += 20; fatores.push(`${dias}d sem reunião`); }

  // Risco do contrato vigente
  const ct = contratos.find(c => c.clienteId === cliente.id && (c.status === 'ativo' || c.status === 'em_renovacao'));
  if (ct) {
    if (ct.risco === 'critico') { score += 30; fatores.push('Contrato em risco crítico'); }
    else if (ct.risco === 'alto') { score += 18; fatores.push('Contrato em risco alto'); }
  }
  if (cliente.status === 'bloqueado' || cliente.status === 'suspenso') { score += 25; fatores.push('Contrato bloqueado'); }
  if (cliente.status === 'em_renovacao') { score += 10; fatores.push('Em renovação'); }

  // Tarefas pendentes
  const tarefasPendentes = tarefas.filter(t => t.clienteId === cliente.id && t.status !== 'concluida');
  const atrasadas = tarefasPendentes.filter(t => new Date(t.dataVencimento) < new Date()).length;
  if (atrasadas > 0) { score += Math.min(20, atrasadas * 5); fatores.push(`${atrasadas} tarefa(s) atrasada(s)`); }

  // Fase metodológica — diagnóstico/onboarding precisa atenção
  if (cliente.faseMetodologica === 'diagnostico') { score += 5; fatores.push('Em diagnóstico (atenção inicial)'); }

  // Tempo de contrato — contratos novos (<60d) ou maduros (>270d) precisam atenção
  if (ct) {
    const diasContrato = (Date.now() - new Date(ct.dataInicio).getTime()) / 86400000;
    if (diasContrato < 60) { score += 8; fatores.push('Contrato recente'); }
    else if (diasContrato > 270) { score += 12; fatores.push('Próximo da renovação'); }
  }

  let nivel: NivelPrioridade;
  if (score >= 60) nivel = 'critica';
  else if (score >= 35) nivel = 'alta';
  else if (score >= 15) nivel = 'media';
  else nivel = 'baixa';

  return { nivel, score, fatores: fatores.slice(0, 3) };
}

// ---------- Cliente ativo por consultor (definição) ----------

export function isClienteAtivoConsultor(cliente: Cliente, consultorId: string, contratos: Contrato[] = []): boolean {
  if (cliente.consultorId !== consultorId) return false;
  if (!['ativo', 'em_onboarding', 'em_renovacao'].includes(cliente.status)) return false;
  // Tem contrato vigente
  const hoje = new Date();
  const ct = (contratos || []).find(c =>
    c.clienteId === cliente.id &&
    c.consultorId === consultorId &&
    new Date(c.dataInicio) <= hoje &&
    new Date(c.dataFim) >= hoje
  );
  return !!ct;
}
