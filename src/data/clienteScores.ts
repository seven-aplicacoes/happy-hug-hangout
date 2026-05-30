// === Scores do Cliente — PARTE 2 / Bloco 3 ===
// Scores 0–100 derivados deterministicamente do estado real do cliente.

import { clientes, reunioes, diasDesdeUltimaReuniao, calcularEngajamento } from './mockData';
import { getAlertasContratoDoCliente } from './contratoExtras';
import { getExecucaoClientes } from './contratosAnalytics';
import type { Cliente, NivelEngajamento } from '@/types';

export interface ClienteScores {
  risco: number;          // 0–100 (alto = maior probabilidade de churn)
  engajamento: number;    // 0–100
  evolucao: number;       // 0–100
  csatMedio: number;      // 0–100
  csatTaxaResposta: number; // 0–100
  classRisco: 'baixo' | 'medio' | 'alto' | 'critico';
  engajamentoNivel: NivelEngajamento;
}

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export function getClienteScores(clienteId: string): ClienteScores {
  const cl = clientes.find(c => c.id === clienteId);
  const seed = hashStr(clienteId);
  if (!cl) {
    return { risco: 50, engajamento: 50, evolucao: 50, csatMedio: 70, csatTaxaResposta: 60, classRisco: 'medio', engajamentoNivel: 'atencao' };
  }

  // Engajamento: inverso de dias sem reunião + status do contrato
  const dias = diasDesdeUltimaReuniao(clienteId) ?? 0;
  const baseEng = Math.max(0, 100 - dias * 4);
  const ajusteStatus = cl.status === 'ativo' ? 0 : cl.status === 'em_renovacao' || cl.status === 'em_onboarding' ? -5 : -25;
  const engajamento = Math.max(0, Math.min(100, baseEng + ajusteStatus));

  // Evolução: índice Seven + alertas de execução
  const ex = getExecucaoClientes().find(e => e.clienteId === clienteId);
  const ajusteEx = ex ? -ex.indiceAtraso / 2 : 0;
  const evolucao = Math.max(0, Math.min(100, cl.indiceSeven + ajusteEx));

  // Risco: combinação ponderada
  const alertas = getAlertasContratoDoCliente(clienteId).length;
  const risco = Math.round(
    Math.max(0, Math.min(100,
      (100 - engajamento) * 0.45 +
      (100 - evolucao) * 0.35 +
      alertas * 8 +
      (cl.status === 'bloqueado' || cl.status === 'suspenso' ? 20 : 0),
    )),
  );

  // CSAT: derivado de reuniões realizadas (mock determinístico mas estável)
  const reaCl = reunioes.filter(r => r.clienteId === clienteId && r.status === 'realizada');
  const csatBase = 70 + (seed % 25);
  const csatMedio = Math.min(100, csatBase);
  const csatTaxaResposta = Math.min(100, 40 + (reaCl.length * 8) + (seed % 20));

  const classRisco = risco >= 75 ? 'critico' : risco >= 55 ? 'alto' : risco >= 35 ? 'medio' : 'baixo';

  return {
    risco,
    engajamento: Math.round(engajamento),
    evolucao: Math.round(evolucao),
    csatMedio: Math.round(csatMedio),
    csatTaxaResposta: Math.round(csatTaxaResposta),
    classRisco,
    engajamentoNivel: calcularEngajamento(clienteId) as NivelEngajamento,
  };
}

export const labelClassRisco: Record<ClienteScores['classRisco'], string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  critico: 'Crítico',
};

export const variantClassRisco: Record<ClienteScores['classRisco'], 'success' | 'warning' | 'danger' | 'info'> = {
  baixo: 'success',
  medio: 'info',
  alto: 'warning',
  critico: 'danger',
};

// ─── Timeline de mudanças de status (mock determinístico) ──
export interface StatusEvento {
  data: string;
  statusAnterior: string;
  statusNovo: string;
  motivo: string;
  tipo: 'status' | 'plano' | 'reativacao';
}

export function getTimelineStatus(clienteId: string): StatusEvento[] {
  const cl = clientes.find(c => c.id === clienteId);
  if (!cl) return [];
  const seed = hashStr(clienteId + 'tl');
  const baseAno = new Date(cl.dataInicio).getFullYear();
  const events: StatusEvento[] = [
    { data: cl.dataInicio, statusAnterior: '—', statusNovo: 'em_onboarding', motivo: 'Início do contrato', tipo: 'status' },
    { data: `${baseAno}-${String(((seed % 6) + 2)).padStart(2, '0')}-15`, statusAnterior: 'em_onboarding', statusNovo: 'ativo', motivo: 'Onboarding concluído', tipo: 'status' },
  ];
  if (seed % 3 === 0) {
    events.push({ data: `${baseAno + 1}-02-10`, statusAnterior: 'ativo', statusNovo: 'churn', motivo: 'Cancelamento por orçamento', tipo: 'status' });
    events.push({ data: `${baseAno + 1}-08-20`, statusAnterior: 'churn', statusNovo: 'ativo', motivo: 'Reativação após nova rodada', tipo: 'reativacao' });
  }
  if (cl.status !== 'ativo') {
    events.push({ data: cl.ultimaInteracao, statusAnterior: 'ativo', statusNovo: cl.status, motivo: 'Alteração de status', tipo: 'status' });
  }
  // Mudança de plano determinística
  if (seed % 4 === 0) {
    events.push({ data: `${baseAno}-${String((seed % 9) + 3).padStart(2, '0')}-05`, statusAnterior: 'Plano Essencial', statusNovo: 'Plano Avançado', motivo: 'Upgrade contratado', tipo: 'plano' });
  }
  return events.sort((a, b) => a.data.localeCompare(b.data));
}

export function ehReativado(clienteId: string): boolean {
  return getTimelineStatus(clienteId).some(e => e.tipo === 'reativacao');
}
