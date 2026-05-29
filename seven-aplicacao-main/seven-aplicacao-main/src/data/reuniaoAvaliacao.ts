// === Avaliação IA estruturada de reuniões (Bloco 5) ===
// Tudo determinístico via hash do reuniaoId — sem chamadas externas.

import { reunioes } from './mockData';

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export type DimensaoAvaliacao =
  | 'clareza_pauta'
  | 'aderencia_tempo'
  | 'qualidade_decisoes'
  | 'engajamento_cliente'
  | 'follow_ups';

export interface DimensaoNota {
  dimensao: DimensaoAvaliacao;
  nota: number; // 0-10
  comentario: string;
}

export const labelDimensao: Record<DimensaoAvaliacao, string> = {
  clareza_pauta: 'Clareza da pauta',
  aderencia_tempo: 'Aderência ao tempo',
  qualidade_decisoes: 'Qualidade das decisões',
  engajamento_cliente: 'Engajamento do cliente',
  follow_ups: 'Follow-ups gerados',
};

export const descricaoDimensao: Record<DimensaoAvaliacao, string> = {
  clareza_pauta: 'A pauta foi objetiva, com tópicos bem definidos?',
  aderencia_tempo: 'O tempo previsto foi respeitado?',
  qualidade_decisoes: 'As decisões tomadas foram claras e acionáveis?',
  engajamento_cliente: 'O cliente participou ativamente?',
  follow_ups: 'Os próximos passos ficaram bem encaminhados?',
};

const COMENTARIOS_POOL: Record<DimensaoAvaliacao, string[]> = {
  clareza_pauta: [
    'Pauta enviada com antecedência e respeitada na execução.',
    'Pauta clara, mas alguns tópicos extrapolaram o escopo.',
    'Reunião sem pauta formal — definir antes da próxima.',
  ],
  aderencia_tempo: [
    'Reunião encerrada dentro do tempo previsto.',
    'Estendeu em ~10 min; aceitável para o tema.',
    'Excedeu significativamente o tempo previsto.',
  ],
  qualidade_decisoes: [
    'Decisões claras com responsável e prazo definidos.',
    'Algumas decisões ficaram em aberto para validação.',
    'Decisões importantes adiadas para próxima reunião.',
  ],
  engajamento_cliente: [
    'Cliente participou ativamente, contribuiu e fez perguntas.',
    'Engajamento moderado; sponsor mais passivo.',
    'Engajamento baixo — verificar contexto e prioridade.',
  ],
  follow_ups: [
    'Follow-ups documentados e atribuídos no momento.',
    'Alguns follow-ups precisam ser detalhados após a reunião.',
    'Follow-ups vagos — risco de não execução.',
  ],
};

export interface AvaliacaoIaReuniao {
  reuniaoId: string;
  geradoEm: string;
  status: 'gerada_ia' | 'revisada_consultor' | 'aprovada_cliente';
  notaGeral: number; // 0-10
  resumoExecutivo: string;
  dimensoes: DimensaoNota[];
  pontosFortes: string[];
  pontosAtencao: string[];
  sugestoesProximaReuniao: string[];
  decisoesIdentificadas: string[];
  followUpsSugeridos: { titulo: string; responsavel: string; prazo: string }[];
}

const RESUMOS_POOL = [
  'Reunião focada em alinhamento estratégico, com decisões claras sobre próximos passos. Cliente engajado e equipe preparada.',
  'Encontro produtivo de validação técnica. Pequenos ajustes necessários na cadência de entregas.',
  'Reunião de acompanhamento padrão. Indicadores revisados, sem surpresas. Cliente confortável com o ritmo.',
  'Reunião com tom de retomada após hiato. Necessário reforçar prioridades e ritmo de execução.',
  'Sessão de workshop com equipe ampliada. Resultou em mapa de ações práticas para o próximo ciclo.',
  'Reunião com sponsor para validação de marcos. Sinal positivo sobre a continuidade do projeto.',
];

const FORTES_POOL = [
  'Pauta bem estruturada e respeitada',
  'Documentação compartilhada antes da reunião',
  'Decisões com responsáveis claros',
  'Cliente trouxe dados preparados',
  'Boa síntese ao final do encontro',
  'Tempo respeitado',
];

const ATENCAO_POOL = [
  'Sponsor não esteve presente',
  'Discussão técnica desviou do objetivo principal',
  'Próximos passos ficaram vagos',
  'Necessário formalizar decisão em ata',
  'Equipe do cliente parecia desalinhada internamente',
  'Pendência documental ainda não resolvida',
];

const SUGESTOES_POOL = [
  'Enviar pauta com 24h de antecedência',
  'Convidar sponsor para validação de marcos',
  'Reservar 10 min finais para consolidar próximos passos',
  'Trazer dados visuais para sustentar decisões',
  'Limitar a reunião a 60 minutos',
  'Definir owner de cada tópico antes do encontro',
];

const DECISOES_POOL = [
  'Aprovado avanço para a próxima fase do plano',
  'Validado novo cronograma de entregas',
  'Aprovada contratação adicional na equipe do cliente',
  'Definido novo formato do relatório mensal',
  'Adiado lançamento da iniciativa X em 30 dias',
];

const FOLLOWUPS_POOL = [
  { titulo: 'Enviar ata da reunião ao sponsor', responsavel: 'Consultor' },
  { titulo: 'Atualizar dashboard com novos indicadores', responsavel: 'Consultor' },
  { titulo: 'Revisar plano de ação trimestral', responsavel: 'Cliente + Consultor' },
  { titulo: 'Agendar workshop de aprofundamento', responsavel: 'Consultor' },
  { titulo: 'Validar números financeiros com controladoria', responsavel: 'Cliente' },
];

export function getAvaliacaoIa(reuniaoId: string): AvaliacaoIaReuniao | null {
  const r = reunioes.find(x => x.id === reuniaoId);
  if (!r || r.status !== 'realizada') return null;
  const seed = hash(reuniaoId);

  // Notas determinísticas — média entre 5.5 e 9.5
  const dimensoes: DimensaoNota[] = (Object.keys(labelDimensao) as DimensaoAvaliacao[]).map((d, i) => {
    const base = 5.5 + ((seed >> (i * 2)) % 40) / 10; // 5.5 - 9.4
    const nota = Math.round(base * 10) / 10;
    const idxComentario = nota >= 8 ? 0 : nota >= 6.5 ? 1 : 2;
    return {
      dimensao: d,
      nota,
      comentario: COMENTARIOS_POOL[d][idxComentario],
    };
  });

  const notaGeral = Math.round((dimensoes.reduce((a, x) => a + x.nota, 0) / dimensoes.length) * 10) / 10;

  const statusOpts: AvaliacaoIaReuniao['status'][] = ['gerada_ia', 'gerada_ia', 'gerada_ia', 'revisada_consultor', 'aprovada_cliente'];

  const fortes = [
    FORTES_POOL[seed % FORTES_POOL.length],
    FORTES_POOL[(seed >> 3) % FORTES_POOL.length],
    FORTES_POOL[(seed >> 5) % FORTES_POOL.length],
  ].filter((v, i, a) => a.indexOf(v) === i);

  const atencao = notaGeral < 8
    ? [ATENCAO_POOL[seed % ATENCAO_POOL.length], ATENCAO_POOL[(seed >> 4) % ATENCAO_POOL.length]]
      .filter((v, i, a) => a.indexOf(v) === i)
    : [ATENCAO_POOL[seed % ATENCAO_POOL.length]];

  const sugestoes = [
    SUGESTOES_POOL[seed % SUGESTOES_POOL.length],
    SUGESTOES_POOL[(seed >> 3) % SUGESTOES_POOL.length],
  ].filter((v, i, a) => a.indexOf(v) === i);

  const decisoes = [
    DECISOES_POOL[seed % DECISOES_POOL.length],
    ...(seed % 3 === 0 ? [DECISOES_POOL[(seed >> 2) % DECISOES_POOL.length]] : []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const followUps = [
    FOLLOWUPS_POOL[seed % FOLLOWUPS_POOL.length],
    FOLLOWUPS_POOL[(seed >> 4) % FOLLOWUPS_POOL.length],
  ].filter((v, i, a) => a.findIndex(y => y.titulo === v.titulo) === i)
    .map((f, i) => {
      const dias = 3 + ((seed + i) % 12);
      const prazo = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
      return { ...f, prazo };
    });

  return {
    reuniaoId,
    geradoEm: r.meetingDate,
    status: statusOpts[seed % statusOpts.length],
    notaGeral,
    resumoExecutivo: RESUMOS_POOL[seed % RESUMOS_POOL.length],
    dimensoes,
    pontosFortes: fortes,
    pontosAtencao: atencao,
    sugestoesProximaReuniao: sugestoes,
    decisoesIdentificadas: decisoes,
    followUpsSugeridos: followUps,
  };
}

export const labelStatusAvaliacao: Record<AvaliacaoIaReuniao['status'], string> = {
  gerada_ia: 'Gerada por IA',
  revisada_consultor: 'Revisada pelo consultor',
  aprovada_cliente: 'Aprovada pelo cliente',
};

export const variantStatusAvaliacao: Record<AvaliacaoIaReuniao['status'], 'info' | 'warning' | 'success'> = {
  gerada_ia: 'info',
  revisada_consultor: 'warning',
  aprovada_cliente: 'success',
};

export function corNota(nota: number): 'success' | 'warning' | 'danger' {
  if (nota >= 8) return 'success';
  if (nota >= 6) return 'warning';
  return 'danger';
}
