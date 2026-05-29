import { Briefcase, Calendar, DollarSign, Users, Loader2, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StatusTag } from '@/components/StatusTag';
import { formatDuration } from '@/lib/duration';
import { labelStatus } from '@/data/mockData';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';

function MeetingDots({ total, scheduled }: { total: number; scheduled: number }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="group relative">
          {i < scheduled ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-seven-success" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
          )}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {i < scheduled ? 'Encontro agendado' : 'Sem agenda marcada'}
          </div>
        </div>
      ))}
      <span className="text-[10px] font-bold text-muted-foreground ml-1">
        {scheduled}/{total}
      </span>
    </div>
  );
}

function PhaseRow({ phase }: { phase: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 border-b last:border-0 text-sm items-center hover:bg-muted/50 transition-colors px-2">
      <div className="md:col-span-3 font-medium flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
        {phase.name}
      </div>
      <div className="md:col-span-2 capitalize text-xs font-semibold text-muted-foreground">
        {phase.executorType || '-'}
      </div>
      <div className="md:col-span-2 text-xs text-muted-foreground truncate">
        {phase.responsibleConsultantNome || '-'}
      </div>
      <div className="md:col-span-2">
        <StatusTag label={labelStatus[phase.status] || phase.status} />
      </div>
      <div className="md:col-span-2 flex items-center gap-1.5 text-muted-foreground text-xs">
        <Clock className="h-3.5 w-3.5" />
        {formatDuration(phase.durationMinutes)}
      </div>
      <div className="md:col-span-2">
        <MeetingDots total={phase.meetingsCount || 0} scheduled={0} />
      </div>
      <div className="md:col-span-1 flex items-center justify-end text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function ProductItem({ product }: { product: any }) {
  const { phases, isLoading } = useContractProductPhases(product.id);
  
  return (
    <div className="border rounded-md mb-4 overflow-hidden bg-white shadow-sm">
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between bg-muted/30 border-b gap-3">
        <div>
          <h4 className="font-bold text-base text-foreground">{product.productNome}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {product.startDate ? new Date(product.startDate).toLocaleDateString() : '-'} a {product.endDate ? new Date(product.endDate).toLocaleDateString() : '-'}
            </span>
            <span className="text-xs text-muted-foreground border-l pl-3">
              Jornada de Execução
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusTag label={labelStatus[product.status] || product.status} />
        </div>
      </div>
      
      <div className="p-0">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" /> <span className="text-sm text-muted-foreground">Carregando jornada...</span></div>
        ) : phases && phases.length > 0 ? (
          <div className="bg-white">
            <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-bold text-muted-foreground uppercase py-2 px-4 bg-muted/10 border-b tracking-wider">
              <div className="md:col-span-3">Módulo da Jornada</div>
              <div className="md:col-span-2">Tipo</div>
              <div className="md:col-span-2">Responsável</div>
              <div className="md:col-span-2">Status</div>
              <div className="md:col-span-2">Duração</div>
              <div className="md:col-span-1 text-right pr-1">Enc.</div>
            </div>
            <div className="divide-y">
              {phases.map(phase => <PhaseRow key={phase.id} phase={phase} />)}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma etapa da jornada configurada para este produto.</div>
        )}
      </div>
    </div>
  );
}

interface ContractJourneyCardProps {
  contrato: any;
  expanded?: boolean;
}

export const ContractJourneyCard = ({ contrato, expanded = false }: ContractJourneyCardProps) => {
  const { products, isLoading } = useContractProducts(contrato.id);
  
  const content = (
    <div className="pt-6 border-t mt-1">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Detalhamento de Produtos e Módulos</h4>
      </div>
      
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary/60" />
          <p className="text-sm text-muted-foreground">Carregando estrutura do contrato...</p>
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-4">
          {products.map(product => <ProductItem key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="py-12 text-center bg-muted/20 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Este contrato ainda não possui produtos vinculados.</p>
        </div>
      )}
    </div>
  );

  if (expanded) {
    return (
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden border-muted/60 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-left w-full mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-bold text-lg text-foreground">{contrato.tipo}</h3>
              <StatusTag label={labelStatus[contrato.status] || contrato.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mt-1.5">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(contrato.dataInicio).toLocaleDateString()} a {new Date(contrato.dataFim).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> R$ {contrato.valor?.toLocaleString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {contrato.consultorNome}</span>
            </div>
          </div>
          <div className="md:text-right shrink-0 mt-2 md:mt-0">
             <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
               {products?.length || 0} Produtos
             </Badge>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <AccordionItem value={contrato.id} className="border rounded-xl mb-4 bg-white shadow-sm overflow-hidden border-muted/60">
      <AccordionTrigger className="px-5 py-5 hover:no-underline hover:bg-muted/5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-left w-full pr-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-bold text-lg text-foreground">{contrato.tipo}</h3>
              <StatusTag label={labelStatus[contrato.status] || contrato.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mt-1.5">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(contrato.dataInicio).toLocaleDateString()} a {new Date(contrato.dataFim).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> R$ {contrato.valor?.toLocaleString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {contrato.consultorNome}</span>
            </div>
          </div>
          <div className="md:text-right shrink-0 mt-2 md:mt-0">
             <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
               {products?.length || 0} Produtos
             </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6">
        {content}
      </AccordionContent>
    </AccordionItem>
  );
};
