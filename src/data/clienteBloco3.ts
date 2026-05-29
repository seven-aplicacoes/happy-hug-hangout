// === Bloco 3 — Ficha do cliente: Valor Percebido, Decisões, Plano de Sucesso, Relatório Mensal ===
// Tudo determinístico baseado no clienteId.

import { clientes, reunioes, tarefas, contratos, calcularEngajamento, labelFase } from './mockData';
import { getCsatMedio, getScoreEvolucao } from './clienteExtras';
import type { Cliente, FaseMetodologica } from '@/types';

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// ─── Valor Percebido (0-100) ─────────────────────────────
export interface DimensaoValor {
  nome: string;
  valor: number; // 0-100
  descricao: string;
}

export interface ValorPercebido {
  score: number; // 0-100
  tendencia: 'subindo' | 'estavel' | 'caindo';
  dimensoes: DimensaoValor[];
  ultimaAvaliacao: string;
  proximaAvaliacao: string;
  comentarioCliente?: string;
}

export function getValorPercebido(cliente: Cliente): ValorPercebido {
  const seed = hash(cliente.id + 'vp');
  const csat = getCsatMedio(cliente.id); // 0-10
  const evol = getScoreEvolucao(cliente);

  // Dimensões: resultados, relacionamento, metodologia, ROI percebido
  const resultados = Math.min(100, Math.round(evol * 0.7 + (csat * 10) * 0.3 + (seed % 10) - 5));
  const relacionamento = Math.min(100, Math.round(csat * 10 + (seed % 12) - 6));
  const metodologia = Math.min(100, Math.round(60 + (seed % 30) + (cliente.indiceSeven / 10)));
  const roi = Math.min(100, Math.round((cliente.indiceSeven * 0.6) + ((seed >> 3) % 35) + (cliente.potencialUpsell ? 8 : 0)));

  const score = Math.round((resultados + relacionamento + metodologia + roi) / 4);
  const tend = (seed % 3);
  const tendencia: ValorPercebido['tendencia'] = tend === 0 ? 'subindo' : tend === 1 ? 'estavel' : 'caindo';

  const hoje = new Date();
  const ult = new Date(hoje.getTime() - ((seed % 45) + 5) * 86400000);
  const prox = new Date(ult.getTime() + 90 * 86400000);

  const comentariosPool = [
    'Sentimos evolução clara nos indicadores e a metodologia está nos ajudando muito.',
    'A consultoria trouxe disciplina ao nosso processo. Esperamos resultados ainda maiores.',
    'Estamos satisfeitos com o ritmo, mas gostaríamos de ver mais ações práticas.',
    'O retorno sobre o investimento já está claro para a diretoria.',
    'Reuniões muito produtivas; a equipe técnica está engajada.',
  ];

  return {
    score,
    tendencia,
    dimensoes: [
      { nome: 'Resultados gerados', valor: resultados, descricao: 'Indicadores de negócio impactados pela consultoria.' },
      { nome: 'Relacionamento', valor: relacionamento, descricao: 'Qualidade da interação com o consultor (CSAT).' },
      { nome: 'Metodologia', valor: metodologia, descricao: 'Clareza, organização e ritmo da metodologia Seven.' },
      { nome: 'ROI percebido', valor: roi, descricao: 'Retorno percebido frente ao investimento contratado.' },
    ],
    ultimaAvaliacao: ult.toISOString().slice(0, 10),
    proximaAvaliacao: prox.toISOString().slice(0, 10),
    comentarioCliente: score >= 60 ? comentariosPool[seed % comentariosPool.length] : undefined,
  };
}

export function corValor(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

// ─── Decisões registradas ────────────────────────────────
export type ImpactoDecisao = 'alto' | 'medio' | 'baixo';
export type StatusDecisao = 'em_andamento' | 'implementada' | 'pendente' | 'cancelada';

export interface DecisaoRegistrada {
  id: string;
  data: string;
  decisao: string;
  contexto: string;
  responsavel: string;
  responsavelTipo: 'consultor' | 'cliente' | 'comite';
  impacto: ImpactoDecisao;
  status: StatusDecisao;
  fase: FaseMetodologica;
  origemReuniaoId?: string;
}

const DECISOES_POOL = [
  { decisao: 'Aprovar nova política comercial', contexto: 'Reestruturação da tabela de comissões para alinhar com metas de margem.', impacto: 'alto' as const },
  { decisao: 'Contratar gestor financeiro', contexto: 'Necessidade de profissionalizar a área financeira para suportar crescimento.', impacto: 'alto' as const },
  { decisao: 'Implementar reunião semanal de indicadores', contexto: 'Aumentar previsibilidade e responsabilidade dos líderes.', impacto: 'medio' as const },
  { decisao: 'Renegociar contrato com fornecedor principal', contexto: 'Margem de negociação identificada no diagnóstico.', impacto: 'medio' as const },
  { decisao: 'Adiar lançamento do novo produto', contexto: 'Foco no fechamento da reestruturação interna antes da expansão.', impacto: 'alto' as const },
  { decisao: 'Adotar CRM unificado', contexto: 'Centralizar pipeline comercial em ferramenta única.', impacto: 'medio' as const },
  { decisao: 'Criar comitê estratégico mensal', contexto: 'Pauta recorrente de revisão de rumo com sócios e consultoria.', impacto: 'baixo' as const },
  { decisao: 'Reestruturar organograma da operação', contexto: 'Definição de papéis e cadeia de comando.', impacto: 'alto' as const },
  { decisao: 'Validar plano de sucessão familiar', contexto: 'Iniciar transição da segunda geração com governança formal.', impacto: 'alto' as const },
];

const RESP_POOL = [
  { nome: 'Diretoria do cliente', tipo: 'cliente' as const },
  { nome: 'Sócios + consultor', tipo: 'comite' as const },
  { nome: 'Consultor responsável', tipo: 'consultor' as const },
  { nome: 'CEO', tipo: 'cliente' as const },
];

export function getDecisoes(clienteId: string): DecisaoRegistrada[] {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) return [];
  const seed = hash(clienteId);
  const qtd = 4 + (seed % 4); // 4-7 decisões
  const reun = reunioes.filter(r => r.clienteId === clienteId && r.status === 'realizada')
    .sort((a, b) => b.data.localeCompare(a.data));

  return Array.from({ length: qtd }, (_, i) => {
    const s = seed + i * 13;
    const tpl = DECISOES_POOL[s % DECISOES_POOL.length];
    const resp = RESP_POOL[s % RESP_POOL.length];
    const offsetDias = (s % 120) + i * 8;
    const data = new Date(Date.now() - offsetDias * 86400000).toISOString().slice(0, 10);
    const statusOpts: StatusDecisao[] = ['implementada', 'em_andamento', 'em_andamento', 'pendente', 'implementada', 'cancelada'];
    return {
      id: `dec-${clienteId}-${i}`,
      data,
      decisao: tpl.decisao,
      contexto: tpl.contexto,
      responsavel: resp.nome,
      responsavelTipo: resp.tipo,
      impacto: tpl.impacto,
      status: statusOpts[s % statusOpts.length],
      fase: cliente.faseMetodologica,
      origemReuniaoId: reun[i % Math.max(1, reun.length)]?.id,
    };
  }).sort((a, b) => b.data.localeCompare(a.data));
}

export const labelImpacto: Record<ImpactoDecisao, string> = {
  alto: 'Alto impacto', medio: 'Médio impacto', baixo: 'Baixo impacto',
};
export const variantImpacto: Record<ImpactoDecisao, 'danger' | 'warning' | 'neutral'> = {
  alto: 'danger', medio: 'warning', baixo: 'neutral',
};
export const labelStatusDecisao: Record<StatusDecisao, string> = {
  em_andamento: 'Em andamento', implementada: 'Implementada', pendente: 'Pendente', cancelada: 'Cancelada',
};
export const variantStatusDecisao: Record<StatusDecisao, 'success' | 'warning' | 'info' | 'neutral'> = {
  implementada: 'success', em_andamento: 'warning', pendente: 'info', cancelada: 'neutral',
};

// ─── Plano de Sucesso completo ───────────────────────────
export type StatusMarco = 'concluido' | 'em_andamento' | 'pendente' | 'atrasado';

export interface MarcoPlano {
  id: string;
  titulo: string;
  fase: FaseMetodologica;
  prazo: string;
  responsavel: string;
  status: StatusMarco;
  progresso: number; // 0-100
  diasParaVencer: number;
}

export interface ObjetivoEstrategico {
  id: string;
  titulo: string;
  metrica: string;
  valorAtual: string;
  metaAlvo: string;
  progresso: number;
  prazo: string;
}

export interface PlanoSucesso {
  visaoGeral: string;
  northStar: string;
  objetivos: ObjetivoEstrategico[];
  marcos: MarcoPlano[];
  progressoGlobal: number;
  ultimaRevisao: string;
  proximaRevisao: string;
}

const VISOES_POOL = [
  'Profissionalizar a gestão e dobrar a operação em 24 meses com saúde financeira.',
  'Consolidar a marca como referência regional e expandir para 3 novas praças.',
  'Estabilizar margem operacional acima de 18% e estruturar governança para captação.',
  'Implementar metodologia de gestão por indicadores em todas as áreas.',
];

const NORTHSTAR_POOL = [
  'Crescer faturamento em 35% mantendo margem ≥ 18%.',
  'Atingir NPS ≥ 70 com a base de clientes em 12 meses.',
  'Reduzir custos fixos em 15% sem comprometer entrega.',
  'Implementar 100% da nova governança até o final do ciclo.',
];

const METRICAS_POOL = [
  { titulo: 'Crescimento de receita', metrica: 'Receita anual', valorAtual: 'R$ 4,8M', metaAlvo: 'R$ 6,5M' },
  { titulo: 'Margem operacional', metrica: '% margem', valorAtual: '12%', metaAlvo: '18%' },
  { titulo: 'NPS de clientes', metrica: 'NPS', valorAtual: '52', metaAlvo: '70' },
  { titulo: 'Eficiência comercial', metrica: 'Ticket médio', valorAtual: 'R$ 2.300', metaAlvo: 'R$ 3.500' },
  { titulo: 'Estruturação de processos', metrica: '% áreas mapeadas', valorAtual: '40%', metaAlvo: '100%' },
];

const MARCOS_BASE: { titulo: string; fase: FaseMetodologica }[] = [
  { titulo: 'Diagnóstico inicial concluído', fase: 'diagnostico' },
  { titulo: 'Plano estratégico aprovado', fase: 'planejamento' },
  { titulo: 'Cronograma de execução validado', fase: 'planejamento' },
  { titulo: 'Sprint de estruturação 1 entregue', fase: 'estruturacao' },
  { titulo: 'Sprint de estruturação 2 entregue', fase: 'estruturacao' },
  { titulo: 'Dashboard de indicadores em produção', fase: 'monitoramento' },
  { titulo: 'Comitê de monitoramento estabelecido', fase: 'monitoramento' },
  { titulo: 'Relatório final e transferência de conhecimento', fase: 'encerramento' },
];

const FASES_ORDER: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];

export function getPlanoSucesso(cliente: Cliente): PlanoSucesso {
  const seed = hash(cliente.id + 'plano');
  const idxFaseAtual = FASES_ORDER.indexOf(cliente.faseMetodologica);
  const hoje = new Date();

  const marcos: MarcoPlano[] = MARCOS_BASE.map((m, i) => {
    const idxFaseM = FASES_ORDER.indexOf(m.fase);
    const offsetDias = (i - 3) * 30 + ((seed + i * 11) % 20) - 10;
    const prazoMs = hoje.getTime() + offsetDias * 86400000;
    const prazo = new Date(prazoMs);
    const dias = Math.floor((prazo.getTime() - hoje.getTime()) / 86400000);
    let status: StatusMarco;
    let progresso: number;
    if (idxFaseM < idxFaseAtual) {
      status = 'concluido'; progresso = 100;
    } else if (idxFaseM === idxFaseAtual) {
      status = dias < 0 ? 'atrasado' : 'em_andamento';
      progresso = Math.max(20, Math.min(85, 40 + ((seed + i) % 50)));
    } else {
      status = 'pendente'; progresso = 0;
    }
    const responsaveis = ['Ana Beatriz', 'Carlos Eduardo', 'Marina Costa', 'Equipe do Cliente', 'Cliente + Consultor'];
    return {
      id: `marco-${cliente.id}-${i}`,
      titulo: m.titulo,
      fase: m.fase,
      prazo: prazo.toISOString().slice(0, 10),
      responsavel: responsaveis[(seed + i) % responsaveis.length],
      status,
      progresso,
      diasParaVencer: dias,
    };
  });

  const concluidos = marcos.filter(m => m.status === 'concluido').length;
  const emAndamentoProg = marcos.filter(m => m.status === 'em_andamento').reduce((a, m) => a + m.progresso, 0);
  const progressoGlobal = Math.round(((concluidos * 100) + emAndamentoProg) / marcos.length);

  const objetivos: ObjetivoEstrategico[] = Array.from({ length: 3 }, (_, i) => {
    const tpl = METRICAS_POOL[(seed + i * 5) % METRICAS_POOL.length];
    const prog = Math.min(95, 25 + ((seed + i * 7) % 60));
    const prazoOff = 90 + ((seed + i) % 180);
    return {
      id: `obj-${cliente.id}-${i}`,
      titulo: tpl.titulo,
      metrica: tpl.metrica,
      valorAtual: tpl.valorAtual,
      metaAlvo: tpl.metaAlvo,
      progresso: prog,
      prazo: new Date(hoje.getTime() + prazoOff * 86400000).toISOString().slice(0, 10),
    };
  });

  const ultRev = new Date(hoje.getTime() - ((seed % 30) + 5) * 86400000);
  const proxRev = new Date(ultRev.getTime() + 30 * 86400000);

  return {
    visaoGeral: VISOES_POOL[seed % VISOES_POOL.length],
    northStar: NORTHSTAR_POOL[seed % NORTHSTAR_POOL.length],
    objetivos,
    marcos,
    progressoGlobal,
    ultimaRevisao: ultRev.toISOString().slice(0, 10),
    proximaRevisao: proxRev.toISOString().slice(0, 10),
  };
}

export const labelStatusMarco: Record<StatusMarco, string> = {
  concluido: 'Concluído', em_andamento: 'Em andamento', pendente: 'Pendente', atrasado: 'Atrasado',
};
export const variantStatusMarco: Record<StatusMarco, 'success' | 'warning' | 'danger' | 'neutral'> = {
  concluido: 'success', em_andamento: 'warning', atrasado: 'danger', pendente: 'neutral',
};

// ─── Relatório Mensal ────────────────────────────────────
export interface SecaoRelatorio {
  titulo: string;
  resumo: string;
  destaques: string[];
}

export interface RelatorioMensal {
  mesReferencia: string; // ex: 'Abril/2025'
  geradoEm: string;
  consultor: string;
  resumoExecutivo: string;
  secoes: SecaoRelatorio[];
  highlights: { label: string; valor: string; tendencia: 'up' | 'down' | 'flat' }[];
  proximosPassos: string[];
  statusGeracao: 'gerado' | 'gerando' | 'pendente';
}

const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function getRelatorioMensal(cliente: Cliente, mesOffset = 0): RelatorioMensal {
  const seed = hash(cliente.id + 'rel' + mesOffset);
  const hoje = new Date();
  const mesRef = new Date(hoje.getFullYear(), hoje.getMonth() - mesOffset - 1, 1);
  const mesLabel = `${MESES_PT[mesRef.getMonth()]}/${mesRef.getFullYear()}`;

  const reunsMes = reunioes.filter(r => {
    if (r.clienteId !== cliente.id || r.status !== 'realizada') return false;
    const d = new Date(r.meetingDate);
    return d.getMonth() === mesRef.getMonth() && d.getFullYear() === mesRef.getFullYear();
  });

  const tarefasConcl = tarefas.filter(t => t.clienteId === cliente.id && t.status === 'concluida').length;
  const eng = calcularEngajamento(cliente.id);
  const tend = (seed % 3) === 0 ? 'up' : (seed % 3) === 1 ? 'flat' : 'down';

  return {
    mesReferencia: mesLabel,
    geradoEm: new Date(hoje.getFullYear(), hoje.getMonth() - mesOffset, 3).toISOString().slice(0, 10),
    consultor: cliente.consultorNome,
    resumoExecutivo: `Em ${mesLabel}, ${cliente.nomeFantasia} avançou na fase de ${labelFase[cliente.faseMetodologica]}. Foram realizadas ${reunsMes.length} reuniões e ${tarefasConcl % 5 + 2} entregas concluídas. Engajamento ${eng === 'em_dia' ? 'saudável' : eng === 'atencao' ? 'em atenção' : 'crítico'}.`,
    secoes: [
      {
        titulo: 'Reuniões e interações',
        resumo: `${reunsMes.length} reuniões realizadas no mês com média de ${reunsMes.length > 0 ? Math.round(reunsMes.reduce((a, r) => a + r.duracao, 0) / reunsMes.length) : 0} minutos por encontro.`,
        destaques: reunsMes.slice(0, 3).map(r => `${r.meetingDate} — ${r.tipo}: ${r.title.slice(0, 60)}`),
      },
      {
        titulo: 'Entregas e marcos',
        resumo: 'Avanço dos entregáveis previstos para o ciclo conforme o cronograma metodológico.',
        destaques: [
          'Validação do plano de ação trimestral',
          'Implementação do dashboard operacional',
          'Workshop com liderança realizado',
        ].slice(0, 2 + (seed % 2)),
      },
      {
        titulo: 'Indicadores de saúde',
        resumo: `Índice Seven em ${cliente.indiceSeven}. CSAT médio em ${getCsatMedio(cliente.id).toFixed(1)}/10.`,
        destaques: [
          `Engajamento: ${eng === 'em_dia' ? 'em dia' : eng === 'atencao' ? 'em atenção' : 'crítico'}`,
          `Score de evolução: ${getScoreEvolucao(cliente)}`,
        ],
      },
      {
        titulo: 'Riscos e atenções',
        resumo: eng === 'critico' ? 'Cliente sem interação recente — ação de contenção recomendada.' : 'Sem riscos materiais identificados no período.',
        destaques: eng === 'critico'
          ? ['Reagendar contato semanal', 'Reunião de retomada com sponsor']
          : ['Manter cadência de reuniões', 'Acompanhar entregas do trimestre'],
      },
    ],
    highlights: [
      { label: 'Reuniões no mês', valor: String(reunsMes.length), tendencia: tend as 'up' | 'down' | 'flat' },
      { label: 'CSAT médio', valor: `${getCsatMedio(cliente.id).toFixed(1)}/10`, tendencia: 'up' },
      { label: 'Índice Seven', valor: String(cliente.indiceSeven), tendencia: cliente.indiceSeven >= 70 ? 'up' : 'flat' },
      { label: 'Tarefas concluídas', valor: String(tarefasConcl), tendencia: 'flat' },
    ],
    proximosPassos: [
      'Validar prioridades do próximo ciclo com o sponsor.',
      'Avançar entregáveis pendentes da fase atual.',
      'Agendar próxima revisão estratégica.',
    ],
    statusGeracao: 'gerado',
  };
}
