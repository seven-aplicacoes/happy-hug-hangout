// === Contrato Extras — Bloco 1 (Produtos, Alertas, KPIs estratégicos) ===
// Gerador determinístico baseado em IDs (sem dependência de backend)

import { contratos, clientes, calcularEngajamento, diasDesdeUltimaReuniao } from './mockData';
import type { Contrato, Cliente, StatusContrato } from '@/types';

// ─── Produtos disponíveis ────────────────────────────────
export const PRODUTOS = [
  'Conselho Estratégico',
  'Doc Mentoring',
  'Gestão Comercial',
  'Gestão Financeira',
  'Go Better',
  'Jornada do Paciente',
  'Legacy',
] as const;

export type Produto = typeof PRODUTOS[number];

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Produto vinculado a um contrato (determinístico pelo id). */
export function getProdutoContrato(contratoId: string): Produto {
  return PRODUTOS[hashStr(contratoId) % PRODUTOS.length];
}

/** Produto atual do cliente — primeiro contrato vigente. */
export function getProdutoAtualCliente(clienteId: string, customContratos?: Contrato[]): Produto | null {
  const source = customContratos || contratos;
  const ct = source.find(
    c => c.clienteId === clienteId && !['encerrado', 'churn', 'cancelado'].includes(c.status),
  );
  return ct ? getProdutoContrato(ct.id) : null;
}


/** Histórico de produtos consumidos pelo cliente (todos os contratos). */
export interface HistoricoProduto {
  contratoId: string;
  produto: Produto;
  inicio: string;
  fim: string;
  status: StatusContrato;
  valor: number;
}

export function getHistoricoProdutos(clienteId: string): HistoricoProduto[] {
  return contratos
    .filter(c => c.clienteId === clienteId)
    .map(c => ({
      contratoId: c.id,
      produto: getProdutoContrato(c.id),
      inicio: c.dataInicio,
      fim: c.dataFim,
      status: c.status,
      valor: c.valor,
    }))
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
}

// ─── Alertas Automáticos de Contrato ─────────────────────
export type TipoAlertaContrato = 'encerramento_proximo' | 'sem_renovacao' | 'atraso_entregavel';

export interface AlertaContrato {
  clienteId: string;
  clienteNome: string;
  consultorId: string;
  consultorNome: string;
  contratoId: string;
  tipo: TipoAlertaContrato;
  severidade: 'alta' | 'media' | 'baixa';
  mensagem: string;
  diasRestantes?: number;
  diasAtraso?: number;
}

const STATUS_RENOV_ATIVA: StatusContrato[] = ['em_renovacao', 'renovado'];
const STATUS_TERMINADO: StatusContrato[] = ['encerrado', 'churn', 'cancelado'];

export function getAlertasContratoDoCliente(clienteId: string): AlertaContrato[] {
  const hoje = new Date();
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) return [];
  const cts = contratos.filter(c => c.clienteId === clienteId && !STATUS_TERMINADO.includes(c.status));
  const out: AlertaContrato[] = [];

  for (const ct of cts) {
    const fim = new Date(ct.dataFim);
    const diffDias = Math.floor((fim.getTime() - hoje.getTime()) / 86400000);

    // Encerramento próximo: <90d e sem renovação iniciada
    if (diffDias > 0 && diffDias < 90 && !STATUS_RENOV_ATIVA.includes(ct.status)) {
      out.push({
        clienteId, clienteNome: cliente.nomeFantasia,
        consultorId: cliente.consultorId, consultorNome: cliente.consultorNome,
        contratoId: ct.id, tipo: 'encerramento_proximo',
        severidade: diffDias < 30 ? 'alta' : 'media',
        mensagem: `Vence em ${diffDias} dias sem renovação iniciada`,
        diasRestantes: diffDias,
      });
    }

    // Sem renovação: vencido sem renovado/em_renovacao
    if (diffDias <= 0 && !STATUS_RENOV_ATIVA.includes(ct.status)) {
      const atraso = Math.abs(diffDias);
      out.push({
        clienteId, clienteNome: cliente.nomeFantasia,
        consultorId: cliente.consultorId, consultorNome: cliente.consultorNome,
        contratoId: ct.id, tipo: 'sem_renovacao',
        severidade: 'alta',
        mensagem: `Vencido há ${atraso} dias sem renovação`,
        diasAtraso: atraso,
      });
    }

    // Atraso em entregável (mock determinístico):
    // ~30% dos clientes em execução/monitoramento têm atraso simulado
    const fasesComEntregavel = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento'];
    if (fasesComEntregavel.includes(cliente.faseMetodologica)) {
      const seed = hashStr(ct.id + 'entrega') % 100;
      if (seed < 30) {
        const diasAtrasoEntrega = (seed % 14) + 1;
        out.push({
          clienteId, clienteNome: cliente.nomeFantasia,
          consultorId: cliente.consultorId, consultorNome: cliente.consultorNome,
          contratoId: ct.id, tipo: 'atraso_entregavel',
          severidade: diasAtrasoEntrega > 7 ? 'alta' : 'media',
          mensagem: `Entregável da fase atrasado há ${diasAtrasoEntrega} dias`,
          diasAtraso: diasAtrasoEntrega,
        });
      }
    }
  }
  return out;
}

export function getAlertasContrato(opts?: { consultorId?: string }): AlertaContrato[] {
  const out: AlertaContrato[] = [];
  for (const cl of clientes) {
    if (opts?.consultorId && cl.consultorId !== opts.consultorId) continue;
    out.push(...getAlertasContratoDoCliente(cl.id));
  }
  return out;
}

export const labelAlertaContrato: Record<TipoAlertaContrato, string> = {
  encerramento_proximo: 'Encerramento próximo',
  sem_renovacao: 'Sem renovação',
  atraso_entregavel: 'Atraso em entregável',
};

// ─── KPIs Estratégicos de Contratos ──────────────────────
export interface KpisEstrategicos {
  churnRate: number;          // %
  taxaRenovacao: number;      // %
  taxaReativacao: number;     // %
  ltvMedio: number;           // R$
  // Variação vs período anterior (mock determinístico)
  deltaChurn: number;
  deltaRenovacao: number;
  deltaReativacao: number;
  deltaLtv: number;
  // Mini-série (6 meses) — para sparklines
  serieChurn: number[];
  serieRenovacao: number[];
  serieReativacao: number[];
  serieLtv: number[];
}

export type PeriodoKpi = '3m' | '6m' | '12m' | 'ano';

export function getKpisEstrategicos(periodo: PeriodoKpi = '12m'): KpisEstrategicos {
  const hoje = new Date();
  const limiteMeses = periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12;
  const limite = new Date(hoje.getFullYear(), hoje.getMonth() - limiteMeses, hoje.getDate());

  const totalCt = contratos.length || 1;

  // Churn rate
  const churns = contratos.filter(c => (c.status === 'churn' || c.status === 'cancelado'));
  const churnRate = Math.round((churns.length / totalCt) * 1000) / 10;

  // Taxa de renovação: renovado / (renovado + churn + cancelado + encerrado vencidos)
  const vencidos = contratos.filter(c => new Date(c.dataFim) <= hoje || ['renovado', 'churn', 'cancelado', 'encerrado'].includes(c.status));
  const renovados = contratos.filter(c => c.status === 'renovado' || c.status === 'em_renovacao').length;
  const taxaRenovacao = vencidos.length > 0 ? Math.round((renovados / vencidos.length) * 1000) / 10 : 0;

  // Taxa de reativação: clientes que tiveram contrato churn/cancelado e voltaram a ter contrato ativo
  const clientesChurned = new Set(churns.map(c => c.clienteId));
  const reativados = Array.from(clientesChurned).filter(clId =>
    contratos.some(c => c.clienteId === clId && (c.status === 'ativo' || c.status === 'renovado' || c.status === 'em_renovacao')),
  ).length;
  const taxaReativacao = clientesChurned.size > 0
    ? Math.round((reativados / clientesChurned.size) * 1000) / 10
    : 0;

  // LTV médio: soma valor por cliente / num clientes
  const valorPorCliente: Record<string, number> = {};
  contratos.forEach(c => { valorPorCliente[c.clienteId] = (valorPorCliente[c.clienteId] || 0) + c.valor; });
  const numClientes = Object.keys(valorPorCliente).length || 1;
  const ltvMedio = Math.round(Object.values(valorPorCliente).reduce((a, b) => a + b, 0) / numClientes);

  // Deltas determinísticos (mock realista entre -5 e +5 pontos)
  const seed = hashStr(periodo);
  const det = (k: number) => {
    const r = (seed * (k + 1)) % 100;
    return Math.round((r - 50) / 10 * 10) / 10;
  };

  // Séries de 6 pontos com pequena variação ao redor do valor atual
  const serie = (atual: number, base: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const noise = ((seed * (i + base + 1)) % 30) - 15;
      return Math.max(0, Math.round((atual + noise / 5) * 10) / 10);
    });
  };

  return {
    churnRate,
    taxaRenovacao,
    taxaReativacao,
    ltvMedio,
    deltaChurn: det(1),
    deltaRenovacao: det(2),
    deltaReativacao: det(3),
    deltaLtv: det(4),
    serieChurn: serie(churnRate, 1),
    serieRenovacao: serie(taxaRenovacao, 2),
    serieReativacao: serie(taxaReativacao, 3),
    serieLtv: serie(ltvMedio / 1000, 4),
  };
}

// ─── Análise por Tempo de Contrato ───────────────────────
export interface FaixaTempo {
  key: string;
  label: string;
  minMeses: number;
  maxMeses: number;
  clientes: Cliente[];
  qtd: number;
  pct: number;
}

const FAIXAS: Array<Omit<FaixaTempo, 'clientes' | 'qtd' | 'pct'>> = [
  { key: '0-3', label: '0–3 meses (Onboarding)', minMeses: 0, maxMeses: 3 },
  { key: '3-6', label: '3–6 meses', minMeses: 3, maxMeses: 6 },
  { key: '6-12', label: '6–12 meses', minMeses: 6, maxMeses: 12 },
  { key: '12-24', label: '12–24 meses', minMeses: 12, maxMeses: 24 },
  { key: '24+', label: '24+ meses', minMeses: 24, maxMeses: 9999 },
];

const mesesDesde = (iso: string): number => {
  const d = new Date(iso);
  const hoje = new Date();
  return (hoje.getFullYear() - d.getFullYear()) * 12 + (hoje.getMonth() - d.getMonth());
};

export function getDistribuicaoPorTempo(): FaixaTempo[] {
  const total = clientes.length || 1;
  return FAIXAS.map(f => {
    const cs = clientes.filter(c => {
      const m = mesesDesde(c.dataInicio);
      return m >= f.minMeses && m < f.maxMeses;
    });
    return { ...f, clientes: cs, qtd: cs.length, pct: Math.round((cs.length / total) * 1000) / 10 };
  });
}

export function getLtvPorCliente(clienteId: string): number {
  return contratos.filter(c => c.clienteId === clienteId).reduce((a, c) => a + c.valor, 0);
}
