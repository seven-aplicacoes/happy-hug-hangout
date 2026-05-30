import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useReunioes } from '@/hooks/useReunioes';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useContratos } from '@/hooks/useContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useConsultantAvailability } from '@/hooks/useConsultantAvailability';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Calendar, Clock, MapPin, Link as LinkIcon, AlignLeft, Users as UsersIcon, AlertTriangle, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
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
  const { user, perfil } = useAuth();
  const { upsertReuniao } = useReunioes();
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { consultores, isLoading: loadingConsultores } = useConsultores();
  const { contratos, isLoading: loadingContratos } = useContratos();
  
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
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phaseResponsibleId, setPhaseResponsibleId] = useState<string | null>(null);

  const { products: contractProducts, isLoading: loadingProducts } = useContractProducts(contractId);
  const { phases: productPhases, isLoading: loadingPhases } = useContractProductPhases(contractProductId);
  const { meetings: moduleMeetings, isLoading: loadingMeetings } = useContractModuleMeetings(contractProductPhaseId);
  
  const { availabilities, isLoading: loadingAvailability } = useConsultantAvailability({
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
      setMeetingUrl(reuniao.meetingUrl || '');
      setLocation(reuniao.location || '');
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
      setMeetingUrl(initialData.meetingUrl || '');
      setLocation(initialData.location || '');
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
      setMeetingUrl('');
      setLocation('');
      setDescription('');
    }
    setErrors({});
  }, [reuniao, initialData, open]);

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
    
    if (isLocked && !phaseResponsibleId && contractProductPhaseId && contractProductPhaseId !== 'none') {
      toast({ title: "Responsável ausente", description: "Defina um responsável no módulo antes de salvar.", variant: "destructive" });
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // Regra de reagendamento: 2 horas antes
      if (reuniao?.meetingDate && reuniao?.startTime) {
        const now = new Date();
        const scheduledDate = new Date(`${reuniao.meetingDate}T${reuniao.startTime}`);
        const diffInHours = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 2 && diffInHours > 0) {
          toast({
            title: "Reagendamento bloqueado",
            description: "Este encontro só pode ser reagendado até 2 horas antes do horário marcado.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 1. Availability validation (only if module/meeting is linked AND not manual source)
      const isCalendlyMeeting = reuniao?.source === 'calendly' || (reuniao as any)?.external_provider === 'calendly';
      
      if (!isCalendlyMeeting && contractModuleMeetingId && contractModuleMeetingId !== 'none' && availabilities && availabilities.length > 0) {
        const [year, month, day] = meetingDate.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const dayOfWeek = selectedDate.getDay(); 
        
        const matchingAvailability = availabilities.find(av => {
          const [sYear, sMonth, sDay] = av.start_date.split('-').map(Number);
          const [eYear, eMonth, eDay] = av.end_date.split('-').map(Number);
          const start = new Date(sYear, sMonth - 1, sDay);
          const end = new Date(eYear, eMonth - 1, eDay);
          
          const dateMatch = selectedDate >= start && selectedDate <= end;
          const weekdayMatch = av.weekday === dayOfWeek;
          
          if (dateMatch && weekdayMatch) {
            const timeMatch = startTime >= av.start_time && startTime <= av.end_time;
            return timeMatch;
          }
          return false;
        });

        if (!matchingAvailability) {
          toast({ 
            title: "Horário Indisponível", 
            description: "Este horário não está disponível para este encontro. Escolha uma data e horário configurados pelo consultor.", 
            variant: "destructive" 
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Conflict validation (only for manual meetings)
      if (!isCalendlyMeeting) {
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
            description: `Este consultor já possui uma reunião agendada (${conflictingMeeting.start_time} - ${conflictingMeeting.title}). Escolha outro horário disponível.`, 
            variant: "destructive" 
          });
          setIsSubmitting(false);
          return;
        }
      }

      const payload: Partial<Reuniao> = {
        id: reuniao?.id,
        title, tipo, clienteId,
        contractId: (contractId === 'none' || !contractId) ? null : contractId,
        contractProductId: (contractProductId === 'none' || !contractProductId) ? null : contractProductId,
        contractProductPhaseId: (contractProductPhaseId === 'none' || !contractProductPhaseId) ? null : contractProductPhaseId,
        contractModuleMeetingId: (contractModuleMeetingId === 'none' || !contractModuleMeetingId) ? null : contractModuleMeetingId,
        consultorId, status, meetingDate, startTime, duracao, meetingUrl, location, description,
        source: reuniao?.source || 'manual'
      };
      await upsertReuniao.mutateAsync(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11 px-6 font-bold">Cancelar</Button>
      <Button 
        onClick={handleSave} 
        disabled={isSubmitting || (contractModuleMeetingId && contractModuleMeetingId !== 'none' && (!availabilities || availabilities.length === 0) && !loadingAvailability)} 
        className="h-11 px-8 font-bold shadow-lg shadow-primary/20"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Reunião'}
      </Button>
    </div>
  );

  const summaryItem = (label: string, value: string | undefined | null) => (
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className="text-xs font-bold text-foreground truncate">{value || 'Não informado'}</span>
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
        {/* Resumo do Agendamento */}
        <div className="bg-muted/30 rounded-2xl p-6 border border-muted/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Info className="h-16 w-16" />
          </div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <UsersIcon className="h-3 w-3" /> Resumo do Agendamento
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
            {summaryItem('Cliente', selectedCliente?.nomeFantasia || selectedCliente?.razaoSocial)}
            {summaryItem('Contrato', selectedContrato ? `${selectedContrato.tipo} (${new Date(selectedContrato.dataInicio).toLocaleDateString()})` : null)}
            {summaryItem('Produto', selectedProduto?.productNome)}
            {summaryItem('Módulo', selectedModulo?.name)}
            {summaryItem('Encontro', selectedEncontro?.title || (selectedEncontro ? `Encontro ${selectedEncontro.meetingNumber}` : null))}
            {summaryItem('Consultor Responsável', selectedConsultor?.full_name)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.title && "text-destructive")}>Título da Reunião *</Label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ex: Alinhamento de Diagnóstico"
                className={cn("h-11 font-medium", errors.title && "border-destructive")} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="h-11 font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Check-in Semanal">Check-in Semanal</SelectItem>
                    <SelectItem value="Alinhamento Estratégico">Alinhamento Estratégico</SelectItem>
                    <SelectItem value="Apresentação de Resultados">Apresentação de Resultados</SelectItem>
                    <SelectItem value="Workshop / Treinamento">Workshop / Treinamento</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="h-11 font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="remarcada">Remarcada</SelectItem>
                    <SelectItem value="reagendada">Reagendada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Local / Link</Label>
              <div className="relative">
                <Input 
                  value={meetingUrl || location} 
                  onChange={e => { setMeetingUrl(e.target.value); setLocation(e.target.value); }} 
                  className="h-11 pl-10" 
                  placeholder="Meet, Zoom ou Endereço" 
                  disabled={reuniao?.source === 'calendly'}
                />
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Descrição / Pauta</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Descreva os tópicos principais..." 
                className="min-h-[120px] resize-none" 
                disabled={reuniao?.source === 'calendly'}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> Agenda e Disponibilidade
              </h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.meetingDate && "text-destructive")}>Data Disponível *</Label>
                  {availabilities && availabilities.length > 0 ? (
                    <Select value={meetingDate} onValueChange={setMeetingDate}>
                      <SelectTrigger className={cn("h-11 font-medium bg-white", errors.meetingDate && "border-destructive")}>
                        <SelectValue placeholder="Selecione uma data" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const availableDates: string[] = [];
                          availabilities.forEach(av => {
                            const [sYear, sMonth, sDay] = av.start_date.split('-').map(Number);
                            const [eYear, eMonth, eDay] = av.end_date.split('-').map(Number);
                            const current = new Date(sYear, sMonth - 1, sDay);
                            const end = new Date(eYear, eMonth - 1, eDay);

                            while (current <= end) {
                              if (current.getDay() === av.weekday) {
                                const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                                if (!availableDates.includes(dateStr)) {
                                  availableDates.push(dateStr);
                                }
                              }
                              current.setDate(current.getDate() + 1);
                            }
                          });

                          return availableDates.sort().map(date => {
                            const [y, m, d] = date.split('-').map(Number);
                            const slotDate = new Date(y, m - 1, d);
                            return (
                              <SelectItem key={date} value={date}>
                                {slotDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              </SelectItem>
                            );
                          });
                        })()}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="relative">
                       <Input 
                        type="date" 
                        value={meetingDate} 
                        onChange={e => setMeetingDate(e.target.value)} 
                        className={cn("h-11 pl-10 bg-white", errors.meetingDate && "border-destructive")} 
                        disabled={contractModuleMeetingId && contractModuleMeetingId !== 'none'}
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  {contractModuleMeetingId && contractModuleMeetingId !== 'none' && (!availabilities || availabilities.length === 0) && !loadingAvailability && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <AlertTriangle className="h-3 w-3" /> Nenhuma disponibilidade configurada.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.startTime && "text-destructive")}>Horário *</Label>
                    {availabilities && availabilities.length > 0 && meetingDate ? (
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger className={cn("h-11 font-medium bg-white", errors.startTime && "border-destructive")}>
                          <SelectValue placeholder="Horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const [y, m, d] = meetingDate.split('-').map(Number);
                            const selDate = new Date(y, m - 1, d);
                            const weekday = selDate.getDay();
                            
                            const matchingAvails = availabilities.filter(av => {
                              const [sYear, sMonth, sDay] = av.start_date.split('-').map(Number);
                              const [eYear, eMonth, eDay] = av.end_date.split('-').map(Number);
                              const start = new Date(sYear, sMonth - 1, sDay);
                              const end = new Date(eYear, eMonth - 1, eDay);
                              return av.weekday === weekday && selDate >= start && selDate <= end;
                            });

                            const timeSlots: string[] = [];
                            matchingAvails.forEach(av => {
                              let current = av.start_time;
                              const end = av.end_time;
                              while (current < end) {
                                timeSlots.push(current);
                                // Increment by slot duration (assume 60min if not set)
                                const [h, min] = current.split(':').map(Number);
                                const next = new Date();
                                next.setHours(h, min + (av.slot_duration_minutes || 60), 0);
                                current = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
                              }
                            });

                            return [...new Set(timeSlots)].sort().map(time => (
                              <SelectItem key={time} value={time}>
                                {time.substring(0, 5)}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="relative">
                        <Input 
                          type="time" 
                          value={startTime} 
                          onChange={e => setStartTime(e.target.value)} 
                          className={cn("h-11 pl-10 bg-white", errors.startTime && "border-destructive")} 
                          disabled={contractModuleMeetingId && contractModuleMeetingId !== 'none'}
                        />
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Duração (min)</Label>
                    <Input 
                      type="number" 
                      value={duracao} 
                      onChange={e => setDuracao(Number(e.target.value))} 
                      className="h-11 font-medium bg-white" 
                    />
                  </div>
                </div>
              </div>

              {/* Status da Disponibilidade */}
              {contractModuleMeetingId && contractModuleMeetingId !== 'none' && (
                <div className="pt-4 border-t border-primary/10">
                  {loadingAvailability ? (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verificando horários...
                    </div>
                  ) : availabilities && availabilities.length > 0 ? (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4" /> Horários disponíveis sincronizados.
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                      <p className="text-[10px] text-amber-800 font-black uppercase flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" /> Atenção
                      </p>
                      <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                        Nenhuma disponibilidade configurada para este encontro. Entre em contato com o consultor responsável.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return '';
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
