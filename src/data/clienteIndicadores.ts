// === Indicadores expandidos do Consultor — Bloco 1+2 ===
// CSAT/NPS, prioridade automática, novos campos de cliente, benchmarks.

import { labelStatus, labelFase, labelEngajamento, variantEngajamento, calcularEngajamento, diasDesdeUltimaReuniao } from './mockData';
import { getProdutoAtualCliente } from './contratoExtras';
import type { Cliente, Contrato, Reuniao, Tarefa } from '@/types';
import { differenceInMonths, startOfMonth, endOfMonth } from 'date-fns';

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

export type PeriodoPreset = 'mes_atual' | 'mes_anterior' | 'custom';

export interface Periodo {
  preset: PeriodoPreset;
  from: Date;
  to: Date;
}

export function getPeriodo(preset: PeriodoPreset, custom?: { from?: Date; to?: Date }): Periodo {
  const hoje = new Date();
  
  if (preset === 'mes_atual') {
    const from = startOfMonth(hoje);
    const to = endOfMonth(hoje);
    return { preset, from, to };
  } else if (preset === 'mes_anterior') {
    const from = startOfMonth(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
    const to = endOfMonth(from);
    return { preset, from, to };
  } else if (preset === 'custom' && custom) {
    // Garantir que o período personalizado comece no início do mês 'from' e termine no fim do mês 'to'
    const from = custom.from ? startOfMonth(custom.from) : startOfMonth(hoje);
    const to = custom.to ? endOfMonth(custom.to) : endOfMonth(hoje);
    return { preset, from, to };
  }
  
  // Default to current month
  return { preset: 'mes_atual', from: startOfMonth(hoje), to: endOfMonth(hoje) };
}

export const labelPreset: Record<PeriodoPreset, string> = {
  'mes_atual': 'Mês atual',
  'mes_anterior': 'Mês anterior',
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
    csatTaxaAdesao: realizadas.length > 0 ? Number(((csats.length / realizadas.length) * 100).toFixed(1)) : 0,
    csatNotaMedia: csats.length > 0 ? Number((csats.reduce((a, c) => a + (c.score || c.nota), 0) / csats.length).toFixed(1)) : 0,
    npsAtual,
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

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\r?\n|;|,|\|/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function getClienteContexto(cliente: Cliente): ClienteContexto {
  const dores = normalizeList((cliente as any).pains);
  const fatores = normalizeList((cliente as any).success_factors);
  const objetivo = ((cliente as any).current_objective || '').toString().trim();
  const briefing = ((cliente as any).briefing || '').toString().trim();
  return {
    dores,
    fatoresSucesso: fatores,
    objetivoAtual: objetivo,
    briefing,
  };
}


// ---------- Prioridade automática do cliente ----------

export type NivelPrioridade = 'critica' | 'alta' | 'media' | 'baixa' | 'nao_definida';

export const labelPrioridade: Record<NivelPrioridade, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa', nao_definida: 'Não definida',
};

export const variantPrioridade: Record<NivelPrioridade, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
  critica: 'danger', alta: 'warning', media: 'info', baixa: 'success', nao_definida: 'neutral',
};


export const ordemPrioridade: Record<NivelPrioridade, number> = {
  critica: 0, alta: 1, media: 2, baixa: 3, nao_definida: 4,
};


export function calcularPrioridade(cliente: Cliente, contratos: Contrato[] = [], tarefas: Tarefa[] = []): { nivel: NivelPrioridade; score: number; fatores: string[] } {
  let score = 0;
  const fatores: string[] = [];

  const eng = calcularEngajamento(cliente.id);
  const dias = diasDesdeUltimaReuniao(cliente.id);
  if (eng === 'critico') { score += 40; fatores.push(`${dias}d sem reunião`); }
  else if (eng === 'atencao') { score += 20; fatores.push(`${dias}d sem reunião`); }

  const ct = contratos.find(c => c.clienteId === cliente.id && (c.status === 'ativo' || c.status === 'em_renovacao'));
  if (ct) {
    if (ct.risco === 'critico') { score += 30; fatores.push('Contrato em risco crítico'); }
    else if (ct.risco === 'alto') { score += 18; fatores.push('Contrato em risco alto'); }
  }
  if (cliente.status === 'bloqueado' || cliente.status === 'suspenso') { score += 25; fatores.push('Contrato bloqueado'); }
  if (cliente.status === 'em_renovacao') { score += 10; fatores.push('Em renovação'); }

  const tarefasPendentes = tarefas.filter(t => t.clienteId === cliente.id && t.status !== 'concluida');
  const atrasadas = tarefasPendentes.filter(t => new Date(t.dataVencimento) < new Date()).length;
  if (atrasadas > 0) { score += Math.min(20, atrasadas * 5); fatores.push(`${atrasadas} tarefa(s) atrasada(s)`); }

  if (cliente.faseMetodologica === 'diagnostico') { score += 5; fatores.push('Em diagnóstico (atenção inicial)'); }

  if (ct) {
    const diasContrato = (Date.now() - new Date(ct.dataInicio).getTime()) / 86400000;
    if (diasContrato < 60) { score += 8; fatores.push('Contrato recente'); }
    else if (diasContrato > 270) { score += 12; fatores.push('Próximo da renovação'); }
  }

  let nivel: NivelPrioridade;
  if (score >= 60) nivel = 'critica';
  else if (score >= 35) nivel = 'alta';
  else if (score >= 15) nivel = 'media';
  else if (fatores.length > 0) nivel = 'baixa';
  else nivel = 'nao_definida';


  return { nivel, score, fatores: fatores.slice(0, 3) };
}

// ---------- Cliente ativo por consultor (definição) ----------

export function isClienteAtivoConsultor(cliente: Cliente, consultorId: string, contratos: Contrato[] = []): boolean {
  if (cliente.consultorId !== consultorId) return false;
  if (!['ativo', 'em_onboarding', 'em_renovacao'].includes(cliente.status)) return false;
  const hoje = new Date();
  const ct = (contratos || []).find(c =>
    c.clienteId === cliente.id &&
    c.consultorId === consultorId &&
    new Date(c.dataInicio) <= hoje &&
    new Date(c.dataFim) >= hoje
  );
  return !!ct;
}
