import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Loader2, CheckCircle2, User, AlertCircle, RefreshCcw } from 'lucide-react';
import { useConsultantAvailability } from '@/hooks/useConsultantAvailability';
import { useReunioes } from '@/hooks/useReunioes';
import { ContractModuleMeeting } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { checkConsultantConflict } from '@/lib/conflicts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
  moduleMeeting: ContractModuleMeeting;
}

export const ModalAgendamentoCliente = ({ open, onClose, moduleMeeting }: Props) => {
  const { toast } = useToast();
  const { clienteSession, user } = useAuth();
  const queryClient = useQueryClient();
  const filters = {
    contractModuleMeetingId: moduleMeeting.id,
    consultantId: moduleMeeting.consultantId
  };
  const { slots, availabilities, isLoading: loadingSlots } = useConsultantAvailability(filters);
  const { upsertReuniao } = useReunioes();
  
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  useEffect(() => {
    setSelectedSlot(null);
  }, [open]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      console.group('[Portal Availability] Debug Agendamento');
      console.log('Cliente logado ID:', clienteSession?.clienteId);
      console.log('Módulo Meeting:', moduleMeeting);
      console.log('Consultor responsável ID:', moduleMeeting.consultantId);
      console.log('Filtros usados:', filters);
      console.groupEnd();
    }
  }, [open, moduleMeeting, clienteSession]);

  useEffect(() => {
    if (!loadingSlots && open) {
      console.log('[Portal Availability] Disponibilidades regras:', availabilities);
      console.log('[Portal Availability] Slots retornados:', slots);
    }
  }, [loadingSlots, slots, availabilities, open]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    
    try {
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
        id: moduleMeeting.scheduledMeetingId, // If exists, it will update
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
        source: 'portal_cliente',
        scheduledBy: user?.id, // Usar o ID de autenticação do usuário
        meetingLinkProvider: 'teams'
      });

      toast({ title: "Agendado!", description: "Seu encontro foi agendado com sucesso." });
      onClose();
    } catch (error: any) {
      console.error('[Portal Agendamento Error]:', error);
      const errorMessage = error.message || error.details || "Não foi possível realizar o agendamento.";
      toast({ 
        title: "Erro ao agendar", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSlots = slots?.filter(s => !s.is_booked) || [];

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
      <Button onClick={handleConfirm} disabled={!selectedSlot || isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Agendamento'}
      </Button>
    </div>
  );

  return (
    <BaseModal open={open} onClose={onClose} titulo="Agendar Encontro" footer={footer}>
      <div className="space-y-6 py-2">
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
          <p className="text-sm font-bold text-primary">{moduleMeeting.title}</p>
          <p className="text-xs text-muted-foreground mt-1">Consultor Responsável: <span className="font-semibold text-foreground">{moduleMeeting.consultantName}</span></p>
        </div>

        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Escolha uma data e horário
          </h4>
          
          {loadingSlots ? (
             <div className="py-10 text-center">
               <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-50" />
               <p className="text-[10px] text-muted-foreground mt-2 animate-pulse">Buscando horários disponíveis...</p>
             </div>
          ) : !moduleMeeting.consultantId ? (
            <div className="py-10 text-center bg-amber-50 rounded-lg border border-dashed border-amber-200">
               <AlertCircle className="h-6 w-6 mx-auto text-amber-500 mb-2" />
               <p className="text-sm text-amber-800 font-bold">Consultor não identificado.</p>
               <p className="text-[11px] text-amber-700 mt-2">Não foi possível identificar o consultor responsável por este encontro.</p>
             </div>
          ) : availableSlots.length === 0 ? (
             <div className="py-10 text-center bg-muted/20 rounded-lg border border-dashed">
               <p className="text-sm text-muted-foreground font-bold">
                 {availabilities && availabilities.length > 0 
                   ? "Não há horários livres disponíveis para este período." 
                   : "O consultor responsável ainda não configurou disponibilidade."}
               </p>
               <p className="text-[11px] text-muted-foreground mt-2">Entre em contato com o consultor responsável.</p>
               
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-4 text-[10px] uppercase font-bold gap-2"
               >
                 <RefreshCcw className="h-3 w-3" /> Atualizar
               </Button>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
              {availableSlots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:border-primary hover:shadow-md group",
                    selectedSlot?.id === slot.id ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" : "bg-white border-muted shadow-sm"
                  )}
                >
                  <span className={cn(
                    "text-xs font-black uppercase tracking-tight",
                    selectedSlot?.id === slot.id ? "text-white" : "text-foreground"
                  )}>
                    {new Date(slot.available_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
                  <div className="flex items-center gap-3 mt-2 w-full border-t border-current/10 pt-2">
                    <span className="text-[11px] font-bold flex items-center gap-1.5 opacity-90">
                      <Clock className="h-3.5 w-3.5" /> {slot.start_time.substring(0, 5)}
                    </span>
                    <span className="text-[11px] font-medium opacity-60 ml-auto">
                      {slot.duration_minutes} min
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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
