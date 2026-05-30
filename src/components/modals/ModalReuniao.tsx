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
  
  const { slots, availabilities, isLoading: loadingAvailability } = useConsultantAvailability({
    contractModuleMeetingId: contractModuleMeetingId && contractModuleMeetingId !== 'none' ? contractModuleMeetingId : undefined,
    contractPhaseId: contractProductPhaseId && contractProductPhaseId !== 'none' ? contractProductPhaseId : undefined,
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
      // 1. Availability validation (only if module/meeting is linked)
      if (contractModuleMeetingId && contractModuleMeetingId !== 'none' && availabilities && availabilities.length > 0) {
        const selectedDate = new Date(meetingDate);
        const dayOfWeek = selectedDate.getDay(); 
        
        const isWithinPeriod = availabilities.some(av => {
          const startDate = new Date(av.start_date);
          const endDate = new Date(av.end_date);
          const dateMatch = selectedDate >= startDate && selectedDate <= endDate;
          const weekdayMatch = av.weekday === dayOfWeek;
          
          // Se o consultor definiu slots exatos, validamos contra o start_time dos slots
          if (slots && slots.length > 0) {
             return slots.some(s => s.available_date === meetingDate && s.start_time === startTime && !s.is_booked);
          }
          
          const timeMatch = startTime >= av.start_time && startTime <= av.end_time;
          return dateMatch && weekdayMatch && timeMatch;
        });

        if (!isWithinPeriod) {
          toast({ 
            title: "Fora da Disponibilidade", 
            description: "Este horário não está disponível para agendamento. Escolha um dos horários liberados pelo consultor.", 
            variant: "destructive" 
          });
          setIsSubmitting(false);
          return;
        }
      } else if (contractModuleMeetingId && contractModuleMeetingId !== 'none' && (!availabilities || availabilities.length === 0) && !loadingAvailability) {
        // Se tem encontro vinculado mas não tem disponibilidade configurada
        toast({ 
          title: "Sem Disponibilidade", 
          description: "Nenhuma disponibilidade configurada para este encontro. Entre em contato com o consultor.", 
          variant: "destructive" 
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Conflict validation
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
        disabled={isSubmitting || (contractModuleMeetingId && contractModuleMeetingId !== 'none' && (!slots || slots.length === 0) && !loadingAvailability)} 
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
                  {slots && slots.length > 0 ? (
                    <Select value={meetingDate} onValueChange={setMeetingDate}>
                      <SelectTrigger className={cn("h-11 font-medium bg-white", errors.meetingDate && "border-destructive")}>
                        <SelectValue placeholder="Selecione uma data" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(slots.map(s => s.available_date))).sort().map(date => {
                          const slotDate = new Date(date + 'T00:00:00');
                          return (
                            <SelectItem key={date} value={date}>
                              {slotDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                            </SelectItem>
                          );
                        })}
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
                  {contractModuleMeetingId && contractModuleMeetingId !== 'none' && (!slots || slots.length === 0) && !loadingAvailability && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <AlertTriangle className="h-3 w-3" /> Nenhuma disponibilidade configurada.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.startTime && "text-destructive")}>Horário *</Label>
                    {slots && slots.length > 0 && meetingDate ? (
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger className={cn("h-11 font-medium bg-white", errors.startTime && "border-destructive")}>
                          <SelectValue placeholder="Horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {slots
                            .filter(s => s.available_date === meetingDate && !s.is_booked)
                            .map(slot => (
                              <SelectItem key={slot.id} value={slot.start_time}>
                                {slot.start_time.substring(0, 5)}
                              </SelectItem>
                            ))
                          }
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
                  ) : slots && slots.length > 0 ? (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4" /> Horários disponíveis sincronizados.
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                      <p className="text-[10px] text-amber-800 font-black uppercase flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" /> Atenção
                      </p>
                      <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                        O consultor responsável ainda não configurou os horários para este encontro.
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
