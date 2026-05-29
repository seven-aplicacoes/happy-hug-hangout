// === Relacionamento + NPS — Bloco 8 (mock determinístico) ===
import { clientes } from './mockData';

export type StatusTratativa = 'em_andamento' | 'concluida' | 'sem_resposta';
export type CategoriaFeedback = 'positivo' | 'duvida' | 'reclamacao' | 'elogio' | 'evolucao';
export type CanalAtividade = 'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'outro';

export interface NpsRegistro {
  id: string;
  clienteId: string;
  data: string;
  nota: number; // 0-10
  comentario: string;
  responsavel: string;
  statusTratativa: StatusTratativa;
  trimestre: string;
}

export interface FeedbackRegistrado {
  id: string;
  clienteId: string;
  clienteNome: string;
  categoria: CategoriaFeedback;
  texto: string;
  arquivo?: string;
  data: string;
  responsavel: string;
}

export interface AtividadeRelacionamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  canal: CanalAtividade;
  data: string;
  responsavel: string;
  observacao: string;
  proximaAcao?: string;
}

export const labelStatusTratativa: Record<StatusTratativa, string> = {
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  sem_resposta: 'Sem resposta',
};

export const variantTratativa: Record<StatusTratativa, 'warning' | 'success' | 'danger'> = {
  em_andamento: 'warning',
  concluida: 'success',
  sem_resposta: 'danger',
};

export const labelCategoriaFb: Record<CategoriaFeedback, string> = {
  positivo: 'Positivo',
  duvida: 'Dúvida',
  reclamacao: 'Reclamação',
  elogio: 'Elogio',
  evolucao: 'Percepção de evolução',
};

export const variantCategoriaFb: Record<CategoriaFeedback, 'success' | 'info' | 'danger' | 'warning'> = {
  positivo: 'success',
  duvida: 'info',
  reclamacao: 'danger',
  elogio: 'success',
  evolucao: 'warning',
};

export const labelCanal: Record<CanalAtividade, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  reuniao: 'Reunião',
  outro: 'Outro',
};

const seeded = (s: number) => { let x = s; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; };

function gerarNps(): NpsRegistro[] {
  const out: NpsRegistro[] = [];
  const comentarios = [
    'Equipe muito atenciosa, entregas no prazo.',
    'Resultados visíveis, mas comunicação pode melhorar.',
    'Faltou retorno após reunião do mês passado.',
    'Excelente metodologia, recomendaria sem hesitar.',
    'Aguardando próxima fase para avaliar melhor.',
    'Algumas entregas atrasadas comprometeram o ritmo.',
  ];
  const trimestres = ['2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1'];
  clientes.forEach((cl, idx) => {
    const rand = seeded(idx * 17 + 3);
    trimestres.forEach((tri, i) => {
      const baseNota = 6 + Math.floor(rand() * 5); // 6-10
      // Última pode estar sem resposta
      const isUltima = i === trimestres.length - 1;
      const semResposta = isUltima && rand() < 0.25;
      const nota = semResposta ? 0 : Math.min(10, Math.max(0, baseNota + (rand() < 0.3 ? -2 : 0)));
      const status: StatusTratativa = semResposta
        ? 'sem_resposta'
        : nota <= 6 ? (rand() < 0.5 ? 'em_andamento' : 'concluida') : 'concluida';
      const ano = parseInt(tri.split('-')[0]);
      const q = parseInt(tri.split('-')[1].replace('Q', ''));
      const dataAvaliacao = `${ano}-${String((q - 1) * 3 + 2).padStart(2, '0')}-15`;
      out.push({
        id: `nps-${cl.id}-${tri}`,
        clienteId: cl.id,
        data: dataAvaliacao,
        nota,
        comentario: semResposta ? '—' : comentarios[Math.floor(rand() * comentarios.length)],
        responsavel: cl.consultorNome,
        statusTratativa: status,
        trimestre: tri,
      });
    });
  });
  return out;
}

function gerarFeedbacks(): FeedbackRegistrado[] {
  const out: FeedbackRegistrado[] = [];
  const exemplos: { cat: CategoriaFeedback; texto: string }[] = [
    { cat: 'positivo', texto: 'Cliente elogiou clareza dos relatórios mensais.' },
    { cat: 'reclamacao', texto: 'Reclamação sobre atraso de 3 dias na última entrega.' },
    { cat: 'duvida', texto: 'Dúvida sobre cálculo do indicador de retorno.' },
    { cat: 'elogio', texto: 'Elogio público à consultora em reunião com diretoria.' },
    { cat: 'evolucao', texto: 'Percepção de evolução: equipe cliente já adota processos novos.' },
    { cat: 'positivo', texto: 'Print de WhatsApp positivo recebido após apresentação.' },
  ];
  clientes.forEach((cl, idx) => {
    const rand = seeded(idx * 23 + 11);
    const qtd = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < qtd; i++) {
      const ex = exemplos[Math.floor(rand() * exemplos.length)];
      const d = new Date(); d.setDate(d.getDate() - Math.floor(rand() * 90));
      out.push({
        id: `fb-${cl.id}-${i}`,
        clienteId: cl.id,
        clienteNome: cl.nomeFantasia,
        categoria: ex.cat,
        texto: ex.texto,
        arquivo: rand() < 0.4 ? `print-${cl.id}-${i}.png` : undefined,
        data: d.toISOString().slice(0, 10),
        responsavel: cl.consultorNome,
      });
    }
  });
  return out.sort((a, b) => b.data.localeCompare(a.data));
}

function gerarAtividades(): AtividadeRelacionamento[] {
  const out: AtividadeRelacionamento[] = [];
  const canais: CanalAtividade[] = ['ligacao', 'whatsapp', 'email', 'reuniao'];
  const observacoes = [
    'Confirmação de reunião e alinhamento de pauta.',
    'Envio de material complementar solicitado.',
    'Cliente sinalizou interesse em pacote ampliado.',
    'Suporte rápido sobre dúvida operacional.',
    'Follow-up de pendência levantada na última reunião.',
  ];
  const proximas = [
    'Agendar reunião de fechamento de fase',
    'Enviar proposta atualizada',
    'Revisar plano de ação',
    'Aguardar retorno do cliente',
  ];
  clientes.forEach((cl, idx) => {
    const rand = seeded(idx * 41 + 19);
    const qtd = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < qtd; i++) {
      const d = new Date(); d.setDate(d.getDate() - Math.floor(rand() * 45));
      out.push({
        id: `atv-${cl.id}-${i}`,
        clienteId: cl.id,
        clienteNome: cl.nomeFantasia,
        canal: canais[Math.floor(rand() * canais.length)],
        data: d.toISOString().slice(0, 10),
        responsavel: cl.consultorNome,
        observacao: observacoes[Math.floor(rand() * observacoes.length)],
        proximaAcao: rand() < 0.7 ? proximas[Math.floor(rand() * proximas.length)] : undefined,
      });
    }
  });
  return out.sort((a, b) => b.data.localeCompare(a.data));
}

export const npsRegistros: NpsRegistro[] = gerarNps();
export const feedbacksRelacionamento: FeedbackRegistrado[] = gerarFeedbacks();
export const atividadesRelacionamento: AtividadeRelacionamento[] = gerarAtividades();

export const getNpsCliente = (clienteId: string) =>
  npsRegistros.filter(n => n.clienteId === clienteId).sort((a, b) => a.data.localeCompare(b.data));

export const getFeedbacksCliente = (clienteId: string) =>
  feedbacksRelacionamento.filter(f => f.clienteId === clienteId);

export const getAtividadesCliente = (clienteId: string) =>
  atividadesRelacionamento.filter(a => a.clienteId === clienteId);

export interface AlertaRelacionamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: 'nps_nao_respondido' | 'nps_baixo' | 'feedback_negativo' | 'sem_contato';
  titulo: string;
  descricao: string;
  variant: 'danger' | 'warning';
}

export interface ConfigAlertasRelacionamento {
  diasSemContatoMax: number;
  notaNpsMin: number;
}

export const configAlertasPadrao: ConfigAlertasRelacionamento = {
  diasSemContatoMax: 21,
  notaNpsMin: 7,
};

export function gerarAlertasRelacionamento(cfg: ConfigAlertasRelacionamento = configAlertasPadrao): AlertaRelacionamento[] {
  const out: AlertaRelacionamento[] = [];
  clientes.forEach(cl => {
    const npsCl = getNpsCliente(cl.id);
    const ultimo = npsCl[npsCl.length - 1];
    if (ultimo && ultimo.statusTratativa === 'sem_resposta') {
      out.push({
        id: `al-nps-${cl.id}`, clienteId: cl.id, clienteNome: cl.nomeFantasia,
        tipo: 'nps_nao_respondido', titulo: `${cl.nomeFantasia} não respondeu NPS`,
        descricao: `Trimestre ${ultimo.trimestre} sem resposta`,
        variant: 'warning',
      });
    }
    if (ultimo && ultimo.statusTratativa !== 'sem_resposta' && ultimo.nota < cfg.notaNpsMin) {
      out.push({
        id: `al-nps-baixo-${cl.id}`, clienteId: cl.id, clienteNome: cl.nomeFantasia,
        tipo: 'nps_baixo', titulo: `NPS baixo: ${ultimo.nota}/10`,
        descricao: `Última nota abaixo de ${cfg.notaNpsMin} — tratativa: ${labelStatusTratativa[ultimo.statusTratativa]}`,
        variant: 'danger',
      });
    }
    const fbsNeg = getFeedbacksCliente(cl.id).filter(f => f.categoria === 'reclamacao');
    if (fbsNeg.length > 0) {
      out.push({
        id: `al-fb-${cl.id}`, clienteId: cl.id, clienteNome: cl.nomeFantasia,
        tipo: 'feedback_negativo', titulo: `${fbsNeg.length} reclamação(ões) registrada(s)`,
        descricao: fbsNeg[0].texto,
        variant: 'danger',
      });
    }
    const atvs = getAtividadesCliente(cl.id);
    const ultimaAtv = atvs[0];
    const dias = ultimaAtv
      ? Math.floor((Date.now() - new Date(ultimaAtv.data).getTime()) / 86400000)
      : 999;
    if (dias > cfg.diasSemContatoMax) {
      out.push({
        id: `al-contato-${cl.id}`, clienteId: cl.id, clienteNome: cl.nomeFantasia,
        tipo: 'sem_contato', titulo: `Sem contato há ${dias}d`,
        descricao: `Limite configurado: ${cfg.diasSemContatoMax} dias`,
        variant: 'warning',
      });
    }
  });
  return out;
}