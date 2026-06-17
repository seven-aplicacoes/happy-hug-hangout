// === Cliente Extras — Bloco 3 (Porte, Datas-Chave, Horas, Scores Evolução/CSAT) ===
// Tudo determinístico baseado em IDs/atributos do cliente.

import { clientes, contratos, reunioes, calcularEngajamento } from './mockData';
import type { Cliente } from '@/types';

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// ─── Porte da Clínica (derivado do faturamento médio atual) ──────────────
export type Porte = 'Pequena' | 'Média' | 'Grande';

export const labelPorte: Record<Porte, string> = {
  Pequena: 'Pequena',
  'Média': 'Média',
  Grande: 'Grande',
};

export const PORTE_OPTIONS = (Object.keys(labelPorte) as Porte[]).map(v => ({ value: v, label: labelPorte[v] }));

/**
 * Calcula o porte da clínica a partir do faturamento médio atual (R$/mês).
 * Regras:
 * - Até R$ 50.000,00            → Pequena
 * - De R$ 50.000,01 a R$ 200.000,00 → Média
 * - Acima de R$ 200.000,00      → Grande
 * Retorna null quando o faturamento não está informado.
 */
export function calcularPorteClinica(faturamento?: number | string | null): Porte | null {
  if (faturamento === null || faturamento === undefined || faturamento === '') return null;
  const v = Number(faturamento);
  if (!isFinite(v) || v <= 0) return null;
  if (v <= 50_000) return 'Pequena';
  if (v <= 200_000) return 'Média';
  return 'Grande';
}

export function getPorte(cliente: Cliente): Porte | null {
  const calc = calcularPorteClinica(cliente?.faturamentoMensal);
  if (calc) return calc;
  const stored = (cliente?.porte as string) || '';
  if (stored === 'Pequena' || stored === 'Média' || stored === 'Grande') return stored as Porte;
  return null;
}

// ─── Datas-Chave ─────────────────────────────────────────
export type StatusDataChave = 'concluido' | 'pendente' | 'atrasado' | 'em_breve';

export interface DataChave {
  id: string;
  evento: string;
  data: string; // ISO
  responsavel: string;
  status: StatusDataChave;
  diasParaVencer: number;
}

const EVENTOS_BASE = [
  'Reunião de Kickoff',
  'Entrega do Diagnóstico',
  'Apresentação de Resultados',
  'Avaliação de CSAT',
  'Renovação Contratual',
  'Workshop com Liderança',
];

const RESPONSAVEIS = ['Ana Beatriz', 'Carlos Eduardo', 'Marina Costa', 'Cliente'];

export function getDatasChave(clienteId: string): DataChave[] {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) return [];
  const ct = contratos.find(c => c.clienteId === clienteId);
  const inicio = ct ? new Date(ct.dataInicio) : new Date(cliente.dataInicio);
  const fim = ct ? new Date(ct.dataFim) : new Date(Date.now() + 365 * 86400000);
  const total = Math.max(60, (fim.getTime() - inicio.getTime()) / 86400000);
  const hoje = new Date();
  const seed = hashStr(clienteId);

  return EVENTOS_BASE.map((evento, i) => {
    // distribui ao longo do contrato em frações 0.05, 0.20, 0.45, 0.65, 0.95, 0.80
    const fracoes = [0.05, 0.2, 0.45, 0.65, 0.95, 0.8];
    const ms = inicio.getTime() + total * fracoes[i] * 86400000;
    const data = new Date(ms);
    const dias = Math.floor((data.getTime() - hoje.getTime()) / 86400000);
    const responsavel = RESPONSAVEIS[(seed + i) % RESPONSAVEIS.length];
    let status: StatusDataChave;
    if (dias < -3) status = 'concluido';
    else if (dias < 0) status = 'atrasado';
    else if (dias <= 7) status = 'em_breve';
    else status = 'pendente';
    // ~20% das datas passadas viram atrasadas em vez de concluídas
    if (status === 'concluido' && (seed + i) % 5 === 0) status = 'atrasado';
    return {
      id: `${clienteId}-dk-${i}`,
      evento,
      data: data.toISOString().slice(0, 10),
      responsavel,
      status,
      diasParaVencer: dias,
    };
  }).sort((a, b) => a.data.localeCompare(b.data));
}

export const labelStatusDataChave: Record<StatusDataChave, string> = {
  concluido: 'Concluído',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  em_breve: 'Em breve',
};

// ─── Horas previstas vs. consumidas ──────────────────────
export interface ConsumoHoras {
  previstas: number;
  realizadas: number;
  saldo: number;
  percentual: number;
  zona: 'verde' | 'amarelo' | 'laranja' | 'vermelho';
  porMes: { mes: string; horas: number }[]; // últimos 6 meses
}

const ZONA_LABEL: Record<ConsumoHoras['zona'], string> = {
  verde: 'No prazo',
  amarelo: 'Atenção',
  laranja: 'Próximo ao limite',
  vermelho: 'Excedido',
};
export const labelZonaHoras = ZONA_LABEL;

export function getConsumoHoras(clienteId: string): ConsumoHoras {
  const ct = contratos.find(c => c.clienteId === clienteId);
  // Previstas: 8h/mês × duração do contrato em meses (mock estável)
  let previstas = 96; // default 12 meses × 8h
  if (ct) {
    const meses = Math.max(1, Math.round(
      (new Date(ct.dataFim).getTime() - new Date(ct.dataInicio).getTime()) / (30 * 86400000),
    ));
    previstas = meses * 8;
  }
  // Realizadas: soma das durações (min) das reuniões realizadas / 60
  const minutos = reunioes
    .filter(r => r.clienteId === clienteId && r.status === 'realizada')
    .reduce((a, r) => a + (r.duracao || 60), 0);
  const realizadas = Math.round((minutos / 60) * 10) / 10;
  const saldo = Math.round((previstas - realizadas) * 10) / 10;
  const percentual = previstas > 0 ? Math.round((realizadas / previstas) * 1000) / 10 : 0;
  let zona: ConsumoHoras['zona'] = 'verde';
  if (percentual > 100) zona = 'vermelho';
  else if (percentual > 90) zona = 'laranja';
  else if (percentual > 70) zona = 'amarelo';

  // Série dos últimos 6 meses — soma real por mês
  const hoje = new Date();
  const porMes: { mes: string; horas: number }[] = [];
  const labelMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  for (let i = 5; i >= 0; i--) {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const proxRef = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
    const min = reunioes
      .filter(r => r.clienteId === clienteId && r.status === 'realizada')
      .filter(r => {
        const d = new Date(r.meetingDate);
        return d >= ref && d < proxRef;
      })
      .reduce((a, r) => a + (r.duracao || 60), 0);
    porMes.push({ mes: labelMes[ref.getMonth()], horas: Math.round((min / 60) * 10) / 10 });
  }
  return { previstas, realizadas, saldo, percentual, zona, porMes };
}

// ─── Score de Evolução (0-100) ───────────────────────────
const FASES_ORDER = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];

export function getScoreEvolucao(cliente: Cliente): number {
  const idxFase = FASES_ORDER.indexOf(cliente.faseMetodologica);
  const progressoFase = ((idxFase + 1) / FASES_ORDER.length) * 100;
  // Mistura com índice Seven e fator de prazo determinístico
  const seed = hashStr(cliente.id);
  const fatorPrazo = ((seed % 30) - 10); // -10 a +20 (penaliza atrasos)
  const eng = calcularEngajamento(cliente.id);
  const ajusteEng = eng === 'em_dia' ? 5 : eng === 'critico' ? -15 : -5;
  return Math.max(0, Math.min(100, Math.round(progressoFase * 0.5 + cliente.indiceSeven * 0.4 + fatorPrazo + ajusteEng)));
}

export function corEvolucao(score: number): 'success' | 'warning' | 'danger' {
  if (score > 70) return 'success';
  if (score >= 40) return 'warning';
  return 'danger';
}

// ─── CSAT (0-10) ────────────────────────────────────────
export interface CsatHistorico {
  data: string;
  valor: number;
}

export function getCsatHistorico(clienteId: string): CsatHistorico[] {
  const seed = hashStr(clienteId);
  const reun = reunioes.filter(r => r.clienteId === clienteId && r.status === 'realizada')
    .sort((a, b) => a.data.localeCompare(b.data));
  return reun.map((r, i) => ({
    data: r.meetingDate,
    // CSAT entre 6.5 e 9.8 — ondulação determinística
    valor: Math.round(((6.5 + ((seed + i * 17) % 33) / 10) + Math.sin(i + seed) * 0.3) * 10) / 10,
  }));
}

export function getCsatMedio(clienteId: string): number {
  const h = getCsatHistorico(clienteId);
  if (h.length === 0) return 0;
  return Math.round((h.reduce((a, x) => a + x.valor, 0) / h.length) * 10) / 10;
}

export function corCsat(media: number): 'success' | 'warning' | 'danger' {
  if (media >= 8) return 'success';
  if (media >= 6) return 'warning';
  return 'danger';
}

// ─── Entregáveis Detalhados por Fase (3.4) ──────────────
export type StatusEntregavel = 'concluido' | 'em_andamento' | 'pendente' | 'atrasado';

export interface EntregavelDetalhado {
  id: string;
  titulo: string;
  status: StatusEntregavel;
  responsavel: string;
  prazo: string; // ISO
  evidencia?: string;
  diasParaVencer: number;
}

export const labelStatusEntregavel: Record<StatusEntregavel, string> = {
  concluido: 'Concluído',
  em_andamento: 'Em andamento',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

const RESP_ENT = ['Ana Beatriz', 'Carlos Eduardo', 'Marina Costa', 'Equipe do Cliente'];
const EVIDENCIAS_POOL = ['relatorio-v1.pdf', 'planilha-acompanhamento.xlsx', 'apresentacao.pptx', 'ata-validacao.pdf'];

export function getEntregaveisDetalhados(
  clienteId: string,
  faseNome: string,
  faseStatus: 'concluida' | 'em_andamento' | 'pendente',
  entregaveis: string[],
): EntregavelDetalhado[] {
  const seedBase = hashStr(clienteId + faseNome);
  const hoje = new Date();
  return entregaveis.map((titulo, i) => {
    const seed = seedBase + i * 7;
    const offsetDias = ((seed % 90) - 45); // -45 a +44
    const prazoMs = hoje.getTime() + offsetDias * 86400000;
    const prazo = new Date(prazoMs);
    const diasParaVencer = Math.floor((prazo.getTime() - hoje.getTime()) / 86400000);

    let status: StatusEntregavel;
    if (faseStatus === 'concluida') {
      status = (seed % 10) === 0 ? 'atrasado' : 'concluido';
    } else if (faseStatus === 'pendente') {
      status = 'pendente';
    } else {
      // em_andamento: misto
      if (diasParaVencer < -2) status = (seed % 3 === 0) ? 'concluido' : 'atrasado';
      else if (diasParaVencer < 7) status = 'em_andamento';
      else status = (seed % 4 === 0) ? 'em_andamento' : 'pendente';
    }
    const evidencia = (status === 'concluido' || (seed % 3 === 0))
      ? EVIDENCIAS_POOL[seed % EVIDENCIAS_POOL.length]
      : undefined;
    return {
      id: `${clienteId}-${faseNome}-${i}`,
      titulo,
      status,
      responsavel: RESP_ENT[seed % RESP_ENT.length],
      prazo: prazo.toISOString().slice(0, 10),
      evidencia,
      diasParaVencer,
    };
  });
}

export function corStatusEntregavel(s: StatusEntregavel): 'success' | 'warning' | 'danger' | 'neutral' {
  if (s === 'concluido') return 'success';
  if (s === 'em_andamento') return 'warning';
  if (s === 'atrasado') return 'danger';
  return 'neutral';
}
