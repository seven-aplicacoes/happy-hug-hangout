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
  ShieldCheck,
  Briefcase,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Users,
  Target,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

        </div>
      </div>

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

function ContractSection({ 
  contrato, 
  products, 
  currentProductId, 
  setSelectedProduct,
  phases,
  onRateMeeting,
  csatStatus
}: { 
  contrato: any, 
  products: any[] | undefined, 
  currentProductId: string | undefined,
  setSelectedProduct: (id: string) => void,
  phases: any[] | undefined,
  onRateMeeting: (m: any) => void,
  csatStatus: any[] | undefined
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 border border-neutral-100">
                <Briefcase className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-neutral-900">{contrato.tipo}</h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase border border-green-100/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {contrato.status}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs text-neutral-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {contrato.dataInicio ? format(new Date(contrato.dataInicio), 'dd/MM/yyyy') : '--'} A {contrato.dataFim ? format(new Date(contrato.dataFim), 'dd/MM/yyyy') : '--'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Consultor {contrato.consultorNome}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end md:self-center">
              <div className="px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                {products?.length || 0} PRODUTOS
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-neutral-400 hover:bg-neutral-50"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {isExpanded && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-primary/40 rounded-full" />
            <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Detalhamento de Produtos e Módulos</h4>
          </div>

          {products?.map(product => (
            <ProductSection 
              key={product.id} 
              product={product} 
              phases={product.id === currentProductId ? phases : []} 
              onRateMeeting={onRateMeeting}
              csatStatus={csatStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductSection({ product, phases, onRateMeeting, csatStatus }: { product: any, phases: any[] | undefined, onRateMeeting: (m: any) => void, csatStatus: any[] | undefined }) {
  return (
    <Card className="border border-neutral-100 shadow-sm bg-neutral-50/30 overflow-hidden">
      <div className="p-6 border-b border-neutral-100 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 border border-neutral-100">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-bold text-neutral-900">{product.productNome}</h4>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[9px] font-bold uppercase border border-green-100/50">
                  <div className="h-1 w-1 rounded-full bg-green-500" />
                  {product.status}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1.5 text-[11px] text-neutral-500 font-bold uppercase tracking-tight">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {product.startDate ? format(new Date(product.startDate), 'dd/MM/yyyy') : '--'} A {product.endDate ? format(new Date(product.endDate), 'dd/MM/yyyy') : '--'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  DURAÇÃO: {(product.consultantHours || 0) / 60}H
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  {product.productCategory || 'GERAL'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white border-b border-neutral-100">
              <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Módulo</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest hidden md:table-cell">Executor</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest hidden lg:table-cell">Responsável</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Duração / Enc.</th>
            </tr>
          </thead>
          <tbody>
            {phases?.map((phase, idx) => (
              <ModuleRow 
                key={phase.id} 
                phase={phase} 
                onRateMeeting={onRateMeeting}
                csatStatus={csatStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ModuleRow({ phase, onRateMeeting, csatStatus }: { phase: any, onRateMeeting: (m: any) => void, csatStatus: any[] | undefined }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <tr 
        className={cn(
          "group cursor-pointer transition-colors border-b border-neutral-100 last:border-0",
          isOpen ? "bg-white" : "hover:bg-neutral-50/50 bg-white"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={cn("transition-transform", isOpen ? "rotate-180" : "rotate-0")}>
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </div>
            <span className="text-sm font-bold text-neutral-900">{phase.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 hidden md:table-cell">
          <span className="text-xs font-medium text-neutral-500 capitalize">{phase.executorType || 'Consultor'}</span>
        </td>
        <td className="px-6 py-4 hidden lg:table-cell">
          <span className="text-xs font-medium text-neutral-500">{phase.responsibleConsultantNome || 'Não definido'}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[9px] font-bold uppercase w-fit border border-neutral-200/50">
            <div className={cn("h-1 w-1 rounded-full", 
              phase.status === 'concluida' ? "bg-green-500" : 
              phase.status === 'em_andamento' ? "bg-primary" : "bg-neutral-400"
            )} />
            {phase.status.replace('_', ' ')}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-4 text-xs font-bold text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {(phase.durationMinutes || 0) / 60}h
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              3/3
            </div>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-white border-b border-neutral-100">
          <td colSpan={5} className="px-8 py-0">
            <div className="pb-8 pt-4">
              <Tabs defaultValue="encontros" className="w-full">
                <TabsList className="bg-transparent border-b border-neutral-100 rounded-none h-auto p-0 mb-6 gap-8">
                  <TabsTrigger value="encontros" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-[10px] font-bold uppercase tracking-widest">Encontros</TabsTrigger>
                  <TabsTrigger value="materiais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-[10px] font-bold uppercase tracking-widest">Materiais de Apoio</TabsTrigger>
                  <TabsTrigger value="entregaveis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-[10px] font-bold uppercase tracking-widest">Entregáveis Cliente</TabsTrigger>
                </TabsList>
                
                <TabsContent value="encontros" className="mt-0">
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Progresso: 0/3 Encontros</div>
                    <PhaseMeetingsList 
                      moduleId={phase.id} 
                      onRateMeeting={onRateMeeting}
                      csatStatus={csatStatus}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="materiais" className="mt-0">
                  <div className="py-8 text-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    <p className="text-xs text-neutral-400 italic">Materiais de apoio vinculados a este módulo serão exibidos aqui.</p>
                  </div>
                </TabsContent>

                <TabsContent value="entregaveis" className="mt-0">
                  <div className="py-8 text-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    <p className="text-xs text-neutral-400 italic">Entregáveis pendentes ou concluídos deste módulo.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PhaseMeetingsList({ moduleId, onRateMeeting, csatStatus }: { moduleId: string, onRateMeeting: (m: any) => void, csatStatus?: any[] }) {
  const { meetings, isLoading } = useModuleMeetings(moduleId);
  if (isLoading) return <div className="space-y-3 mt-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
  if (!meetings || meetings.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
      {meetings.map((m) => {
        const isCompleted = m.status === 'realizada';
        const isScheduled = m.status === 'agendado';
        const csatInfo = csatStatus?.find(s => s.id === m.id);
        const isResponded = csatInfo?.isResponded;
        
        return (
          <Card key={m.id} className="p-4 bg-white border border-neutral-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-neutral-50 flex items-center justify-center text-[10px] font-bold text-neutral-400 border border-neutral-100 group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
                #{m.meetingNumber}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-neutral-900 truncate">{m.title || `Encontro ${m.meetingNumber}`}</p>
                  <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border", 
                    isCompleted ? "bg-green-50 text-green-600 border-green-100/50" : 
                    isScheduled ? "bg-amber-50 text-amber-600 border-amber-100/50" : "bg-neutral-50 text-neutral-400 border-neutral-100"
                  )}>
                    <div className={cn("h-1 w-1 rounded-full", isCompleted ? "bg-green-500" : isScheduled ? "bg-amber-500" : "bg-neutral-400")} />
                    {m.status}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 text-[10px] font-medium text-neutral-400">
                  {m.scheduledAt && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(m.scheduledAt), "dd/MM/yyyy 'às' HH:mm")}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[9px] text-neutral-300 font-bold">Consultor</span>
                    {m.consultantName || 'Não definido'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isCompleted && !isResponded && (
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold text-primary border-primary/20 hover:bg-primary/5" onClick={() => onRateMeeting(m)}>
                  <Star className="h-3 w-3 mr-1.5 fill-primary/10" /> AVALIAR
                </Button>
              )}
              {isResponded && <span className="text-[9px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded border border-green-100/50">Avaliado</span>}
              {!isCompleted && (
                <Button variant="outline" size="sm" className="h-9 px-4 text-[11px] font-bold text-neutral-900 border-neutral-200 hover:bg-neutral-50 shadow-sm">
                  {isScheduled ? 'Reagendar' : 'Agendar'}
                </Button>
              )}
            </div>
          </Card>
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

