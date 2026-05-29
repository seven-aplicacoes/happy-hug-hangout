/**
 * Capacidade operacional dos consultores — Bloco 2.
 * Agora suporta dados reais vindo do banco.
 */
import type { Consultor, Cliente, Reuniao, Contrato } from '@/types';

export type StatusCapacidade = 'subutilizacao' | 'disponivel' | 'atencao' | 'sobrecarga';
export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface Capacidade {
  consultorId: string;
  horasDisponiveis: number;
  maxClientes: number;
  horasUtilizadasMes: number;
  ocupacaoPct: number;
  clientesAtivos: number;
  utilizacaoCarteiraPct: number;
  ltvMedioCarteira: number;
  status: StatusCapacidade;
}

export interface AlertaCapacidade {
  tipo: StatusCapacidade;
  label: string;
  mensagem: string;
  variant: StatusVariant;
}

const inicioMes = (() => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
})();

export function calculateCapacidade(
  consultorId: string,
  config: { hours_available?: number; max_clients?: number },
  clientes: Cliente[],
  reunioes: Reuniao[],
  contratos: Contrato[]
): Capacidade {
  const horasDisponiveis = config.hours_available || 160;
  const maxClientes = config.max_clients || 10;
  
  const meusClientes = (clientes || []).filter(c => c.consultorId === consultorId && c.status === 'ativo');
  const minhasReunioes = (reunioes || []).filter(
    r => r.consultorId === consultorId && r.status === 'realizada' && r.meetingDate >= inicioMes
  );
  
  const horasUtilizadasMes = Math.round(
    minhasReunioes.reduce((acc, r) => acc + (r.duracao || 60) / 60, 0)
  );
  
  const meusContratos = (contratos || []).filter(c => c.consultorId === consultorId);
  const ltvMedioCarteira = meusContratos.length
    ? Math.round(meusContratos.reduce((s, c) => s + (c.valor || 0), 0) / meusContratos.length)
    : 0;

  const ocupacaoPct = Math.round((horasUtilizadasMes / horasDisponiveis) * 100);
  const clientesAtivosCount = meusClientes.length;
  const utilizacaoCarteiraPct = Math.round((clientesAtivosCount / maxClientes) * 100);

  let status: StatusCapacidade;
  if (ocupacaoPct > 100 || clientesAtivosCount > maxClientes) status = 'sobrecarga';
  else if (ocupacaoPct >= 71) status = 'atencao';
  else if (ocupacaoPct >= 50) status = 'disponivel';
  else status = 'subutilizacao';

  return {
    consultorId,
    horasDisponiveis,
    maxClientes,
    horasUtilizadasMes,
    ocupacaoPct,
    clientesAtivos: clientesAtivosCount,
    utilizacaoCarteiraPct,
    ltvMedioCarteira,
    status,
  };
}

export const labelCapacidade: Record<StatusCapacidade, string> = {
  sobrecarga: 'Sobrecarga',
  atencao: 'Atenção',
  disponivel: 'Disponível',
  subutilizacao: 'Subutilização',
};

export const variantCapacidade: Record<StatusCapacidade, StatusVariant> = {
  sobrecarga: 'danger',
  atencao: 'warning',
  disponivel: 'success',
  subutilizacao: 'info',
};

export function getAlertaCapacidadeFromData(cap: Capacidade): AlertaCapacidade | null {
  if (cap.status === 'sobrecarga') {
    return {
      tipo: 'sobrecarga',
      label: 'Sobrecarga',
      mensagem: `Ocupação em ${cap.ocupacaoPct}% e ${cap.clientesAtivos}/${cap.maxClientes} clientes ativos. Redistribuir carteira.`,
      variant: 'danger',
    };
  }
  if (cap.status === 'subutilizacao') {
    return {
      tipo: 'subutilizacao',
      label: 'Subutilização',
      mensagem: `Ocupação em ${cap.ocupacaoPct}% nas últimas 2 semanas. Pode receber novos clientes.`,
      variant: 'warning',
    };
  }
  if (cap.status === 'disponivel') {
    return {
      tipo: 'disponivel',
      label: 'Capacidade disponível',
      mensagem: `Pode receber novos clientes (${cap.ocupacaoPct}% de ocupação).`,
      variant: 'success',
    };
  }
  return null;
}

// Compatibility exports
export const getCapacidade = (id: string): Capacidade => {
  return {
    consultorId: id,
    horasDisponiveis: 160,
    maxClientes: 10,
    horasUtilizadasMes: 0,
    ocupacaoPct: 0,
    clientesAtivos: 0,
    utilizacaoCarteiraPct: 0,
    ltvMedioCarteira: 0,
    status: 'disponivel',
  };
};

export const getTodasCapacidades = (): Capacidade[] => [];

export const getAlertaCapacidade = (id: string): AlertaCapacidade | null => null;

export const getBalanceamento = () => ({
  score: 0,
  label: 'Balanceado',
  variant: 'success' as StatusVariant,
  distribuicao: [] as { consultor: Consultor; clientes: number; ocupacao: number; sugestao: string }[],
});
