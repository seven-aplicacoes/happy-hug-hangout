import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  clientes, contratos, consultores, calcularEngajamento, labelFase, labelStatus,
  variantEngajamento,
} from '@/data/mockData';
import { getProdutoAtualCliente } from '@/data/contratoExtras';
import type { FaseMetodologica } from '@/types';
import { ChevronRight, GitBranch, RefreshCw, DollarSign, Calendar } from 'lucide-react';

const FASES: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];

export default function AdminPipelinePage() {
  const navigate = useNavigate();
  const [consultorFiltro, setConsultorFiltro] = useState<string>('todos');

  const ativos = useMemo(() => {
    return clientes.filter(cl =>
      !['encerrado', 'churn', 'cancelado'].includes(cl.status) &&
      (consultorFiltro === 'todos' || cl.consultorId === consultorFiltro),
    );
  }, [consultorFiltro]);

  const porFase = useMemo(() => {
    const m: Record<FaseMetodologica, typeof clientes> = {
      diagnostico: [], planejamento: [], estruturacao: [], monitoramento: [], encerramento: [],
    };
    ativos.forEach(cl => { m[cl.faseMetodologica].push(cl); });
    return m;
  }, [ativos]);

  // Funil de renovação
  const hoje = new Date();
  const renovacoes = useMemo(() => {
    return contratos
      .filter(c => ['ativo', 'em_renovacao', 'renovado'].includes(c.status))
      .filter(c => consultorFiltro === 'todos' || c.consultorId === consultorFiltro)
      .map(c => {
        const dias = Math.floor((new Date(c.dataFim).getTime() - hoje.getTime()) / 86400000);
        let bucket: 'critica' | 'iminente' | 'planejada' | 'futura' | 'renovado';
        if (c.status === 'renovado') bucket = 'renovado';
        else if (dias <= 30) bucket = 'critica';
        else if (dias <= 60) bucket = 'iminente';
        else if (dias <= 120) bucket = 'planejada';
        else bucket = 'futura';
        return { ...c, dias, bucket };
      });
  }, [consultorFiltro]);

  const buckets = [
    { id: 'critica' as const, label: 'Crítica · ≤30d', variant: 'danger' as const },
    { id: 'iminente' as const, label: 'Iminente · 31-60d', variant: 'warning' as const },
    { id: 'planejada' as const, label: 'Planejada · 61-120d', variant: 'info' as const },
    { id: 'futura' as const, label: 'Futura · >120d', variant: 'neutral' as const },
    { id: 'renovado' as const, label: 'Renovado', variant: 'success' as const },
  ];

  const valorTotal = ativos.reduce((s, cl) => {
    const ct = contratos.find(c => c.clienteId === cl.id && !['encerrado', 'churn', 'cancelado'].includes(c.status));
    return s + (ct?.valor || 0);
  }, 0);
  const valorRenovacaoCritica = renovacoes.filter(r => r.bucket === 'critica').reduce((s, r) => s + r.valor, 0);

  return (
    <div>
      <PageHeader
        titulo="Pipeline"
        subtitulo="Movimentação dos clientes pelas fases metodológicas e funil de renovações"
      >
        <Select value={consultorFiltro} onValueChange={setConsultorFiltro}>
          <SelectTrigger className="w-[200px] h-9 text-xs"><SelectValue placeholder="Usuário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos usuários</SelectItem>
            {consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard titulo="Clientes ativos" valor={ativos.length} icon={GitBranch} />
        <StatCard titulo="Renovações em ≤30d" valor={renovacoes.filter(r => r.bucket === 'critica').length} icon={RefreshCw} variant="danger" />
        <StatCard titulo="Valor em risco" valor={`R$ ${(valorRenovacaoCritica / 1000).toFixed(0)}k`} icon={DollarSign} variant="warning" />
        <StatCard titulo="Carteira sob gestão" valor={`R$ ${(valorTotal / 1000).toFixed(0)}k`} icon={Calendar} />
      </div>

      <SectionHeader titulo="Fases metodológicas" descricao="Distribuição da carteira ao longo do método Seven" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {FASES.map((fase, idx) => {
          const items = porFase[fase];
          return (
            <Card key={fase} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Fase {idx + 1}</span>
                  <span className="text-xs font-medium tabular-nums text-foreground">{items.length}</span>
                </div>
                <CardTitle className="text-sm font-medium">{labelFase[fase]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 flex-1">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground py-3 text-center">Sem clientes</p>
                )}
                {items.slice(0, 6).map(cl => {
                  const eng = calcularEngajamento(cl.id);
                  const produto = getProdutoAtualCliente(cl.id);
                  return (
                    <button
                      key={cl.id}
                      onClick={() => navigate(`/admin/cliente/${cl.id}`)}
                      className="w-full text-left bg-secondary/30 hover:bg-secondary border border-border/50 rounded-md p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-foreground truncate flex-1">{cl.nomeFantasia}</p>
                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`h-1.5 w-1.5 rounded-full bg-seven-${variantEngajamento[eng] === 'success' ? 'success' : variantEngajamento[eng] === 'warning' ? 'warning' : 'danger'}`} />
                        <span className="text-[10px] text-muted-foreground truncate">{produto || '—'}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{cl.consultorNome}</p>
                    </button>
                  );
                })}
                {items.length > 6 && (
                  <p className="text-[10px] text-center text-muted-foreground pt-1">+ {items.length - 6} outros</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SectionHeader titulo="Funil de renovação" descricao="Contratos vigentes agrupados por proximidade do vencimento" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {buckets.map(b => {
          const items = renovacoes.filter(r => r.bucket === b.id);
          const total = items.reduce((s, r) => s + r.valor, 0);
          return (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <StatusTag label={b.label} variant={b.variant} />
                <CardTitle className="text-sm font-medium pt-1">{items.length} contratos</CardTitle>
                <p className="text-[11px] text-muted-foreground tabular-nums">R$ {(total / 1000).toFixed(0)}k</p>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                {items.slice(0, 5).map(r => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/admin/cliente/${r.clienteId}`)}
                    className="w-full text-left text-xs hover:bg-secondary rounded px-2 py-1.5 transition-colors"
                  >
                    <p className="font-medium text-foreground truncate">{r.clienteNome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.bucket === 'renovado' ? 'Renovado' : r.dias > 0 ? `${r.dias}d` : 'Vencido'} · R$ {(r.valor / 1000).toFixed(0)}k
                    </p>
                  </button>
                ))}
                {items.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-2">—</p>}
                {items.length > 5 && <p className="text-[10px] text-muted-foreground text-center">+ {items.length - 5}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
