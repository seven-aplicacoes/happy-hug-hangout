import React from 'react';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComingSoonPageWrapperProps {
  children: React.ReactNode;
}

export const ComingSoonPageWrapper = ({ children }: ComingSoonPageWrapperProps) => {
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Banner */}
      <div className="mb-6 w-full animate-in fade-in slide-in-from-top duration-500">
        <div className="bg-[#FAF7F0] border border-primary/30 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              Funcionalidade em breve disponível
            </h2>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Esta área está em desenvolvimento e será liberada em uma próxima atualização.
            </p>
          </div>
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative flex-1">
        <div 
          className="opacity-[0.35] pointer-events-none grayscale-[20%] transition-all duration-300"
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
