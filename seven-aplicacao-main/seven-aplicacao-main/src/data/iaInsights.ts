// === Insights IA — Bloco 6 (mock determinístico) ===
// Geração baseada em estado da carteira: engajamento, capacidade, contratos.

import { clientes, contratos, calcularEngajamento, diasDesdeUltimaReuniao } from './mockData';
import { getCapacidade } from './consultorExtras';
import { getProdutoAtualCliente, PRODUTOS } from './contratoExtras';

export type IaInsightTipo =
  | 'churn_previsto'
  | 'cross_sell'
  | 'renovacao_iminente'
  | 'rebalanceamento'
  | 'upsell';

export interface IaInsight {
  id: string;
  tipo: IaInsightTipo;
  titulo: string;
  descricao: string;
  acaoLabel: string;
  acaoHref?: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
  confianca: number; // 0-100
  contexto?: { clienteId?: string; consultorId?: string };
}

const hoje = new Date();
const DIAS_RENOV = 60;

export function gerarInsightsIA(): IaInsight[] {
  const out: IaInsight[] = [];

  // 1) Churn previsto — engajamento crítico há mais de 20 dias
  clientes.forEach(cl => {
    if (cl.status !== 'ativo') return;
    const dias = diasDesdeUltimaReuniao(cl.id);
    if (calcularEngajamento(cl.id) === 'critico' && dias >= 16) {
      const conf = Math.min(95, 55 + dias);
      out.push({
        id: `ia-churn-${cl.id}`,
        tipo: 'churn_previsto',
        titulo: `Risco de churn em ${cl.nomeFantasia}`,
        descricao: `${dias} dias sem reunião realizada. Padrão histórico sugere ${conf}% de chance de cancelamento nos próximos 30 dias.`,
        acaoLabel: 'Agendar reunião de retenção',
        acaoHref: `/admin/cliente/${cl.id}`,
        variant: 'danger',
        confianca: conf,
        contexto: { clienteId: cl.id },
      });
    }
  });

  // 2) Renovação iminente — contratos terminando em <60d
  contratos.forEach(ct => {
    if (!['ativo', 'em_renovacao'].includes(ct.status)) return;
    const fim = new Date(ct.dataFim);
    const dias = Math.floor((fim.getTime() - hoje.getTime()) / 86400000);
    if (dias > 0 && dias <= DIAS_RENOV) {
      out.push({
        id: `ia-renov-${ct.id}`,
        tipo: 'renovacao_iminente',
        titulo: `Renovação em ${dias}d — ${ct.clienteNome}`,
        descricao: `Contrato ${ct.tipo} encerra em ${fim.toLocaleDateString('pt-BR')}. Engajamento atual: ${calcularEngajamento(ct.clienteId)}.`,
        acaoLabel: 'Iniciar negociação',
        acaoHref: `/admin/cliente/${ct.clienteId}`,
        variant: dias <= 30 ? 'warning' : 'info',
        confianca: 80,
        contexto: { clienteId: ct.clienteId },
      });
    }
  });

  // 3) Cross-sell — clientes com Índice Seven >75 e apenas 1 produto
  clientes.forEach(cl => {
    if (cl.status !== 'ativo' || cl.indiceSeven < 75) return;
    const produtoAtual = getProdutoAtualCliente(cl.id);
    if (!produtoAtual) return;
    const sugestao = PRODUTOS.find(p => p !== produtoAtual) || produtoAtual;
    out.push({
      id: `ia-cross-${cl.id}`,
      tipo: 'cross_sell',
      titulo: `Oportunidade de cross-sell — ${cl.nomeFantasia}`,
      descricao: `Índice Seven ${cl.indiceSeven}/100. Clientes similares aderiram a "${sugestao}" após 8 meses de "${produtoAtual}".`,
      acaoLabel: 'Ver proposta sugerida',
      acaoHref: `/admin/cliente/${cl.id}`,
      variant: 'success',
      confianca: 72,
      contexto: { clienteId: cl.id },
    });
  });

  // 4) Upsell — potencialUpsell flag
  clientes.filter(cl => cl.potencialUpsell && cl.status === 'ativo').forEach(cl => {
    out.push({
      id: `ia-up-${cl.id}`,
      tipo: 'upsell',
      titulo: `${cl.nomeFantasia} pronto para upsell`,
      descricao: `Faturamento mensal R$ ${(cl.faturamentoMensal/1000).toFixed(0)}k e ciclo maduro. Sugestão: pacote estratégico ampliado.`,
      acaoLabel: 'Abrir cliente',
      acaoHref: `/admin/cliente/${cl.id}`,
      variant: 'info',
      confianca: 68,
      contexto: { clienteId: cl.id },
    });
  });

  // 5) Rebalanceamento — consultor em sobrecarga
  const sobrecarregados = ['c1', 'c2', 'c3']
    .map(id => getCapacidade(id))
    .filter(c => c.status === 'sobrecarga' || c.ocupacaoPct > 90);
  sobrecarregados.forEach(cap => {
    out.push({
      id: `ia-bal-${cap.consultorId}`,
      tipo: 'rebalanceamento',
      titulo: 'Rebalanceamento sugerido',
      descricao: `Consultor com ${cap.ocupacaoPct}% de ocupação e ${cap.clientesAtivos}/${cap.maxClientes} clientes. Realocar 1-2 contas reduziria risco operacional.`,
      acaoLabel: 'Ver consultores',
      acaoHref: `/admin/consultores/${cap.consultorId}`,
      variant: 'warning',
      confianca: 85,
      contexto: { consultorId: cap.consultorId },
    });
  });

  // Ordenar por confiança e limitar
  return out.sort((a, b) => b.confianca - a.confianca).slice(0, 12);
}

export const labelTipoIA: Record<IaInsightTipo, string> = {
  churn_previsto: 'Churn previsto',
  cross_sell: 'Cross-sell',
  renovacao_iminente: 'Renovação',
  rebalanceamento: 'Rebalanceamento',
  upsell: 'Upsell',
};
