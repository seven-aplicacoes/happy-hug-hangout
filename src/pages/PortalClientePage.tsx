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
  Circle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { useClienteContratos } from '@/hooks/useClienteContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useClienteDocumentos } from '@/hooks/useClienteDocumentos';
import { useClientCSAT } from '@/hooks/useClientCSAT';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PortalClientePage() {
  const { clienteSession, loginCliente, logoutCliente } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  
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
    contratos?.find(c => c.status === 'ativo' || c.status === 'em_onboarding'),
    [contratos]
  );

  const { products, isLoading: loadingProducts } = useContractProducts(activeContract?.id);
  const activeProduct = useMemo(() => products?.[0], [products]);

  const { phases, isLoading: loadingPhases } = useContractProductPhases(activeProduct?.id);
  const { documentos, isLoading: loadingDocs } = useClienteDocumentos(clientId);
  const { responses: csatResponses, submitCSAT } = useClientCSAT(clientId);

  const isLoading = loadingFicha || loadingContratos || loadingProducts || loadingPhases || loadingDocs;

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
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 col-span-2" />
            <Skeleton className="h-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const clientDeliverables = documentos?.filter(d => d.visibility === 'client' || d.visibility === 'all') || [];
  
  // Get all meetings from all phases to show history and upcoming
  // Since we don't have a direct hook for all meetings of a client that are part of the journey easily
  // we'll rely on the phases' meetings.
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur-md">
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
            <Button variant="ghost" size="sm" className="text-neutral-500" onClick={logoutCliente}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-light text-neutral-900">
              Bem-vindo, <span className="font-semibold text-primary">{cliente?.nomeFantasia}</span>
            </h1>
            <p className="text-neutral-500">Acompanhe em tempo real o progresso da sua consultoria.</p>
          </div>
          
          <Card className="bg-white border-none shadow-sm flex items-center gap-4 p-4 pr-6 min-w-[300px]">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Consultor Responsável</p>
              <p className="font-medium text-neutral-900">{activeContract?.consultorNome || cliente?.consultorNome}</p>
            </div>
          </Card>
        </div>

        {/* Journey Progress */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Progresso da Consultoria
            </h2>
            <div className="text-sm font-medium text-neutral-500 bg-white px-3 py-1 rounded-full shadow-sm border border-neutral-100">
              Produto: <span className="text-neutral-900 font-bold">{activeProduct?.productNome || 'Consultoria'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Phase Stepper */}
            <div className="xl:col-span-8 space-y-4">

              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <ScrollArea className="h-[500px] w-full p-6">
                  <div className="relative pl-8 space-y-10">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-neutral-100" />
                    
                    {phases?.map((phase, idx) => {
                      const isCompleted = phase.status === 'concluida';
                      const isCurrent = phase.status === 'em_andamento';
                      
                      return (
                        <div key={phase.id} className="relative">
                          <div className={cn(
                            "absolute -left-[25px] h-4 w-4 rounded-full border-2 bg-white z-10",
                            isCompleted ? "border-green-500 bg-green-500" : 
                            isCurrent ? "border-primary bg-primary animate-pulse" : "border-neutral-200"
                          )}>
                            {isCompleted && <CheckCircle className="h-3 w-3 text-white absolute inset-0 m-auto" />}
                          </div>
                          
                          <div className={cn(
                            "space-y-4 p-5 rounded-xl border transition-all",
                            isCurrent ? "bg-primary/[0.02] border-primary/20 ring-1 ring-primary/5" : "bg-white border-neutral-100"
                          )}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Módulo {idx + 1}</span>
                                  {isCurrent && <StatusTag label="Fase Atual" />}
                                </div>
                                <h3 className="font-semibold text-lg text-neutral-900">{phase.name}</h3>
                                {phase.clientNotes && (
                                  <p className="text-sm text-neutral-500 mt-1 max-w-lg">{phase.clientNotes}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
                                  <Clock className="h-3.5 w-3.5" />
                                  {phase.durationMinutes ? `${phase.durationMinutes} min previstos` : 'Tempo flexível'}
                                </div>
                              </div>
                            </div>

                            {/* Phase Meetings List (Simplified for client) */}
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

            {/* Sidebar: Deliverables & Next Steps */}
            <div className="xl:col-span-4 space-y-6">

              {/* Deliverables */}
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Entregáveis Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-1">
                    {clientDeliverables.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-xs text-neutral-400 italic">Nenhum entregável disponível no momento.</p>
                      </div>
                    ) : (
                      clientDeliverables.map(doc => (
                        <a 
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between px-6 py-3 hover:bg-neutral-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]">{doc.titulo}</p>
                              <p className="text-[10px] text-neutral-400">Disponibilizado em {format(new Date(doc.data), 'dd/MM/yy')}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-primary transition-colors" />
                        </a>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Status & Alerts (Client facing) */}
              <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <SevenLogo fill="white" height={100} />
                </div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Status da Jornada
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold">Tudo em dia!</p>
                    <p className="text-primary-foreground/80 text-sm">Sua consultoria está seguindo o cronograma planejado.</p>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <p className="text-primary-foreground/60">Data de Início</p>
                      <p className="font-medium">{activeContract?.dataInicio ? format(new Date(activeContract.dataInicio), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}</p>
                    </div>
                    <div className="text-xs text-right">
                      <p className="text-primary-foreground/60">Status do Contrato</p>
                      <StatusTag label={activeContract?.status || 'Ativo'} className="bg-white/20 text-white border-none" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>


      {/* CSAT Dialog */}
      <Dialog open={isCsatOpen} onOpenChange={setIsCsatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Sua avaliação é importante
            </DialogTitle>
            <DialogDescription>
              Como foi sua experiência no encontro: <span className="font-semibold text-neutral-900">{selectedMeeting?.title}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">O encontro atingiu as expectativas?</Label>
                <StarRating value={csatRatings.meeting} onChange={(v) => setCsatRatings(prev => ({ ...prev, meeting: v }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">O consultor foi claro e eficiente?</Label>
                <StarRating value={csatRatings.consultant} onChange={(v) => setCsatRatings(prev => ({ ...prev, consultant: v }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">A clareza dos próximos passos foi:</Label>
                <StarRating value={csatRatings.clarity} onChange={(v) => setCsatRatings(prev => ({ ...prev, clarity: v }))} />
              </div>
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <Label className="text-sm font-medium">Em uma escala de 0 a 10, o quanto você recomendaria a Seven?</Label>
                <NpsScale value={csatRatings.nps} onChange={(v) => setCsatRatings(prev => ({ ...prev, nps: v }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Comentários adicionais (opcional)</Label>
                <Textarea 
                  placeholder="Conte-nos um pouco mais sobre sua percepção..."
                  value={csatRatings.comment}
                  onChange={(e) => setCsatRatings(prev => ({ ...prev, comment: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCsatOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitCsat} disabled={csatRatings.meeting === 0 || submitCSAT.isPending}>
              {submitCSAT.isPending ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component for listing meetings of a module
function PhaseMeetingsList({ moduleId, onRateMeeting, responses }: { moduleId: string, onRateMeeting: (m: any) => void, responses: any[] }) {
  const { meetings, isLoading } = useContractModuleMeetings(moduleId);

  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;

  if (!meetings || meetings.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {meetings.map((m) => {
        const isCompleted = m.status === 'realizada';
        const isScheduled = m.status === 'agendado';
        const isResponded = responses?.some(r => r.meeting_id === m.id);

        return (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-neutral-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center border",
                isCompleted ? "bg-green-50 text-green-600 border-green-100" : 
                isScheduled ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-neutral-50 text-neutral-400 border-neutral-100"
              )}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{m.title || `Encontro ${m.meetingNumber}`}</p>
                <p className="text-[11px] text-neutral-500">
                  {isCompleted && m.completedAt ? `Realizado em ${format(new Date(m.completedAt), "dd/MM/yyyy")}` : 
                   isScheduled && m.scheduledAt ? `Agendado para ${format(new Date(m.scheduledAt), "dd/MM/yyyy 'às' HH:mm")}` : 
                   'Aguardando agendamento'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCompleted && !isResponded && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5"
                  onClick={() => onRateMeeting(m)}
                >
                  <Star className="h-3.5 w-3.5 mr-1.5 fill-primary/10" />
                  Avaliar Encontro
                </Button>
              )}
              {isResponded && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-100 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle className="h-3 w-3" />
                  Avaliado
                </div>
              )}
              {isScheduled && m.scheduledAt && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Confirmado
                </div>
              )}
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
        <button
          key={star}
          onClick={() => onChange(star)}
          className={cn(
            "transition-all",
            value >= star ? "text-yellow-400 scale-110" : "text-neutral-200 hover:text-neutral-300"
          )}
        >
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
        <button
          key={i}
          onClick={() => onChange(i)}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-md text-xs font-bold border transition-all",
            value === i ? "bg-primary border-primary text-white scale-110 z-10" : "bg-white border-neutral-200 text-neutral-500 hover:border-primary/50"
          )}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
