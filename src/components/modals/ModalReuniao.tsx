import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useReunioes } from '@/hooks/useReunioes';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useContratos } from '@/hooks/useContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useConsultantAvailability } from '@/hooks/useConsultantAvailability';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Calendar, Clock, Link as LinkIcon, Info, Video, AlertTriangle, Users as UsersIcon } from 'lucide-react';
import { checkConsultantConflict } from '@/lib/conflicts';
import { cn } from '@/lib/utils';
import type { Reuniao, StatusReuniao } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  reuniao?: Reuniao | null;
  initialData?: Partial<Reuniao>;
}

export const ModalReuniao = ({ open, onClose, reuniao, initialData }: Props) => {
  const { user } = useAuth();
  const { upsertReuniao, syncGoogle } = useReunioes();
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  const { contratos } = useContratos();
  
  const [title, setTitle] = useState('');
  const [tipo, setTipo] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [contractId, setContractId] = useState('');
  const [contractProductId, setContractProductId] = useState('');
  const [contractProductPhaseId, setContractProductPhaseId] = useState('');
  const [contractModuleMeetingId, setContractModuleMeetingId] = useState('');
  const [consultorId, setConsultorId] = useState('');
  const [status, setStatus] = useState<StatusReuniao>('agendada');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duracao, setDuracao] = useState(60);
  const [description, setDescription] = useState('');
  
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phaseResponsibleId, setPhaseResponsibleId] = useState<string | null>(null);
  const [meetingLinkMode, setMeetingLinkMode] = useState<'google' | 'manual'>('google');
  const [manualMeetingUrl, setManualMeetingUrl] = useState('');
  const [isGeneratingMeetLink, setIsGeneratingMeetLink] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoadingGoogleStatus, setIsLoadingGoogleStatus] = useState(true);

  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('diagnose-google-connection');
        if (error) throw error;
        setGoogleConnected(!!data?.connected);
      } catch (err) {
        console.error('Error checking Google connection:', err);
        setGoogleConnected(false);
      } finally {
        setIsLoadingGoogleStatus(false);
      }
    };

    if (open) {
      checkGoogleConnection();
    }
  }, [open]);

  useEffect(() => {
    if (!isLoadingGoogleStatus) {
      if (!googleConnected) {
        setMeetingLinkMode('manual');
      } else if (!reuniao && !initialData) {
        setMeetingLinkMode('google');
      }
    }
  }, [googleConnected, reuniao, initialData, isLoadingGoogleStatus]);

  const { products: contractProducts } = useContractProducts(contractId);
  const { phases: productPhases } = useContractProductPhases(contractProductId);
  const { meetings: moduleMeetings } = useContractModuleMeetings(contractProductPhaseId);
  
  const { availabilities, slots, isLoading: loadingAvailability } = useConsultantAvailability({
    contractModuleMeetingId: contractModuleMeetingId && contractModuleMeetingId !== 'none' ? contractModuleMeetingId : undefined,
    consultantId: consultorId || undefined
  });

  const selectedCliente = (clientes || []).find(c => c.id === clienteId);
  const selectedContrato = (contratos || []).find(c => c.id === contractId);
  const selectedProduto = (contractProducts || []).find(p => p.id === contractProductId);
  const selectedModulo = (productPhases || []).find(p => p.id === contractProductPhaseId);
  const selectedEncontro = (moduleMeetings || []).find(m => m.id === contractModuleMeetingId);
  const selectedConsultor = (consultores || []).find(c => c.id === consultorId);

  const isLocked = !!initialData || !!reuniao;

  useEffect(() => {
    if (reuniao) {
      setTitle(reuniao.title || '');
      setTipo(reuniao.tipo || '');
      setClienteId(reuniao.clienteId || '');
      setContractId(reuniao.contractId || '');
      setContractProductId(reuniao.contractProductId || '');
      setContractProductPhaseId(reuniao.contractProductPhaseId || '');
      setContractModuleMeetingId(reuniao.contractModuleMeetingId || '');
      setConsultorId(reuniao.consultorId || '');
      setStatus(reuniao.status || 'agendada');
      setMeetingDate(reuniao.meetingDate || '');
      setStartTime(reuniao.startTime || '');
      setDuracao(reuniao.duracao || 60);
      setManualMeetingUrl(reuniao.locationUrl || reuniao.location || reuniao.meetingUrl || '');
      setMeetingLinkMode(reuniao.meetingLinkProvider === 'google' ? 'google' : 'manual');
      setDescription(reuniao.description || '');
    } else if (initialData) {
      setTitle(initialData.title || '');
      setTipo(initialData.tipo || 'Check-in Semanal');
      setClienteId(initialData.clienteId || '');
      setContractId(initialData.contractId || '');
      setContractProductId(initialData.contractProductId || '');
      setContractProductPhaseId(initialData.contractProductPhaseId || '');
      setContractModuleMeetingId(initialData.contractModuleMeetingId || '');
      setConsultorId(initialData.consultorId || '');
      setStatus('agendada');
      setMeetingDate(initialData.meetingDate || '');
      setStartTime(initialData.startTime || '');
      setDuracao(initialData.duracao || 60);
      setManualMeetingUrl(initialData.locationUrl || initialData.location || initialData.meetingUrl || '');
      setMeetingLinkMode(initialData.meetingLinkProvider === 'google' ? 'google' : 'manual');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setTipo('Check-in Semanal');
      setClienteId('');
      setContractId('');
      setContractProductId('');
      setContractProductPhaseId('');
      setContractModuleMeetingId('');
      setConsultorId('');
      setStatus('agendada');
      setMeetingDate('');
      setStartTime('');
      setDuracao(60);
      setManualMeetingUrl('');
      setMeetingLinkMode(googleConnected ? 'google' : 'manual');
      setDescription('');
    }
    setErrors({});
  }, [reuniao, initialData, open, googleConnected, isLoadingGoogleStatus]);

  useEffect(() => {
    if (open && slots) {
      console.log("[ModalReuniao] Slots atualizados:", { 
        count: slots.length, 
        consultorId, 
        meetingDate,
        availCount: availabilities?.length 
      });
    }
  }, [slots, open, consultorId, meetingDate, availabilities]);

  useEffect(() => {
    if (contractProductPhaseId && contractProductPhaseId !== 'none') {
      const selectedPhase = productPhases?.find(p => p.id === contractProductPhaseId);
      if (selectedPhase?.responsibleConsultantId) {
        setPhaseResponsibleId(selectedPhase.responsibleConsultantId);
        if (!reuniao && (!consultorId || consultorId === '')) {
          setConsultorId(selectedPhase.responsibleConsultantId);
        }
      } else {
        setPhaseResponsibleId(null);
      }
    } else {
      setPhaseResponsibleId(null);
    }
  }, [contractProductPhaseId, productPhases, reuniao, consultorId]);

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!clienteId) newErrors.clienteId = true;
    if (!consultorId) newErrors.consultorId = true;
    if (!meetingDate) newErrors.meetingDate = true;
    if (!startTime) newErrors.startTime = true;
    
    if (Object.keys(newErrors).length > 0) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha todos os campos marcados com * antes de salvar.", 
        variant: "destructive" 
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEndTime = (start: string, durationMin: number) => {
    const [h, m] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + durationMin, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    console.log("Iniciando salvamento de reunião...");
    if (!validate()) {
      console.log("Validação falhou:", errors);
      return;
    }
    setIsSubmitting(true);
    
    try {
      // 1. Availability and Conflict validation
      const endTime = calculateEndTime(startTime, duracao);
      const { hasConflict, conflictingMeeting } = await checkConsultantConflict({
        consultantId: consultorId,
        date: meetingDate,
        startTime,
        endTime,
        ignoreMeetingId: reuniao?.id
      });

      if (hasConflict) {
        toast({ 
          title: "Conflito de Agenda", 
          description: `Este consultor já possui uma reunião agendada (${conflictingMeeting.start_time} - ${conflictingMeeting.title}).`, 
          variant: "destructive" 
        });
        setIsSubmitting(false);
        return;
      }

      const payload: Partial<Reuniao> = {
        id: reuniao?.id,
        title, tipo, clienteId,
        contractId: (contractId === 'none' || !contractId) ? null : contractId,
        contractProductId: (contractProductId === 'none' || !contractProductId) ? null : contractProductId,
        contractProductPhaseId: (contractProductPhaseId === 'none' || !contractProductPhaseId) ? null : contractProductPhaseId,
        contractModuleMeetingId: (contractModuleMeetingId === 'none' || !contractModuleMeetingId) ? null : contractModuleMeetingId,
        consultorId, status, meetingDate, startTime, duracao, 
        meetingUrl: meetingLinkMode === 'manual' ? manualMeetingUrl : undefined,
        location: meetingLinkMode === 'manual' ? manualMeetingUrl : undefined,
        locationUrl: meetingLinkMode === 'manual' ? manualMeetingUrl : undefined,
        meetingLinkProvider: meetingLinkMode,
        description,
        source: reuniao?.source || 'manual'
      };

      // 3. Upsert into Supabase first to get ID
      const result = await upsertReuniao.mutateAsync(payload);
      const savedMeeting = result?.[0];
      if (!savedMeeting) throw new Error("Falha ao salvar reunião.");

      // 4. Google Meet Sync
      if (meetingLinkMode === 'google' && status === 'agendada' && googleConnected) {
        setIsGeneratingMeetLink(true);
        try {
          await supabase.from('meetings').update({ sync_status: 'pending' }).eq('id', savedMeeting.id);
          await syncGoogle.mutateAsync({ 
            meetingId: savedMeeting.id,
            action: reuniao?.google_event_id ? 'update' : 'create'
          });
          toast({ title: "Agendado!", description: "Encontro agendado e link do Google Meet gerado." });
        } catch (err: any) {
          console.error('[Google Sync] Erro:', err);
          toast({ title: "Aviso", description: "Encontro salvo, mas houve erro na sincronização Google Meet.", variant: "warning" as any });
        } finally {
          setIsGeneratingMeetLink(false);
        }
      } else if (meetingLinkMode === 'manual' && manualMeetingUrl) {
        toast({ title: "Sucesso", description: "Encontro salvo com link manual." });
      } else {
        toast({ title: "Sucesso", description: "Encontro salvo." });
      }

      onClose();
    } catch (error: any) {
      console.error('[Meeting Schedule] Erro ao salvar:', error);
      toast({ 
        title: "Erro ao salvar", 
        description: error.message || "Ocorreu um erro inesperado ao salvar a reunião.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11 px-6 font-bold">Cancelar</Button>
      <Button 
        onClick={handleSave} 
        disabled={isSubmitting} 
        className="h-11 px-8 font-bold shadow-lg shadow-primary/20"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Reunião'}
      </Button>
    </div>
  );

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo={reuniao ? "Reagendar Encontro" : "Agendar Encontro"} 
      size="xl" 
      footer={footer}
    >
      <div className="space-y-8 py-2">
        <div className="bg-muted/30 rounded-2xl p-6 border border-muted/60 relative overflow-hidden group">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <UsersIcon className="h-3 w-3" /> Resumo do Agendamento
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Cliente</span>
              <span className="text-xs font-bold text-foreground truncate">{selectedCliente?.nomeFantasia || selectedCliente?.razaoSocial || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contrato</span>
              <span className="text-xs font-bold text-foreground truncate">{selectedContrato?.tipo || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Consultor</span>
              <span className="text-xs font-bold text-foreground truncate">{selectedConsultor?.full_name || '—'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.title && "text-destructive")}>Título da Reunião *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className={cn("h-11 font-medium bg-white", errors.title && "border-destructive")} />
            </div>

            <div className="space-y-4 pt-2">
              {googleConnected ? (
                meetingLinkMode === 'google' ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                        <Video className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-900">Google Meet (Conexão Global)</span>
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] h-4 px-1.5 uppercase font-black">Ativo</Badge>
                        </div>
                        <p className="text-[10px] text-blue-700/70 font-medium leading-relaxed">O link será gerado usando a conta do sistema.</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setMeetingLinkMode('manual')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4">Usar link manual</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Local / Link Manual</Label>
                    <div className="relative">
                      <Input value={manualMeetingUrl} onChange={e => setManualMeetingUrl(e.target.value)} className="h-11 pl-10 bg-white" placeholder="Link do Meet ou Zoom" />
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <button type="button" onClick={() => setMeetingLinkMode('google')} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors">
                      <Video className="h-3 w-3" /> Gerar link Google Meet
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Google Calendar não configurado</p>
                      <p className="text-[10px] text-amber-700/70">A conexão global ainda não foi realizada pelo administrador. Use link manual.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Local / Link Manual</Label>
                    <Input value={manualMeetingUrl} onChange={e => setManualMeetingUrl(e.target.value)} className="h-11 bg-white" placeholder="Link ou Local" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da pauta..." className="min-h-[100px]" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4">
              <div className="space-y-2">
                <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.meetingDate && "text-destructive")}>Data Disponível *</Label>
                <div className="relative">
                  <Select 
                    value={meetingDate} 
                    onValueChange={(val) => {
                      setMeetingDate(val);
                      setStartTime(''); // Reset time when date changes
                    }}
                    disabled={!consultorId || loadingAvailability}
                  >
                    <SelectTrigger className={cn("h-11 pl-10 bg-white shadow-sm transition-all focus:ring-2 focus:ring-primary/20", errors.meetingDate && "border-destructive")}>
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={!consultorId ? "Selecione um consultor primeiro" : "Selecione uma data disponível"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAvailability ? (
                        <div className="p-4 flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Buscando datas...</span>
                        </div>
                      ) : availabilities && availabilities.length > 0 ? (
                        // Extract unique dates from slots for the selected consultant
                        Array.from(new Set(slots?.map(s => s.available_date) || []))
                          .sort()
                          .map(dateStr => {
                            const dateObj = new Date(dateStr + 'T12:00:00');
                            const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short' });
                            return (
                              <SelectItem key={dateStr} value={dateStr}>
                                {formattedDate}
                              </SelectItem>
                            );
                          })
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-amber-600 font-medium italic">O consultor responsável ainda não cadastrou disponibilidade.</p>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {!consultorId && (
                  <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3" /> Selecione o consultor para ver as datas.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.startTime && "text-destructive")}>Horário Disponível *</Label>
                  <Select 
                    value={startTime} 
                    onValueChange={setStartTime}
                    disabled={!meetingDate || loadingAvailability}
                  >
                    <SelectTrigger className={cn("h-11 bg-white shadow-sm transition-all focus:ring-2 focus:ring-primary/20", errors.startTime && "border-destructive")}>
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                      <span className="pl-6">
                        <SelectValue placeholder={!meetingDate ? "Aguardando data..." : "Selecione o horário"} />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {slots?.filter(s => s.available_date === meetingDate).length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-xs text-amber-600 font-medium">Não há horários para esta data.</p>
                        </div>
                      ) : (
                        slots
                          ?.filter(s => s.available_date === meetingDate)
                          .map(slot => {
                            const timeStr = slot.start_time.substring(0, 5);
                            const isBooked = slot.is_booked && (!reuniao || slot.start_time !== reuniao.startTime || meetingDate !== reuniao.meetingDate);
                            
                            return (
                              <SelectItem 
                                key={slot.id} 
                                value={timeStr} 
                                disabled={isBooked}
                                className={cn(isBooked && "opacity-50 cursor-not-allowed")}
                              >
                                {timeStr} {isBooked ? '(Ocupado)' : ''}
                              </SelectItem>
                            );
                          })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Duração (min)</Label>
                  <Input 
                    type="number" 
                    value={duracao} 
                    onChange={e => setDuracao(Number(e.target.value))} 
                    className="h-11 bg-white shadow-sm focus:ring-2 focus:ring-primary/20" 
                    step={15}
                    min={15}
                  />
                </div>
              </div>

              {consultorId && meetingDate && !loadingAvailability && availabilities?.length === 0 && (
                <p className="text-[10px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 italic flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  O consultor responsável ainda não cadastrou disponibilidade para este período.
                </p>
              )}

              {meetingDate && slots?.filter(s => s.available_date === meetingDate && !s.is_booked).length === 0 && !loadingAvailability && (
                <p className="text-[10px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 italic flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  Não há horários livres disponíveis para esta data.
                </p>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
