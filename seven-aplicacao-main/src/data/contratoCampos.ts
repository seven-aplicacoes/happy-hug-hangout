// === Campos complementares do contrato (compra, encerramento, pagamento, plano, OneDrive, multi-consultor) ===
// Determinístico por id. Estrutura mock pronta para conexão com backend real.

import { clientes, contratos, consultores } from './mockData';
import type { Cliente } from '@/types';

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export type StatusPagamento = 'em_dia' | 'pendente' | 'atrasado' | 'inadimplente' | 'isento';

export const labelStatusPagamento: Record<StatusPagamento, string> = {
  em_dia: 'Em dia',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  inadimplente: 'Inadimplente',
  isento: 'Isento',
};

export const variantStatusPagamento: Record<StatusPagamento, 'success' | 'warning' | 'danger' | 'neutral'> = {
  em_dia: 'success',
  pendente: 'warning',
  atrasado: 'warning',
  inadimplente: 'danger',
  isento: 'neutral',
};

export interface CamposContratoExt {
  dataCompra: string;            // ≠ dataInicio (assinatura/compra)
  dataInicio: string;            // dataInicio operacional
  dataEncerramentoPrevista: string;
  dataEncerramentoReal?: string; // só quando encerrado de fato
  statusPagamento: StatusPagamento;
  diasAtrasoPagamento: number;
  proximoVencimento: string;
  linkOneDrive: string;
  consultoresAdicionais: { id: string; nome: string; papel: string }[];
}

const DEFASAGEM_COMPRA_DIAS = [3, 7, 14, 21, 30];

export function getCamposContrato(contratoId: string): CamposContratoExt {
  const ct = contratos.find(c => c.id === contratoId);
  if (!ct) {
    return {
      dataCompra: '', dataInicio: '', dataEncerramentoPrevista: '',
      statusPagamento: 'em_dia', diasAtrasoPagamento: 0, proximoVencimento: '',
      linkOneDrive: '', consultoresAdicionais: [],
    };
  }
  const seed = hashStr(ct.id);
  const inicio = new Date(ct.dataInicio);
  const dataCompra = new Date(inicio.getTime() - DEFASAGEM_COMPRA_DIAS[seed % DEFASAGEM_COMPRA_DIAS.length] * 86400000);

  const fim = new Date(ct.dataFim);
  const encerrado = ['encerrado', 'churn', 'cancelado'].includes(ct.status);
  let dataReal: string | undefined;
  if (encerrado) {
    // diferença -10 a +20 dias do previsto
    const off = ((seed * 31) % 30) - 10;
    dataReal = new Date(fim.getTime() + off * 86400000).toISOString().slice(0, 10);
  }

  // Status pagamento
  const ps: StatusPagamento[] = ['em_dia', 'em_dia', 'em_dia', 'em_dia', 'pendente', 'atrasado', 'inadimplente', 'isento'];
  const statusPagamento = ps[seed % ps.length];
  const diasAtrasoPagamento = statusPagamento === 'atrasado' ? (seed % 15) + 5
    : statusPagamento === 'inadimplente' ? (seed % 40) + 30 : 0;

  // Próximo vencimento: dia 10 do próximo mês
  const hoje = new Date();
  const prox = new Date(hoje.getFullYear(), hoje.getMonth() + (hoje.getDate() > 10 ? 1 : 0), 10);

  // Link OneDrive determinístico
  const slug = ct.clienteNome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const linkOneDrive = `https://onedrive.live.com/seven/clientes/${slug}-${ct.clienteId}`;

  // Consultores adicionais (cliente com mais de 1 consultor): ~25% dos contratos
  const consultoresAdicionais: { id: string; nome: string; papel: string }[] = [];
  if (seed % 4 === 0) {
    const outros = consultores.filter(c => c.id !== ct.consultorId);
    const extra = outros[seed % outros.length];
    if (extra) consultoresAdicionais.push({ id: extra.id, nome: extra.nome, papel: 'Co-consultor especialista' });
  }
  if (seed % 11 === 0 && consultoresAdicionais.length > 0) {
    const outros = consultores.filter(c => c.id !== ct.consultorId && !consultoresAdicionais.find(x => x.id === c.id));
    const extra = outros[(seed + 1) % outros.length];
    if (extra) consultoresAdicionais.push({ id: extra.id, nome: extra.nome, papel: 'Suporte temático' });
  }

  return {
    dataCompra: dataCompra.toISOString().slice(0, 10),
    dataInicio: ct.dataInicio,
    dataEncerramentoPrevista: ct.dataFim,
    dataEncerramentoReal: dataReal,
    statusPagamento,
    diasAtrasoPagamento,
    proximoVencimento: prox.toISOString().slice(0, 10),
    linkOneDrive,
    consultoresAdicionais,
  };
}

// ─── Histórico de Mudança de Plano ──────────────────────
export interface MudancaPlano {
  data: string;
  planoAnterior: string;
  planoNovo: string;
  motivo: string;
  tipo: 'upgrade' | 'downgrade' | 'troca';
  responsavel: string;
}

const PLANOS = ['Conselho Estratégico', 'Doc Mentoring', 'Gestão Comercial', 'Gestão Financeira', 'Go Better', 'Legacy'];
const MOTIVOS_UP = ['Cliente buscou maior maturidade', 'Resultado superou expectativa', 'Necessidade de expansão'];
const MOTIVOS_DOWN = ['Redução de escopo solicitada', 'Reorganização interna do cliente', 'Ajuste de investimento'];

export function getMudancasPlano(clienteId: string): MudancaPlano[] {
  const seed = hashStr(clienteId);
  if (seed % 3 === 0) return []; // 1/3 sem mudanças
  const qtd = (seed % 3) + 1;
  const out: MudancaPlano[] = [];
  const cliente = clientes.find(c => c.id === clienteId);
  const inicio = cliente ? new Date(cliente.dataInicio).getTime() : Date.now() - 730 * 86400000;
  const passo = (Date.now() - inicio) / (qtd + 1);
  for (let i = 0; i < qtd; i++) {
    const s = seed + i * 13;
    const isUp = s % 2 === 0;
    const anteriorIdx = s % PLANOS.length;
    const novoIdx = (anteriorIdx + (isUp ? 2 : -1) + PLANOS.length) % PLANOS.length;
    out.push({
      data: new Date(inicio + passo * (i + 1)).toISOString().slice(0, 10),
      planoAnterior: PLANOS[anteriorIdx],
      planoNovo: PLANOS[novoIdx],
      motivo: (isUp ? MOTIVOS_UP : MOTIVOS_DOWN)[s % 3],
      tipo: isUp ? 'upgrade' : 'downgrade',
      responsavel: cliente?.consultorNome || 'Consultor Seven',
    });
  }
  return out.sort((a, b) => a.data.localeCompare(b.data));
}

// ─── Potencial de aumento de produtividade (0-100%) ──────
export function getPotencialProdutividade(cliente: Cliente): { score: number; descricao: string; corVariant: 'success' | 'warning' | 'danger' } {
  // Combinação determinística: índice Seven + fase + porte
  const seed = hashStr(cliente.id);
  const base = 100 - cliente.indiceSeven; // quanto pior o índice, maior o potencial
  const fatorFase = cliente.faseMetodologica === 'monitoramento' || cliente.faseMetodologica === 'estruturacao' ? 15 : 5;
  const ruido = (seed % 20) - 10;
  const score = Math.max(5, Math.min(95, Math.round(base * 0.6 + fatorFase + ruido)));
  const descricao = score >= 60
    ? 'Alto potencial — concentre esforços em gestão e processos para destravar evolução.'
    : score >= 30
    ? 'Potencial moderado — refinar execução pode trazer ganhos relevantes.'
    : 'Cliente próximo do teto operacional — foco em consolidação e upsell estratégico.';
  const corVariant = score >= 60 ? 'success' : score >= 30 ? 'warning' : 'danger';
  return { score, descricao, corVariant };
}
