// === Metodologia Seven — Hub centralizado (Bloco 4) ===
// Estrutura completa da metodologia: 5 fases + materiais, templates, perguntas-chave.

import type { FaseMetodologica } from '@/types';

export type TipoMaterial = 'pdf' | 'video' | 'planilha' | 'apresentacao' | 'link' | 'template';

export interface Material {
  id: string;
  titulo: string;
  tipo: TipoMaterial;
  descricao: string;
  duracao?: string; // para vídeos
  paginas?: number; // para PDFs
  atualizadoEm: string;
  tag?: 'novo' | 'atualizado' | 'essencial';
}

export interface Template {
  id: string;
  titulo: string;
  formato: string;
  descricao: string;
  exemplos: string[];
}

export interface PerguntaChave {
  id: string;
  pergunta: string;
  objetivo: string;
}

export interface FaseDetalhada {
  id: FaseMetodologica;
  ordem: number;
  nome: string;
  duracaoMedia: string;
  proposito: string;
  objetivos: string[];
  entregaveis: string[];
  ferramentas: string[];
  materiais: Material[];
  templates: Template[];
  perguntasChave: PerguntaChave[];
  alertas: string[];
}

export const METODOLOGIA: FaseDetalhada[] = [
  {
    id: 'diagnostico',
    ordem: 1,
    nome: 'Diagnóstico',
    duracaoMedia: 'Varia por produto',
    proposito: 'Compreender em profundidade o cenário atual da empresa, mapear processos, dores e oportunidades reais.',
    objetivos: [
      'Mapear processos críticos da operação',
      'Identificar gargalos financeiros, operacionais e culturais',
      'Levantar indicadores baseline (atuais)',
      'Alinhar expectativas com sponsor e stakeholders',
    ],
    entregaveis: [
      'Relatório de diagnóstico (40+ páginas)',
      'Matriz SWOT consolidada',
      'Mapa de processos AS-IS',
      'Painel de indicadores baseline',
    ],
    ferramentas: ['Canvas Seven', 'Matriz GUT', 'Diagrama de Ishikawa', 'Bizagi/Lucidchart'],
    materiais: [
      { id: 'd-m1', titulo: 'Manual do Diagnóstico Seven', tipo: 'pdf', descricao: 'Guia completo do consultor para conduzir a fase de diagnóstico.', paginas: 68, atualizadoEm: '2025-02-10', tag: 'essencial' },
      { id: 'd-m2', titulo: 'Vídeo aula: Como conduzir o kick-off', tipo: 'video', descricao: 'Boas práticas para a primeira reunião com o cliente.', duracao: '24 min', atualizadoEm: '2025-01-15' },
      { id: 'd-m3', titulo: 'Checklist de levantamento financeiro', tipo: 'planilha', descricao: 'Itens mínimos a coletar nos primeiros módulos.', atualizadoEm: '2025-03-02', tag: 'atualizado' },
      { id: 'd-m4', titulo: 'Framework de entrevistas qualitativas', tipo: 'pdf', descricao: 'Roteiro estruturado para entrevistar líderes e equipes.', paginas: 22, atualizadoEm: '2024-11-20' },
    ],
    templates: [
      { id: 'd-t1', titulo: 'Template Relatório de Diagnóstico', formato: '.pptx + .docx', descricao: 'Estrutura padrão Seven para apresentação do diagnóstico.', exemplos: ['Sumário executivo', 'Matriz SWOT', 'Mapa de processos', 'Recomendações iniciais'] },
      { id: 'd-t2', titulo: 'Template Painel de Indicadores Baseline', formato: '.xlsx', descricao: 'Planilha de indicadores essenciais por área.', exemplos: ['Indicadores financeiros', 'KPIs operacionais', 'Métricas comerciais'] },
    ],
    perguntasChave: [
      { id: 'd-p1', pergunta: 'Qual é a dor número 1 que motivou a contratação?', objetivo: 'Entender o gatilho real da consultoria.' },
      { id: 'd-p2', pergunta: 'Quem é o sponsor executivo do projeto?', objetivo: 'Garantir patrocínio para decisões difíceis.' },
      { id: 'd-p3', pergunta: 'Qual é a métrica de sucesso esperada em 6 meses?', objetivo: 'Definir north star compartilhada.' },
    ],
    alertas: [
      'Não pular conversas individuais com sócios e líderes.',
      'Validar números coletados em pelo menos duas fontes.',
    ],
  },
  {
    id: 'planejamento',
    ordem: 2,
    nome: 'Planejamento',
    duracaoMedia: 'Varia por produto',
    proposito: 'Traduzir o diagnóstico em um plano executável com objetivos, prazos, responsáveis e métricas claras.',
    objetivos: [
      'Definir objetivos estratégicos prioritários',
      'Construir plano de ação 90/180/365 dias',
      'Alinhar metas SMART com a liderança',
      'Estabelecer governança do projeto',
    ],
    entregaveis: [
      'Plano estratégico aprovado',
      'Cronograma de execução',
      'Matriz RACI dos envolvidos',
      'Documento de governança',
    ],
    ferramentas: ['OKRs', 'Gantt', 'Kanban', 'Matriz RACI', 'Roadmap visual'],
    materiais: [
      { id: 'p-m1', titulo: 'Guia de OKRs Seven', tipo: 'pdf', descricao: 'Como definir objetivos e KRs com clientes.', paginas: 40, atualizadoEm: '2025-01-10', tag: 'essencial' },
      { id: 'p-m2', titulo: 'Workshop: Construção de Roadmap', tipo: 'video', descricao: 'Conduzindo a sessão de planejamento estratégico.', duracao: '45 min', atualizadoEm: '2024-12-05' },
      { id: 'p-m3', titulo: 'Banco de iniciativas por especialidade', tipo: 'planilha', descricao: '+200 iniciativas pré-mapeadas por área.', atualizadoEm: '2025-02-28', tag: 'novo' },
    ],
    templates: [
      { id: 'p-t1', titulo: 'Template Plano Estratégico', formato: '.pptx', descricao: 'Modelo padrão Seven para apresentar o plano à diretoria.', exemplos: ['Visão de longo prazo', 'Pilares estratégicos', 'Plano 90/180/365', 'Cronograma'] },
      { id: 'p-t2', titulo: 'Template Matriz RACI', formato: '.xlsx', descricao: 'Atribuição clara de responsabilidades por entrega.', exemplos: ['Responsável', 'Aprovador', 'Consultado', 'Informado'] },
    ],
    perguntasChave: [
      { id: 'p-p1', pergunta: 'Quais 3 objetivos serão prioritários para os próximos 90 dias?', objetivo: 'Forçar foco em impacto.' },
      { id: 'p-p2', pergunta: 'Quem será o dono de cada frente de trabalho?', objetivo: 'Garantir accountability.' },
      { id: 'p-p3', pergunta: 'Quais decisões a diretoria precisa estar pronta para tomar?', objetivo: 'Antecipar pontos de bloqueio.' },
    ],
    alertas: [
      'Plano sem dono é plano sem execução.',
      'Validar capacidade real do cliente antes de prometer prazos.',
    ],
  },
  {
    id: 'estruturacao',
    ordem: 3,
    nome: 'Estruturação',
    duracaoMedia: 'Varia por produto',
    proposito: 'Implementar as iniciativas planejadas, estruturar processos, treinar a equipe e gerar resultados visíveis.',
    objetivos: [
      'Implementar processos e ferramentas',
      'Treinar líderes e equipes',
      'Acompanhar entregas e ajustar rota',
      'Garantir adoção dos novos padrões',
    ],
    entregaveis: [
      'Processos documentados e em uso',
      'Equipe treinada e certificada',
      'Dashboard operacional ativo',
      'Relatórios quinzenais de progresso',
    ],
    ferramentas: ['Módulos de execução', 'Daily 15min', 'Burn-down', 'Trello/Asana', 'Documentação viva'],
    materiais: [
      { id: 'e-m1', titulo: 'Playbook de Estruturação', tipo: 'pdf', descricao: 'Como conduzir sprints com clientes não-tech.', paginas: 84, atualizadoEm: '2025-03-10', tag: 'essencial' },
      { id: 'e-m2', titulo: 'Modelo de treinamento corporativo', tipo: 'apresentacao', descricao: 'Slides padrão para treinar equipes do cliente.', atualizadoEm: '2025-02-18' },
      { id: 'e-m3', titulo: 'Vídeo: Conduzindo dailies eficazes', tipo: 'video', descricao: 'Boas práticas de reuniões diárias com cliente.', duracao: '18 min', atualizadoEm: '2024-10-22' },
      { id: 'e-m4', titulo: 'Matriz de adoção de processos', tipo: 'planilha', descricao: 'Ferramenta para medir aderência da equipe.', atualizadoEm: '2025-01-30' },
    ],
    templates: [
      { id: 'e-t1', titulo: 'Template Sprint Review', formato: '.pptx', descricao: 'Estrutura para apresentar resultados quinzenais.', exemplos: ['Entregas concluídas', 'Próximos passos', 'Riscos', 'Decisões necessárias'] },
      { id: 'e-t2', titulo: 'Template Procedimento Operacional', formato: '.docx', descricao: 'Modelo para documentar processos novos.', exemplos: ['Objetivo', 'Responsáveis', 'Passo a passo', 'Critérios de qualidade'] },
    ],
    perguntasChave: [
      { id: 'e-p1', pergunta: 'O que está bloqueando a entrega desta sprint?', objetivo: 'Identificar impedimentos cedo.' },
      { id: 'e-p2', pergunta: 'A equipe está adotando o novo processo?', objetivo: 'Medir aderência real.' },
      { id: 'e-p3', pergunta: 'Que ajustes precisamos fazer no plano?', objetivo: 'Manter o plano vivo.' },
    ],
    alertas: [
      'Pausa de execução superior a 14 dias requer reavaliação.',
      'Documentar todas as decisões tomadas em comitê.',
    ],
  },
  {
    id: 'monitoramento',
    ordem: 4,
    nome: 'Monitoramento',
    duracaoMedia: 'Contínuo',
    proposito: 'Acompanhar indicadores, medir resultados e consolidar a cultura de gestão por dados.',
    objetivos: [
      'Manter rotina de acompanhamento',
      'Avaliar impacto das ações implementadas',
      'Ajustar estratégias com base em dados',
      'Capacitar a liderança para autonomia',
    ],
    entregaveis: [
      'Dashboard estratégico em produção',
      'Relatórios mensais de performance',
      'Ata de comitês mensais',
      'Plano de melhoria contínua',
    ],
    ferramentas: ['Power BI', 'Dashboards Seven', 'Comitê mensal', 'Análises comparativas'],
    materiais: [
      { id: 'm-m1', titulo: 'Manual do Comitê Estratégico', tipo: 'pdf', descricao: 'Como conduzir o comitê mensal com a diretoria.', paginas: 32, atualizadoEm: '2024-12-12', tag: 'essencial' },
      { id: 'm-m2', titulo: 'Biblioteca de dashboards', tipo: 'link', descricao: 'Repositório com 30+ dashboards prontos.', atualizadoEm: '2025-03-05', tag: 'novo' },
      { id: 'm-m3', titulo: 'Vídeo: Storytelling com dados', tipo: 'video', descricao: 'Como apresentar resultados ao C-Level.', duracao: '32 min', atualizadoEm: '2025-01-08' },
    ],
    templates: [
      { id: 'm-t1', titulo: 'Template Relatório Mensal', formato: '.pptx', descricao: 'Modelo Seven de relatório mensal de performance.', exemplos: ['Highlights do mês', 'Indicadores vs meta', 'Decisões necessárias', 'Próximos passos'] },
      { id: 'm-t2', titulo: 'Template Ata de Comitê', formato: '.docx', descricao: 'Estrutura padrão de ata do comitê estratégico.', exemplos: ['Pauta', 'Decisões', 'Responsáveis', 'Prazos'] },
    ],
    perguntasChave: [
      { id: 'm-p1', pergunta: 'O indicador X está evoluindo conforme esperado?', objetivo: 'Comparar real vs meta sistematicamente.' },
      { id: 'm-p2', pergunta: 'Que decisão precisa ser tomada este mês?', objetivo: 'Manter ritmo de governança.' },
      { id: 'm-p3', pergunta: 'A liderança está conduzindo as rotinas sem nós?', objetivo: 'Preparar transição para autonomia.' },
    ],
    alertas: [
      'Indicadores sem ação são apenas decoração.',
      'Comitê mensal não pode ser cancelado mais de 1x por trimestre.',
    ],
  },
  {
    id: 'encerramento',
    ordem: 5,
    nome: 'Encerramento',
    duracaoMedia: 'Varia por produto',
    proposito: 'Consolidar aprendizados, transferir conhecimento e preparar terreno para renovação ou nova frente.',
    objetivos: [
      'Documentar aprendizados e legado',
      'Transferir 100% do conhecimento à equipe',
      'Consolidar resultados quantitativos',
      'Avaliar oportunidades de continuidade',
    ],
    entregaveis: [
      'Relatório final consolidado',
      'Manual operacional do legado',
      'Apresentação de resultados à diretoria',
      'Plano de continuidade autônoma',
    ],
    ferramentas: ['Workshop de retrospectiva', 'NPS final', 'Balanço financeiro do projeto'],
    materiais: [
      { id: 'f-m1', titulo: 'Guia de Encerramento Seven', tipo: 'pdf', descricao: 'Como fechar projetos com excelência.', paginas: 28, atualizadoEm: '2025-02-05', tag: 'essencial' },
      { id: 'f-m2', titulo: 'Template Apresentação Final', tipo: 'apresentacao', descricao: 'Slides para apresentar resultados consolidados.', atualizadoEm: '2025-01-22' },
    ],
    templates: [
      { id: 'f-t1', titulo: 'Template Relatório Final', formato: '.pptx + .pdf', descricao: 'Modelo completo de fechamento de projeto.', exemplos: ['Jornada percorrida', 'Resultados alcançados', 'Aprendizados', 'Próximos horizontes'] },
      { id: 'f-t2', titulo: 'Template Plano de Continuidade', formato: '.docx', descricao: 'Roteiro para autonomia da equipe pós-consultoria.', exemplos: ['Rotinas críticas', 'Indicadores a manter', 'Pontos de atenção'] },
    ],
    perguntasChave: [
      { id: 'f-p1', pergunta: 'Quais resultados quantitativos vamos defender?', objetivo: 'Garantir narrativa de impacto.' },
      { id: 'f-p2', pergunta: 'A equipe está pronta para conduzir sem nós?', objetivo: 'Validar maturidade adquirida.' },
      { id: 'f-p3', pergunta: 'Existe espaço para nova frente ou renovação?', objetivo: 'Identificar oportunidades de continuidade.' },
    ],
    alertas: [
      'Não encerre sem coletar NPS final.',
      'Documentação incompleta = legado fragilizado.',
    ],
  },
];

export const labelTipoMaterial: Record<TipoMaterial, string> = {
  pdf: 'PDF',
  video: 'Vídeo',
  planilha: 'Planilha',
  apresentacao: 'Apresentação',
  link: 'Link externo',
  template: 'Template',
};

// Materiais transversais (não atrelados a fase)
export interface MaterialGeral {
  id: string;
  titulo: string;
  categoria: 'cultura' | 'comercial' | 'metodologia' | 'integracao';
  tipo: TipoMaterial;
  descricao: string;
  atualizadoEm: string;
}

export const MATERIAIS_GERAIS: MaterialGeral[] = [
  { id: 'g1', titulo: 'Manifesto Seven', categoria: 'cultura', tipo: 'pdf', descricao: 'Princípios e valores que guiam a consultoria.', atualizadoEm: '2024-09-01' },
  { id: 'g2', titulo: 'Visão geral da metodologia', categoria: 'metodologia', tipo: 'apresentacao', descricao: 'Apresentação institucional para uso comercial e onboarding.', atualizadoEm: '2025-01-15' },
  { id: 'g3', titulo: 'Argumentário comercial', categoria: 'comercial', tipo: 'pdf', descricao: 'Como apresentar a metodologia em propostas e reuniões iniciais.', atualizadoEm: '2025-02-20' },
  { id: 'g4', titulo: 'Onboarding de novos consultores', categoria: 'metodologia', tipo: 'video', descricao: 'Trilha de capacitação para novos integrantes.', atualizadoEm: '2025-03-01' },
  { id: 'g5', titulo: 'Conector Microsoft Teams (preview)', categoria: 'integracao', tipo: 'link', descricao: 'Em breve: registro automático de reuniões via Teams.', atualizadoEm: '2025-03-10' },
  { id: 'g6', titulo: 'Conector Calendly (preview)', categoria: 'integracao', tipo: 'link', descricao: 'Em breve: agendamentos sincronizados.', atualizadoEm: '2025-03-10' },
];

export const labelCategoria: Record<MaterialGeral['categoria'], string> = {
  cultura: 'Cultura Seven',
  comercial: 'Comercial',
  metodologia: 'Metodologia',
  integracao: 'Integrações',
};
