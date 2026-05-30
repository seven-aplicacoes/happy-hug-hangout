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
  Clock, 
  FileText, 
  Star,
  LayoutDashboard,
  History,
  FileCheck,
  ExternalLink,
  MessageCircle,
  Briefcase,
  DollarSign,
  Users,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { useClienteContratos } from '@/hooks/useClienteContratos';
import { useClientCSAT } from '@/hooks/useClientCSAT';
import { useClienteHistorico } from '@/hooks/useClienteHistorico';
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
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractJourneyCard } from '@/components/contracts/ContractJourneyCard';
import { StatusTag } from '@/components/StatusTag';
import { labelStatus } from '@/data/mockData';
import { Accordion } from '@/components/ui/accordion';


export default function PortalClientePage() {
  const { clienteSession, loginCliente, logoutCliente } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  
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

  const { submitCSAT } = useClientCSAT(clientId);
  const { historico, isLoading: loadingHist } = useClienteHistorico(clientId);
  const { summary, isLoading: loadingSummary } = usePortalSummary(clientId);
  const { csatStatus } = usePortalCSAT(clientId);

  const isLoading = loadingFicha || loadingContratos || loadingHist || loadingSummary;


  const handleLogin = async () => {
    setErro('');
    const res = await loginCliente(email, senha);
    if (!res.ok) setErro(res.erro || 'Erro ao entrar.');
  };

  const handleOpenCsat = (meeting: any) => {
    setSelectedMeeting(meeting);
    setCsatRatings({ meeting: 0, consultant: 0, clarity: 0, nps: 0, comment: '' });
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
    const phone = "5511999999999"; 
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
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@empresa.com.br" className="bg-neutral-50 border-neutral-200 focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-xs font-medium uppercase tracking-wider text-neutral-500">Senha</Label>
              <Input id="pass" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="••••••••" className="bg-neutral-50 border-neutral-200 focus:ring-primary/20" />
            </div>
            {erro && <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">{erro}</p>}
            <Button className="w-full py-6 text-base font-medium shadow-lg shadow-primary/20 mt-2" onClick={handleLogin}>Acessar Portal</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
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
            <Button size="sm" className="hidden md:flex bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={handleContactConsultant}>
              <MessageCircle className="h-4 w-4 mr-2" /> Falar com consultor
            </Button>
            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-red-600" onClick={logoutCliente}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-12">
        {/* Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <IndicatorCard title="Encontros Previstos" value={`${summary?.totalMeetings || 0}`} icon={<Calendar className="h-5 w-5 text-blue-500" />} />
          <IndicatorCard title="Encontros Realizados" value={`${summary?.realizedMeetings || 0} de ${summary?.totalMeetings || 0}`} icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} />
          <IndicatorCard title="Próxima Reunião" value={summary?.nextMeetingDate ? format(new Date(summary.nextMeetingDate), "dd/MM/yy 'às' HH:mm") : 'Nenhuma agendada'} icon={<Clock className="h-5 w-5 text-amber-500" />} />
          <IndicatorCard title="CSAT Pendente" value={`${csatStatus?.filter(s => !s.isResponded).length || 0}`} icon={<Star className="h-5 w-5 text-yellow-500" />} />
        </div>

        {/* 1. Journey Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">Produtos e Jornada de Execução</h2>
          </div>

          <Accordion type="single" collapsible className="w-full" defaultValue={activeContract?.id}>
            {contratos?.map(contrato => (
              <ContractJourneyCard 
                key={contrato.id} 
                contrato={contrato} 
                expanded={contrato.id === activeContract?.id} 
                mode="client" 
              />
            ))}
          </Accordion>

          {contratos?.length === 0 && (
            <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-neutral-100">
              <LayoutDashboard className="h-10 w-10 text-neutral-200 mx-auto mb-4" />
              <p className="text-neutral-400 text-sm">Nenhum contrato ativo encontrado.</p>
            </div>
          )}
        </section>

        <Separator />

        {/* 2. History Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-neutral-900 uppercase tracking-tight">Histórico de Reuniões</h2>
          </div>
          <div className="space-y-4">
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
              <div className="py-12 text-center bg-white rounded-xl border-2 border-dashed border-neutral-100">
                <p className="text-neutral-400 text-sm">Nenhum registro no histórico.</p>
              </div>
            )}
          </div>
        </section>

      </div>

      <Dialog open={isCsatOpen} onOpenChange={setIsCsatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Avaliação do Encontro</DialogTitle>
            <DialogDescription>Como foi sua experiência no encontro: <span className="font-semibold text-neutral-900">{selectedMeeting?.title}</span>?</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-sm font-medium">Nota da reunião (1-5)</Label><StarRating value={csatRatings.meeting} onChange={(v) => setCsatRatings(prev => ({ ...prev, meeting: v }))} /></div>
              <div className="space-y-2 pt-2 border-t border-neutral-100"><Label className="text-sm font-medium">Recomendaria a Seven? (NPS 0-10)</Label><NpsScale value={csatRatings.nps} onChange={(v) => setCsatRatings(prev => ({ ...prev, nps: v }))} /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">Comentário</Label><Textarea placeholder="Sua opinião..." value={csatRatings.comment} onChange={(e) => setCsatRatings(prev => ({ ...prev, comment: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSubmitCsat} disabled={csatRatings.meeting === 0}>Enviar Feedback</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IndicatorCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="p-4 border-none shadow-sm bg-white flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{title}</p>
        <p className="text-sm font-semibold text-neutral-900 truncate">{value}</p>
      </div>
    </Card>
  );
}

function ContractSection({ contrato, products, currentProductId, phases, onRateMeeting, csatStatus }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 border border-neutral-100"><Briefcase className="h-7 w-7" /></div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-neutral-900">{contrato.tipo}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 uppercase text-[9px]">{contrato.status}</Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Consultor: {contrato.consultorNome}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? <ChevronUp /> : <ChevronDown />}</Button>
          </div>
        </div>
      </Card>

      {isExpanded && products?.map((product: any) => (
        <Card key={product.id} className="border border-neutral-100 shadow-sm bg-white overflow-hidden">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/30">
            <h4 className="text-lg font-bold text-neutral-900">{product.productNome}</h4>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white border-b border-neutral-100">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase">Módulo</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase">Duração</th>
                </tr>
              </thead>
              <tbody>
                {phases?.map((phase: any) => (
                  <ModuleRow key={phase.id} phase={phase} onRateMeeting={onRateMeeting} csatStatus={csatStatus} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ModuleRow({ phase, onRateMeeting, csatStatus }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <tr className="group cursor-pointer hover:bg-neutral-50/50" onClick={() => setIsOpen(!isOpen)}>
        <td className="px-6 py-4 font-bold text-sm">{phase.name}</td>
        <td className="px-6 py-4 uppercase text-[9px] font-bold">{phase.status}</td>
        <td className="px-6 py-4 text-xs">{(phase.durationMinutes || 0) / 60}h</td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={3} className="px-6 pb-6">
            <PhaseMeetingsList moduleId={phase.id} onRateMeeting={onRateMeeting} csatStatus={csatStatus} />
          </td>
        </tr>
      )}
    </>
  );
}

function PhaseMeetingsList({ moduleId, onRateMeeting, csatStatus }: any) {
  const { meetings, isLoading } = useModuleMeetings(moduleId);
  if (isLoading) return <Skeleton className="h-20 w-full" />;
  return (
    <div className="space-y-2">
      {meetings?.map((m: any) => {
        const isCompleted = m.status === 'realizada';
        const isResponded = csatStatus?.find((s: any) => s.id === m.id)?.isResponded;
        return (
          <div key={m.id} className="p-3 bg-neutral-50 rounded-lg flex justify-between items-center border border-neutral-100">
            <span className="text-xs font-medium">{m.title}</span>
            {isCompleted && !isResponded && (
              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => onRateMeeting(m)}>AVALIAR</Button>
            )}
            {isResponded && <Badge variant="secondary" className="text-[8px]">AVALIADO</Badge>}
          </div>
        );
      })}
    </div>
  );
}

function StarRating({ value, onChange }: any) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}><Star className={cn("h-6 w-6", value >= s ? "fill-yellow-400 text-yellow-400" : "text-neutral-200")} /></button>
      ))}
    </div>
  );
}

function NpsScale({ value, onChange }: any) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: 11 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className={cn("h-8 w-8 flex items-center justify-center rounded border", value === i ? "bg-primary text-white" : "bg-white")}>{i}</button>
      ))}
    </div>
  );
}
