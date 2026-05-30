import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { useConsultantAvailability } from '@/hooks/useConsultantAvailability';
import { useReunioes } from '@/hooks/useReunioes';
import { ContractModuleMeeting } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { checkConsultantConflict } from '@/lib/conflicts';

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
  
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          title: "Horário Indisponível",
          description: "Infelizmente este horário acabou de ser ocupado. Por favor, escolha outro.",
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
             <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-50" /></div>
          ) : availableSlots.length === 0 ? (
             <div className="py-10 text-center bg-muted/20 rounded-lg border border-dashed">
               <p className="text-sm text-muted-foreground">O consultor ainda não disponibilizou horários para este módulo.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
              {availableSlots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-all hover:border-primary/50",
                    selectedSlot?.id === slot.id ? "bg-primary text-white border-primary shadow-md" : "bg-white border-muted"
                  )}
                >
                  <span className="text-xs font-bold">{new Date(slot.available_date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                  <span className="text-[11px] mt-1 flex items-center gap-1 opacity-80">
                    <Clock className="h-3 w-3" /> {slot.start_time.substring(0, 5)} ({slot.duration_minutes} min)
                  </span>
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
