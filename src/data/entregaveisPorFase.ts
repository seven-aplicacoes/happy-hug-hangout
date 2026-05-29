// === Entregáveis por Fase — PARTE 2 / Bloco 3 ===
// Escopos pré-carregados por produto, microfases, planejado x realizado.

import { clientes } from './mockData';
import { getProdutoAtualCliente } from './contratoExtras';
import type { FaseMetodologica } from '@/types';

export interface MicroEntregavel {
  id: string;
  titulo: string;
  status: 'planejado' | 'em_execucao' | 'concluido' | 'atrasado';
  prazo: string;
  responsavel: string;
}

export interface FaseEntregaveis {
  fase: FaseMetodologica;
  titulo: string;
  obrigatorios: string[];
  micros: MicroEntregavel[];
  planejados: number;
  realizados: number;
  atrasados: number;
}

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Escopos por fase (genéricos, complementados por produto)
const OBRIG_POR_FASE: Record<FaseMetodologica, string[]> = {
  diagnostico: ['Mapa de stakeholders', 'Diagnóstico inicial', 'Levantamento de processos críticos'],
  planejamento: ['Plano de ação 90 dias', 'Definição de OKRs', 'Cronograma macro'],
  estruturacao: ['Implementação dos pilares', 'Treinamento da equipe', 'Painéis de acompanhamento'],
  monitoramento: ['Reuniões mensais de revisão', 'Ajustes finos', 'Relatório executivo trimestral'],
  encerramento: ['Plano de continuidade', 'Documentação final', 'Reunião de balanço'],
};

const PRODUTO_EXTRAS: Record<string, string[]> = {
  'Conselho Estratégico': ['Agenda do conselho', 'Atas formalizadas'],
  'Doc Mentoring': ['Sessões individuais agendadas', 'Plano de desenvolvimento'],
  'Gestão Comercial': ['Funil comercial estruturado', 'KPIs de vendas'],
  'Gestão Financeira': ['DRE gerencial', 'Fluxo de caixa projetado'],
  'Go Better': ['Diagnóstico cultural', 'Plano de evolução'],
  'Jornada do Paciente': ['Mapa da jornada', 'Pontos de fricção identificados'],
  'Legacy': ['Plano de sucessão', 'Acordo familiar'],
};

export function getEntregaveisCliente(clienteId: string): FaseEntregaveis[] {
  const cl = clientes.find(c => c.id === clienteId);
  if (!cl) return [];
  const produto = getProdutoAtualCliente(clienteId);
  const extras = produto ? PRODUTO_EXTRAS[produto] || [] : [];
  const seed = hashStr(clienteId + 'ent');
  const fases: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];
  const faseAtualIdx = fases.indexOf(cl.faseMetodologica);

  return fases.map((fase, idx) => {
    const obrigatorios = [...OBRIG_POR_FASE[fase], ...(idx === faseAtualIdx ? extras : [])];
    const totalMicros = obrigatorios.length;
    const micros: MicroEntregavel[] = obrigatorios.map((titulo, i) => {
      const s = (seed + i * 7 + idx * 11) % 100;
      let status: MicroEntregavel['status'];
      if (idx < faseAtualIdx) status = 'concluido';
      else if (idx > faseAtualIdx) status = 'planejado';
      else status = s < 40 ? 'concluido' : s < 70 ? 'em_execucao' : s < 88 ? 'planejado' : 'atrasado';
      return {
        id: `${clienteId}-${fase}-${i}`,
        titulo,
        status,
        prazo: `2025-${String((idx + 3) % 12 + 1).padStart(2, '0')}-${String(((s % 27) + 1)).padStart(2, '0')}`,
        responsavel: cl.consultorNome,
      };
    });
    const realizados = micros.filter(m => m.status === 'concluido').length;
    const atrasados = micros.filter(m => m.status === 'atrasado').length;
    return {
      fase,
      titulo: { diagnostico: 'Diagnóstico', planejamento: 'Planejamento', estruturacao: 'Estruturação', monitoramento: 'Monitoramento', encerramento: 'Encerramento' }[fase],
      obrigatorios,
      micros,
      planejados: totalMicros,
      realizados,
      atrasados,
    };
  });
}
