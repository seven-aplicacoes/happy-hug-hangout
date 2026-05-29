// === Inteligência Avançada — PARTE 2 / Bloco 4 ===
// Análises por fase, produto, churn cruzado e tempo médio.

import { clientes, contratos, consultores, labelEspecialidade, labelRegiao } from './mockData';
import { getProdutoContrato } from './contratoExtras';
import type { FaseMetodologica } from '@/types';

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const mesesDesde = (iso: string): number => {
  const d = new Date(iso);
  const h = new Date();
  return (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth());
};

// ─── Análise por fase do contrato (0-3 / 3-6 / 6-12 / +12) ──
export interface AnaliseFase {
  key: string;
  label: string;
  descricao: string;
  qtd: number;
  churnRate: number;
  riscoMedio: number;
}

export function getAnalisePorFase(): AnaliseFase[] {
  const buckets = [
    { key: '0-3', label: '0–3 meses', descricao: 'Onboarding · risco inicial', min: 0, max: 3 },
    { key: '3-6', label: '3–6 meses', descricao: 'Estabilização', min: 3, max: 6 },
    { key: '6-12', label: '6–12 meses', descricao: 'Expansão', min: 6, max: 12 },
    { key: '12+', label: '+12 meses', descricao: 'Retenção e upsell', min: 12, max: 9999 },
  ];
  return buckets.map(b => {
    const cls = clientes.filter(c => {
      const m = mesesDesde(c.dataInicio);
      return m >= b.min && m < b.max;
    });
    const ids = new Set(cls.map(c => c.id));
    const cts = contratos.filter(c => ids.has(c.clienteId));
    const churn = cts.filter(c => c.status === 'churn' || c.status === 'cancelado').length;
    const churnRate = cts.length ? Math.round((churn / cts.length) * 1000) / 10 : 0;
    const riscoMedio = cls.length ? Math.round(cls.reduce((s, c) => s + (100 - c.indiceSeven), 0) / cls.length) : 0;
    return { key: b.key, label: b.label, descricao: b.descricao, qtd: cls.length, churnRate, riscoMedio };
  });
}

// ─── Churn por perfil ────────────────────────────────────
export interface ChurnPerfil { categoria: string; valor: string; total: number; churns: number; rate: number; }

function porteCliente(fat: number): string {
  if (fat <= 100000) return 'Até 100k';
  if (fat <= 300000) return '100k–300k';
  if (fat <= 500000) return '300k–500k';
  if (fat <= 1000000) return '500k–1M';
  return 'Acima de 1M';
}

export function getChurnPorPerfil(): { porte: ChurnPerfil[]; regiao: ChurnPerfil[]; especialidade: ChurnPerfil[]; consultor: ChurnPerfil[] } {
  const aggregate = (cat: string, key: (cl: typeof clientes[number]) => string): ChurnPerfil[] => {
    const map = new Map<string, { total: number; churns: number }>();
    clientes.forEach(cl => {
      const k = key(cl);
      if (!map.has(k)) map.set(k, { total: 0, churns: 0 });
      const cur = map.get(k)!;
      cur.total += 1;
      if (cl.status === 'churn' || cl.status === 'cancelado') cur.churns += 1;
    });
    return Array.from(map.entries()).map(([valor, v]) => ({
      categoria: cat, valor,
      total: v.total, churns: v.churns,
      rate: v.total ? Math.round((v.churns / v.total) * 1000) / 10 : 0,
    })).sort((a, b) => b.rate - a.rate);
  };
  return {
    porte: aggregate('Porte', cl => porteCliente(cl.faturamentoMensal)),
    regiao: aggregate('Região', cl => labelRegiao[cl.regiao]),
    especialidade: aggregate('Especialidade', cl => labelEspecialidade[cl.especialidade]),
    consultor: aggregate('Consultor', cl => cl.consultorNome),
  };
}

// ─── Tempo médio até cancelar / reativar (mock determinístico) ──
export function getTemposMedios(): { tempoMedioCancelamento: number; tempoMedioReativacao: number } {
  const churns = contratos.filter(c => c.status === 'churn' || c.status === 'cancelado');
  if (!churns.length) return { tempoMedioCancelamento: 0, tempoMedioReativacao: 0 };
  const meses = churns.map(c => {
    const i = new Date(c.dataInicio); const f = new Date(c.dataFim);
    return (f.getFullYear() - i.getFullYear()) * 12 + (f.getMonth() - i.getMonth());
  });
  const tempoMedioCancelamento = Math.round(meses.reduce((s, n) => s + n, 0) / meses.length);
  // reativação: ~4–7 meses (seed por consultor)
  const tempoMedioReativacao = 5 + (hashStr('reativ') % 3);
  return { tempoMedioCancelamento, tempoMedioReativacao };
}

// ─── Distribuição da base por fase ───────────────────────
export function getBaseDistribuicaoFase(): { fase: FaseMetodologica; label: string; qtd: number; pct: number }[] {
  const total = clientes.length || 1;
  const fases: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];
  return fases.map(f => {
    const qtd = clientes.filter(c => c.faseMetodologica === f).length;
    return { fase: f, label: { diagnostico: 'Diagnóstico', planejamento: 'Planejamento', estruturacao: 'Estruturação', monitoramento: 'Monitoramento', encerramento: 'Encerramento' }[f], qtd, pct: Math.round((qtd / total) * 1000) / 10 };
  });
}

// ─── Mapa de risco × fase × tempo sem interação ──────────
export interface CelulaRisco { fase: FaseMetodologica; faseLabel: string; bucketTempo: '0-7d' | '8-15d' | '16-30d' | '+30d'; qtd: number; }

export function getMatrizRisco(): CelulaRisco[] {
  const fases: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];
  const buckets: CelulaRisco['bucketTempo'][] = ['0-7d', '8-15d', '16-30d', '+30d'];
  const out: CelulaRisco[] = [];
  fases.forEach(f => {
    buckets.forEach(b => out.push({ fase: f, faseLabel: { diagnostico: 'Diagnóstico', planejamento: 'Planejamento', estruturacao: 'Estruturação', monitoramento: 'Monitoramento', encerramento: 'Encerramento' }[f], bucketTempo: b, qtd: 0 }));
  });
  clientes.forEach(cl => {
    const ult = new Date(cl.ultimaInteracao);
    const d = Math.floor((Date.now() - ult.getTime()) / 86400000);
    const b: CelulaRisco['bucketTempo'] = d <= 7 ? '0-7d' : d <= 15 ? '8-15d' : d <= 30 ? '16-30d' : '+30d';
    const cell = out.find(c => c.fase === cl.faseMetodologica && c.bucketTempo === b);
    if (cell) cell.qtd += 1;
  });
  return out;
}
