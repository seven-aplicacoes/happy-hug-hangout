// === Alertas específicos do cliente (acelerado / dificuldade / agenda / expectativa / desalinhamento) ===

import { clientes, reunioes, diasDesdeUltimaReuniao, calcularEngajamento } from './mockData';
import type { Cliente } from '@/types';

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export type TipoAlertaCliente =
  | 'acelerado'
  | 'dificuldade'
  | 'agenda_apertada'
  | 'expectativa_nao_atendida'
  | 'desalinhamento';

export interface AlertaCliente {
  clienteId: string;
  clienteNome: string;
  consultorId: string;
  consultorNome: string;
  tipo: TipoAlertaCliente;
  severidade: 'alta' | 'media' | 'baixa';
  motivo: string;
  proximaAcao: string;
  evidencia: string;
}

export const labelAlertaCliente: Record<TipoAlertaCliente, string> = {
  acelerado: 'Cliente acelerado',
  dificuldade: 'Cliente em dificuldade',
  agenda_apertada: 'Agenda apertada',
  expectativa_nao_atendida: 'Expectativa não atendida',
  desalinhamento: 'Desalinhamento',
};

export const corAlertaCliente: Record<TipoAlertaCliente, 'success' | 'warning' | 'danger' | 'info'> = {
  acelerado: 'success',
  dificuldade: 'danger',
  agenda_apertada: 'warning',
  expectativa_nao_atendida: 'danger',
  desalinhamento: 'warning',
};

const FASES_AVANCADAS = ['estruturacao', 'monitoramento', 'encerramento'];

export function getAlertasCliente(clienteId: string): AlertaCliente[] {
  const cl = clientes.find(c => c.id === clienteId);
  if (!cl) return [];
  const out: AlertaCliente[] = [];
  const seed = hashStr(clienteId);
  const dias = diasDesdeUltimaReuniao(clienteId);
  const reunioesCl = reunioes.filter(r => r.clienteId === clienteId);
  const realizadas = reunioesCl.filter(r => r.status === 'realizada').length;
  const canceladas = reunioesCl.filter(r => r.status === 'cancelada').length;
  const taxaCancel = reunioesCl.length ? canceladas / reunioesCl.length : 0;

  // Acelerado: índice Seven alto + fase avançada + engajamento em_dia
  if (cl.indiceSeven >= 80 && FASES_AVANCADAS.includes(cl.faseMetodologica) && dias <= 7) {
    out.push({
      clienteId, clienteNome: cl.nomeFantasia,
      consultorId: cl.consultorId, consultorNome: cl.consultorNome,
      tipo: 'acelerado', severidade: 'baixa',
      motivo: `Índice Seven ${cl.indiceSeven} em fase de ${cl.faseMetodologica}, ritmo acima do esperado`,
      proximaAcao: 'Avaliar antecipação de marcos e oportunidade de upsell',
      evidencia: `${realizadas} reuniões realizadas · última há ${dias}d`,
    });
  }

  // Dificuldade: índice Seven baixo + crítico
  if (cl.indiceSeven < 50 && calcularEngajamento(clienteId) === 'critico') {
    out.push({
      clienteId, clienteNome: cl.nomeFantasia,
      consultorId: cl.consultorId, consultorNome: cl.consultorNome,
      tipo: 'dificuldade', severidade: 'alta',
      motivo: `Índice Seven ${cl.indiceSeven} e ${dias}d sem reunião`,
      proximaAcao: 'Agendar reunião extraordinária com decisor para destravar',
      evidencia: `Engajamento crítico · ${canceladas} cancelamentos no histórico`,
    });
  }

  // Agenda apertada: muitos cancelamentos
  if (taxaCancel >= 0.3 && reunioesCl.length >= 3) {
    out.push({
      clienteId, clienteNome: cl.nomeFantasia,
      consultorId: cl.consultorId, consultorNome: cl.consultorNome,
      tipo: 'agenda_apertada', severidade: 'media',
      motivo: `${Math.round(taxaCancel * 100)}% de reuniões canceladas`,
      proximaAcao: 'Renegociar cadência ou propor formato assíncrono',
      evidencia: `${canceladas} canceladas de ${reunioesCl.length} agendadas`,
    });
  }

  // Expectativa não atendida: determinístico ~20% dos clientes
  if (seed % 5 === 0) {
    out.push({
      clienteId, clienteNome: cl.nomeFantasia,
      consultorId: cl.consultorId, consultorNome: cl.consultorNome,
      tipo: 'expectativa_nao_atendida', severidade: 'alta',
      motivo: 'Cliente sinalizou em NPS/feedback que resultado está abaixo do esperado',
      proximaAcao: 'Sessão de realinhamento de escopo com decisor + plano de recuperação 30d',
      evidencia: 'NPS recente abaixo da média da carteira',
    });
  }

  // Desalinhamento: determinístico ~15%
  if (seed % 7 === 0) {
    out.push({
      clienteId, clienteNome: cl.nomeFantasia,
      consultorId: cl.consultorId, consultorNome: cl.consultorNome,
      tipo: 'desalinhamento', severidade: 'media',
      motivo: 'Decisões aprovadas em reunião não foram executadas pelo cliente',
      proximaAcao: 'Reforçar acompanhamento semanal e ata estruturada de decisões',
      evidencia: 'Ações de últimas 2 reuniões marcadas como pendentes pelo lado do cliente',
    });
  }

  return out;
}

export function getAlertasClienteGlobal(opts?: { consultorId?: string }): AlertaCliente[] {
  const out: AlertaCliente[] = [];
  for (const cl of clientes) {
    if (opts?.consultorId && cl.consultorId !== opts.consultorId) continue;
    out.push(...getAlertasCliente(cl.id));
  }
  return out;
}
