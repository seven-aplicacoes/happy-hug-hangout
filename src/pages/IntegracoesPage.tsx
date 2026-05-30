import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INTEGRACOES,
  EVENTOS_INTEGRACAO,
  labelStatus,
  labelCategoria,
  type Integracao,
  type StatusIntegracao,
  type CategoriaIntegracao,
} from '@/data/integracoes';
import {
  CalendarDays, Video, MessageCircle, BookOpen, Plug, CheckCircle2, Clock,
  ArrowUpRight, RefreshCw, Settings2, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconCategoria: Record<CategoriaIntegracao, typeof CalendarDays> = {
  agenda: CalendarDays,
  reuniao: Video,
  mensageria: MessageCircle,
  conhecimento: BookOpen,
};

const dotStatus: Record<StatusIntegracao, string> = {
  conectado: 'bg-emerald-500',
  beta: 'bg-amber-500',
  disponivel: 'bg-sky-500',
  em_breve: 'bg-muted-foreground/40',
};

function fmtData(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CardIntegracao({ integ, onSelect, perfil }: { integ: Integracao; onSelect: (i: Integracao) => void; perfil?: string }) {
  const Icon = iconCategoria[integ.categoria];
  return (
    <Card className="p-5 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group" onClick={() => onSelect(integ)}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
          <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${dotStatus[integ.status]}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {labelStatus[integ.status]}
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

function DetalheIntegracao({ integ, onClose }: { integ: Integracao; onClose: () => void }) {
  const ativo = integ.status === 'conectado' || integ.status === 'beta';
  return (
    <Card className="p-6 sticky top-4">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{integ.fornecedor}</p>
          <h2 className="text-xl font-light mt-1">{integ.nome}</h2>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dotStatus[integ.status]}`} />
            <span className="text-xs text-muted-foreground">{labelStatus[integ.status]} · {labelCategoria[integ.categoria]}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{integ.descricao}</p>

      {ativo && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-muted/40 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Conta</p>
            <p className="text-xs font-medium mt-0.5 truncate">{integ.contaVinculada || 'Conta de equipe'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Conectado em</p>
            <p className="text-xs font-medium mt-0.5">{integ.conectadoEm ? new Date(integ.conectadoEm).toLocaleDateString('pt-BR') : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Última sync</p>
            <p className="text-xs font-medium mt-0.5">{fmtData(integ.ultimaSincronizacao)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Itens</p>
            <p className="text-xs font-medium mt-0.5">{integ.itensSincronizados ?? '—'}</p>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">Benefícios</p>
          <ul className="space-y-1.5">
            {integ.beneficios.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">Capacidades</p>
          <div className="flex flex-wrap gap-1.5">
            {integ.capacidades.map((c, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-sm bg-muted text-foreground">{c}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">Escopos requeridos</p>
          <div className="flex flex-wrap gap-1.5">
            {integ.escopos.map((s, i) => (
              <code key={i} className="text-[11px] px-1.5 py-0.5 rounded-sm bg-foreground/5 text-foreground font-mono">{s}</code>
            ))}
          </div>
        </div>
      </div>

        {integ.id === 'calendly' ? (
          <div className="flex flex-col gap-2 pt-4 border-t border-border/60">
             {perfil === 'admin' ? (
               <>
                 <Button 
                   className={cn(
                     "bg-primary hover:bg-primary/90",
                     integ.status === 'conectado' && "bg-emerald-600 hover:bg-emerald-700"
                   )}
                   onClick={() => {
                     toast({ title: 'OAuth Calendly', description: 'Redirecionando para autorização...' });
                     const client_id = 'CALENDLY_CLIENT_ID'; 
                     const redirect_uri = encodeURIComponent(window.location.origin + '/admin/integracoes');
                     const url = `https://auth.calendly.com/oauth/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}`;
                     window.location.href = url;
                   }}
                 >
                   <Plug className="h-4 w-4 mr-2" strokeWidth={1.5} /> 
                   {integ.status === 'conectado' ? 'Reconectar Conta Central' : 'Conectar Conta Central'}
                 </Button>
                 {integ.status === 'conectado' && (
                   <Button variant="outline" onClick={() => setShowMapping(true)}>
                     <Settings2 className="h-4 w-4 mr-2" strokeWidth={1.5} /> Mapear Consultores
                   </Button>
                 )}
               </>
             ) : (
               <div className="text-center py-2">
                 <p className="text-xs text-muted-foreground italic">
                   A integração com Calendly é gerenciada pela administração.
                 </p>
               </div>
             )}
             <p className="text-[10px] text-muted-foreground text-center px-4">
               {perfil === 'admin' 
                 ? 'Conecte a conta central do Calendly para toda a empresa.' 
                 : 'Sua agenda será vinculada ao link configurado pelo administrador.'}
             </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-4 border-t border-border/60">
            {integ.status === 'conectado' || integ.status === 'beta' ? (
              <>
                <Button onClick={() => toast({ title: 'Sincronização iniciada', description: `${integ.nome} está sincronizando.` })}>
                  <RefreshCw className="h-4 w-4 mr-2" strokeWidth={1.5} /> Sincronizar agora
                </Button>
                <Button variant="outline" onClick={() => toast({ title: 'Configurações abertas', description: 'Edite escopos e preferências.' })}>
                  <Settings2 className="h-4 w-4 mr-2" strokeWidth={1.5} /> Configurações
                </Button>
              </>
            ) : integ.status === 'disponivel' ? (
              <Button onClick={() => toast({ title: 'Conexão iniciada', description: `Autorize ${integ.nome} na nova janela.` })}>
                <Plug className="h-4 w-4 mr-2" strokeWidth={1.5} /> Conectar {integ.nome}
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Clock className="h-4 w-4 mr-2" strokeWidth={1.5} /> Em breve
              </Button>
            )}
            {integ.documentacaoUrl && (
              <a href={integ.documentacaoUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-start">
                Documentação <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
            )}
          </div>
        )}
    </Card>
  );
}

export default function IntegracoesPage() {
  const [filtro, setFiltro] = useState<'todas' | CategoriaIntegracao>('todas');
  const [selecionada, setSelecionada] = useState<Integracao | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load actual connection status
  const { data: calendlyIntegration, isLoading: loadingIntegration } = useQuery({
    queryKey: ['calendly-integration', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultant_calendar_integrations')
        .select('*')
        .eq('consultant_id', user?.id)
        .eq('provider', 'calendly')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const updatedIntegracoes = useMemo(() => {
    return INTEGRACOES.map(i => {
      if (i.id === 'calendly' && calendlyIntegration) {
        return {
          ...i,
          status: 'conectado' as StatusIntegracao,
          conectadoEm: calendlyIntegration.created_at,
          contaVinculada: calendlyIntegration.provider_user_uri
        };
      }
      return i;
    });
  }, [calendlyIntegration]);

  useEffect(() => {
    // Handle OAuth Callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleExchangeCode(code);
    }
  }, []);

  const handleExchangeCode = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('calendly-oauth', {
        body: { action: 'exchange_code', code }
      });

      if (error) throw error;
      
      toast({ title: 'Sucesso!', description: 'Calendly conectado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['calendly-integration'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('Error exchanging code:', error);
      toast({ title: 'Erro ao conectar', description: error.message, variant: 'destructive' });
    }
  };

  const lista = useMemo(
    () => filtro === 'todas' ? updatedIntegracoes : updatedIntegracoes.filter(i => i.categoria === filtro),
    [filtro, updatedIntegracoes],
  );

  const conectadas = updatedIntegracoes.filter(i => i.status === 'conectado' || i.status === 'beta').length;
  const disponiveis = updatedIntegracoes.filter(i => i.status === 'disponivel').length;
  const futuras = updatedIntegracoes.filter(i => i.status === 'em_breve').length;

  const filtros: Array<{ id: 'todas' | CategoriaIntegracao; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'reuniao', label: 'Reuniões' },
    { id: 'mensageria', label: 'Mensageria' },
    { id: 'conhecimento', label: 'Conhecimento' },
  ];

  return (
    <div>
      <PageHeader
        titulo="Integrações"
        subtitulo="Conecte calendários, salas de reunião, mensageria e a base de conhecimento Seven em um único lugar."
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Conectadas</p>
          <p className="text-3xl font-thin mt-2">{conectadas}</p>
          <p className="text-xs text-muted-foreground mt-1">Sincronizando ativamente</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Disponíveis</p>
          <p className="text-3xl font-thin mt-2">{disponiveis}</p>
          <p className="text-xs text-muted-foreground mt-1">Prontas para conectar</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Roadmap</p>
          <p className="text-3xl font-thin mt-2">{futuras}</p>
          <p className="text-xs text-muted-foreground mt-1">Em breve no produto</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-1.5">
            {filtros.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${
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
            {lista.map(i => <CardIntegracao key={i.id} integ={i} onSelect={setSelecionada} />)}
          </div>

          <Card className="p-5 mt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">Atividade recente</p>
            <div className="space-y-3">
              {EVENTOS_INTEGRACAO.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhuma atividade recente.</p>
              ) : (
                EVENTOS_INTEGRACAO.map(ev => {
                  const integ = INTEGRACOES.find(i => i.id === ev.integracaoId);
                  return (
                    <div key={ev.id} className="flex gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">{ev.titulo}</p>
                          <span className="text-[11px] text-muted-foreground shrink-0">{fmtData(ev.data)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {integ?.nome} · {ev.detalhe}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div>
          {selecionada && <DetalheIntegracao integ={selecionada} onClose={() => setSelecionada(null)} />}
        </div>
      </div>
    </div>
  );
}
