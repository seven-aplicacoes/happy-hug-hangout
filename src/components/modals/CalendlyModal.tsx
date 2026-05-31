import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { buildCalendlyUrl } from '@/lib/calendly';
import { Loader2 } from 'lucide-react';

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
  context?: CalendlyContext;
};

export const CalendlyModal = ({ open, onClose, url, prefill }: CalendlyModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const finalUrl = buildCalendlyUrl(url, prefill);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      titulo="Agendar reunião"
      descricao="Escolha o melhor dia e horário disponível."
      size="2xl"
    >
      <div className="relative w-full h-[80vh] md:h-[85vh] bg-neutral-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
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
    </BaseModal>
  );
};
