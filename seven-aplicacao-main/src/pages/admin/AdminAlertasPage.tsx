import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { FilterBar, FilterConfig } from '@/components/FilterBar';
import { consultores } from '@/data/mockData';
import { useClientAlerts } from '@/hooks/useClientAlerts';
import { useClientes } from '@/hooks/useClientes';
import {
  labelModulo,
  labelSeveridade,
  variantSeveridade,
  type SeveridadeAlerta,
} from '@/data/sevenGestaoMock';
import { AlertTriangle, Activity, TrendingUp, ShieldAlert, ChevronRight } from 'lucide-react';

interface AlertaRow {
  id: string;
  clienteId: string;
  clienteNome: string;
  consultorId: string;
  consultorNome: string;
  titulo: string;
  descricao: string;
  severidade: SeveridadeAlerta;
  modulo: string;
}

const severidadeOrder: Record<SeveridadeAlerta, number> = { critico: 0, atencao: 1, oportunidade: 2 };

export default function AdminAlertasPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const sevFilter = (params.get('severidade') || 'todos') as 'todos' | SeveridadeAlerta;
  const consultorFilter = params.get('consultor') || 'todos';

  const { alerts, isLoading: loadingAlerts } = useClientAlerts();
  const { clientes, isLoading: loadingClientes } = useClientes();

  const todos: AlertaRow[] = useMemo(() => {
    if (!alerts || !clientes) return [];
    
    return alerts.map(a => {
      const cliente = clientes.find(c => c.id === a.client_id);
      return {
        id: a.id,
        clienteId: a.client_id,
        clienteNome: cliente?.nomeFantasia || 'Cliente desconhecido',
        consultorId: a.consultant_id || cliente?.consultorId || '',
        consultorNome: cliente?.consultorNome || 'Não atribuído',
        titulo: a.type, // Map type to title or keep as is
        descricao: a.reason,
        severidade: (a.severity === 'alta' ? 'critico' : a.severity === 'media' ? 'atencao' : 'oportunidade') as SeveridadeAlerta,
        modulo: a.type
      };
    }).sort((a, b) => severidadeOrder[a.severidade] - severidadeOrder[b.severidade]);
  }, [alerts, clientes]);

  const counts = useMemo(() => ({
    critico: todos.filter(a => a.severidade === 'critico').length,
    atencao: todos.filter(a => a.severidade === 'atencao').length,
    oportunidade: todos.filter(a => a.severidade === 'oportunidade').length,
  }), [todos]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todos.filter(a => {
      if (sevFilter !== 'todos' && a.severidade !== sevFilter) return false;
      if (consultorFilter !== 'todos' && a.consultorId !== consultorFilter) return false;
      if (q && !`${a.titulo} ${a.descricao} ${a.clienteNome}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [todos, sevFilter, consultorFilter, search]);

  if (loadingAlerts || loadingClientes) {
    return <div className="p-8">Carregando alertas...</div>;
  }

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === 'todos') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  const toneBg: Record<SeveridadeAlerta, string> = {
    critico: 'border-l-2 border-seven-danger/60 bg-seven-danger/5',
    atencao: 'border-l-2 border-seven-warning/60 bg-seven-warning/5',
    oportunidade: 'border-l-2 border-primary/60 bg-primary/5',
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'severidade',
      label: 'Severidade',
      options: [
        { label: 'Crítico', value: 'critico' },
        { label: 'Atenção', value: 'atencao' },
        { label: 'Oportunidade', value: 'oportunidade' },
      ],
    },
    {
      key: 'consultor',
      label: 'Usuário',
      options: consultores.map(c => ({ label: c.nome, value: c.id })),
    },
  ];

  return (
    <div className="space-y-12">
      <PageHeader titulo="Painel de Alertas" subtitulo="Sinais operacionais agregados do Seven Gestão" />

      <section>
        <SectionHeader overline="Visão consolidada" titulo="Alertas por severidade" descricao="Clique para filtrar a lista" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            titulo="Crítico"
            valor={counts.critico}
            subtitulo="Bloqueios e indisponibilidades"
            icon={ShieldAlert}
            variant="danger"
            onClick={() => setParam('severidade', sevFilter === 'critico' ? 'todos' : 'critico')}
          />
          <StatCard
            titulo="Atenção"
            valor={counts.atencao}
            subtitulo="Degradação operacional"
            icon={AlertTriangle}
            variant="warning"
            onClick={() => setParam('severidade', sevFilter === 'atencao' ? 'todos' : 'atencao')}
          />
          <StatCard
            titulo="Oportunidade"
            valor={counts.oportunidade}
            subtitulo="Potencial de upsell e adoção"
            icon={TrendingUp}
            variant="info"
            onClick={() => setParam('severidade', sevFilter === 'oportunidade' ? 'todos' : 'oportunidade')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader overline="Lista" titulo="Alertas em aberto" descricao={`${filtrados.length} alerta${filtrados.length === 1 ? '' : 's'}`} />
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por cliente, alerta ou descrição..."
          filters={filterConfigs}
          filterValues={{ severidade: sevFilter, consultor: consultorFilter }}
          onFilterChange={setParam}
          onClear={() => { setSearch(''); setParams({}, { replace: true }); }}
        />

        <Card>
          <CardContent className="p-2">
            {filtrados.length === 0 ? (
              <EmptyState titulo="Sem alertas" descricao="Nenhum alerta corresponde aos filtros aplicados." />
            ) : (
              <ul className="divide-y divide-border/60">
                {filtrados.map(a => (
                  <li
                    key={`${a.clienteId}-${a.id}`}
                    className={`group flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors ${toneBg[a.severidade]} hover:bg-muted/40`}
                    onClick={() => navigate(`/admin/cliente/${a.clienteId}`)}
                  >
                    <Activity className="h-4 w-4 mt-1 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{a.titulo}</span>
                        <StatusTag label={labelSeveridade[a.severidade]} variant={variantSeveridade[a.severidade]} />
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{labelModulo[a.modulo]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.descricao}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        <span className="font-medium text-foreground/80">{a.clienteNome}</span>
                        <span className="mx-1.5">·</span>
                        {a.consultorNome}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors mt-1" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
