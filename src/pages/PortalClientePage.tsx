import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SevenLogo } from '@/components/SevenLogo';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  CheckCircle2, 
  Building2, 
  LogOut, 
  User, 
  Clock, 
  FileText, 
  Star,
  LayoutDashboard,
  CheckCircle,
  History,
  FileCheck,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  FileBadge,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { useClienteContratos } from '@/hooks/useClienteContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings, useContractModuleMeetings as useModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useClientCSAT } from '@/hooks/useClientCSAT';
import { useClienteHistorico } from '@/hooks/useClienteHistorico';
import { useClienteTarefas } from '@/hooks/useClienteTarefas';
import { usePortalDeliverables } from '@/hooks/usePortalDeliverables';
import { usePortalSummary } from '@/hooks/usePortalSummary';
import { usePortalCSAT } from '@/hooks/usePortalCSAT';
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

  const clientId = clienteSession?.clienteId;
  const { cliente, isLoading: loadingFicha } = useClienteFicha(clientId);
  const { contratos, isLoading: loadingContratos } = useClienteContratos(clientId);
  
  const activeContract = useMemo(() => 
    contratos?.find(c => c.status === 'ativo' || c.status === 'em_onboarding') || contratos?.[0],
    [contratos]
  );

  const { products, isLoading: loadingProducts } = useContractProducts(activeContract?.id);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const currentProductId = selectedProduct || products?.[0]?.id;
  
  const activeProduct = useMemo(() => 
    products?.find(p => p.id === currentProductId),
    [products, currentProductId]
  );

  const { phases, isLoading: loadingPhases } = useContractProductPhases(currentProductId);
  const { submitCSAT } = useClientCSAT(clientId);
  const { historico, isLoading: loadingHist } = useClienteHistorico(clientId);
  const { deliverables, isLoading: loadingDocs } = usePortalDeliverables(clientId);
  const { summary, isLoading: loadingSummary } = usePortalSummary(clientId);
  const { csatStatus } = usePortalCSAT(clientId);

  const isLoading = loadingFicha || loadingContratos || loadingProducts || loadingPhases || loadingDocs || loadingHist || loadingSummary;

  // Debug logs
  console.log("Portal Debug:", {
    clientId,
    cliente,
    activeContract,
    products,
    currentProductId,
    phases,
    deliverables,
    summary,
    csatStatus,
    isLoading,
    loadingStates: {
      ficha: loadingFicha,
      contratos: loadingContratos,
      products: loadingProducts,
      phases: loadingPhases,
      docs: loadingDocs,
      hist: loadingHist,
      summary: loadingSummary
    }
  });

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

  const handleContactConsultant = () => {
    // Implement contact logic (WhatsApp link or email)
    const phone = "5511999999999"; // Placeholder
    window.open(`https://wa.me/${phone}?text=Olá, sou o cliente ${cliente?.nomeFantasia} e gostaria de falar sobre minha jornada.`, '_blank');
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="sticky top-0 z-20 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SevenLogo fill="hsl(var(--primary))" height={20} />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                {cliente?.nomeFantasia}
              </div>
              <p className="text-[10px] text-neutral-500 font-medium">Contrato: {activeContract?.tipo || 'Ativo'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              size="sm" 
              className="hidden md:flex bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
              onClick={handleContactConsultant}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar com consultor
            </Button>
            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-red-600" onClick={logoutCliente}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Summary Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <IndicatorCard 
            title="Encontros Previstos" 
            value={`${summary?.totalMeetings || 0}`} 
            icon={<Calendar className="h-5 w-5 text-blue-500" />} 
          />
          <IndicatorCard 
            title="Encontros Realizados" 
            value={`${summary?.realizedMeetings || 0} de ${summary?.totalMeetings || 0}`} 
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} 
          />
          <IndicatorCard 
            title="Próxima Reunião" 
            value={summary?.nextMeetingDate ? format(new Date(summary.nextMeetingDate), "dd/MM/yy 'às' HH:mm") : 'Nenhuma agendada'} 
            icon={<Clock className="h-5 w-5 text-amber-500" />} 
          />
          <IndicatorCard 
            title="CSAT Pendente" 
            value={`${csatStatus?.filter(s => !s.isResponded).length || 0}`} 
            icon={<Star className="h-5 w-5 text-yellow-500" />} 
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Nav */}
          <aside className="lg:w-64 space-y-6 shrink-0">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2">Navegação</p>
              <nav className="space-y-1">
                <NavButton active={activeTab === 'jornada'} onClick={() => setActiveTab('jornada')} icon={<LayoutDashboard className="h-4 w-4" />} label="Sua Jornada" />
                <NavButton active={activeTab === 'contrato'} onClick={() => setActiveTab('contrato')} icon={<FileBadge className="h-4 w-4" />} label="Meu Contrato" />
                <NavButton active={activeTab === 'entregaveis'} onClick={() => setActiveTab('entregaveis')} icon={<FileCheck className="h-4 w-4" />} label="Entregáveis" />
                <NavButton active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} icon={<History className="h-4 w-4" />} label="Histórico" />
              </nav>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2">Produtos</p>
              <div className="space-y-2">
                {products?.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg text-xs font-medium border transition-all",
                      currentProductId === p.id 
                        ? "bg-primary text-white border-primary shadow-md" 
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

            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Seu Consultor</p>
                <p className="font-medium text-neutral-900 text-sm truncate">{activeContract?.consultorNome}</p>
              </div>
            </Card>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="jornada" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-neutral-900">{activeProduct?.productNome || 'Sua Jornada'}</h2>
                </div>
                
                <div className="space-y-4">
                  {phases?.map((phase, idx) => (
                    <Card key={phase.id} className="overflow-hidden border-none shadow-sm bg-white">
                      <div className="flex">
                        <div className={cn("w-1.5 shrink-0", 
                          phase.status === 'concluida' ? "bg-green-500" : 
                          phase.status === 'em_andamento' ? "bg-primary animate-pulse" : "bg-neutral-200"
                        )} />
                        <div className="p-5 flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Módulo {idx + 1}</p>
                              <h3 className="font-semibold text-lg text-neutral-900">{phase.name}</h3>
                              {phase.clientNotes && <p className="text-sm text-neutral-500 mt-1">{phase.clientNotes}</p>}
                            </div>
                            <div className="text-right">
                              <p className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block",
                                phase.status === 'concluida' ? "bg-green-50 text-green-600" : 
                                phase.status === 'em_andamento' ? "bg-primary/10 text-primary" : "bg-neutral-50 text-neutral-400"
                              )}>
                                {phase.status.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          <PhaseMeetingsList 
                            moduleId={phase.id} 
                            onRateMeeting={handleOpenCsat}
                            csatStatus={csatStatus}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="entregaveis" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deliverables?.map(doc => (
                    <Card key={doc.id} className="p-4 border-none shadow-sm bg-white hover:ring-1 hover:ring-primary/20 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-neutral-900 truncate">{doc.title}</h4>
                          <p className="text-xs text-neutral-500 mt-1">Status: <span className="capitalize">{doc.status}</span></p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{format(new Date(doc.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full h-8 text-[10px] font-bold uppercase"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-2" /> Visualizar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {deliverables?.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-neutral-100">
                      <FileText className="h-10 w-10 text-neutral-200 mx-auto mb-4" />
                      <p className="text-neutral-400 text-sm">Nenhum entregável disponível ainda.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-0 space-y-4">
                {historico?.map(event => (
                  <Card key={event.id} className="p-5 border-none shadow-sm bg-white flex gap-6">
                    <div className="md:w-32 shrink-0 border-r border-neutral-100 pr-6">
                      <p className="text-xs font-bold text-neutral-900">{format(new Date(event.data), "dd/MM/yyyy")}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1">{event.tipo}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-neutral-900">{event.titulo}</h4>
                      <p className="text-sm text-neutral-500 leading-relaxed">{event.descricao}</p>
                    </div>
                  </Card>
                ))}
                {historico?.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-neutral-100">
                    <History className="h-10 w-10 text-neutral-200 mx-auto mb-4" />
                    <p className="text-neutral-400 text-sm">Nenhum registro no histórico.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* CSAT Modal */}
      <Dialog open={isCsatOpen} onOpenChange={setIsCsatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Sua avaliação é importante</DialogTitle>
            <DialogDescription>Como foi sua experiência no encontro: <span className="font-semibold text-neutral-900">{selectedMeeting?.title}</span>?</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-sm font-medium">De 1 a 5, como você avalia a reunião realizada?</Label><StarRating value={csatRatings.meeting} onChange={(v) => setCsatRatings(prev => ({ ...prev, meeting: v }))} /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">O consultor conduziu bem a reunião?</Label><StarRating value={csatRatings.consultant} onChange={(v) => setCsatRatings(prev => ({ ...prev, consultant: v }))} /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">O conteúdo foi claro e útil?</Label><StarRating value={csatRatings.clarity} onChange={(v) => setCsatRatings(prev => ({ ...prev, clarity: v }))} /></div>
              <div className="space-y-2 pt-2 border-t border-neutral-100"><Label className="text-sm font-medium">Recomendaria a Seven? (NPS 0-10)</Label><NpsScale value={csatRatings.nps} onChange={(v) => setCsatRatings(prev => ({ ...prev, nps: v }))} /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">Comentário ou sugestão</Label><Textarea placeholder="Sua opinião nos ajuda a melhorar..." value={csatRatings.comment} onChange={(e) => setCsatRatings(prev => ({ ...prev, comment: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsCsatOpen(false)}>Cancelar</Button><Button onClick={handleSubmitCsat} disabled={csatRatings.meeting === 0}>Enviar Feedback</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IndicatorCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="p-4 border-none shadow-sm bg-white flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{title}</p>
        <p className="text-sm font-semibold text-neutral-900 truncate">{value}</p>
      </div>
    </Card>
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

function PhaseMeetingsList({ moduleId, onRateMeeting, csatStatus }: { moduleId: string, onRateMeeting: (m: any) => void, csatStatus?: any[] }) {
  const { meetings, isLoading } = useModuleMeetings(moduleId);
  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (!meetings || meetings.length === 0) return null;
  
  return (
    <div className="mt-4 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Encontros do Módulo</p>
      {meetings.map((m) => {
        const isCompleted = m.status === 'realizada';
        const isScheduled = m.status === 'agendado';
        const csatInfo = csatStatus?.find(s => s.id === m.id);
        const isResponded = csatInfo?.isResponded;
        
        return (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border", 
                isCompleted ? "bg-green-100 text-green-600 border-green-200" : 
                isScheduled ? "bg-blue-100 text-blue-600 border-blue-200" : "bg-white text-neutral-300 border-neutral-200"
              )}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-900 truncate">{m.title || `Encontro ${m.meetingNumber}`}</p>
                <p className="text-[10px] text-neutral-500">
                  {isCompleted && m.completedAt ? `Realizado: ${format(new Date(m.completedAt), "dd/MM/yy")}` : 
                   isScheduled && m.scheduledAt ? `Agendado: ${format(new Date(m.scheduledAt), "dd/MM/yy 'às' HH:mm")}` : 
                   'Previsto na jornada'}
                </p>
              </div>
            </div>
            {isCompleted && !isResponded && (
              <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-primary hover:bg-primary/10" onClick={() => onRateMeeting(m)}>
                <Star className="h-3 w-3 mr-1" /> AVALIAR
              </Button>
            )}
            {isResponded && <span className="text-[9px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">Feedback Enviado</span>}
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
        <button key={star} type="button" onClick={() => onChange(star)} className={cn("transition-all", value >= star ? "text-yellow-400" : "text-neutral-200 hover:text-neutral-300")}>
          <Star className={cn("h-7 w-7", value >= star ? "fill-current" : "fill-none")} />
        </button>
      ))}
    </div>
  );
}

function NpsScale({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: 11 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className={cn("h-9 w-9 flex items-center justify-center rounded-md text-xs font-bold border transition-all shrink-0", value === i ? "bg-primary border-primary text-white" : "bg-white border-neutral-200 text-neutral-500 hover:border-primary/50")}>
          {i}
        </button>
      ))}
    </div>
  );
}
