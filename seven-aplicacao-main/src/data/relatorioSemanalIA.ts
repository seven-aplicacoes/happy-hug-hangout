// === Relatório Semanal IA — PARTE 2 / Bloco 5 ===
import { gerarInsightsIA, type IaInsight } from './iaInsights';
import { getChurnAnalise } from './contratosAnalytics';
import { clientes, contratos } from './mockData';

export interface ResumoSemanal {
  semanaLabel: string;
  riscosCriticos: number;
  oportunidades: number;
  novosClientes: number;
  contratosVencendo: number;
  destaque: string;
  insights: IaInsight[];
  riscosTop: IaInsight[];
  oportunidadesTop: IaInsight[];
}

export function getRelatorioSemanal(): ResumoSemanal {
  const insights = gerarInsightsIA();
  const riscos = insights.filter(i => i.variant === 'danger' || i.variant === 'warning');
  const oportunidades = insights.filter(i => i.variant === 'success' || i.variant === 'info');

  const hoje = new Date();
  const seteDias = new Date(hoje.getTime() - 7 * 86400000);
  const novosClientes = clientes.filter(c => new Date(c.dataInicio) >= seteDias).length;
  const contratosVencendo = contratos.filter(ct => {
    const f = new Date(ct.dataFim);
    const dd = (f.getTime() - hoje.getTime()) / 86400000;
    return dd > 0 && dd < 30;
  }).length;

  const churnA = getChurnAnalise();
  const destaque = churnA.motivos[0]
    ? `Principal motivo de churn da semana: "${churnA.motivos[0].motivo}" (${churnA.motivos[0].pct}%).`
    : 'Semana sem churns registrados.';

  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return {
    semanaLabel: `${fmt(seteDias)} – ${fmt(hoje)}`,
    riscosCriticos: riscos.length,
    oportunidades: oportunidades.length,
    novosClientes,
    contratosVencendo,
    destaque,
    insights,
    riscosTop: riscos.slice(0, 5),
    oportunidadesTop: oportunidades.slice(0, 5),
  };
}

// ─── Recomendações por perfil ─────────────────────────────
export interface RecomendacaoPerfil {
  perfil: 'gestor_projetos' | 'sucesso_cliente' | 'diretor_operacoes';
  perfilLabel: string;
  itens: { titulo: string; descricao: string; prioridade: 'alta' | 'media' | 'baixa' }[];
}

export function getRecomendacoesPorPerfil(): RecomendacaoPerfil[] {
  const insights = gerarInsightsIA();
  const churn = insights.filter(i => i.tipo === 'churn_previsto').slice(0, 3);
  const cross = insights.filter(i => i.tipo === 'cross_sell' || i.tipo === 'upsell').slice(0, 3);
  const reb = insights.filter(i => i.tipo === 'rebalanceamento');
  const renov = insights.filter(i => i.tipo === 'renovacao_iminente').slice(0, 3);

  return [
    {
      perfil: 'gestor_projetos',
      perfilLabel: 'Gestor de Projetos',
      itens: [
        ...churn.map(c => ({ titulo: `Priorizar: ${c.titulo}`, descricao: c.descricao, prioridade: 'alta' as const })),
        ...renov.map(c => ({ titulo: `Renovação: ${c.titulo}`, descricao: c.descricao, prioridade: 'media' as const })),
      ],
    },
    {
      perfil: 'sucesso_cliente',
      perfilLabel: 'Sucesso do Cliente',
      itens: [
        ...churn.slice(0, 2).map(c => ({ titulo: `Ação de retenção: ${c.titulo}`, descricao: c.descricao, prioridade: 'alta' as const })),
        { titulo: 'Roteiro semanal de check-ins', descricao: 'Confirmar agenda de relacionamento para clientes em fase de monitoramento.', prioridade: 'media' as const },
      ],
    },
    {
      perfil: 'diretor_operacoes',
      perfilLabel: 'Diretor de Operações',
      itens: [
        ...cross.map(c => ({ titulo: `Comercial: ${c.titulo}`, descricao: c.descricao, prioridade: 'media' as const })),
        ...reb.map(c => ({ titulo: `Redistribuição: ${c.titulo}`, descricao: c.descricao, prioridade: 'alta' as const })),
      ],
    },
  ];
}
