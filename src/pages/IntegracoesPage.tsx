import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INTEGRACOES,
  type Integracao,
  type StatusIntegracao,
  type CategoriaIntegracao,
} from '@/data/integracoes';
import {
  CalendarDays, Video, MessageCircle, BookOpen, Plug, CheckCircle2, Clock,
  ArrowUpRight, RefreshCw, Settings2, ExternalLink, Activity, ShieldCheck, UserCheck, Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const iconCategoria: Record<CategoriaIntegracao, typeof CalendarDays> = {
  agenda: CalendarDays,
  reuniao: Video,
  mensageria: MessageCircle,
  conhecimento: BookOpen,
};

const labelStatus: Record<StatusIntegracao, string> = {
  conectado: 'Conectado',
  configuracao: 'Configuração',
};

const labelCategoria: Record<CategoriaIntegracao, string> = {
  agenda: 'Configuração',
  reuniao: 'Reunião',
  mensageria: 'Mensageria',
  conhecimento: 'Conhecimento',
};

const dotStatus: Record<StatusIntegracao, string> = {
  conectado: 'bg-emerald-500',
  configuracao: 'bg-amber-500',
};

function fmtData(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CardIntegracao({ integ, onSelect, isConnected }: { integ: Integracao; onSelect: (i: Integracao) => void; isConnected: boolean }) {
  const Icon = iconCategoria[integ.categoria];
  return (
    <Card className="p-5 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group" onClick={() => onSelect(integ)}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
          <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : dotStatus[integ.status]}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {isConnected ? 'CONECTADO' : labelStatus[integ.status]}
          </span>
        </div>
      </div>
      <div className="space-y-1 mb-4">
        <h3 className="text-base font-medium leading-tight">{integ.nome}</h3>
        <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{integ.fornecedor}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{integ.descricao}</p>
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <span className="text-xs text-muted-foreground">{labelCategoria[integ.categoria]}</span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
      </div>
    </Card>
  );
}

function GoogleDiagnostics() {
  const { data: connection } = useQuery({
    queryKey: ['google-connection-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_connections')
        .select('*')
        .eq('scope_type', 'global')
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: logs } = useQuery({
    queryKey: ['google-sync-logs-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_sync_logs')
        .select('*')
        .eq('provider', 'google')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  if (!connection) return null;

  return (
    <div className="mt-6 space-y-4 border-t pt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4 flex items-center gap-2">
        <Activity className="h-3 w-3" /> Status da Integração Global
      </p>
      
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Conta Global Ativa
          </span>
          <span className="text-blue-600 font-medium">{connection.google_email}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5" /> Última Sincronização
          </span>
          <span className="text-muted-foreground">{fmtData(connection.updated_at)}</span>
        </div>
      </div>

      {logs && logs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Atividades Recentes (Global)</p>
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="text-[10px] flex items-center justify-between p-1.5 border-b last:border-0 border-border/40">
                <span className="truncate max-w-[120px] font-mono text-muted-foreground">{log.action}</span>
                <span className={log.success ? "text-emerald-500" : "text-destructive"}>
                  {log.success ? "Sucesso" : "Falha"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetalheIntegracao({ integ, onClose }: { integ: Integracao; onClose: () => void }) {
  const { perfil } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: connection } = useQuery({
    queryKey: ['google-connection-global'],
    queryFn: async () => {
      const { data } = await supabase
        .from('google_connections')
        .select('*')
        .eq('scope_type', 'global')
        .eq('status', 'active')
        .maybeSingle();
      return data;
    }
  });

  const isConnected = integ.id === 'google_calendar' ? !!connection : integ.status === 'conectado';

  const handleConnect = async () => {
    if (integ.id === 'google_calendar') {
      if (perfil !== 'admin') {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem configurar a conexão global.', variant: 'destructive' });
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('google-oauth-start', {
          body: { redirect_uri: window.location.origin + window.location.pathname }
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        }
      } catch (err: any) {
        toast({ title: 'Erro ao iniciar conexão', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    } else {
      toast({ title: 'Em breve', description: 'Esta integração estará disponível em breve.' });
    }
  };

  const handleDisconnect = async () => {
    if (integ.id === 'google_calendar') {
      if (perfil !== 'admin') {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem desconectar a conexão global.', variant: 'destructive' });
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.functions.invoke('disconnect-google');
        if (error) throw error;
        toast({ title: 'Desconectado', description: 'A conta Google global foi desconectada.' });
        queryClient.invalidateQueries({ queryKey: ['google-connection-global'] });
      } catch (err: any) {
        toast({ title: 'Erro ao desconectar', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDiagnose = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-google-connection');
      if (error) throw error;
      if (data?.connected) {
        toast({ title: 'Diagnóstico OK', description: `Conexão global ativa: ${data.data?.email}` });
      } else {
        toast({ title: 'Atenção', description: data?.message || 'Nenhuma conexão global encontrada.', variant: 'warning' as any });
      }
    } catch (err: any) {
      toast({ title: 'Erro no diagnóstico', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sticky top-4 border-primary/20 shadow-lg">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{integ.fornecedor}</p>
          <h2 className="text-xl font-light mt-1">{integ.nome}</h2>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : dotStatus[integ.status]}`} />
            <span className="text-xs text-muted-foreground">{isConnected ? 'Global Ativa' : labelStatus[integ.status]} · {labelCategoria[integ.categoria]}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{integ.descricao}</p>

      {integ.id === 'google_calendar' && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-800 leading-relaxed">
            <strong>Conexão Global:</strong> Todos os agendamentos do sistema usarão esta conta única para gerar links do Google Meet e eventos na agenda.
          </p>
        </div>
      )}

      {isConnected && connection && integ.id === 'google_calendar' && (
        <div className="grid grid-cols-1 gap-3 p-3 rounded-md bg-muted/40 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">E-mail do Sistema</p>
            <p className="text-xs font-medium mt-0.5 truncate">{connection.google_email}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Configurado por</p>
            <p className="text-xs font-medium mt-0.5">Administrador</p>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-5">
        {integ.id === 'google_calendar' && perfil === 'admin' && <GoogleDiagnostics />}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">Recursos</p>
          <ul className="space-y-1.5">
            {integ.beneficios.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-border/60">
        {perfil === 'admin' ? (
          isConnected ? (
            <>
              <Button onClick={handleDiagnose} disabled={loading} variant="outline" className="border-primary/20">
                <Activity className="h-4 w-4 mr-2" strokeWidth={1.5} /> Diagnosticar Conexão
              </Button>
              <Button variant="outline" className="text-destructive hover:bg-destructive/5" onClick={handleDisconnect} disabled={loading}>
                Desconectar Conta Global
              </Button>
              <Button variant="ghost" size="sm" onClick={handleConnect} disabled={loading} className="text-[10px] uppercase font-bold">
                Reautenticar Conta
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={loading}>
              <Plug className="h-4 w-4 mr-2" /> Conectar Conta Global
            </Button>
          )
        ) : (
          <div className="p-3 bg-muted/20 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Apenas administradores podem gerenciar esta integração.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function IntegracoesPage() {
  const { perfil } = useAuth();
  const [filtro, setFiltro] = useState<'todas' | CategoriaIntegracao>('todas');
  const [selecionada, setSelecionada] = useState<Integracao | null>(INTEGRACOES[0]);
  const queryClient = useQueryClient();

  const { data: connection } = useQuery({
    queryKey: ['google-connection-global'],
    queryFn: async () => {
      const { data } = await supabase
        .from('google_connections')
        .select('*')
        .eq('scope_type', 'global')
        .eq('status', 'active')
        .maybeSingle();
      return data;
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      const processCallback = async () => {
        toast({ title: 'Processando conexão global...', description: 'Aguarde um momento.' });
        try {
          const { data, error } = await supabase.functions.invoke('google-oauth-callback', {
            body: { 
              code,
              redirect_uri: window.location.origin + window.location.pathname
            }
          });
          if (error) throw error;
          if (data?.success === false) throw new Error(data.error);
          toast({ title: 'Conectado com sucesso!', description: 'A conta Google global foi vinculada.' });
          queryClient.invalidateQueries({ queryKey: ['google-connection-global'] });
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err: any) {
          toast({ title: 'Erro na conexão', description: err.message, variant: 'destructive' });
        }
      };
      processCallback();
    }
  }, []);

  const lista = useMemo(
    () => filtro === 'todas' ? INTEGRACOES : INTEGRACOES.filter(i => i.categoria === filtro),
    [filtro],
  );

  const filtros: Array<{ id: 'todas' | CategoriaIntegracao; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'agenda', label: 'Configuração' },
    { id: 'reuniao', label: 'Reuniões' },
    { id: 'mensageria', label: 'Mensageria' },
    { id: 'conhecimento', label: 'Conhecimento' },
  ];

  // If not admin, we might want to hide some specific integrations or actions
  // But for now, we follow the requirement: card is visible, but management is admin-only

  return (
    <div>
      <PageHeader
        titulo="Integrações"
        subtitulo="Gerencie as conexões globais e ferramentas externas do Sistema SEVEN."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            {filtros.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`text-xs px-3 py-1.5 rounded-sm transition-colors whitespace-nowrap ${
                  filtro === f.id
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lista.map(i => (
              <CardIntegracao 
                key={i.id} 
                integ={i} 
                onSelect={setSelecionada} 
                isConnected={i.id === 'google_calendar' ? !!connection : false} 
              />
            ))}
          </div>
        </div>

        <div>
          {selecionada && <DetalheIntegracao integ={selecionada} onClose={() => setSelecionada(null)} />}
        </div>
      </div>
    </div>
  );
}
