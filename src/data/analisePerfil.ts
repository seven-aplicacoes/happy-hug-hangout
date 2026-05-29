// === Análise por Região e Especialidade — crescimento, ticket, evolução ===

import { clientes, contratos, labelEspecialidade, labelRegiao } from './mockData';
import type { Especialidade, Regiao, FaseMetodologica } from '@/types';

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export interface PerfilAnalise {
  chave: string;
  label: string;
  qtdClientes: number;
  ticketMedio: number;
  crescimento: number;        // % vs período anterior
  evolucaoMedia: number;      // índice Seven médio
  contratosNovos: number;     // últimos 6 meses
  receitaTotal: number;
}

function aggregate<T extends string>(getter: (cl: typeof clientes[number]) => T, labels: Record<string, string>): PerfilAnalise[] {
  const grupos = new Map<T, typeof clientes>();
  clientes.forEach(cl => {
    const k = getter(cl);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(cl);
  });
  const hoje = Date.now();
  const seisMesesAtras = hoje - 180 * 86400000;
  return Array.from(grupos.entries()).map(([chave, cls]) => {
    const ids = new Set(cls.map(c => c.id));
    const cts = contratos.filter(c => ids.has(c.clienteId));
    const ativos = cts.filter(c => !['encerrado', 'churn', 'cancelado'].includes(c.status));
    const receita = ativos.reduce((s, c) => s + c.valor, 0);
    const ticket = ativos.length ? Math.round(receita / ativos.length) : 0;
    const novos = cts.filter(c => new Date(c.dataInicio).getTime() >= seisMesesAtras).length;
    const evolucao = cls.length ? Math.round(cls.reduce((s, c) => s + c.indiceSeven, 0) / cls.length) : 0;
    // Crescimento determinístico -15% a +35%
    const seed = hashStr(String(chave));
    const crescimento = Math.round(((seed % 50) - 15) * 10) / 10;
    return {
      chave: String(chave),
      label: labels[String(chave)] || String(chave),
      qtdClientes: cls.length,
      ticketMedio: ticket,
      crescimento,
      evolucaoMedia: evolucao,
      contratosNovos: novos,
      receitaTotal: receita,
    };
  }).sort((a, b) => b.receitaTotal - a.receitaTotal);
}

export function getAnalisePorRegiao(): PerfilAnalise[] {
  return aggregate(cl => cl.regiao, labelRegiao);
}

export function getAnalisePorEspecialidade(): PerfilAnalise[] {
  return aggregate(cl => cl.especialidade, labelEspecialidade);
}

// ─── Cruzamento Tempo de Contrato × Progresso Metodológico ──
export interface CruzamentoTempoFase {
  faixaTempo: string;
  fase: FaseMetodologica;
  faseLabel: string;
  qtd: number;
  status: 'saudavel' | 'atencao' | 'critico';
  diagnostico: string;
}

const FASES: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];
const FASE_LABEL: Record<FaseMetodologica, string> = {
  diagnostico: 'Diagnóstico',
  planejamento: 'Planejamento',
  estruturacao: 'Estruturação',
  monitoramento: 'Monitoramento',
  encerramento: 'Encerramento',
};

const FAIXAS = [
  { key: '0-3m', min: 0, max: 3, faseEsperada: 0 },
  { key: '3-6m', min: 3, max: 6, faseEsperada: 1 },
  { key: '6-12m', min: 6, max: 12, faseEsperada: 2 },
  { key: '12m+', min: 12, max: 9999, faseEsperada: 3 },
];

const mesesDesde = (iso: string) => {
  const d = new Date(iso);
  const h = new Date();
  return (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth());
};

export function getCruzamentoTempoFase(): CruzamentoTempoFase[] {
  const out: CruzamentoTempoFase[] = [];
  for (const faixa of FAIXAS) {
    for (const fase of FASES) {
      const qtd = clientes.filter(c => {
        const m = mesesDesde(c.dataInicio);
        return m >= faixa.min && m < faixa.max && c.faseMetodologica === fase;
      }).length;
      const idxFase = FASES.indexOf(fase);
      const delta = idxFase - faixa.faseEsperada;
      let status: 'saudavel' | 'atencao' | 'critico';
      let diagnostico: string;
      if (delta < -1) {
        status = 'critico';
        diagnostico = 'Progresso muito abaixo do esperado para o tempo de contrato';
      } else if (delta < 0) {
        status = 'atencao';
        diagnostico = 'Ligeiramente atrasado em relação ao tempo de contrato';
      } else if (delta === 0 || delta === 1) {
        status = 'saudavel';
        diagnostico = 'Progresso compatível com o tempo de contrato';
      } else {
        status = 'saudavel';
        diagnostico = 'Acelerado — supera a curva esperada';
      }
      if (qtd > 0) out.push({ faixaTempo: faixa.key, fase, faseLabel: FASE_LABEL[fase], qtd, status, diagnostico });
    }
  }
  return out;
}

// ─── Distribuição de clientes por etapa metodológica (para pizza) ──
export function getDistribuicaoEtapas(): { fase: FaseMetodologica; label: string; qtd: number; pct: number }[] {
  const total = clientes.length || 1;
  return FASES.map(f => {
    const qtd = clientes.filter(c => c.faseMetodologica === f).length;
    return { fase: f, label: FASE_LABEL[f], qtd, pct: Math.round((qtd / total) * 1000) / 10 };
  });
}
