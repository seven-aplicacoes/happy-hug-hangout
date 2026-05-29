// === Contratos Analytics — PARTE 2 / Bloco 1 ===
// Camada estratégica complementar a contratoExtras.ts.
// Foco: distribuição por status, faixas de tempo (drill-down), produto,
// indicadores estratégicos (LTV/coorte) e execução (planejado x realizado).

import { contratos, clientes, calcularEngajamento } from './mockData';
import { getProdutoContrato, getHistoricoProdutos, PRODUTOS, type Produto } from './contratoExtras';
import type { Contrato, Cliente, StatusContrato } from '@/types';

// ─── Distribuição por Status ─────────────────────────────
export interface DistStatus {
  status: StatusContrato;
  label: string;
  qtd: number;
  pct: number;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const labelDist: Record<StatusContrato, string> = {
  ativo: 'Ativo',
  em_onboarding: 'Em onboarding',
  em_renovacao: 'Em renovação',
  renovado: 'Renovado',
  bloqueado: 'Bloqueado',
  suspenso: 'Suspenso',
  cancelado: 'Cancelado',
  churn: 'Churn',
  encerrado: 'Encerrado',
};

const variantDist: Record<StatusContrato, DistStatus['variant']> = {
  ativo: 'success',
  em_onboarding: 'info',
  em_renovacao: 'warning',
  renovado: 'success',
  bloqueado: 'danger',
  suspenso: 'warning',
  cancelado: 'danger',
  churn: 'danger',
  encerrado: 'neutral',
};

export function getDistribuicaoStatus(): DistStatus[] {
  const total = contratos.length || 1;
  const ordem: StatusContrato[] = ['ativo', 'em_onboarding', 'em_renovacao', 'renovado', 'bloqueado', 'suspenso', 'cancelado', 'churn', 'encerrado'];
  return ordem.map(s => {
    const qtd = contratos.filter(c => c.status === s).length;
    return { status: s, label: labelDist[s], qtd, pct: Math.round((qtd / total) * 1000) / 10, variant: variantDist[s] };
  });
}

// ─── Faixas de tempo refinadas (0-3-6-9-12-15-36m) ───────
export interface FaixaTempoDetalhada {
  key: string;
  label: string;
  minMeses: number;
  maxMeses: number;
  qtd: number;
  pct: number;
  contratos: Contrato[];
  clientes: Cliente[];
}

const FAIXAS_DETALHADAS = [
  { key: '0-3', label: '0–3 meses', min: 0, max: 3 },
  { key: '3-6', label: '3–6 meses', min: 3, max: 6 },
  { key: '6-9', label: '6–9 meses', min: 6, max: 9 },
  { key: '9-12', label: '9–12 meses', min: 9, max: 12 },
  { key: '12-15', label: '12–15 meses', min: 12, max: 15 },
  { key: '15-36', label: '15–36 meses', min: 15, max: 36 },
] as const;

const mesesEntre = (iso: string): number => {
  const d = new Date(iso);
  const h = new Date();
  return (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth());
};

export function getDistribuicaoTempoDetalhada(): FaixaTempoDetalhada[] {
  const total = contratos.length || 1;
  return FAIXAS_DETALHADAS.map(f => {
    const cts = contratos.filter(c => {
      const m = mesesEntre(c.dataInicio);
      return m >= f.min && m < f.max;
    });
    const ids = new Set(cts.map(c => c.clienteId));
    const cls = clientes.filter(c => ids.has(c.id));
    return {
      key: f.key, label: f.label, minMeses: f.min, maxMeses: f.max,
      qtd: cts.length, pct: Math.round((cts.length / total) * 1000) / 10,
      contratos: cts, clientes: cls,
    };
  });
}

// ─── Novos contratos por mês (12m) ───────────────────────
export interface NovosPorMes { mes: string; ano: number; key: string; total: number; valor: number; }

export function getNovosContratosPorMes(meses = 12): NovosPorMes[] {
  const out: NovosPorMes[] = [];
  const h = new Date();
  const mLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(h.getFullYear(), h.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const cts = contratos.filter(c => {
      const ini = new Date(c.dataInicio);
      return ini.getFullYear() === y && ini.getMonth() === m;
    });
    out.push({
      mes: mLabels[m], ano: y, key: `${y}-${String(m + 1).padStart(2, '0')}`,
      total: cts.length, valor: cts.reduce((s, c) => s + c.valor, 0),
    });
  }
  return out;
}

// ─── Distribuição por Produto + jornada de consumo ───────
export interface ProdutoAnalytics {
  produto: Produto;
  ativos: number;
  receitaMensal: number;     // soma valor contratos vigentes
  ticketMedio: number;
  tempoMedioMeses: number;   // permanência média
  churnRate: number;         // % churn no produto
}

export function getProdutosAnalytics(): ProdutoAnalytics[] {
  return PRODUTOS.map(p => {
    const cts = contratos.filter(c => getProdutoContrato(c.id) === p);
    const ativos = cts.filter(c => c.status === 'ativo').length;
    const receitaMensal = cts.filter(c => c.status === 'ativo').reduce((s, c) => s + c.valor, 0);
    const ticketMedio = ativos > 0 ? Math.round(receitaMensal / ativos) : 0;
    const tempos = cts.map(c => Math.max(1, mesesEntre(c.dataInicio)));
    const tempoMedioMeses = tempos.length ? Math.round(tempos.reduce((s, n) => s + n, 0) / tempos.length) : 0;
    const churns = cts.filter(c => c.status === 'churn' || c.status === 'cancelado').length;
    const churnRate = cts.length ? Math.round((churns / cts.length) * 1000) / 10 : 0;
    return { produto: p, ativos, receitaMensal, ticketMedio, tempoMedioMeses, churnRate };
  }).sort((a, b) => b.ativos - a.ativos);
}

// ─── LTV por coorte (mês de início) ──────────────────────
export interface CoorteLTV { coorte: string; clientes: number; ltvMedio: number; }

export function getLtvPorCoorte(): CoorteLTV[] {
  const map = new Map<string, { ids: Set<string>; valor: number }>();
  contratos.forEach(c => {
    const d = new Date(c.dataInicio);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, { ids: new Set(), valor: 0 });
    const cur = map.get(key)!;
    cur.ids.add(c.clienteId);
    cur.valor += c.valor;
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({
      coorte: k,
      clientes: v.ids.size,
      ltvMedio: v.ids.size ? Math.round(v.valor / v.ids.size) : 0,
    }))
    .slice(-12);
}

// ─── Indicadores de Execução ─────────────────────────────
export interface ExecucaoCliente {
  clienteId: string;
  clienteNome: string;
  consultorNome: string;
  planejado: number;   // entregáveis planejados
  realizado: number;   // executados
  atrasoDias: number;
  indiceAtraso: number; // %
}

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export function getExecucaoClientes(): ExecucaoCliente[] {
  return clientes
    .filter(c => !['encerrado', 'churn', 'cancelado'].includes(c.status))
    .map(c => {
      const seed = hashStr(c.id);
      const planejado = 6 + (seed % 6);
      const realizado = Math.max(0, planejado - ((seed >> 3) % 4));
      const atrasoDias = ((seed >> 5) % 20);
      const indiceAtraso = Math.round(((planejado - realizado) / planejado) * 100);
      return {
        clienteId: c.id, clienteNome: c.nomeFantasia, consultorNome: c.consultorNome,
        planejado, realizado, atrasoDias, indiceAtraso,
      };
    })
    .sort((a, b) => b.indiceAtraso - a.indiceAtraso);
}

export function getIndiceAtrasoGlobal(): number {
  const ex = getExecucaoClientes();
  if (!ex.length) return 0;
  return Math.round(ex.reduce((s, e) => s + e.indiceAtraso, 0) / ex.length);
}

// ─── Análise crítica de Churn ────────────────────────────
export interface ChurnAnalise {
  total: number;
  porMes: { mes: string; qtd: number }[];
  porConsultor: { consultor: string; qtd: number }[];
  porPorte: { porte: string; qtd: number }[];
  motivos: { motivo: string; qtd: number; pct: number }[];
}

const MOTIVOS = [
  'Falta de evolução percebida',
  'Custo acima do orçamento',
  'Mudança de prioridade interna',
  'Conflito com consultor',
  'Mudança de gestão no cliente',
];

export function getChurnAnalise(): ChurnAnalise {
  const churns = contratos.filter(c => c.status === 'churn' || c.status === 'cancelado');
  const porMes = new Map<string, number>();
  const porConsultor = new Map<string, number>();
  const porPorte = new Map<string, number>();
  const porMotivo = new Map<string, number>();
  churns.forEach(c => {
    const d = new Date(c.dataFim);
    const km = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    porMes.set(km, (porMes.get(km) || 0) + 1);
    porConsultor.set(c.consultorNome, (porConsultor.get(c.consultorNome) || 0) + 1);
    const cl = clientes.find(x => x.id === c.clienteId);
    const fat = cl?.faturamentoMensal || 0;
    const porte = fat <= 100000 ? 'Até 100k' : fat <= 300000 ? '100k–300k' : fat <= 500000 ? '300k–500k' : fat <= 1000000 ? '500k–1M' : 'Acima de 1M';
    porPorte.set(porte, (porPorte.get(porte) || 0) + 1);
    const motivo = MOTIVOS[hashStr(c.id) % MOTIVOS.length];
    porMotivo.set(motivo, (porMotivo.get(motivo) || 0) + 1);
  });
  const total = churns.length || 1;
  return {
    total: churns.length,
    porMes: Array.from(porMes.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([mes, qtd]) => ({ mes, qtd })),
    porConsultor: Array.from(porConsultor.entries()).sort((a, b) => b[1] - a[1]).map(([consultor, qtd]) => ({ consultor, qtd })),
    porPorte: Array.from(porPorte.entries()).sort((a, b) => b[1] - a[1]).map(([porte, qtd]) => ({ porte, qtd })),
    motivos: Array.from(porMotivo.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([motivo, qtd]) => ({ motivo, qtd, pct: Math.round((qtd / total) * 1000) / 10 })),
  };
}

// Re-export utilitário para conveniência
export { getHistoricoProdutos, getProdutoContrato, PRODUTOS };
