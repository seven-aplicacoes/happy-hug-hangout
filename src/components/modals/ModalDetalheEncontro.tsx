import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  History as HistoryIcon,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
  meeting: any;
  mode?: 'admin' | 'client' | 'consultor';
  onSchedule: () => void;
}

export const ModalDetalheEncontro = ({ open, onClose, meeting, mode = 'admin', onSchedule }: Props) => {
  const isCompleted = ['realizada', 'concluida', 'concluído', 'concluída', 'resolvido', 'completed', 'done'].includes(meeting?.status?.toLowerCase() || '');
  const isScheduled = meeting?.status === 'agendado';
  const isCanceled = meeting?.status === 'cancelada' || meeting?.status === 'cancelado';
  
  // Fetch specific history for this meeting
  const { data: history } = useQuery({
    queryKey: ['meeting-history', meeting?.id],
    queryFn: async () => {
      if (!meeting?.id) return [];
      const { data, error } = await supabase
        .from('meeting_history_events')
        .select('*')
        .eq('meeting_id', meeting.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!meeting?.id && open
  });

  if (!meeting) return null;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'agendado': return <Badge className="bg-blue-500 hover:bg-blue-600">Agendado</Badge>;
      case 'realizada':
      case 'concluída':
      case 'concluido': return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
      case 'cancelada':
      case 'cancelado': return <Badge variant="destructive">Cancelado</Badge>;
      case 'pendente': return <Badge variant="secondary">Pendente</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      titulo={`Encontro #${meeting.meetingNumber}: ${meeting.title}`}
      descricao="Detalhes e histórico do agendamento."
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label label="Consultor Responsável" />
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <User className="h-4 w-4 text-primary" />
                {meeting.consultantName || 'Não definido'}
              </div>
            </div>
            <div className="space-y-1">
              <Label label="Status do Encontro" />
              <div>{getStatusBadge(meeting.status)}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-tight text-neutral-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Informações do Agendamento
            </h4>
            
            {isScheduled ? (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary/60">Data e Hora</p>
                    <p className="text-lg font-bold text-primary">
                      {format(new Date(meeting.scheduledAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-white border-primary/20 text-primary">Confirmado</Badge>
                </div>
                
                <div className="flex gap-4 pt-2">
                  {meeting.rescheduleUrl && (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-bold flex-1" onClick={() => window.open(meeting.rescheduleUrl, '_blank')}>
                      <RefreshCw className="h-3.5 w-3.5" /> Reagendar
                    </Button>
                  )}
                  {meeting.cancelUrl && (
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 flex-1" onClick={() => window.open(meeting.cancelUrl, '_blank')}>
                      <XCircle className="h-3.5 w-3.5" /> Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ) : isCompleted ? (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-bold text-green-900">Encontro Concluído</p>
                  <p className="text-xs text-green-700">Este encontro foi realizado com sucesso.</p>
                </div>
              </div>
            ) : isCanceled ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-red-600">
                  <XCircle className="h-6 w-6" />
                  <p className="text-sm font-bold">Agendamento Cancelado</p>
                </div>
                <Button className="w-full h-9 gap-2 font-bold" onClick={onSchedule}>
                  <Calendar className="h-4 w-4" /> Agendar Novamente
                </Button>
              </div>
            ) : (
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-6 text-center space-y-4">
                <p className="text-sm text-neutral-500">Nenhum agendamento ativo para este encontro.</p>
                <Button className="w-full h-11 gap-2 font-bold shadow-lg shadow-primary/20" onClick={onSchedule}>
                  <Calendar className="h-4 w-4" /> Agendar Encontro
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Sidebar */}
        <div className="bg-neutral-50/50 rounded-xl p-4 border border-neutral-100 space-y-4 max-h-[400px] overflow-y-auto">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <HistoryIcon className="h-3 w-3" /> Linha do Tempo
          </h4>
          
          <div className="space-y-4 relative">
            {history && history.length > 0 ? (
              history.map((event, idx) => (
                <div key={event.id} className="relative pl-6 pb-2 last:pb-0">
                  {idx < history.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-0 w-px bg-neutral-200" />
                  )}
                  <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-neutral-900">{event.title}</p>
                    <p className="text-[9px] text-neutral-500 leading-tight">{event.description}</p>
                    <p className="text-[8px] font-medium text-neutral-400 mt-1">
                      {format(new Date(event.created_at), "dd/MM/yy 'às' HH:mm")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-neutral-400 italic py-4 text-center">Nenhum histórico disponível.</p>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

const Label = ({ label }: { label: string }) => (
  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
);
