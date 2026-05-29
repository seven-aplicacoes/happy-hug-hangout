// === Documentos — Bloco 6 (mock determinístico) ===
import { clientes, reunioes } from './mockData';

export type StatusDocumento = 'aprovado' | 'pendente' | 'nao_conforme';
export type TipoDocumento = 'ata' | 'entregavel' | 'relatorio' | 'contrato' | 'materiais_apoio' | 'entregavel_metodologico';

export interface FeedbackGestor {
  id: string;
  data: string;
  autor: string;
  texto: string;
  statusAplicado: StatusDocumento;
}

export interface Documento {
  id: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  tipo: TipoDocumento;
  fase?: string;
  autor: string;
  data: string;
  status: StatusDocumento;
  arquivo: string;
  feedbacks: FeedbackGestor[];
}

export const labelStatusDoc: Record<StatusDocumento, string> = {
  aprovado: 'Aprovado',
  pendente: 'Pendente',
  nao_conforme: 'Não conforme',
};

export const variantStatusDoc: Record<StatusDocumento, 'success' | 'warning' | 'danger'> = {
  aprovado: 'success',
  pendente: 'warning',
  nao_conforme: 'danger',
};

export const labelTipoDoc: Record<TipoDocumento, string> = {
  ata: 'Ata de reunião',
  entregavel: 'Entregável metodológico',
  relatorio: 'Relatório',
  contrato: 'Documento contratual',
  materiais_apoio: 'Materiais de Apoio',
  entregavel_metodologico: 'Entregável Cliente',
};

const seeded = (s: number) => { let x = s; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; };

function gerarDocumentos(): Documento[] {
  const out: Documento[] = [];
  const tipos: TipoDocumento[] = ['ata', 'entregavel', 'relatorio'];
  const titulosEntregavel = ['Mapa de processos', 'Plano estratégico', 'Diagnóstico inicial', 'Roadmap trimestral', 'Análise SWOT', 'Plano de ação'];
  const fases = ['Diagnóstico', 'Planejamento', 'Estruturação', 'Monitoramento'];
  const statusOpcoes: StatusDocumento[] = ['aprovado', 'aprovado', 'aprovado', 'pendente', 'pendente', 'nao_conforme'];
  const feedbacksPossiveis = [
    'Documento bem estruturado, dados consistentes. Pronto para envio ao cliente.',
    'Revisar seção de indicadores — números divergem da última ata.',
    'Falta assinatura do responsável e data de validade do documento.',
    'Excelente síntese, manter padrão para próximas entregas.',
    'Cliente solicitou ajuste no escopo da fase 2 antes da aprovação final.',
  ];

  clientes.forEach((cl, idx) => {
    const rand = seeded(idx * 31 + 7);
    // Atas — derivadas das reuniões realizadas
    const atasCl = reunioes
      .filter(r => r.clienteId === cl.id && r.status === 'realizada')
      .slice(0, 4);
    atasCl.forEach((r, i) => {
      const status = statusOpcoes[Math.floor(rand() * statusOpcoes.length)];
      out.push({
        id: `doc-ata-${r.id}`,
        clienteId: cl.id,
        clienteNome: cl.nomeFantasia,
        titulo: `Ata · ${r.tipo} (${r.meetingDate})`,
        tipo: 'ata',
        fase: fases[Math.floor(rand() * fases.length)],
        autor: r.consultorNome,
        data: r.meetingDate,
        status,
        arquivo: `ata-${r.id}.pdf`,
        feedbacks: status !== 'aprovado' ? [{
          id: `fb-${r.id}`,
          data: r.meetingDate,
          autor: 'Gestor Seven',
          texto: feedbacksPossiveis[Math.floor(rand() * feedbacksPossiveis.length)],
          statusAplicado: status,
        }] : [],
      });
    });

    // Entregáveis
    const qtdEnt = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < qtdEnt; i++) {
      const status = statusOpcoes[Math.floor(rand() * statusOpcoes.length)];
      const titulo = titulosEntregavel[Math.floor(rand() * titulosEntregavel.length)];
      const dataDoc = new Date(); dataDoc.setDate(dataDoc.getDate() - Math.floor(rand() * 60));
      out.push({
        id: `doc-ent-${cl.id}-${i}`,
        clienteId: cl.id,
        clienteNome: cl.nomeFantasia,
        titulo: `${titulo} · ${cl.nomeFantasia}`,
        tipo: 'entregavel',
        fase: fases[Math.floor(rand() * fases.length)],
        autor: cl.consultorNome,
        data: dataDoc.toISOString().slice(0, 10),
        status,
        arquivo: `${titulo.toLowerCase().replace(/\s/g, '-')}-${cl.id}.pdf`,
        feedbacks: status !== 'aprovado' ? [{
          id: `fb-ent-${cl.id}-${i}`,
          data: dataDoc.toISOString().slice(0, 10),
          autor: 'Gestor Seven',
          texto: feedbacksPossiveis[Math.floor(rand() * feedbacksPossiveis.length)],
          statusAplicado: status,
        }] : [],
      });
    }
  });
  return out.sort((a, b) => b.data.localeCompare(a.data));
}

export const documentos: Documento[] = gerarDocumentos();

export const getDocumentosCliente = (clienteId: string) =>
  documentos.filter(d => d.clienteId === clienteId);

/** Texto curto que orienta a ação do consultor sobre uma tarefa */
export function contextoEstrategicoTarefa(clienteId: string): string | null {
  const cl = clientes.find(c => c.id === clienteId);
  if (!cl) return null;
  const reunioesCl = reunioes
    .filter(r => r.clienteId === clienteId && r.status === 'realizada')
    .sort((a, b) => b.data.localeCompare(a.data));
  const dias = reunioesCl[0]
    ? Math.floor((Date.now() - new Date(reunioesCl[0].data).getTime()) / 86400000)
    : null;

  if (cl.status === 'bloqueado') return `Cliente bloqueado · ${dias ?? '?'}d sem reunião`;
  if (cl.status === 'suspenso') return `Cliente suspenso · revisar contrato antes de avançar`;
  if (cl.status === 'em_renovacao') return `Em renovação · ${dias ?? '?'}d s/ reunião · alinhar antes do vencimento`;
  if (dias !== null && dias > 20) return `Risco alto · sem reunião há ${dias} dias`;
  if (dias !== null && dias > 10) return `Atenção · ${dias} dias sem reunião`;
  if (cl.potencialUpsell) return `Potencial upsell · aproveitar momento`;
  return null;
}