import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusTag } from '@/components/StatusTag';
import { SevenLogo } from '@/components/SevenLogo';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  CheckCircle2, 
  Building2, 
  LogOut, 
  ChevronRight, 
  User, 
  Clock, 
  FileText, 
  Star,
  LayoutDashboard,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  History,
  FileCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { useClienteContratos } from '@/hooks/useClienteContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings, useContractModuleMeetings as useModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useClienteDocumentos } from '@/hooks/useClienteDocumentos';
import { useClientCSAT } from '@/hooks/useClientCSAT';
import { useClienteIndicadores } from '@/hooks/useClienteIndicadores';
import { useClientAlerts } from '@/hooks/useClientAlerts';
import { useClienteHistorico } from '@/hooks/useClienteHistorico';
import { useClienteTarefas } from '@/hooks/useClienteTarefas';
import { useClienteReunioes } from '@/hooks/useClienteReunioes';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

export default function PortalClientePage() {
  const { clienteSession, loginCliente, logoutCliente } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [activeTab, setActiveTab] = useState('jornada');
  
  // CSAT Modal State
  const [isCsatOpen, setIsCsatOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [csatRatings, setCsatRatings] = useState({
    meeting: 0,
    consultant: 0,
    clarity: 0,
    nps: 0,
    comment: ''
  });

  // Scheduling Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedModuleForSchedule, setSelectedModuleForSchedule] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '09:00',
    title: ''
  });

  const clientId = clienteSession?.clienteId;
  const { cliente, isLoading: loadingFicha } = useClienteFicha(clientId);
  const { contratos, isLoading: loadingContratos } = useClienteContratos(clientId);
  
  const activeContract = useMemo(() => 
    contratos?.find(c => c.status === 'ativo' || c.status === 'em_onboarding'),
    [contratos]
  );

  const { products, isLoading: loadingProducts } = useContractProducts(activeContract?.id);
  const { upsertReuniao } = useClienteReunioes(clientId);

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  
  const currentProductId = selectedProduct || products?.[0]?.id;
  const activeProduct = useMemo(() => 
    products?.find(p => p.id === currentProductId),
    [products, currentProductId]
  );

  const { phases, isLoading: loadingPhases } = useContractProductPhases(currentProductId);
  const { documentos, isLoading: loadingDocs } = useClienteDocumentos(clientId);
  const { responses: csatResponses, submitCSAT } = useClientCSAT(clientId);
  const { indicadores, isLoading: loadingInd } = useClienteIndicadores(clientId);
  const { alerts, isLoading: loadingAlerts } = useClientAlerts(clientId);
  const { historico, isLoading: loadingHist } = useClienteHistorico(clientId);
  const { tarefas, isLoading: loadingTasks } = useClienteTarefas(clientId);

  const isLoading = loadingFicha || loadingContratos || loadingProducts || loadingPhases || loadingDocs || loadingInd || loadingAlerts || loadingHist || loadingTasks;

  const handleLogin = async () => {
    setErro('');
    const res = await loginCliente(email, senha);
    if (!res.ok) setErro(res.erro || 'Erro ao entrar.');
  };

  const handleOpenCsat = (meeting: any) => {
    setSelectedMeeting(meeting);
    setCsatRatings({
      meeting: 0,
      consultant: 0,
      clarity: 0,
      nps: 0,
      comment: ''
    });
    setIsCsatOpen(true);
  };

  const handleSubmitCsat = async () => {
    if (!selectedMeeting || !clientId || !activeContract) return;
    await submitCSAT.mutateAsync({
      meeting_id: selectedMeeting.id,
      client_id: clientId,
      contract_id: activeContract.id,
      consultant_id: activeContract.consultorId,
      rating_meeting: csatRatings.meeting,
      rating_consultant: csatRatings.consultant,
      rating_clarity: csatRatings.clarity,
      nps_score: csatRatings.nps,
      comment: csatRatings.comment
    });
    setIsCsatOpen(false);
  };

  const handleScheduleRequest = async () => {
    if (!scheduleData.date || !scheduleData.title) {
      toast({ title: "Preencha os campos", variant: "destructive" });
      return;
    }

    try {
      await upsertReuniao.mutateAsync({
        clienteId: clientId,
        contractId: activeContract?.id,
        contractProductId: activeProduct?.id,
        contractProductPhaseId: selectedModuleForSchedule?.id,
        consultorId: activeContract?.consultorId,
        meetingDate: scheduleData.date,
        startTime: scheduleData.time,
        duracao: 60,
        tipo: 'Consultoria',
        title: scheduleData.title,
        status: 'agendada',
        scheduledBy: clienteSession?.email
      });
      setIsScheduleOpen(false);
      toast({ title: "Solicitação enviada", description: "Sua reunião foi agendada e o consultor foi notificado." });
    } catch (err) {
      console.error(err);
    }
  };

  if (!clienteSession) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="flex justify-center mb-2">
              <SevenLogo fill="hsl(var(--primary))" height={32} />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold text-neutral-900">Portal do Cliente</CardTitle>
              <CardDescription className="text-neutral-500 mt-1">Acompanhe sua jornada com a Seven Gestão</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-neutral-500">E-mail ou CNPJ</Label>
              <Input 
                id="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="exemplo@empresa.com.br"
                className="bg-neutral-50 border-neutral-200 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-xs font-medium uppercase tracking-wider text-neutral-500">Senha</Label>
              <Input 
                id="pass"
                type="password" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
                placeholder="••••••••"
                className="bg-neutral-50 border-neutral-200 focus:ring-primary/20"
              />
            </div>
            {erro && <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">{erro}</p>}
            <Button className="w-full py-6 text-base font-medium shadow-lg shadow-primary/20 mt-2" onClick={handleLogin}>
              Acessar Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-8">
            <Skeleton className="h-[600px] w-64" />
            <div className="flex-1 space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const clientDeliverables = documentos?.filter(d => d.visibility === 'client' || d.visibility === 'all') || [];
  const clientAlerts = alerts?.filter(a => a.status === 'active');
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="sticky top-0 z-20 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SevenLogo fill="hsl(var(--primary))" height={20} />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 text-neutral-600 font-medium text-sm">
              <Building2 className="h-4 w-4" />
              {cliente?.nomeFantasia}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-red-600" onClick={logoutCliente}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 space-y-6 shrink-0">
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2">Menu do Cliente</p>
            <nav className="space-y-1">
              <NavButton active={activeTab === 'jornada'} onClick={() => setActiveTab('jornada')} icon={<LayoutDashboard className="h-4 w-4" />} label="Sua Jornada" />
              <NavButton active={activeTab === 'indicadores'} onClick={() => setActiveTab('indicadores')} icon={<TrendingUp className="h-4 w-4" />} label="Indicadores" />
              <NavButton active={activeTab === 'entregaveis'} onClick={() => setActiveTab('entregaveis')} icon={<FileCheck className="h-4 w-4" />} label="Entregáveis" />
              <NavButton active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} icon={<History className="h-4 w-4" />} label="Histórico" />
            </nav>
          </div>

          <Separator className="bg-neutral-200" />

          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2">Produtos Contratados</p>
            <div className="space-y-2">
              {products?.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg text-xs font-medium border transition-all",
                    currentProductId === p.id 
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                      : "bg-white text-neutral-600 border-neutral-100 hover:border-primary/50"
                  )}
                >
                  <p className="font-bold truncate">{p.productNome}</p>
                  <p className={cn("text-[9px] opacity-70 mt-0.5", currentProductId === p.id ? "text-white" : "text-neutral-400")}>
                    {p.status.toUpperCase()}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          <Card className="bg-white border-none shadow-sm flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Consultor Seven</p>
              <p className="font-medium text-neutral-900 text-sm truncate">{activeContract?.consultorNome || cliente?.consultorNome}</p>
            </div>
          </Card>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-light text-neutral-900">
                Olá, <span className="font-semibold text-primary">{cliente?.nomeFantasia}</span>
              </h1>
              <p className="text-neutral-500">
                {activeTab === 'jornada' && "Acompanhe o progresso da sua consultoria em tempo real."}
                {activeTab === 'indicadores' && "Visualize a evolução dos seus indicadores de performance."}
                {activeTab === 'entregaveis' && "Acesse todos os documentos e materiais da sua jornada."}
                {activeTab === 'historico' && "Reveja reuniões passadas e interações realizadas."}
              </p>
            </div>

            {clientAlerts && clientAlerts.length > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-3 rounded-lg text-amber-800 text-xs font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Você tem {clientAlerts.length} alerta{clientAlerts.length > 1 ? 's' : ''} pendente{clientAlerts.length > 1 ? 's' : ''} de atenção.</span>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="jornada" className="mt-0 space-y-8">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    Progresso: {activeProduct?.productNome}
                  </h2>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className="xl:col-span-8 space-y-4">
                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                      <ScrollArea className="h-[650px] w-full p-6">
                        <div className="relative pl-8 space-y-10">
                          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-neutral-100" />
                          {phases?.map((phase, idx) => {
                            const isCompleted = phase.status === 'concluida';
                            const isCurrent = phase.status === 'em_andamento';
                            return (
                              <div key={phase.id} className="relative">
                                <div className={cn(
                                  "absolute -left-[25px] h-4 w-4 rounded-full border-2 bg-white z-10 flex items-center justify-center",
                                  isCompleted ? "border-green-500 bg-green-500" : 
                                  isCurrent ? "border-primary bg-primary animate-pulse" : "border-neutral-200"
                                )}>
                                  {isCompleted && <CheckCircle className="h-3 w-3 text-white" />}
                                </div>
                                <div className={cn(
                                  "space-y-4 p-5 rounded-xl border transition-all",
                                  isCurrent ? "bg-primary/[0.02] border-primary/20 ring-1 ring-primary/5" : "bg-white border-neutral-100"
                                )}>
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Módulo {idx + 1}</span>
                                        {isCurrent && <StatusTag label="Fase Atual" />}
                                      </div>
                                      <h3 className="font-semibold text-lg text-neutral-900">{phase.name}</h3>
                                      {phase.clientNotes && <p className="text-sm text-neutral-500 mt-1 max-w-lg">{phase.clientNotes}</p>}
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                      <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
                                        <Clock className="h-3.5 w-3.5" />
                                        {phase.durationMinutes ? `${phase.durationMinutes} min previstos` : 'Tempo flexível'}
                                      </div>
                                      {!isCompleted && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-[10px] h-7 px-2 font-bold uppercase tracking-wider"
                                          onClick={() => {
                                            setSelectedModuleForSchedule(phase);
                                            setIsScheduleOpen(true);
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Agendar Encontro
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <PhaseMeetingsList 
                                    moduleId={phase.id} 
                                    onRateMeeting={handleOpenCsat}
                                    responses={csatResponses}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                  <div className="xl:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><SevenLogo fill="white" height={100} /></div>
                      <CardHeader className="relative z-10"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Status da Jornada</CardTitle></CardHeader>
                      <CardContent className="relative z-10 space-y-4">
                        <div className="space-y-1">
                          <p className="text-2xl font-semibold">Consumo de Horas</p>
                          <p className="text-primary-foreground/80 text-sm">Consultoria evoluindo conforme o planejado.</p>
                        </div>
                        <Separator className="bg-white/20" />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-xs">
                            <p className="text-primary-foreground/60">Consultor</p>
                            <p className="font-medium">{(activeProduct?.consultantHours || 0) / 60}h contr.</p>
                          </div>
                          <div className="text-xs text-right">
                            <p className="text-primary-foreground/60">Silvane (IA)</p>
                            <p className="font-medium">{(activeProduct?.silvaneHours || 0) / 60}h contr.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                      <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Tarefas Pendentes</CardTitle></CardHeader>
                      <CardContent className="px-0">
                        <div className="space-y-1">
                          {tarefas?.filter(t => t.status !== 'concluida').slice(0, 5).map(task => (
                            <div key={task.id} className="flex items-center gap-3 px-6 py-3 border-b border-neutral-50 last:border-0">
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{task.titulo}</p>
                                <p className="text-[10px] text-neutral-400">Vence em {format(new Date(task.dataVencimento), 'dd/MM/yy')}</p>
                              </div>
                            </div>
                          ))}
                          {tarefas?.filter(t => t.status !== 'concluida').length === 0 && (
                            <div className="px-6 py-8 text-center"><p className="text-xs text-neutral-400 italic">Nenhuma tarefa pendente.</p></div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="indicadores" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {indicadores?.map(ind => (
                  <Card key={ind.id} className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] uppercase font-bold tracking-widest">{ind.category || 'Geral'}</CardDescription>
                      <CardTitle className="text-sm font-semibold">{ind.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-light text-primary">{ind.value}{ind.unit}</p>
                      <p className="text-[10px] text-neutral-400 mt-2">Atualizado em {format(new Date(ind.date), 'dd/MM/yyyy')}</p>
                    </CardContent>
                  </Card>
                ))}
                {indicadores?.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-neutral-100">
                    <TrendingUp className="h-10 w-10 text-neutral-200 mx-auto mb-4" />
                    <p className="text-neutral-400 text-sm">Nenhum indicador registrado ainda.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="entregaveis" className="mt-0">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="divide-y divide-neutral-100">
                  {clientDeliverables.map(doc => (
                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between px-8 py-5 hover:bg-neutral-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded bg-primary/5 flex items-center justify-center text-primary shrink-0"><FileText className="h-6 w-6" /></div>
                        <div>
                          <p className="font-medium text-neutral-900">{doc.titulo}</p>
                          <p className="text-xs text-neutral-400">Disponibilizado por {doc.autor} em {format(new Date(doc.data), "dd 'de' MMMM", { locale: ptBR })}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="group-hover:text-primary"><Plus className="h-4 w-4 mr-2" /> Visualizar</Button>
                    </a>
                  ))}
                  {clientDeliverables.length === 0 && (
                    <div className="p-20 text-center"><p className="text-neutral-400">Nenhum documento disponível para visualização.</p></div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
              <div className="space-y-4">
                {historico?.map(event => (
                  <Card key={event.id} className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="flex">
                      <div className={cn("w-2 shrink-0", 
                        event.tipo === 'reuniao' ? "bg-blue-400" : 
                        event.tipo === 'conquista' ? "bg-green-400" : "bg-neutral-200"
                      )} />
                      <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                        <div className="md:w-32 shrink-0">
                          <p className="text-xs font-bold text-neutral-400">{format(new Date(event.data), "dd/MM/yyyy")}</p>
                          <p className="text-[10px] uppercase tracking-widest mt-1">{event.tipo}</p>
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-neutral-900">{event.titulo}</h4>
                          <p className="text-sm text-neutral-500 line-clamp-2">{event.descricao}</p>
                          {event.ia_summary && (
                            <div className="mt-4 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 flex items-center gap-1.5"><Star className="h-3 w-3 fill-primary" /> Resumo Silvane (IA)</p>
                              <p className="text-xs text-neutral-600 leading-relaxed italic">{event.ia_summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Modals */}
      <Dialog open={isCsatOpen} onOpenChange={setIsCsatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Sua avaliação é importante</DialogTitle>
            <DialogDescription>Como foi sua experiência no encontro: <span className="font-semibold text-neutral-900">{selectedMeeting?.title}</span>?</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-sm font-medium">O encontro atingiu as expectativas?</Label><StarRating value={csatRatings.meeting} onChange={(v) => setCsatRatings(prev => ({ ...prev, meeting: v }))} /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">O consultor foi claro e eficiente?</Label><StarRating value={csatRatings.consultant} onChange={(v) => setCsatRatings(prev => ({ ...prev, consultant: v }))} /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">A clareza dos próximos passos foi:</Label><StarRating value={csatRatings.clarity} onChange={(v) => setCsatRatings(prev => ({ ...prev, clarity: v }))} /></div>
              <div className="space-y-2 pt-2 border-t border-neutral-100"><Label className="text-sm font-medium">Recomendaria a Seven? (0-10)</Label><NpsScale value={csatRatings.nps} onChange={(v) => setCsatRatings(prev => ({ ...prev, nps: v }))} /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">Comentários</Label><Textarea placeholder="Conte-nos sua percepção..." value={csatRatings.comment} onChange={(e) => setCsatRatings(prev => ({ ...prev, comment: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsCsatOpen(false)}>Cancelar</Button><Button onClick={handleSubmitCsat} disabled={csatRatings.meeting === 0}>Enviar Avaliação</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Agendamento</DialogTitle>
            <DialogDescription>Módulo: <span className="font-bold text-neutral-900">{selectedModuleForSchedule?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-neutral-400">Título da Reunião</Label>
              <Input placeholder="Ex: Alinhamento de Planejamento" value={scheduleData.title} onChange={e => setScheduleData(s => ({...s, title: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-neutral-400">Data Preferencial</Label>
                <Input type="date" value={scheduleData.date} onChange={e => setScheduleData(s => ({...s, date: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-neutral-400">Horário</Label>
                <Input type="time" value={scheduleData.time} onChange={e => setScheduleData(s => ({...s, time: e.target.value}))} />
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 italic bg-neutral-50 p-2 rounded">Observação: O consultor receberá sua solicitação e confirmará a disponibilidade.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Voltar</Button><Button onClick={handleScheduleRequest}>Solicitar Reunião</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className={cn(
        "w-full justify-start font-medium text-sm h-11 transition-all",
        active ? "text-primary bg-primary/5 font-semibold" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
      )}
    >
      <span className={cn("mr-3", active ? "text-primary" : "text-neutral-400")}>{icon}</span>
      {label}
    </Button>
  );
}

function PhaseMeetingsList({ moduleId, onRateMeeting, responses }: { moduleId: string, onRateMeeting: (m: any) => void, responses: any[] }) {
  const { meetings, isLoading } = useModuleMeetings(moduleId);
  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (!meetings || meetings.length === 0) return <p className="text-[10px] text-neutral-400 mt-4 italic">Sem reuniões registradas para este módulo.</p>;
  return (
    <div className="mt-4 space-y-2">
      {meetings.map((m) => {
        const isCompleted = m.status === 'realizada';
        const isScheduled = m.status === 'agendado' || m.status === 'agendada';
        const isResponded = responses?.some(r => r.meeting_id === m.id);
        return (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-neutral-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border", isCompleted ? "bg-green-50 text-green-600 border-green-100" : isScheduled ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-neutral-50 text-neutral-400 border-neutral-100")}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate max-w-[200px]">{m.title || `Encontro ${m.meetingNumber}`}</p>
                <p className="text-[10px] text-neutral-400">
                  {isCompleted && m.completedAt ? `Realizado em ${format(new Date(m.completedAt), "dd/MM/yy")}` : 
                   isScheduled && m.scheduledAt ? `Agendado para ${format(new Date(m.scheduledAt), "dd/MM/yy 'às' HH:mm")}` : 
                   'Aguardando agendamento'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && !isResponded && (
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold text-primary border-primary/20 hover:bg-primary/5" onClick={() => onRateMeeting(m)}>
                  <Star className="h-3 w-3 mr-1.5 fill-primary/10" /> AVALIAR
                </Button>
              )}
              {isResponded && <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-50 border border-neutral-100 text-neutral-400 text-[9px] font-bold uppercase tracking-wider"><CheckCircle className="h-2.5 w-2.5" /> AVALIADO</div>}
              {isScheduled && <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider"><Clock className="h-2.5 w-2.5" /> CONFIRMADO</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className={cn("transition-all", value >= star ? "text-yellow-400 scale-110" : "text-neutral-200 hover:text-neutral-300")}>
          <Star className={cn("h-8 w-8", value >= star ? "fill-current" : "fill-none")} />
        </button>
      ))}
    </div>
  );
}

function NpsScale({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {Array.from({ length: 11 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className={cn("h-10 w-10 flex items-center justify-center rounded-md text-xs font-bold border transition-all shrink-0", value === i ? "bg-primary border-primary text-white scale-110 z-10" : "bg-white border-neutral-200 text-neutral-500 hover:border-primary/50")}>
          {i}
        </button>
      ))}
    </div>
  );
}
