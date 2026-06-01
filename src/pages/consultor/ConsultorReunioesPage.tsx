import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterConfig } from '@/components/FilterBar';
import { StatusTag } from '@/components/StatusTag';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { labelStatus } from '@/data/mockData';
import { useReunioes } from '@/hooks/useReunioes';
import { useConsultantMeetingIndicators } from '@/hooks/useConsultantMeetingIndicators';
import { useClientes } from '@/hooks/useClientes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Loader2, Plus, FileText, CalendarClock, Play } from 'lucide-react';
import { ModalDetalhesReuniao } from '@/components/modals/ModalDetalhesReuniao';
import { ModalReuniao } from '@/components/modals/ModalReuniao';
import { ModalRegistrarReuniao } from '@/components/modals/ModalRegistrarReuniao';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import { cn } from '@/lib/utils';
import type { Reuniao } from '@/types';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const DIAS_POR_PAGINA = 10;

const MESES_LABEL: Record<number, string> = {
  0: 'Janeiro', 1: 'Fevereiro', 2: 'Março', 3: 'Abril',
  4: 'Maio', 5: 'Junho', 6: 'Julho', 7: 'Agosto',
  8: 'Setembro', 9: 'Outubro', 10: 'Novembro', 11: 'Dezembro',
};

export default function ConsultorReunioesPage() {
  const { user } = useAuth();
  const consultorId = user?.consultorId;
  const { reunioes: allReunioes, isLoading: loadingReunioes } = useReunioes();
  const { clientes, isLoading: loadingClientes } = useClientes();
  const { can, isLoading: loadingPermissions } = useMyPermissions();
  
  const now = new Date();
  const [mesAtual, setMesAtual] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const { 
    realizadas: statsRealizadas, 
    previstas: statsPrevistas, 
    saldo: statsSaldo, 
    aderencia: statsAderencia, 
    hasGoal, 
    isLoading: loadingStats 
  } = useConsultantMeetingIndicators(consultorId, mesAtual.month, mesAtual.year);
  
  const isLoading = loadingReunioes || loadingClientes || loadingStats;
  const reunioes = allReunioes || [];

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedReuniao, setSelectedReuniao] = useState<Reuniao | null>(null);
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);

  const [paginaDia, setPaginaDia] = useState(0);

  const clienteOptions = useMemo(() => {
    const nomes = [...new Set(reunioes.map(r => r.clienteNome))].sort();
    return nomes.map(n => ({ label: n, value: n }));
  }, [reunioes]);

  const convidadoOptions = useMemo(() => {
    const todos = [...new Set(reunioes.flatMap(r => r.participantes))].sort();
    return todos.map(p => ({ label: p, value: p }));
  }, [reunioes]);

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [{ label: 'Agendada', value: 'agendada' }, { label: 'Realizada', value: 'realizada' }, { label: 'Cancelada', value: 'cancelada' }, { label: 'Remarcada', value: 'remarcada' }] },
    { key: 'cliente', label: 'Cliente', options: clienteOptions },
    { key: 'convidado', label: 'Convidado', options: convidadoOptions },
  ];

  const reunioesMes = useMemo(() => {
    return reunioes.filter(r => {
      const [y, m] = r.meetingDate.split('-').map(Number);
      return y === mesAtual.year && m === mesAtual.month + 1;
    });
  }, [reunioes, mesAtual]);

  const aderenciaStats = useMemo(() => ({ 
    realizadas: statsRealizadas, 
    previstas: statsPrevistas, 
    aderencia: statsAderencia, 
    saldo: statsSaldo, 
    hasGoal 
  }), [statsRealizadas, statsPrevistas, statsAderencia, statsSaldo, hasGoal]);

  const aderenciaTone = aderenciaStats.aderencia >= 80 ? 'success' : aderenciaStats.aderencia >= 60 ? 'warning' : 'danger';
  const aderenciaColor = aderenciaTone === 'success' ? 'bg-seven-success' : aderenciaTone === 'warning' ? 'bg-seven-warning' : 'bg-seven-danger';
  const aderenciaText = aderenciaTone === 'success' ? 'text-seven-success' : aderenciaTone === 'warning' ? 'text-seven-warning' : 'text-seven-danger';

  const reunioesFiltradas = useMemo(() => {
    let d = [...reunioesMes];
    const q = normalize(search);
    if (q) d = d.filter(r => normalize(r.clienteNome).includes(q) || normalize(r.title).includes(q));
    if (filters.status && filters.status !== 'todos') d = d.filter(r => r.status === filters.status);
    if (filters.cliente && filters.cliente !== 'todos') d = d.filter(r => r.clienteNome === filters.cliente);
    if (filters.convidado && filters.convidado !== 'todos') d = d.filter(r => r.participantes.includes(filters.convidado));
    return d.sort((a, b) => `${a.meetingDate}${a.startTime}`.localeCompare(`${b.meetingDate}${b.startTime}`));
  }, [search, filters, reunioesMes]);

  const grouped = useMemo(() => {
    const g: Record<string, Reuniao[]> = {};
    reunioesFiltradas.forEach(r => {
      if (!g[r.meetingDate]) g[r.meetingDate] = [];
      g[r.meetingDate].push(r);
    });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [reunioesFiltradas]);

  const totalPaginas = Math.ceil(grouped.length / DIAS_POR_PAGINA);
  const diasPaginados = grouped.slice(paginaDia * DIAS_POR_PAGINA, (paginaDia + 1) * DIAS_POR_PAGINA);

  const navegarMes = (dir: -1 | 1) => {
    setMesAtual(prev => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
    setPaginaDia(0);
  };

  const formatDiaLabel = (dataStr: string) => {
    const [y, m, d] = dataStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return `${diasSemana[date.getDay()]}, ${d} de ${MESES_LABEL[m - 1]}`;
  };

  const hasActiveFilter = !!search || Object.values(filters).some(v => v && v !== 'todos');
  const clearFilters = () => { setSearch(''); setFilters({}); };

  if (isLoading || loadingPermissions) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-24" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!can('reunioes')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader titulo="Minhas Reuniões" subtitulo="Agenda e histórico de reuniões" />

      {/* Faixa compacta de aderência — devolve a primeira dobra à agenda */}
      <div className="rounded-md border border-border/70 bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navegarMes(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-editorial text-xl text-foreground">
              {MESES_LABEL[mesAtual.month]} {mesAtual.year}
            </h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navegarMes(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="ui-overline">Realizadas</span>
              <span className="text-sm font-semibold tabular-nums">{aderenciaStats.realizadas}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="ui-overline">Previstas</span>
              <span className="text-sm font-semibold tabular-nums">
                {aderenciaStats.hasGoal ? aderenciaStats.previstas : '—'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="ui-overline">Saldo</span>
              <span className={cn('text-sm font-semibold tabular-nums', aderenciaStats.hasGoal && aderenciaStats.saldo < 0 && 'text-seven-success')}>
                {aderenciaStats.hasGoal ? (aderenciaStats.saldo < 0 ? `+${Math.abs(aderenciaStats.saldo)}` : aderenciaStats.saldo) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="ui-overline">Aderência</span>
              <span className={cn('text-base font-semibold tabular-nums', aderenciaText)}>
                {aderenciaStats.hasGoal ? `${aderenciaStats.aderencia}%` : '—'}
              </span>
            </div>
          </div>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full transition-all', aderenciaColor)} style={{ width: `${Math.min(100, aderenciaStats.aderencia)}%` }} />
        </div>
      </div>

      {/* Summary + filtros */}
      <div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span>{reunioesFiltradas.length} reuniões</span>
          <span>·</span>
          <span>{grouped.length} dias com reuniões</span>
        </div>
        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar reunião..." filters={filterConfigs} filterValues={filters} onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))} />
      </div>

      {/* Day-grouped list */}
      <div className="space-y-10">
        {diasPaginados.length === 0 && (
          <EmptyState
            titulo="Nenhuma reunião encontrada"
            descricao={hasActiveFilter ? 'Tente ajustar ou limpar os filtros ativos.' : 'Sem reuniões neste mês.'}
          />
        )}
        {hasActiveFilter && diasPaginados.length === 0 && (
          <div className="flex justify-center -mt-6">
            <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>
          </div>
        )}
        {diasPaginados.map(([date, items]) => (
          <div key={date}>
            <SectionHeader
              overline={`${items.length} ${items.length === 1 ? 'reunião' : 'reuniões'}`}
              titulo={formatDiaLabel(date)}
              className="pb-2 mb-3"
            />
            <div className="rounded-md border overflow-hidden divide-y">
              {items.map(r => (
                <div 
                  key={r.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors p-4 flex items-center justify-between gap-3 group"
                  onClick={() => setSelectedReuniao(r)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-base font-mono font-semibold text-primary tabular-nums shrink-0">{r.startTime}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.clienteNome} — {r.tipo}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'agendada' && (
                      <div className="hidden group-hover:flex items-center gap-1 mr-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] gap-1 px-2"
                          onClick={(e) => { e.stopPropagation(); setSelectedReuniao(r); setRegistrarOpen(true); }}
                        >
                          <FileText className="h-3 w-3" /> Registrar Ata
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] gap-1 px-2"
                          onClick={(e) => { e.stopPropagation(); setSelectedReuniao(r); setModalAgendamentoOpen(true); }}
                        >
                          <CalendarClock className="h-3 w-3" /> Remarcar
                        </Button>
                        {(r.teamsJoinUrl || r.meetingUrl) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[10px] gap-1 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => { e.stopPropagation(); window.open(r.teamsJoinUrl || r.meetingUrl, '_blank'); }}
                          >
                            <Play className="h-3 w-3" /> Entrar
                          </Button>
                        )}
                      </div>
                    )}

                    <StatusTag label={labelStatus[r.status]} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-4">
          <Button variant="outline" size="sm" disabled={paginaDia === 0} onClick={() => setPaginaDia(p => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Dias anteriores
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {paginaDia * DIAS_POR_PAGINA + 1}–{Math.min((paginaDia + 1) * DIAS_POR_PAGINA, grouped.length)} de {grouped.length} dias
          </span>
          <Button variant="outline" size="sm" disabled={paginaDia >= totalPaginas - 1} onClick={() => setPaginaDia(p => p + 1)}>
            Próximos dias <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {selectedReuniao && (
        <ModalDetalhesReuniao open={!!selectedReuniao && !registrarOpen} onClose={() => setSelectedReuniao(null)} reuniaoId={selectedReuniao.id} onRefresh={() => {}} />
      )}

      {selectedReuniao && (
        <ModalRegistrarReuniao 
          open={registrarOpen} 
          onClose={() => { setRegistrarOpen(false); setSelectedReuniao(null); }} 
          clienteId={selectedReuniao.clienteId} 
          clienteNome={selectedReuniao.clienteNome} 
        />
      )}

      <ModalReuniao 
        open={modalAgendamentoOpen} 
        onClose={() => { setModalAgendamentoOpen(false); setSelectedReuniao(null); }} 
        reuniao={selectedReuniao} 
      />
    </div>
  );
}
