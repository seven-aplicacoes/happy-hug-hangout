import { Briefcase, Calendar, DollarSign, Users, Loader2, Clock, CheckCircle2, Circle, Pencil, Save, X, Trash2, Plus, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StatusTag } from '@/components/StatusTag';
import { formatDuration, hhmmToMinutes, minutesToHHMM } from '@/lib/duration';
import { labelStatus } from '@/data/mockData';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useContractModuleDocuments } from '@/hooks/useContractModuleDocuments';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultores } from '@/hooks/useConsultores';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModalReuniao } from '@/components/modals/ModalReuniao';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

function MeetingList({ phase, contrato, onSchedule }: { phase: any, contrato: any, onSchedule: (meeting: any) => void }) {
  const { meetings, isLoading } = useContractModuleMeetings(phase.id);
  
  if (isLoading) return <div className="p-4 text-center text-xs text-muted-foreground">Carregando encontros...</div>;
  if (!meetings || meetings.length === 0) return <div className="p-4 text-center text-xs text-muted-foreground">Nenhum encontro configurado.</div>;

  return (
    <div className="divide-y border-t mt-2">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="grid grid-cols-12 gap-2 py-3 px-4 items-center text-xs hover:bg-muted/30">
          <div className="col-span-1 font-bold text-muted-foreground">#{meeting.meetingNumber}</div>
          <div className="col-span-4 font-medium">{meeting.title}</div>
          <div className="col-span-2 capitalize text-muted-foreground">{meeting.status}</div>
          <div className="col-span-2 text-muted-foreground">{meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleDateString() : '-'}</div>
          <div className="col-span-3 flex justify-end gap-1">
            {meeting.status === 'pendente' ? (
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold" onClick={() => onSchedule(meeting)}>Agendar</Button>
            ) : (
              <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold">Ver Reunião</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentList({ phase, contrato }: { phase: any, contrato: any }) {
  const { documents, isLoading } = useContractModuleDocuments(phase.id, contrato.id);
  
  if (isLoading) return <div className="p-4 text-center text-xs text-muted-foreground">Carregando documentos...</div>;
  if (!documents || documents.length === 0) return <div className="p-4 text-center text-xs text-muted-foreground">Nenhum documento vinculado.</div>;

  return (
    <div className="divide-y border-t mt-2">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between py-3 px-4 text-xs hover:bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>{doc.titulo}</span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-[10px]">Baixar</Button>
        </div>
      ))}
    </div>
  );
}

function PhaseRow({ phase, contrato, isEditing, onUpdate, onDelete, onSchedule }: { phase: any, contrato: any, isEditing?: boolean, onUpdate?: (data: any) => void, onDelete?: () => void, onSchedule: (meeting: any) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b">
      <div 
        className={cn("grid grid-cols-1 md:grid-cols-12 gap-4 py-3 px-4 text-sm items-center hover:bg-muted/50 transition-colors cursor-pointer", expanded && "bg-muted/20")}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="md:col-span-3 font-medium flex items-center gap-2">
           {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
           <span className="truncate">{phase.name}</span>
        </div>
        <div className="md:col-span-2 capitalize text-[11px] font-semibold text-muted-foreground truncate">{phase.executorType || '-'}</div>
        <div className="md:col-span-2 text-xs text-muted-foreground truncate">{phase.responsibleConsultantNome || '-'}</div>
        <div className="md:col-span-2 flex justify-start"><StatusTag label={labelStatus[phase.status] || phase.status} /></div>
        <div className="md:col-span-2 flex items-center gap-1.5 text-muted-foreground text-xs tabular-nums"><Clock className="h-3.5 w-3.5 shrink-0" /> {formatDuration(phase.durationMinutes)}</div>
        <div className="md:col-span-1 flex justify-end"></div>
      </div>
      
      {expanded && (
        <div className="bg-white px-4 pb-4">
          <Tabs defaultValue="encontros">
            <TabsList className="mb-2">
              <TabsTrigger value="encontros" className="text-xs">Encontros</TabsTrigger>
              <TabsTrigger value="internos" className="text-xs">Documentos Internos</TabsTrigger>
              <TabsTrigger value="cliente" className="text-xs">Documentos p/ Cliente</TabsTrigger>
            </TabsList>
            <TabsContent value="encontros"><MeetingList phase={phase} contrato={contrato} onSchedule={onSchedule} /></TabsContent>
            <TabsContent value="internos"><DocumentList phase={phase} contrato={contrato} /></TabsContent>
            <TabsContent value="cliente"><DocumentList phase={phase} contrato={contrato} /></TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function ProductItem({ product, contrato, isEditing: isParentEditing }: { product: any, contrato: any, isEditing?: boolean }) {
  const { phases, upsertPhases, deletePhase } = useContractProductPhases(product.id);
  
  return (
    <div className="border rounded-md mb-4 overflow-hidden bg-white shadow-sm">
      <div className="bg-muted/30 border-b p-4 font-bold text-base text-foreground">{product.productNome}</div>
      {phases?.map((phase, idx) => (
        <PhaseRow key={phase.id} phase={phase} contrato={contrato} onSchedule={() => {}} />
      ))}
    </div>
  );
}

export const ContractJourneyCard = ({ contrato, expanded = false, isEditing = false }: { contrato: any, expanded?: boolean, isEditing?: boolean }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [meetingToSchedule, setMeetingToSchedule] = useState<any>(null);
  const { products } = useContractProducts(contrato.id);

  const onSchedule = (meeting: any) => {
    setMeetingToSchedule(meeting);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <ModalReuniao 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialData={meetingToSchedule ? {
          title: meetingToSchedule.title,
          clienteId: contrato.clienteId,
          contractId: contrato.id,
          contractProductId: meetingToSchedule.contractProductId,
          contractProductPhaseId: meetingToSchedule.moduleId,
          contractModuleMeetingId: meetingToSchedule.id,
          consultorId: contrato.consultorId,
          tipo: 'Check-in Semanal',
          status: 'agendada'
        } : undefined}
      />
      {products?.map(product => (
        <ProductItem key={product.id} product={product} contrato={contrato} isEditing={isEditing} />
      ))}
    </div>
  );
};
