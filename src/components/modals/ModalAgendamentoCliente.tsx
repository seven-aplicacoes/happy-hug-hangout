import { useState, useMemo, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Loader2, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { useConsultantAvailability } from '@/hooks/useConsultantAvailability';
import { useReunioes } from '@/hooks/useReunioes';
import { ContractModuleMeeting } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { checkConsultantConflict } from '@/lib/conflicts';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
  moduleMeeting: ContractModuleMeeting;
}

export const ModalAgendamentoCliente = ({ open, onClose, moduleMeeting }: Props) => {
  const { toast } = useToast();
  const { slots, isLoading: loadingSlots } = useConsultantAvailability({
    contractModuleMeetingId: moduleMeeting.id,
    consultantId: moduleMeeting.consultantId
  });
  const { upsertReuniao } = useReunioes();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consultantCalendly, setConsultantCalendly] = useState<{
    connected: boolean;
    schedulingUrl: string | null;
    loaded: boolean;
  }>({ connected: false, schedulingUrl: null, loaded: false });

  // Check if consultant has Calendly connected
  useEffect(() => {
    async function checkCalendly() {
      if (!moduleMeeting.consultantId) {
        setConsultantCalendly(prev => ({ ...prev, loaded: true }));
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('calendly_connected, calendly_scheduling_url')
        .eq('id', moduleMeeting.consultantId)
        .maybeSingle();
        
      if (!error && data) {
        setConsultantCalendly({
          connected: !!data.calendly_connected,
          schedulingUrl: data.calendly_scheduling_url,
          loaded: true
        });
      } else {
        setConsultantCalendly(prev => ({ ...prev, loaded: true }));
      }
    }
    checkCalendly();
  }, [moduleMeeting.consultantId]);

  const handleAgendarCalendly = async () => {
    if (!consultantCalendly?.schedulingUrl) {
      toast({
        title: "Calendly não configurado",
        description: "O consultor responsável ainda não conectou o Calendly. Entre em contato com a equipe.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create a session token
      const sessionToken = crypto.randomUUID();
      
      // 2. Save session to DB
      const { error: sessionError } = await supabase
        .from('calendly_booking_sessions')
        .insert({
          session_token: sessionToken,
          client_id: moduleMeeting.clientId,
          contract_id: moduleMeeting.contractId,
          contract_product_id: moduleMeeting.productId,
          contract_phase_id: moduleMeeting.moduleId,
          contract_module_meeting_id: moduleMeeting.id,
          consultant_id: moduleMeeting.consultantId,
          status: 'pending'
        });

      if (sessionError) throw sessionError;

      // 3. Open Calendly with session token in tracking params
      // We use utm_term or salesforce_uuid as custom external ID mapping is limited in free tier
      // but 'utm_term' usually works well for tracking.
      const calendlyUrl = new URL(consultantCalendly.schedulingUrl);
      calendlyUrl.searchParams.set('utm_term', sessionToken);
      
      window.open(calendlyUrl.toString(), '_blank');
      
      toast({
        title: "Calendly aberto",
        description: "Conclua seu agendamento na página do Calendly. O sistema atualizará automaticamente assim que confirmado.",
      });
      
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao iniciar agendamento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter slots by selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate || !slots) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return slots.filter(s => s.available_date === dateStr && !s.is_booked);
  }, [selectedDate, slots]);

  // Generate days for the calendar view
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const hasSlots = slots?.some(s => s.available_date === dateStr && !s.is_booked);
      const isPast = !isAfter(day, subMonths(startOfToday(), 0)) && !isSameDay(day, startOfToday());
      
      return {
        date: day,
        hasSlots,
        isPast,
        isToday: isSameDay(day, startOfToday())
      };
    });
  }, [currentMonth, slots]);

  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));

  const handleConfirmManual = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    
    try {
      // Regra de reagendamento: 2 horas antes
      if (moduleMeeting.scheduledAt) {
        const now = new Date();
        const scheduledDate = new Date(moduleMeeting.scheduledAt);
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

      const endTime = calculateEndTime(selectedSlot.start_time, selectedSlot.duration_minutes);
      
      const { hasConflict, conflictingMeeting } = await checkConsultantConflict({
        consultantId: moduleMeeting.consultantId!,
        date: selectedSlot.available_date,
        startTime: selectedSlot.start_time,
        endTime: endTime,
        ignoreMeetingId: moduleMeeting.scheduledMeetingId // Ignore self when rescheduling
      });

      if (hasConflict) {
        toast({
          title: "Este horário já está ocupado na agenda do consultor.",
          description: "Escolha outro horário disponível.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      await upsertReuniao.mutateAsync({
        id: moduleMeeting.scheduledMeetingId, 
        clienteId: moduleMeeting.clientId,
        contractId: moduleMeeting.contractId,
        contractProductId: moduleMeeting.productId,
        contractProductPhaseId: moduleMeeting.moduleId,
        contractModuleMeetingId: moduleMeeting.id,
        consultorId: moduleMeeting.consultantId,
        title: moduleMeeting.title || `Encontro ${moduleMeeting.meetingNumber}`,
        meetingDate: selectedSlot.available_date,
        startTime: selectedSlot.start_time,
        duracao: selectedSlot.duration_minutes,
        status: 'agendada',
        source: 'portal_cliente'
      });

      toast({ title: "Agendado!", description: "Seu encontro foi agendado com sucesso." });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível realizar o agendamento.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
      {!consultantCalendly?.connected && (
        <Button onClick={handleConfirmManual} disabled={!selectedSlot || isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Agendamento'}
        </Button>
      )}
    </div>
  );

  return (
    <BaseModal open={open} onClose={onClose} titulo="Agendar Encontro" footer={footer} size="xl">
      <div className="space-y-6">
        {/* Consultant Info and Calendly Option */}
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary border-2 border-primary/20">
              {moduleMeeting.consultantName?.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-0.5">Consultor Responsável</h3>
              <p className="text-base font-bold text-foreground">{moduleMeeting.consultantName || 'Não atribuído'}</p>
              <p className="text-xs text-muted-foreground">{moduleMeeting.title}</p>
            </div>
          </div>

          {consultantCalendly?.connected ? (
            <Button 
              onClick={handleAgendarCalendly} 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-12 px-6 font-bold"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Iniciando...' : 'Agendar via Calendly'}
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-700 text-[11px] font-bold uppercase">
              <AlertTriangle className="h-4 w-4" />
              Calendly não conectado - Agendamento Manual
            </div>
          )}
        </div>

        {!consultantCalendly?.connected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" /> 1. Selecione a Data
                </h4>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-[11px] font-bold uppercase min-w-[100px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 border rounded-xl p-2 bg-white">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-center py-2 text-[10px] font-black text-muted-foreground/50">{d}</div>
                ))}
                {calendarDays.map((day, i) => {
                  const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                  const canSelect = day.hasSlots && !day.isPast;

                  return (
                    <button
                      key={i}
                      disabled={!canSelect}
                      onClick={() => {
                        setSelectedDate(day.date);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all relative group",
                        isSelected ? "bg-primary text-white shadow-md scale-105" : 
                        canSelect ? "hover:bg-primary/10 text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
                      )}
                    >
                      {format(day.date, 'd')}
                      {day.hasSlots && !day.isPast && !isSelected && (
                        <div className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> 2. Horários Disponíveis
              </h4>
              
              {loadingSlots ? (
                 <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-50" /></div>
              ) : !selectedDate ? (
                <div className="py-20 text-center bg-muted/20 rounded-xl border border-dashed flex flex-col items-center gap-3">
                  <Calendar className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">Selecione uma data no calendário</p>
                </div>
              ) : slotsForSelectedDate.length === 0 ? (
                <div className="py-20 text-center bg-muted/20 rounded-xl border border-dashed flex flex-col items-center gap-3">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight text-center px-4">Nenhum horário disponível para esta data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {slotsForSelectedDate.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all hover:border-primary group",
                        selectedSlot?.id === slot.id ? "bg-primary text-white border-primary shadow-lg" : "bg-white border-muted"
                      )}
                    >
                      <span className="text-base font-black tabular-nums">{slot.start_time.substring(0, 5)}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60",
                        selectedSlot?.id === slot.id ? "text-white" : "text-muted-foreground"
                      )}>
                        {slot.duration_minutes} min
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedSlot && (
                <div className="mt-6 p-4 rounded-xl bg-seven-success/5 border border-seven-success/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-seven-success/20 flex items-center justify-center text-seven-success shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-seven-success mb-1">Confirmação de Horário</h5>
                      <p className="text-sm font-bold text-foreground">
                        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Início: <span className="text-foreground font-bold">{selectedSlot.start_time.substring(0, 5)}</span> · Duração: <span className="text-foreground font-bold">{selectedSlot.duration_minutes} min</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {consultantCalendly?.connected && (
          <div className="py-12 text-center bg-blue-50/50 rounded-2xl border border-dashed border-blue-200">
            <Calendar className="h-12 w-12 text-blue-200 mx-auto mb-4" />
            <h4 className="text-sm font-bold text-blue-900 mb-2">Integração Calendly Ativa</h4>
            <p className="text-xs text-blue-700/70 max-w-sm mx-auto">
              Utilize o botão acima para agendar seu encontro diretamente na agenda oficial do consultor.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
