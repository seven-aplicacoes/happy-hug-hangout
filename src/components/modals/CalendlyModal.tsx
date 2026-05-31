import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { buildCalendlyUrl } from '@/lib/calendly';
import { Loader2, Calendar, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useToast } from '@/hooks/use-toast';

export type CalendlyContext = {
  clientId?: string;
  clientName?: string;
  contractId?: string;
  contractName?: string;
  productId?: string;
  productName?: string;
  moduleId?: string;
  moduleName?: string;
  meetingId?: string;
  meetingTitle?: string;
  consultantId?: string;
  consultantName?: string;
};

type CalendlyModalProps = {
  open: boolean;
  onClose: () => void;
  url?: string | null;
  prefill?: {
    name?: string;
    email?: string;
  };
  context?: CalendlyContext | null;
};

export const CalendlyModal = ({ open, onClose, url, prefill, context }: CalendlyModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updateMeeting } = useContractModuleMeetings(context?.moduleId);
  const { toast } = useToast();

  const finalUrl = buildCalendlyUrl(url, prefill);

  const handleConfirmScheduling = async () => {
    if (!context?.meetingId || !scheduledDate || !scheduledTime) {
      toast({ 
        title: 'Campos obrigatórios', 
        description: 'Por favor, informe a data e hora que você agendou no Calendly.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      await updateMeeting.mutateAsync({
        id: context.meetingId,
        status: 'agendado',
        scheduledAt: scheduledAt
      });
      toast({ title: 'Sucesso', description: 'Agendamento confirmado no sistema.' });
      onClose();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível confirmar o agendamento.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      titulo={context?.meetingTitle ? `Agendar: ${context.meetingTitle}` : "Agendar reunião"}
      descricao="1. Agende no calendário abaixo. 2. Confirme a data/hora escolhida ao lado."
      size="2xl"
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[80vh]">
        <div className="flex-1 relative bg-neutral-50 rounded-lg overflow-hidden flex flex-col items-center justify-center border">
          {finalUrl ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-50 z-10">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <p className="text-neutral-500 font-medium">Carregando calendário...</p>
                </div>
              )}
              <iframe
                src={finalUrl}
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                title="Calendly"
              />
            </>
          ) : (
            <div className="text-center p-8 max-w-md">
              <div className="bg-amber-50 text-amber-600 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Agenda indisponível</h3>
              <p className="text-neutral-500">
                Link de agendamento não configurado para este consultor. Por favor, entre em contato via WhatsApp.
              </p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-6 p-1">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <h4 className="font-bold text-sm text-primary">Confirmar Agendamento</h4>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Após escolher o horário no Calendly, informe-o aqui para que possamos sincronizar sua jornada.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Data Agendada</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input 
                    type="date" 
                    value={scheduledDate} 
                    onChange={e => setScheduledDate(e.target.value)}
                    className="pl-10 h-11 bg-white border-neutral-200 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Horário Agendado</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input 
                    type="time" 
                    value={scheduledTime} 
                    onChange={e => setScheduledTime(e.target.value)}
                    className="pl-10 h-11 bg-white border-neutral-200 focus:ring-primary/20"
                  />
                </div>
              </div>

              <Button 
                className="w-full h-12 font-bold shadow-lg shadow-primary/20"
                onClick={handleConfirmScheduling}
                disabled={isSaving || !scheduledDate || !scheduledTime}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Confirmar no Sistema
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Resumo do Contexto</h5>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-neutral-400">Produto:</span> <span className="font-bold text-neutral-700">{context?.productName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Módulo:</span> <span className="font-bold text-neutral-700">{context?.moduleName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Consultor:</span> <span className="font-bold text-neutral-700">{context?.consultantName || '-'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};