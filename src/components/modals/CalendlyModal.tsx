import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { buildCalendlyUrl } from '@/lib/calendly';
import { Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  const finalUrl = buildCalendlyUrl(url, prefill, {
    utm_source: 'seven',
    utm_medium: 'portal_cliente',
    utm_campaign: 'module_meeting',
    utm_content: context?.meetingId,
    utm_term: context?.clientId,
    clientId: context?.clientId,
    contractId: context?.contractId,
    productId: context?.productId,
    moduleId: context?.moduleId,
    meetingId: context?.meetingId,
    consultantId: context?.consultantId,
  });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      titulo={context?.meetingTitle ? `Agendar: ${context.meetingTitle}` : "Agendar reunião"}
      descricao="Escolha o melhor horário disponível no Calendly. A confirmação será sincronizada automaticamente."
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
              <Clock className="h-5 w-5 text-primary" />
              <h4 className="font-bold text-sm text-primary">Sincronização Automática</h4>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Após concluir o agendamento no Calendly, o sistema será atualizado automaticamente em alguns segundos.
            </p>
            
            <div className="p-4 rounded-xl border border-dashed border-primary/20 bg-white">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Resumo do Contexto</h5>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between gap-4"><span className="text-neutral-400 shrink-0">Produto:</span> <span className="font-bold text-neutral-700 text-right">{context?.productName || '-'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-neutral-400 shrink-0">Módulo:</span> <span className="font-bold text-neutral-700 text-right">{context?.moduleName || '-'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-neutral-400 shrink-0">Consultor:</span> <span className="font-bold text-neutral-700 text-right">{context?.consultantName || '-'}</span></div>
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full h-11 font-bold"
              onClick={onClose}
            >
              Fechar Modal
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <p className="text-[10px] text-blue-600 leading-tight">
              <strong>Dica:</strong> Se você já agendou e a tela não atualizou, tente recarregar a página em alguns instantes.
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
