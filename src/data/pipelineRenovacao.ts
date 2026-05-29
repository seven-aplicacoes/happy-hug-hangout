// === Pipeline de Renovação — 3 estágios ===
// Elegíveis | Em negociação | Em risco de saída

import { clientes, contratos } from './mockData';
import { getKpisEstrategicos } from './contratoExtras';
import type { Contrato, Cliente } from '@/types';

export type EstagioRenovacao = 'elegiveis' | 'em_negociacao' | 'risco_saida';

export const labelEstagioRenovacao: Record<EstagioRenovacao, string> = {
  elegiveis: 'Elegíveis',
  em_negociacao: 'Em negociação',
  risco_saida: 'Em risco de saída',
};

export const descricaoEstagio: Record<EstagioRenovacao, string> = {
  elegiveis: 'Contratos a vencer em 60–180 dias, sem sinais de risco',
  em_negociacao: 'Proposta enviada ou em discussão ativa com o cliente',
  risco_saida: 'Sinais claros de churn: insatisfação, queda de engajamento ou recusa explícita',
};

export const corEstagio: Record<EstagioRenovacao, 'success' | 'warning' | 'danger'> = {
  elegiveis: 'success',
  em_negociacao: 'warning',
  risco_saida: 'danger',
};

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export interface ItemPipelineRenovacao {
  contratoId: string;
  clienteId: string;
  clienteNome: string;
  consultorId: string;
  consultorNome: string;
  valor: number;
  dataFim: string;
  diasParaFim: number;
  estagio: EstagioRenovacao;
  proximaAcao: string;
  responsavel: string;
  prob: number; // probabilidade de renovação (0-100)
  motivo: string;
}

const ACOES_ELEGIVEIS = [
  'Enviar proposta de renovação',
  'Agendar reunião de balanço de ciclo',
  'Apresentar resultados consolidados',
];
const ACOES_NEGOCIACAO = [
  'Follow-up da proposta enviada',
  'Reunião de fechamento com decisor',
  'Ajustar escopo conforme feedback',
];
const ACOES_RISCO = [
  'Sessão de retenção com diretor',
  'Plano de recuperação 30 dias',
  'Mapear razões de insatisfação',
];

export function getPipelineRenovacao(opts?: { consultorId?: string }): ItemPipelineRenovacao[] {
  const hoje = new Date();
  const out: ItemPipelineRenovacao[] = [];
  for (const ct of contratos) {
    if (opts?.consultorId && ct.consultorId !== opts.consultorId) continue;
    if (['encerrado', 'churn', 'cancelado'].includes(ct.status)) continue;
    const fim = new Date(ct.dataFim);
    const dias = Math.floor((fim.getTime() - hoje.getTime()) / 86400000);
    if (dias < 0 || dias > 240) continue;

    const cliente = clientes.find(c => c.id === ct.clienteId);
    if (!cliente) continue;
    const seed = hashStr(ct.id);

    // Estágio
    let estagio: EstagioRenovacao;
    let prob: number;
    let motivo: string;
    if (cliente.indiceSeven < 50 || cliente.status === 'bloqueado' || cliente.status === 'suspenso') {
      estagio = 'risco_saida';
      prob = 20 + (seed % 25);
      motivo = `Índice Seven ${cliente.indiceSeven} · status ${cliente.status}`;
    } else if (dias <= 90 || ct.status === 'em_renovacao' || seed % 3 === 0) {
      estagio = 'em_negociacao';
      prob = 55 + (seed % 35);
      motivo = ct.status === 'em_renovacao' ? 'Renovação formalmente em curso' : 'Janela de decisão ativa';
    } else {
      estagio = 'elegiveis';
      prob = 70 + (seed % 25);
      motivo = `Contrato saudável a vencer em ${dias}d`;
    }

    const pool =
      estagio === 'elegiveis' ? ACOES_ELEGIVEIS :
      estagio === 'em_negociacao' ? ACOES_NEGOCIACAO : ACOES_RISCO;

    out.push({
      contratoId: ct.id,
      clienteId: cliente.id,
      clienteNome: cliente.nomeFantasia,
      consultorId: ct.consultorId,
      consultorNome: ct.consultorNome,
      valor: ct.valor,
      dataFim: ct.dataFim,
      diasParaFim: dias,
      estagio,
      proximaAcao: pool[seed % pool.length],
      responsavel: ct.consultorNome,
      prob,
      motivo,
    });
  }
  return out.sort((a, b) => a.diasParaFim - b.diasParaFim);
}

export interface ResumoPipeline {
  totalContratos: number;
  valorTotal: number;
  valorEmRisco: number;
  qtdElegiveis: number;
  qtdNegociacao: number;
  qtdRisco: number;
  taxaProjetada: number;
}

export function getResumoPipeline(itens: ItemPipelineRenovacao[]): ResumoPipeline {
  const total = itens.length;
  const valorTotal = itens.reduce((s, i) => s + i.valor, 0);
  const valorEmRisco = itens.filter(i => i.estagio === 'risco_saida').reduce((s, i) => s + i.valor, 0);
  const probMedia = total ? itens.reduce((s, i) => s + i.prob, 0) / total : 0;
  return {
    totalContratos: total,
    valorTotal,
    valorEmRisco,
    qtdElegiveis: itens.filter(i => i.estagio === 'elegiveis').length,
    qtdNegociacao: itens.filter(i => i.estagio === 'em_negociacao').length,
    qtdRisco: itens.filter(i => i.estagio === 'risco_saida').length,
    taxaProjetada: Math.round(probMedia),
  };
}
