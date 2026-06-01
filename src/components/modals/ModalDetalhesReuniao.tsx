import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, Clock, MapPin, Video, ExternalLink, 
  User, CheckCircle2, XCircle, AlertCircle, 
  History, Info, Pencil, Trash2, Loader2, Play
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reuniao, MeetingStatusHistory } from '@/types';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/duration';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onClose: () => void;
  reuniaoId: string;
  onEdit?: (reuniao: Reuniao) => void;
  onRefresh?: () => void;
}

export const ModalDetalhesReuniao = ({ open, onClose, reuniaoId, onEdit, onRefresh }: Props) => {
  const { user, perfil } = useAuth();
  const { toast } = useToast();
  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [history, setHistory] = useState<MeetingStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isAdmin = perfil === 'admin';
  const isConsultant = perfil === 'consultor';
  const isClient = perfil === 'cliente';

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data: r, error } = await supabase
        .from('meetings')
        .select(`
          *,
          client:client_id (trade_name, corporate_name),
          profile:consultant_id (full_name),
          creator:created_by (full_name),
          updater:updated_by (full_name),
          canceler:canceled_by (full_name),
          completer:completed_by (full_name)
        `)
        .eq('id', reuniaoId)
        .single();

      if (error) throw error;

      // Fetch history
      const { data: h } = await supabase
        .from('meeting_status_history')
        .select(`
          *,
          profile:changed_by (full_name)
        `)
        .eq('meeting_id', reuniaoId)
        .order('created_at', { ascending: false });

      const mappedReuniao: Reuniao = {
        id: r.id,
        clienteId: r.client_id,
        clienteNome: r.client?.trade_name || r.client?.corporate_name || 'Desconhecido',
        consultorId: r.consultant_id,
        consultorNome: r.profile && 'full_name' in r.profile ? (r.profile as any).full_name : 'Desconhecido',
        contractId: r.contract_id,
        contractProductId: r.contract_product_id,
        contractProductPhaseId: r.contract_product_phase_id,
        meetingDate: r.meeting_date,
        startTime: r.start_time,
        duracao: r.duration,
        tipo: r.type,
        title: r.title,
        status: r.status as Reuniao['status'],
        description: r.description,
        meetingUrl: r.meeting_url,
        location: r.location,
        locationUrl: r.location_url,
        teamsJoinUrl: r.teams_join_url,
        meetingLinkProvider: r.meeting_link_provider as 'manual' | 'teams',
        microsoftEventId: r.microsoft_event_id,
        participantes: Array.isArray(r.participants) ? (r.participants as unknown as string[]) : [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        canceledAt: r.canceled_at,
        canceledBy: r.canceled_by,
        cancelReason: r.cancel_reason,
        completedAt: r.completed_at,
        completedBy: r.completed_by,
        createdByName: r.creator?.full_name,
        updatedByName: r.updater?.full_name,
        canceledByName: r.canceler?.full_name,
        completedByName: r.completer?.full_name
      };

      setReuniao(mappedReuniao);
      setHistory((h || []).map((item: any) => ({
        id: item.id,
        meetingId: item.meeting_id,
        previousStatus: item.previous_status,
        newStatus: item.new_status,
        changedBy: item.changed_by,
        changedByName: item.profile?.full_name,
        changeReason: item.change_reason,
        payload: item.payload,
        createdAt: item.created_at
      })));
    } catch (err) {
      console.error('Error fetching meeting details:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar os detalhes da reunião.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && reuniaoId) {
      fetchDetails();
      setIsCancelling(false);
      setCancelReason('');
    }
  }, [open, reuniaoId]);

  const updateStatus = async (newStatus: Reuniao['status'], reason?: string) => {
    if (!reuniao) return;
    setSubmitting(true);
    try {
      const payload: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      if (newStatus === 'cancelada') {
        payload.canceled_at = new Date().toISOString();
        payload.canceled_by = user?.id;
        payload.cancel_reason = reason;

        // Microsoft Teams Cancellation
        if (reuniao.microsoftEventId) {
          try {
            await supabase.functions.invoke('create-teams-meeting', {
              body: {
                action: 'cancel',
                microsoftEventId: reuniao.microsoftEventId
              }
            });
          } catch (teamsErr) {
            console.error('Failed to cancel Teams meeting:', teamsErr);
            toast({
              title: "Aviso",
              description: "Status atualizado, mas não foi possível cancelar o evento no Teams automaticamente.",
              variant: "warning" as any
            });
          }
        }
      } else if (newStatus === 'realizada') {
        payload.completed_at = new Date().toISOString();
        payload.completed_by = user?.id;
      }

      const { error } = await supabase
        .from('meetings')
        .update(payload)
        .eq('id', reuniao.id);

      if (error) throw error;

      // Log history
      await supabase.from('meeting_status_history').insert({
        meeting_id: reuniao.id,
        previous_status: reuniao.status,
        new_status: newStatus,
        changed_by: user?.id,
        change_reason: reason || (newStatus === 'realizada' ? 'Encontro concluído' : 'Alteração de status')
      });

      // Update external module meeting status if linked
      if (reuniao.contractModuleMeetingId) {
        let externalStatus = 'agendado';
        if (newStatus === 'realizada') externalStatus = 'realizada';
        if (newStatus === 'cancelada') externalStatus = 'cancelada';
        
        await supabase
          .from('contract_module_meetings')
          .update({ 
            status: externalStatus,
            completed_at: newStatus === 'realizada' ? new Date().toISOString() : null
          })
          .eq('id', reuniao.contractModuleMeetingId);
      }

      toast({ title: 'Sucesso', description: `Status atualizado para ${newStatus}.` });
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe o motivo do cancelamento.', variant: 'destructive' });
      return;
    }
    updateStatus('cancelada', cancelReason);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendada': return <Badge className="bg-blue-500 text-white">Agendado</Badge>;
      case 'em_andamento': return <Badge className="bg-amber-500 text-white animate-pulse">Em Andamento</Badge>;
      case 'realizada': return <Badge className="bg-green-500 text-white">Realizado</Badge>;
      case 'cancelada': return <Badge className="bg-red-500 text-white">Cancelado</Badge>;
      case 'aguardando_confirmacao': return <Badge className="bg-purple-500 text-white">Aguardando Confirmação</Badge>;
      case 'no_show': return <Badge className="bg-gray-500 text-white">No-Show</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const joinLink = reuniao?.teamsJoinUrl || reuniao?.locationUrl || (reuniao?.location?.startsWith('http') ? reuniao.location : null);

  if (loading) {
    return (
      <BaseModal open={open} onClose={onClose} titulo="Carregando detalhes..." size="lg">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Buscando informações...</p>
        </div>
      </BaseModal>
    );
  }

  if (!reuniao) return null;

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo={reuniao.title} 
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            {!isClient && !['realizada', 'cancelada'].includes(reuniao.status) && (
              <>
                <Button variant="outline" onClick={() => onEdit?.(reuniao)} className="gap-2">
                  <Pencil className="h-4 w-4" /> Reagendar
                </Button>
                {!isCancelling && (
                  <Button variant="ghost" onClick={() => setIsCancelling(true)} className="text-destructive hover:bg-destructive/5 gap-2">
                    <Trash2 className="h-4 w-4" /> Cancelar
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            {!isClient && reuniao.status === 'aguardando_confirmacao' && (
              <Button onClick={() => updateStatus('realizada')} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Marcar como Realizada
              </Button>
            )}
            {joinLink && reuniao.status !== 'cancelada' && (
              <Button onClick={() => window.open(joinLink, '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Play className="h-4 w-4" /> Entrar na Reunião
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {isCancelling && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-bold text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Confirmar Cancelamento
            </h4>
            <p className="text-xs text-red-700">Tem certeza que deseja cancelar este encontro? Esta ação não pode ser desfeita.</p>
            <Textarea 
              placeholder="Descreva o motivo do cancelamento..." 
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="bg-white border-red-200 focus-visible:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCancelling(false)}>Desistir</Button>
              <Button variant="destructive" size="sm" onClick={handleCancel} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-muted/30 rounded-2xl p-6 border border-muted/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Info className="h-4 w-4" /> Informações Gerais
                </h3>
                {getStatusBadge(reuniao.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">Cliente</span>
                  <span className="text-xs font-bold">{reuniao.clienteNome}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">Consultor</span>
                  <span className="text-xs font-bold">{reuniao.consultorNome}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">Data</span>
                  <span className="text-xs font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {reuniao.meetingDate ? format(new Date(reuniao.meetingDate + 'T00:00:00'), 'dd/MM/yyyy') : 'Não definida'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">Horário e Duração</span>
                  <span className="text-xs font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {reuniao.startTime || '--:--'} ({formatDuration(reuniao.duracao)})
                  </span>
                </div>
                <div className="flex flex-col col-span-2 space-y-3 pt-2">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60 flex items-center gap-2">
                    {reuniao.meetingLinkProvider === 'teams' ? <Video className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                    Link da Reunião
                  </span>
                  {joinLink ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-3 rounded-xl">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          {reuniao.meetingLinkProvider === 'teams' ? <Video className="h-4 w-4 text-white" /> : <ExternalLink className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-blue-900">
                            {reuniao.meetingLinkProvider === 'teams' ? 'Microsoft Teams' : 'Link Manual'}
                          </p>
                          <p className="text-[10px] text-blue-700 truncate">{joinLink}</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8"
                          onClick={() => window.open(joinLink, '_blank', 'noopener,noreferrer')}
                        >
                          Entrar agora
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground italic">
                      Link da reunião ainda não disponível.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> Pauta / Descrição
              </h3>
              <div className="bg-white border rounded-xl p-4 text-xs text-muted-foreground whitespace-pre-wrap min-h-[100px]">
                {reuniao.description || 'Nenhuma pauta definida para este encontro.'}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-4 space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <History className="h-4 w-4" /> Histórico
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma alteração registrada.</p>
                ) : (
                  history.map((h, i) => (
                    <div key={h.id} className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0">
                      <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-[10px] font-black text-foreground">{h.newStatus.toUpperCase()}</p>
                      <p className="text-[9px] text-muted-foreground">{format(new Date(h.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                      {h.changeReason && <p className="text-[10px] mt-1 italic">"{h.changeReason}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                <Info className="h-4 w-4" /> Auditoria
              </h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">{reuniao.createdAt ? format(new Date(reuniao.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}</span>
                </div>
                {reuniao.updatedAt && format(new Date(reuniao.updatedAt), 'yyyy-MM-dd HH:mm') !== (reuniao.createdAt ? format(new Date(reuniao.createdAt), 'yyyy-MM-dd HH:mm') : '') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última att:</span>
                    <span className="font-medium">{format(new Date(reuniao.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  </div>
                )}
                {reuniao.canceledAt && (
                  <div className="flex justify-between text-red-600">
                    <span>Cancelado em:</span>
                    <span className="font-bold">{format(new Date(reuniao.canceledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  </div>
                )}
                {reuniao.completedAt && (
                  <div className="flex justify-between text-green-600">
                    <span>Finalizado em:</span>
                    <span className="font-bold">{format(new Date(reuniao.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

const AlignLeft = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="21" y1="6" x2="3" y2="6"></line>
    <line x1="15" y1="12" x2="3" y2="12"></line>
    <line x1="17" y1="18" x2="3" y2="18"></line>
  </svg>
);
