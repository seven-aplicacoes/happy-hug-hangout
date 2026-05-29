/**
 * Mock determinístico do "Seven Gestão" (sistema das clínicas).
 * Os dados são SOMENTE LEITURA dentro do SE7EN Gestão.
 * Tudo é derivado do ID para que renderize estável entre sessões.
 */

export type SevenModuloId =
  | 'precificacao'
  | 'planejamento'
  | 'orcamentacao'
  | 'faturamento'
  | 'financeiro'
  | 'empresa';

export interface SevenModulo {
  id: SevenModuloId;
  nome: string;
  ativo: boolean;
  ultimoUsoDias: number | null; // null = sem uso registrado
}

export type SeveridadeAlerta = 'critico' | 'atencao' | 'oportunidade';

export interface AlertaOperacional {
  id: string;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  modulo: SevenModuloId;
}

export interface FaturamentoMes {
  mesLabel: string; // "out", "nov"...
  valor: number;
  vendas: number;
}

export interface SevenIntegracao {
  /** Clínica integrada com Seven Gestão? */
  integrada: boolean;
  modulos: SevenModulo[];
  ultimoFaturamento: string | null; // ISO
  semPoliticaComercial: boolean;
  faturamento6m: FaturamentoMes[];
  ticketMedio: number;
  vendasMes: number;
  conversaoOrcamentos: number; // %
  orcamentosAbertos: number;
  valorAprovadoAguardando: number;
  pipelineOrcamentos: { etapa: string; qtd: number }[];
  alertas: AlertaOperacional[];
  dfcAtualizadoDias: number;
}

const MODULOS_NOMES: Record<SevenModuloId, string> = {
  precificacao: 'Precificação',
  planejamento: 'Planejamento',
  orcamentacao: 'Orçamentação',
  faturamento: 'Faturamento',
  financeiro: 'Financeiro',
  empresa: 'Empresa',
};

export const labelModulo = MODULOS_NOMES;

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** PRNG determinístico simples, baseado em string */
function seedFromId(id: string): () => number {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Verifica se a clínica está integrada (~75% dos clientes). */
function clientIsIntegrated(clienteId: string): boolean {
  const r = seedFromId(clienteId + ':integration')();
  return r > 0.25;
}

export function getSevenData(clienteId: string, faturamentoMensalBase = 100000): SevenIntegracao {
  const integrada = clientIsIntegrated(clienteId);
  const rnd = seedFromId(clienteId + ':seven');

  if (!integrada) {
    return {
      integrada: false,
      modulos: (Object.keys(MODULOS_NOMES) as SevenModuloId[]).map(id => ({
        id, nome: MODULOS_NOMES[id], ativo: false, ultimoUsoDias: null,
      })),
      ultimoFaturamento: null,
      semPoliticaComercial: true,
      faturamento6m: [],
      ticketMedio: 0,
      vendasMes: 0,
      conversaoOrcamentos: 0,
      orcamentosAbertos: 0,
      valorAprovadoAguardando: 0,
      pipelineOrcamentos: [],
      alertas: [],
      dfcAtualizadoDias: 0,
    };
  }

  // Módulos: precificação e empresa quase sempre ativos; outros variam
  const modulosBase: { id: SevenModuloId; nome: string; ativo: boolean; ultimoUsoDias: number }[] = [
    { id: 'empresa', nome: 'Empresa', ativo: true, ultimoUsoDias: Math.floor(rnd() * 5) },
    { id: 'precificacao', nome: 'Precificação', ativo: rnd() > 0.15, ultimoUsoDias: Math.floor(rnd() * 30) },
    { id: 'orcamentacao', nome: 'Orçamentação', ativo: rnd() > 0.25, ultimoUsoDias: Math.floor(rnd() * 20) },
    { id: 'faturamento', nome: 'Faturamento', ativo: rnd() > 0.2, ultimoUsoDias: Math.floor(rnd() * 14) },
    { id: 'financeiro', nome: 'Financeiro', ativo: rnd() > 0.35, ultimoUsoDias: Math.floor(rnd() * 21) },
    { id: 'planejamento', nome: 'Planejamento', ativo: rnd() > 0.45, ultimoUsoDias: Math.floor(rnd() * 60) },
  ];
  const modulos: SevenModulo[] = modulosBase.map(m => ({ ...m, ultimoUsoDias: m.ativo ? m.ultimoUsoDias : null }));

  const semPoliticaComercial = rnd() > 0.7;
  const dfcAtualizadoDias = Math.floor(rnd() * 30);

  // Faturamento últimos 6 meses (centrados no mês atual)
  const now = new Date();
  const faturamento6m: FaturamentoMes[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const variacao = 0.85 + rnd() * 0.4;
    const valor = Math.round(faturamentoMensalBase * variacao);
    faturamento6m.push({
      mesLabel: MESES[d.getMonth()],
      valor,
      vendas: 30 + Math.floor(rnd() * 80),
    });
  }
  const vendasMes = faturamento6m[5].vendas;
  const ticketMedio = Math.round(faturamento6m[5].valor / Math.max(1, vendasMes));

  const pipelineOrcamentos = [
    { etapa: 'Em elaboração', qtd: Math.floor(rnd() * 8) + 1 },
    { etapa: 'Enviados', qtd: Math.floor(rnd() * 12) + 2 },
    { etapa: 'Em negociação', qtd: Math.floor(rnd() * 6) + 1 },
    { etapa: 'Aprovados', qtd: Math.floor(rnd() * 10) + 3 },
  ];
  const orcamentosAbertos = pipelineOrcamentos.slice(0, 3).reduce((s, p) => s + p.qtd, 0);
  const conversaoOrcamentos = Math.round(20 + rnd() * 50);
  const valorAprovadoAguardando = pipelineOrcamentos[3].qtd * (8000 + Math.floor(rnd() * 12000));

  // Alertas operacionais baseados no estado
  const alertas: AlertaOperacional[] = [];
  if (semPoliticaComercial) {
    alertas.push({
      id: `${clienteId}-pol`, severidade: 'critico',
      titulo: 'Nenhuma política comercial configurada',
      descricao: 'Orçamentação bloqueada até a configuração de pelo menos uma política.',
      modulo: 'orcamentacao',
    });
  }
  if (dfcAtualizadoDias > 14) {
    alertas.push({
      id: `${clienteId}-dfc`, severidade: 'atencao',
      titulo: 'DFC sem atualização',
      descricao: `Integração Nibo pendente há ${dfcAtualizadoDias} dias.`,
      modulo: 'financeiro',
    });
  }
  if (!modulos.find(m => m.id === 'planejamento')?.ativo) {
    alertas.push({
      id: `${clienteId}-plan`, severidade: 'oportunidade',
      titulo: 'Nenhuma simulação de planejamento criada',
      descricao: 'Cliente ainda não utilizou o módulo de Planejamento.',
      modulo: 'planejamento',
    });
  }
  if (rnd() > 0.6) {
    alertas.push({
      id: `${clienteId}-prec`, severidade: 'atencao',
      titulo: 'Serviços sem precificação cadastrada',
      descricao: 'Existem serviços vendidos sem preço base configurado.',
      modulo: 'precificacao',
    });
  }

  // último faturamento
  const dataFat = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - Math.floor(rnd() * 12)));

  return {
    integrada: true,
    modulos,
    ultimoFaturamento: dataFat.toISOString().slice(0, 10),
    semPoliticaComercial,
    faturamento6m,
    ticketMedio,
    vendasMes,
    conversaoOrcamentos,
    orcamentosAbertos,
    valorAprovadoAguardando,
    pipelineOrcamentos,
    alertas,
    dfcAtualizadoDias,
  };
}

// ─── Repasses por consultor ────────────────────────────────
export interface RepasseMes {
  mesLabel: string;
  valor: number;
}

export interface RepasseConsultor {
  mesAtual: number;
  mesAnterior: number;
  variacaoPct: number;
  acumuladoAno: number;
  serie6m: RepasseMes[];
  consultoriasMes: number;
  horasMes: number;
  noShowsMes: number;
  cancelamentosMes: number;
  taxaExecucao: number;
}

export function getRepassesConsultor(consultorId: string): RepasseConsultor {
  const rnd = seedFromId(consultorId + ':rep');
  const now = new Date();
  const base = 12000 + Math.floor(rnd() * 18000);
  const serie6m: RepasseMes[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    serie6m.push({
      mesLabel: MESES[d.getMonth()],
      valor: Math.round(base * (0.78 + rnd() * 0.5)),
    });
  }
  const mesAtual = serie6m[5].valor;
  const mesAnterior = serie6m[4].valor;
  const variacaoPct = Math.round(((mesAtual - mesAnterior) / mesAnterior) * 100);
  const acumuladoAno = serie6m.reduce((s, m) => s + m.valor, 0) + Math.round(base * (now.getMonth() - 5) * 0.9);

  const consultoriasMes = 18 + Math.floor(rnd() * 22);
  const horasMes = consultoriasMes * (1 + Math.floor(rnd() * 2));
  const noShowsMes = Math.floor(rnd() * 4);
  const cancelamentosMes = Math.floor(rnd() * 5);
  const realizadas = consultoriasMes - noShowsMes - cancelamentosMes;
  const taxaExecucao = Math.round((realizadas / Math.max(1, consultoriasMes)) * 100);

  return {
    mesAtual, mesAnterior, variacaoPct, acumuladoAno, serie6m,
    consultoriasMes, horasMes, noShowsMes, cancelamentosMes, taxaExecucao,
  };
}

export const labelSeveridade: Record<SeveridadeAlerta, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  oportunidade: 'Oportunidade',
};

export const variantSeveridade: Record<SeveridadeAlerta, 'danger' | 'warning' | 'info'> = {
  critico: 'danger',
  atencao: 'warning',
  oportunidade: 'info',
};
