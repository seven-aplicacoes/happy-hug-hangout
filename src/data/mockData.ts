import type {
  Consultor, Cliente, Contrato, Reuniao, Tarefa, Chamado,
  StatusContrato, StatusReuniao, StatusTarefa, NivelRisco, NivelEngajamento,
  FaseMetodologica, Especialidade, Regiao, TipoDemanda,
} from '@/types';

// ─── Consultores ──────────────────────────────────────────
export const consultores: Consultor[] = [
  { id: 'c1', nome: 'Ana Beatriz Silva', email: 'ana@seven.com', especialidade: 'gestao', clientesAtivos: 5, cargo: 'Consultora Sênior', telefone: '(11) 99876-5432', cidade: 'São Paulo', estado: 'SP', dataEntrada: '2022-03-01', status: 'ativo' },
  { id: 'c2', nome: 'Carlos Eduardo Santos', email: 'carlos@seven.com', especialidade: 'financeiro', clientesAtivos: 4, cargo: 'Consultor Pleno', telefone: '(21) 98765-4321', cidade: 'Rio de Janeiro', estado: 'RJ', dataEntrada: '2023-01-15', status: 'ativo' },
  { id: 'c3', nome: 'Marina Costa', email: 'marina@seven.com', especialidade: 'comercial', clientesAtivos: 3, cargo: 'Consultora Plena', telefone: '(31) 97654-3210', cidade: 'Belo Horizonte', estado: 'MG', dataEntrada: '2023-06-01', status: 'ativo' },
];

// ─── Clientes ─────────────────────────────────────────────
export const clientes: Cliente[] = [
  {
    id: 'cl1', razaoSocial: 'Tech Solutions Ltda', nomeFantasia: 'TechSol', cnpj: '12.345.678/0001-90',
    segmento: 'Tecnologia', regiao: 'sudeste', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva',
    especialidade: 'gestao', faseMetodologica: 'estruturacao', indiceSeven: 82,
    potencialUpsell: true, dataInicio: '2024-03-15', ultimaInteracao: '2025-03-28', status: 'ativo',
    faturamentoMensal: 280000,
  },
  {
    id: 'cl2', razaoSocial: 'Indústria Alimentos Bom Sabor S.A.', nomeFantasia: 'Bom Sabor', cnpj: '23.456.789/0001-01',
    segmento: 'Alimentos', regiao: 'sul', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva',
    especialidade: 'processos', faseMetodologica: 'monitoramento', indiceSeven: 65,
    potencialUpsell: false, dataInicio: '2024-01-10', ultimaInteracao: '2025-03-20', status: 'em_renovacao',
    faturamentoMensal: 1450000,
  },
  {
    id: 'cl3', razaoSocial: 'Construtora Horizonte Ltda', nomeFantasia: 'Horizonte', cnpj: '34.567.890/0001-12',
    segmento: 'Construção', regiao: 'nordeste', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos',
    especialidade: 'financeiro', faseMetodologica: 'planejamento', indiceSeven: 45,
    potencialUpsell: false, dataInicio: '2024-06-01', ultimaInteracao: '2025-03-10', status: 'bloqueado',
    faturamentoMensal: 720000,
  },
  {
    id: 'cl4', razaoSocial: 'Varejo Express Comércio Ltda', nomeFantasia: 'Varejo Express', cnpj: '45.678.901/0001-23',
    segmento: 'Varejo', regiao: 'sudeste', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos',
    especialidade: 'comercial', faseMetodologica: 'diagnostico', indiceSeven: 30,
    potencialUpsell: false, dataInicio: '2024-09-01', ultimaInteracao: '2025-02-15', status: 'suspenso',
    faturamentoMensal: 380000,
  },
  {
    id: 'cl5', razaoSocial: 'Logística Rápida Transportes', nomeFantasia: 'LogRápida', cnpj: '56.789.012/0001-34',
    segmento: 'Logística', regiao: 'centro_oeste', consultorId: 'c3', consultorNome: 'Marina Costa',
    especialidade: 'estrategia', faseMetodologica: 'estruturacao', indiceSeven: 90,
    potencialUpsell: true, dataInicio: '2023-11-01', ultimaInteracao: '2025-03-30', status: 'ativo',
    faturamentoMensal: 2100000,
  },
  {
    id: 'cl6', razaoSocial: 'Saúde & Vida Clínicas', nomeFantasia: 'Saúde & Vida', cnpj: '67.890.123/0001-45',
    segmento: 'Saúde', regiao: 'sudeste', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva',
    especialidade: 'pessoas', faseMetodologica: 'encerramento', indiceSeven: 72,
    potencialUpsell: true, dataInicio: '2023-06-15', ultimaInteracao: '2025-03-25', status: 'renovado',
    faturamentoMensal: 540000,
  },
  {
    id: 'cl7', razaoSocial: 'Educação Futuro S.A.', nomeFantasia: 'EduFuturo', cnpj: '78.901.234/0001-56',
    segmento: 'Educação', regiao: 'norte', consultorId: 'c3', consultorNome: 'Marina Costa',
    especialidade: 'gestao', faseMetodologica: 'planejamento', indiceSeven: 55,
    potencialUpsell: false, dataInicio: '2024-08-01', ultimaInteracao: '2025-03-18', status: 'em_onboarding',
    faturamentoMensal: 175000,
  },
  {
    id: 'cl8', razaoSocial: 'Agro Verde Cooperativa', nomeFantasia: 'AgroVerde', cnpj: '89.012.345/0001-67',
    segmento: 'Agronegócio', regiao: 'centro_oeste', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos',
    especialidade: 'financeiro', faseMetodologica: 'estruturacao', indiceSeven: 78,
    potencialUpsell: true, dataInicio: '2024-02-01', ultimaInteracao: '2025-03-29', status: 'ativo',
    faturamentoMensal: 3200000,
  },
];

// ─── Contratos ────────────────────────────────────────────
const contratosAtivos: Contrato[] = clientes.map((cl) => ({
  id: `ct-${cl.id}`,
  clienteId: cl.id,
  clienteNome: cl.nomeFantasia,
  tipo: 'Consultoria Estratégica',
  valor: Math.floor(Math.random() * 80000) + 20000,
  dataInicio: cl.dataInicio,
  dataFim: '2025-12-31',
  status: cl.status,
  risco: 'baixo',
  faseMetodologica: cl.faseMetodologica,
  consultorId: cl.consultorId,
  consultorNome: cl.consultorNome,
}));

const contratosHistoricos: Contrato[] = [
  { id: 'ct-hist-cl1-1', clienteId: 'cl1', clienteNome: 'TechSol', tipo: 'Diagnóstico Empresarial', valor: 18000, dataInicio: '2023-06-01', dataFim: '2023-12-31', status: 'encerrado', risco: 'baixo', faseMetodologica: 'encerramento', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva' },
  { id: 'ct-hist-cl1-2', clienteId: 'cl1', clienteNome: 'TechSol', tipo: 'Reestruturação Financeira', valor: 35000, dataInicio: '2024-01-10', dataFim: '2024-03-14', status: 'encerrado', risco: 'baixo', faseMetodologica: 'encerramento', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva' },
  { id: 'ct-hist-cl2-1', clienteId: 'cl2', clienteNome: 'Bom Sabor', tipo: 'Consultoria de Processos', valor: 22000, dataInicio: '2023-04-01', dataFim: '2023-12-31', status: 'encerrado', risco: 'medio', faseMetodologica: 'encerramento', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva' },
  { id: 'ct-hist-cl5-1', clienteId: 'cl5', clienteNome: 'LogRápida', tipo: 'Planejamento Estratégico', valor: 28000, dataInicio: '2023-02-01', dataFim: '2023-10-31', status: 'encerrado', risco: 'baixo', faseMetodologica: 'encerramento', consultorId: 'c3', consultorNome: 'Marina Costa' },
  { id: 'ct-hist-cl6-1', clienteId: 'cl6', clienteNome: 'Saúde & Vida', tipo: 'Gestão de Pessoas', valor: 15000, dataInicio: '2022-09-01', dataFim: '2023-06-14', status: 'encerrado', risco: 'baixo', faseMetodologica: 'encerramento', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva' },
  { id: 'ct-hist-cl8-1', clienteId: 'cl8', clienteNome: 'AgroVerde', tipo: 'Diagnóstico Financeiro', valor: 12000, dataInicio: '2023-08-01', dataFim: '2024-01-31', status: 'encerrado', risco: 'baixo', faseMetodologica: 'encerramento', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos' },
];

export const contratos: Contrato[] = [...contratosAtivos, ...contratosHistoricos];

// ─── Reuniões ─────────────────────────────────────────────
const hoje = new Date().toISOString().slice(0, 10);

// Gerador de reuniões em escala — cria ~80-90 reuniões por mês, distribuídas de forma realista
function gerarReunioesEmEscala(): Reuniao[] {
  const clientesMock = clientes;
  const consultoresMock = consultores;
  const tipos = ['Acompanhamento', 'Alinhamento', 'Diagnóstico', 'Check-in', 'Emergencial', 'Workshop', 'Apresentação', 'Planejamento', 'Revisão', 'Kickoff'];
  const pautas = [
    'Revisão de indicadores do mês', 'Definição de metas trimestrais', 'Análise de risco contratual',
    'Status dos entregáveis', 'Apresentação de resultados', 'Levantamento inicial de processos',
    'Alinhamento de expectativas com diretoria', 'Validação de cronograma', 'Revisão de escopo do projeto',
    'Feedback sobre entregas recentes', 'Planejamento de próximos passos', 'Discussão de oportunidades de melhoria',
    'Análise de satisfação do cliente', 'Apresentação de benchmark', 'Workshop de capacitação da equipe',
    'Revisão de OKRs', 'Definição de prioridades do sprint', 'Acompanhamento de plano de ação',
    'Reunião de onboarding', 'Encerramento de fase do projeto', 'Discussão sobre expansão de contrato',
    'Mapeamento de stakeholders', 'Análise de ROI do projeto', 'Revisão de SLA e prazos',
  ];
  const horas = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  const duracoes = [30, 45, 60, 90, 120];
  const statusOpcoes: StatusReuniao[] = ['agendada', 'realizada', 'cancelada'];
  const participantesBase = ['Diretor', 'Gerente', 'Coordenador', 'Analista', 'CEO', 'CFO', 'COO'];

  const result: Reuniao[] = [];
  let idCounter = 1;

  // Seed simples para distribuição determinística
  const seededRandom = (seed: number) => {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  };

  // Gerar reuniões para 6 meses centrados no mês atual
  const now = new Date();
  const startMonth = now.getMonth() - 2; // 2 meses atrás
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), startMonth + i, 1);
    const year = date.getFullYear();
    const m = date.getMonth() + 1;
    const month = date.getMonth();
    const daysInMonth = new Date(year, m, 0).getDate();
    const rand = seededRandom(i * 1000 + year * 13 + month * 7 + 42);

    // Gerar entre 80 e 95 reuniões por mês
    const totalReunions = 80 + Math.floor(rand() * 16);

    // Distribuir reuniões pelos dias úteis (seg-sex)
    const diasUteis: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow >= 1 && dow <= 5) diasUteis.push(d);
    }

    // Garantir pelo menos 3 por dia, distribuir o restante
    const reunioesPorDia: Record<number, number> = {};
    diasUteis.forEach(d => { reunioesPorDia[d] = 3; });
    let restante = totalReunions - diasUteis.length * 3;
    while (restante > 0) {
      const dia = diasUteis[Math.floor(rand() * diasUteis.length)];
      reunioesPorDia[dia] = (reunioesPorDia[dia] || 0) + 1;
      restante--;
    }

    for (const dia of diasUteis) {
      const qtd = reunioesPorDia[dia] || 3;
      const dataStr = `${year}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const isPast = dataStr < hoje;

      for (let i = 0; i < qtd; i++) {
        const cl = clientesMock[Math.floor(rand() * clientesMock.length)];
        const cons = consultoresMock[Math.floor(rand() * consultoresMock.length)];
        const status: StatusReuniao = isPast
          ? (rand() > 0.15 ? 'realizada' : 'cancelada')
          : (rand() > 0.1 ? 'agendada' : 'agendada');

        result.push({
          id: `r${idCounter++}`,
          clienteId: cl.id,
          clienteNome: cl.nomeFantasia,
          contractId: `ct-${cl.id}`,
          consultorId: cons.id,
          consultorNome: cons.nome,
          meetingDate: dataStr,
          startTime: horas[Math.floor(rand() * horas.length)],
          duracao: duracoes[Math.floor(rand() * duracoes.length)],
          tipo: tipos[Math.floor(rand() * tipos.length)],
          title: pautas[Math.floor(rand() * pautas.length)],
          status,
          ata: status === 'realizada' ? 'Pontos discutidos e próximos passos definidos conforme pauta.' : undefined,
          participantes: [
            cons.nome.split(' ')[0],
            `${participantesBase[Math.floor(rand() * participantesBase.length)]} (${cl.nomeFantasia})`,
          ],
        });
      }
    }
  }

  return result;
}

export const reunioes: Reuniao[] = gerarReunioesEmEscala();

// ─── Tarefas ──────────────────────────────────────────────
export const tarefas: Tarefa[] = [
  // A fazer (4)
  { id: 't1', titulo: 'Revisar contrato Bom Sabor', descricao: 'Verificar cláusulas de renovação', clienteId: 'cl2', clienteNome: 'Bom Sabor', contratoId: 'ct-cl2', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva', tipo: 'interna', status: 'a_fazer', prioridade: 'alto', dataVencimento: '2025-04-05', dataCriacao: '2025-03-25', origem: 'gestor', contratoNome: 'Contrato Bom Sabor 2024' },
  { id: 't2', titulo: 'Diagnóstico inicial Varejo Express', descricao: 'Mapear processos e identificar gaps', clienteId: 'cl4', clienteNome: 'Varejo Express', contratoId: 'ct-cl4', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos', tipo: 'consultoria', status: 'a_fazer', prioridade: 'alto', dataVencimento: '2025-04-10', dataCriacao: '2025-03-22', origem: 'reuniao', contratoNome: 'Contrato Varejo Express 2024' },
  { id: 't3', titulo: 'Responder chamado AgroVerde', descricao: 'Dúvida sobre relatório financeiro', clienteId: 'cl8', clienteNome: 'AgroVerde', contratoId: 'ct-cl8', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos', tipo: 'chamado', status: 'a_fazer', prioridade: 'baixo', dataVencimento: '2025-04-03', dataCriacao: '2025-03-28', origem: 'chamado', contratoNome: 'Contrato AgroVerde 2024' },
  { id: 't4', titulo: 'Montar proposta comercial EduFuturo', descricao: 'Proposta de expansão de escopo', clienteId: 'cl7', clienteNome: 'EduFuturo', contratoId: 'ct-cl7', consultorId: 'c3', consultorNome: 'Marina Costa', tipo: 'interna', status: 'a_fazer', prioridade: 'medio', dataVencimento: '2025-04-15', dataCriacao: '2025-03-30', origem: 'gestor', contratoNome: 'Contrato EduFuturo 2024' },

  // Em andamento (5)
  { id: 't5', titulo: 'Elaborar relatório mensal TechSol', descricao: 'Compilar indicadores e enviar ao cliente', clienteId: 'cl1', clienteNome: 'TechSol', contratoId: 'ct-cl1', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva', tipo: 'consultoria', status: 'em_andamento', prioridade: 'medio', dataVencimento: hoje, dataCriacao: '2025-03-20', origem: 'rotina_automatica', contratoNome: 'Contrato TechSol 2024' },
  { id: 't6', titulo: 'Preparar workshop LogRápida', descricao: 'Material para workshop de estratégia', clienteId: 'cl5', clienteNome: 'LogRápida', contratoId: 'ct-cl5', consultorId: 'c3', consultorNome: 'Marina Costa', tipo: 'consultoria', status: 'em_andamento', prioridade: 'medio', dataVencimento: '2025-04-08', dataCriacao: '2025-03-18', origem: 'reuniao', contratoNome: 'Contrato LogRápida 2023' },
  { id: 't7', titulo: 'Planejamento estratégico EduFuturo', descricao: 'Definir roadmap com o cliente', clienteId: 'cl7', clienteNome: 'EduFuturo', contratoId: 'ct-cl7', consultorId: 'c3', consultorNome: 'Marina Costa', tipo: 'consultoria', status: 'em_andamento', prioridade: 'medio', dataVencimento: '2025-04-12', dataCriacao: '2025-03-20', origem: 'reuniao', contratoNome: 'Contrato EduFuturo 2024' },
  { id: 't8', titulo: 'Atualizar dashboard financeiro Horizonte', descricao: 'Inserir dados Q1 no painel do cliente', clienteId: 'cl3', clienteNome: 'Horizonte', contratoId: 'ct-cl3', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos', tipo: 'consultoria', status: 'em_andamento', prioridade: 'alto', dataVencimento: '2025-04-06', dataCriacao: '2025-03-26', origem: 'reuniao', contratoNome: 'Contrato Horizonte 2024' },
  { id: 't9', titulo: 'Mapear stakeholders Saúde & Vida', descricao: 'Identificar decisores para renovação', clienteId: 'cl6', clienteNome: 'Saúde & Vida', contratoId: 'ct-cl6', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva', tipo: 'interna', status: 'em_andamento', prioridade: 'baixo', dataVencimento: '2025-04-14', dataCriacao: '2025-03-29', origem: 'rotina_automatica', contratoNome: 'Contrato Saúde & Vida 2023' },

  // Impedida (3)
  { id: 't10', titulo: 'Plano de recuperação Horizonte', descricao: 'Montar plano de ação para redução de risco', clienteId: 'cl3', clienteNome: 'Horizonte', contratoId: 'ct-cl3', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos', tipo: 'consultoria', status: 'impedida', prioridade: 'critico', dataVencimento: '2025-04-01', dataCriacao: '2025-03-15', motivoImpedimento: 'Aguardando dados financeiros do cliente', origem: 'reuniao', contratoNome: 'Contrato Horizonte 2024' },
  { id: 't11', titulo: 'Revisão de processos Bom Sabor', descricao: 'Mapear fluxo de produção atual', clienteId: 'cl2', clienteNome: 'Bom Sabor', contratoId: 'ct-cl2', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva', tipo: 'consultoria', status: 'impedida', prioridade: 'alto', dataVencimento: '2025-04-07', dataCriacao: '2025-03-22', motivoImpedimento: 'Gerente de produção em férias até 07/04', origem: 'reuniao', contratoNome: 'Contrato Bom Sabor 2024' },
  { id: 't12', titulo: 'Integração de sistemas Varejo Express', descricao: 'Conectar ERP com painel de gestão', clienteId: 'cl4', clienteNome: 'Varejo Express', contratoId: 'ct-cl4', consultorId: 'c2', consultorNome: 'Carlos Eduardo Santos', tipo: 'chamado', status: 'impedida', prioridade: 'medio', dataVencimento: '2025-04-09', dataCriacao: '2025-03-27', motivoImpedimento: 'TI do cliente sem disponibilidade', origem: 'chamado', contratoNome: 'Contrato Varejo Express 2024' },

  // Concluída (3)
  { id: 't13', titulo: 'Encerramento Saúde & Vida', descricao: 'Preparar documentação de encerramento', clienteId: 'cl6', clienteNome: 'Saúde & Vida', contratoId: 'ct-cl6', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva', tipo: 'interna', status: 'concluida', prioridade: 'baixo', dataVencimento: '2025-03-30', dataCriacao: '2025-03-10', origem: 'rotina_automatica', contratoNome: 'Contrato Saúde & Vida 2023' },
  { id: 't14', titulo: 'Relatório de onboarding TechSol', descricao: 'Documentar processo de entrada do cliente', clienteId: 'cl1', clienteNome: 'TechSol', contratoId: 'ct-cl1', consultorId: 'c1', consultorNome: 'Ana Beatriz Silva', tipo: 'consultoria', status: 'concluida', prioridade: 'medio', dataVencimento: '2025-03-28', dataCriacao: '2025-03-10', origem: 'reuniao', contratoNome: 'Contrato TechSol 2024' },
  { id: 't15', titulo: 'Benchmark concorrencial LogRápida', descricao: 'Análise comparativa com 3 concorrentes', clienteId: 'cl5', clienteNome: 'LogRápida', contratoId: 'ct-cl5', consultorId: 'c3', consultorNome: 'Marina Costa', tipo: 'consultoria', status: 'concluida', prioridade: 'baixo', dataVencimento: '2025-03-25', dataCriacao: '2025-03-05', origem: 'gestor', contratoNome: 'Contrato LogRápida 2023' },
];

// ─── Chamados ─────────────────────────────────────────────
export const chamados: Chamado[] = [
  { id: 'ch1', clienteId: 'cl1', clienteNome: 'TechSol', assunto: 'Dúvida sobre indicadores', descricao: 'Cliente não entendeu cálculo do ROI', status: 'resolvido', prioridade: 'baixo', dataCriacao: '2025-03-15', dataResolucao: '2025-03-16' },
  { id: 'ch2', clienteId: 'cl3', clienteNome: 'Horizonte', assunto: 'Urgência no fluxo de caixa', descricao: 'Necessidade de revisão urgente do fluxo', status: 'aberto', prioridade: 'critico', dataCriacao: '2025-03-28' },
  { id: 'ch3', clienteId: 'cl4', clienteNome: 'Varejo Express', assunto: 'Solicitação de reunião extra', descricao: 'Diretoria quer reunião fora do ciclo', status: 'em_andamento', prioridade: 'medio', dataCriacao: '2025-03-27' },
];

// ─── Helpers ──────────────────────────────────────────────
export const getClientesByConsultor = (consultorId: string) =>
  clientes.filter((c) => c.consultorId === consultorId);

export const getReunioesDoConsultor = (_consultorId: string) =>
  [...reunioes];

export const getTarefasDoConsultor = (_consultorId: string) =>
  [...tarefas];

export const getReunioesHoje = (_consultorId?: string) => {
  const hojeStr = new Date().toISOString().slice(0, 10);
  return reunioes.filter((r) => r.meetingDate === hojeStr);
};

export const labelFase: Record<string, string> = {
  diagnostico: 'Diagnóstico',
  planejamento: 'Planejamento',
  estruturacao: 'Estruturação',
  monitoramento: 'Monitoramento',
  encerramento: 'Encerramento',
};

export const labelRisco: Record<string, string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  critico: 'Crítico',
};

export const labelStatus: Record<string, string> = {
  ativo: 'Ativo',
  em_onboarding: 'Em onboarding',
  em_renovacao: 'Em renovação',
  renovado: 'Renovado',
  bloqueado: 'Bloqueado',
  suspenso: 'Suspenso',
  cancelado: 'Cancelado',
  churn: 'Churn',
  encerrado: 'Encerrado',
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  remarcada: 'Remarcada',
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  impedida: 'Impedida',
  concluida: 'Concluída',
  
  aberto: 'Aberto',
  resolvido: 'Resolvido',
};

// ─── Engajamento (calculado a partir de dias sem reunião) ──
export const labelEngajamento: Record<NivelEngajamento, string> = {
  em_dia: 'Em dia',
  atencao: 'Atenção',
  critico: 'Crítico',
  sem_dados: 'Sem dados',
};

export const variantEngajamento: Record<NivelEngajamento, 'success' | 'warning' | 'danger' | 'info'> = {
  em_dia: 'success',
  atencao: 'warning',
  critico: 'danger',
  sem_dados: 'info',
};


/** Dias desde a última reunião realizada do cliente. Se nunca houve, retorna null. */
export function diasDesdeUltimaReuniao(clienteId: string, customReunioes?: Reuniao[]): number | null {
  const hojeMs = Date.now();
  const source = customReunioes || reunioes;
  const reunioesCl = source
    .filter(r => r.clienteId === clienteId && r.status === 'realizada')
    .map(r => ({ ...r, _d: r.meetingDate || r.data || '' }))
    .filter(r => !!r._d)
    .sort((a, b) => b._d.localeCompare(a._d));
  
  if (reunioesCl.length > 0) {
    return Math.max(0, Math.floor((hojeMs - new Date(reunioesCl[0]._d).getTime()) / 86400000));
  }
  
  return null;
}

/** 1-8d → em_dia · 9-15d → atenção · >15d → crítico · null → sem_dados */
export function calcularEngajamento(clienteId: string, customReunioes?: Reuniao[]): NivelEngajamento {
  const d = diasDesdeUltimaReuniao(clienteId, customReunioes);
  if (d === null) return 'sem_dados';
  if (d <= 8) return 'em_dia';
  if (d <= 15) return 'atencao';
  return 'critico';
}



export const labelEspecialidade: Record<string, string> = {
  gestao: 'Gestão',
  financeiro: 'Financeiro',
  comercial: 'Comercial',
  processos: 'Processos',
  pessoas: 'Pessoas',
  estrategia: 'Estratégia',
};

export const labelRegiao: Record<string, string> = {
  norte: 'Norte',
  nordeste: 'Nordeste',
  centro_oeste: 'Centro-Oeste',
  sudeste: 'Sudeste',
  sul: 'Sul',
};

export const getConsultorById = (id: string) =>
  consultores.find((c) => c.id === id);
