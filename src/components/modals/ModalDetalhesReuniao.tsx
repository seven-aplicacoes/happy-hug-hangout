import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, Clock, MapPin, Video, ExternalLink, 
  User, CheckCircle2, XCircle, AlertCircle, 
  History, Info, Pencil, Trash2, Loader2, Play, RefreshCcw,
  Copy, Plus, FileText, AlignLeft, ShieldCheck, Eye, EyeOff, Link as LinkIcon,
  Users as UsersIcon, ListChecks as ListChecksIcon, Lock as LockIcon
} from 'lucide-react';


import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reuniao, MeetingStatusHistory, MeetingMinutes } from '@/types';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/duration';
import { Textarea } from '@/components/ui/textarea';
import { ModalRegistrarAta } from './ModalRegistrarAta';
import { ModalReuniao } from './ModalReuniao';

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
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingTeams, setGeneratingTeams] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
  const [registrarAtaOpen, setRegistrarAtaOpen] = useState(false);
  const [remarcarOpen, setRemarcarOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showManualLinkForm, setShowManualLinkForm] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualProvider, setManualProvider] = useState<'teams' | 'manual'>('manual');



  const isAdmin = perfil === 'admin';
  const isConsultant = perfil === 'consultor';
  const isClient = perfil === 'cliente';

  const fetchDetails = async () => {
    if (!reuniaoId) {
      console.error('[MeetingDetails] No reuniaoId provided');
      return;
    }

    setLoading(true);
    try {
      console.log('[MeetingDetails] Fetching details for ID:', reuniaoId);
      
      const { data: r, error } = await supabase
        .from('meetings')
        .select(`
          *,
          client:client_id (trade_name, corporate_name, email),
          profile:profiles!meetings_consultant_id_fkey (full_name, email)
        `)

        .eq('id', reuniaoId)
        .maybeSingle();

      if (error) {
        console.error('[MeetingDetails] Supabase error fetching meeting:', error);
        throw error;
      }


      if (!r) {
        console.error('[MeetingDetails] Meeting not found for ID:', reuniaoId);
        throw new Error('Reunião não encontrada');
      }

      // Step 2: Resilient fetch for audit profile names (created_by, updated_by, etc.)
      const profileIds = [r.created_by, r.updated_by, r.canceled_by, r.completed_by].filter(Boolean);
      let profilesMap: Record<string, string> = {};
      
      if (profileIds.length > 0) {
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds);
          
          profilesData?.forEach(p => {
            profilesMap[p.id] = p.full_name;
          });
        } catch (auditErr) {
          console.warn('[MeetingDetails] audit fetch warning:', auditErr);
        }
      }

      // Step 3: Fetch history
      let h: any[] = [];
      try {
        const { data: historyData } = await supabase
          .from('meeting_status_history')
          .select(`
            *,
            profile:changed_by (full_name)
          `)
          .eq('meeting_id', reuniaoId)
          .order('created_at', { ascending: false });
        h = historyData || [];
      } catch (histErr) {
        console.warn('[MeetingDetails] history fetch warning:', histErr);
      }

      // Step 4: Fetch minutes
      let m: any = null;
      try {
        const { data: minutesData } = await supabase
          .from('meeting_minutes')
          .select('*')
          .eq('meeting_id', reuniaoId)
          .maybeSingle();
        m = minutesData;
      } catch (minErr) {
        console.warn('[MeetingDetails] minutes fetch warning:', minErr);
      }

      const mappedMinutes: MeetingMinutes | null = m ? {
        id: m.id,
        meetingId: m.meeting_id,
        summary: m.summary,
        discussionPoints: m.discussion_points,
        decisions: m.decisions,
        nextSteps: m.next_steps,
        internalNotes: m.internal_notes,
        visibleToClient: m.visible_to_client,
        createdBy: m.created_by,
        updatedBy: m.updated_by,
        createdAt: m.created_at,
        updatedAt: m.updated_at
      } : null;

      setMinutes(mappedMinutes);

      const mappedReuniao: Reuniao = {
        id: r.id,
        clienteId: r.client_id,
        clienteNome: r.client?.trade_name || r.client?.corporate_name || 'Desconhecido',
        consultorId: r.consultant_id,
        consultorNome: r.profile?.full_name || 'Desconhecido',
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
        meetingLinkProvider: r.meeting_link_provider as 'manual' | 'teams' | 'teams_manual',
        microsoftEventId: r.microsoft_event_id,
        participantes: Array.isArray(r.participants) ? (r.participants as unknown as string[]) : [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        canceledAt: r.canceled_at,
        canceledBy: r.canceled_by,
        cancelReason: r.cancel_reason,
        completedAt: r.completed_at,
        completedBy: r.completed_by,
        createdByName: profilesMap[r.created_by] || 'Sistema',
        updatedByName: profilesMap[r.updated_by] || 'Sistema',
        canceledByName: profilesMap[r.canceled_by] || 'Desconhecido',
        completedByName: profilesMap[r.completed_by] || 'Desconhecido',
        teams_creation_status: r.teams_creation_status as 'created' | 'failed' | null,
        teams_creation_error: r.teams_creation_error
      };

      // Ensure status is normalized for local UI
      if (r.status === 'realizado') (mappedReuniao as any).status = 'realizada';
      if (r.status === 'cancelado') (mappedReuniao as any).status = 'cancelada';
      if (r.status === 'agendado') (mappedReuniao as any).status = 'agendada';

      setReuniao(mappedReuniao);
      setHistory(h.map((item: any) => ({
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
    } catch (err: any) {
      console.error('[MeetingDetails] Error in fetchDetails:', err);
      toast({ title: 'Erro', description: err.message || 'Não foi possível carregar os detalhes da reunião.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (open && reuniaoId) {
      fetchDetails();
      setIsCancelling(false);
      setIsConfirmingCompletion(false);
      setCancelReason('');
    }
  }, [open, reuniaoId]);

  // Refresh details when sub-modals close
  useEffect(() => {
    if (open && reuniaoId && !remarcarOpen && !registrarAtaOpen) {
      fetchDetails();
    }
  }, [remarcarOpen, registrarAtaOpen]);


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
        
        // Update timeline on completion
        await supabase.from('timeline_events').insert({
          client_id: reuniao.clienteId,
          meeting_id: reuniao.id,
          type: 'reuniao',
          title: `Reunião realizada: ${reuniao.title}`,
          description: reuniao.description || '',
          date: new Date().toISOString(),
          status: 'realizada'
        } as any);
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

  const generateTeamsLink = async () => {
    if (!reuniao) return;
    setGeneratingTeams(true);
    try {
      const { data: rawData } = await supabase
        .from('meetings')
        .select(`
          *,
          client:client_id (trade_name, corporate_name, email),
          profile:consultant_id (full_name, email)
        `)
        .eq('id', reuniao.id)
        .single();

      if (!rawData) throw new Error('Reunião não encontrada');

      // Validation
      if (!reuniao.meetingDate) throw new Error('Data da reunião não informada.');
      if (!reuniao.startTime) throw new Error('Horário da reunião não informado.');
      if (!reuniao.title) throw new Error('Título da reunião não informado.');

      const isUpdate = !!reuniao.microsoftEventId;
      const startDateTime = `${reuniao.meetingDate}T${reuniao.startTime}:00`;
      
      // Calculate end time
      const [hours, minutes] = reuniao.startTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes, 0);
      endDate.setMinutes(endDate.getMinutes() + (reuniao.duracao || 60));
      const endDateTime = `${reuniao.meetingDate}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;


      const { data, error: invokeError } = await supabase.functions.invoke('create-teams-meeting', {
        body: {
          action: isUpdate ? 'update' : 'create',
          microsoftEventId: reuniao.microsoftEventId,
          title: reuniao.title,
          description: reuniao.description,
          startDateTime,
          endDateTime,
          attendees: [
            { email: (rawData.client as any)?.email, name: (rawData.client as any)?.trade_name || (rawData.client as any)?.corporate_name },
            { email: (rawData.profile as any)?.email, name: (rawData.profile as any)?.full_name }
          ]
        }
      });

      // Handle the new structured error format
      if (invokeError || (data && !data.success)) {
        const errorDetails = data?.details || invokeError?.message || 'Erro desconhecido';
        const errorMsg = data?.error || 'Não foi possível gerar o link do Teams';
        
        await supabase
          .from('meetings')
          .update({
            teams_creation_status: 'failed',
            teams_creation_error: `${errorMsg} (${errorDetails})`,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('id', reuniao.id);

        await supabase.from('meeting_status_history').insert({
          meeting_id: reuniao.id,
          action: 'teams_link_generation_failed',
          new_status: reuniao.status,
          changed_by: user?.id,
          change_reason: `Falha ao gerar link do Teams: ${errorMsg}. Detalhes: ${errorDetails}`,
          payload: data // Store the full error response for debugging
        });

        throw new Error(errorMsg);
      }

      if (data?.teamsJoinUrl) {
        const updatePayload = {
          teams_join_url: data.teamsJoinUrl,
          location_url: data.teamsJoinUrl,
          meeting_url: data.teamsJoinUrl,
          microsoft_event_id: data.microsoftEventId,
          meeting_link_provider: 'teams',
          teams_creation_status: 'created',
          teams_creation_error: null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        };

        const { error: dbError } = await supabase
          .from('meetings')
          .update(updatePayload)
          .eq('id', reuniao.id);

        if (dbError) throw dbError;

        await supabase.from('meeting_status_history').insert({
          meeting_id: reuniao.id,
          action: isUpdate ? 'link_updated' : 'link_created',
          new_status: reuniao.status,
          changed_by: user?.id,
          change_reason: 'Link do Microsoft Teams gerado com sucesso'
        });

        toast({ title: 'Sucesso', description: 'Link do Teams gerado com sucesso.' });
        fetchDetails();
      } else {
        throw new Error('Link do Teams não retornado na resposta.');
      }
    } catch (err: any) {
      console.error('[Teams] Falha ao gerar link:', err);
      toast({ title: 'Falha ao gerar link do Teams', description: err.message || 'Erro desconhecido ao gerar link.', variant: 'destructive' });
    } finally {
      setGeneratingTeams(false);
    }
  };

  const handleAddManualLink = async () => {
    if (!reuniao) return;
    if (!manualUrl.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe a URL da reunião.', variant: 'destructive' });
      return;
    }

    if (!manualUrl.startsWith('http://') && !manualUrl.startsWith('https://')) {
      toast({ title: 'URL inválida', description: 'A URL deve começar com http:// ou https://', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const isTeams = manualUrl.toLowerCase().includes('teams.microsoft.com');
      const provider = isTeams ? 'teams_manual' : 'manual';

      const { error } = await supabase
        .from('meetings')
        .update({
          location_url: manualUrl,
          meeting_url: manualUrl,
          teams_join_url: isTeams ? manualUrl : null,
          meeting_link_provider: provider,
          teams_creation_status: isTeams ? 'created' : 'manual',
          teams_creation_error: null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', reuniao.id);

      if (error) throw error;

      await supabase.from('meeting_status_history').insert({
        meeting_id: reuniao.id,
        action: 'manual_link_added',
        new_status: reuniao.status,
        changed_by: user?.id,
        change_reason: `Link manual adicionado (${provider}).`
      });

      toast({ title: 'Sucesso', description: 'Link manual adicionado com sucesso.' });
      setShowManualLinkForm(false);
      setManualUrl('');
      fetchDetails();
    } catch (err: any) {
      console.error('Error adding manual link:', err);
      toast({ title: 'Erro', description: 'Não foi possível salvar o link manual.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
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

  const joinLink = reuniao?.teamsJoinUrl || reuniao?.meetingUrl || reuniao?.locationUrl || (reuniao?.location?.startsWith('http') ? reuniao.location : null);

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

  if (!reuniao && !loading) return null;

  const canEdit = !isClient && (reuniao.status === 'agendada' || reuniao.status === 'em_andamento' || reuniao.status === 'reagendada' || reuniao.status === 'aguardando_confirmacao');
  const canCancel = !isClient && !['realizada', 'cancelada', 'realizado'].includes(reuniao.status);
  const canMarkAsRealizada = !isClient && !['realizada', 'cancelada', 'realizado'].includes(reuniao.status);
  const canRegistrarAta = !isClient && reuniao.status !== 'cancelada';

  const handleMarkAsCompleted = async (withAta = false) => {
    if (withAta) {
      setRegistrarAtaOpen(true);
    }
    await updateStatus('realizada', 'Reunião marcada como realizada pelo consultor');
    setIsConfirmingCompletion(false);
  };

  return (
    <>
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo={reuniao.title} 
      size="full"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            {!isClient && (
              <>
                {(reuniao.status === 'cancelada' || !['realizada'].includes(reuniao.status)) && (
                  <Button variant="outline" onClick={() => setRemarcarOpen(true)} className="gap-2">
                    <Pencil className="h-4 w-4" /> Remarcar
                  </Button>
                )}
                {canCancel && !isCancelling && (
                  <Button variant="ghost" onClick={() => setIsCancelling(true)} className="text-destructive hover:bg-destructive/5 gap-2">
                    <Trash2 className="h-4 w-4" /> Cancelar
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            {!isClient && canRegistrarAta && (
              <Button variant="outline" onClick={() => setRegistrarAtaOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" /> {minutes ? 'Editar Ata' : 'Registrar Ata'}
              </Button>
            )}
            {!isClient && canMarkAsRealizada && (
              <Button onClick={() => setIsConfirmingCompletion(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Marcar como Realizada
              </Button>
            )}
            {joinLink && reuniao.status !== 'cancelada' && (
              <Button onClick={() => window.open(joinLink, '_blank', 'noopener,noreferrer')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
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

        {isConfirmingCompletion && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Finalizar Reunião
            </h4>
            <p className="text-xs text-green-700">Deseja marcar esta reunião como realizada? {!minutes && 'Você também pode registrar a ata agora.'}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsConfirmingCompletion(false)}>Cancelar</Button>
              {!minutes && (
                <Button variant="outline" size="sm" onClick={() => handleMarkAsCompleted(true)} className="border-green-200 text-green-700 hover:bg-green-100">
                  Registrar Ata e Marcar como Realizada
                </Button>
              )}
              <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleMarkAsCompleted(false)} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Marcar como Realizada'}
              </Button>
            </div>
          </div>
        )}


        {showManualLinkForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Adicionar Link Manual
            </h4>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-blue-800">URL da Reunião</Label>
              <Input 
                placeholder="https://..." 
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                className="bg-white border-blue-200 focus-visible:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowManualLinkForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddManualLink} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Link'}
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
                    {reuniao.meetingLinkProvider?.includes('teams') ? <Video className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                    Link da Reunião
                  </span>
                  <div className="flex flex-col gap-2">
                    {joinLink ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-3 rounded-xl">
                          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                            {reuniao.meetingLinkProvider?.includes('teams') ? <Video className="h-4 w-4 text-white" /> : <ExternalLink className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-blue-900">
                              {reuniao.meetingLinkProvider?.includes('teams') ? 'Microsoft Teams' : 'Link Manual'}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-blue-700 truncate">{joinLink}</p>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 text-blue-600 hover:bg-blue-100"
                                onClick={() => {
                                  navigator.clipboard.writeText(joinLink);
                                  toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência.' });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
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
                      <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-xl border border-dashed">
                        <div className="flex items-center gap-2 text-muted-foreground italic mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {reuniao.teams_creation_status === 'failed' 
                              ? "Falha ao gerar link do Teams." 
                              : "Link da reunião ainda não disponível."}
                          </span>
                        </div>
                        
                        {!isClient && (
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={generateTeamsLink} 
                              disabled={generatingTeams}
                              className="text-[10px] h-8 gap-1.5"
                            >
                              {generatingTeams ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-3 w-3" />
                              )}
                              {reuniao.teams_creation_status === 'failed' ? "Tentar gerar link novamente" : "Gerar link do Teams"}
                            </Button>
                             <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowManualLinkForm(true)} 
                              className="text-[10px] h-8 gap-1.5"
                            >
                              <Plus className="h-3 w-3" /> Adicionar link manual
                            </Button>
                          </div>
                        )}
                        
                        {!isClient && reuniao.teams_creation_error && (
                          <p className="text-[9px] text-destructive mt-1 bg-destructive/5 p-2 rounded">
                            Erro: {reuniao.teams_creation_error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> Pauta / Descrição
              </h3>
              <div className="bg-white border rounded-xl p-4 text-xs text-muted-foreground whitespace-pre-wrap min-h-[60px]">
                {reuniao.description || 'Nenhuma pauta definida para este encontro.'}
              </div>
            </div>

            {minutes && (minutes.visibleToClient || !isClient) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Ata da Reunião
                  </h3>
                  {!minutes.visibleToClient && (
                    <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-200 bg-amber-50">
                      <EyeOff className="h-3 w-3" /> Apenas Interno
                    </Badge>
                  )}
                </div>
                
                <div className="bg-green-50/30 border border-green-100 rounded-2xl overflow-hidden">
                  <div className="p-6 space-y-6">
                    {minutes.summary && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-green-800 flex items-center gap-2">
                          <Info className="h-3 w-3" /> Resumo
                        </h4>
                        <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">{minutes.summary}</p>
                      </div>
                    )}
                    
                    {minutes.discussionPoints && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-green-800 flex items-center gap-2">
                          <UsersIcon className="h-3 w-3" /> Pontos Discutidos
                        </h4>
                        <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">{minutes.discussionPoints}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {minutes.decisions && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" /> Decisões
                          </h4>
                          <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">{minutes.decisions}</p>
                        </div>
                      )}
                      
                      {minutes.nextSteps && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-green-800 flex items-center gap-2">
                            <ListChecksIcon className="h-3 w-3" /> Próximos Passos
                          </h4>
                          <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">{minutes.nextSteps}</p>
                        </div>
                      )}
                    </div>

                    {!isClient && minutes.internalNotes && (
                      <div className="mt-4 pt-4 border-t border-green-200/50 space-y-2 bg-amber-50/50 -mx-6 -mb-6 p-6">
                        <h4 className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-2">
                          <LockIcon className="h-3 w-3" /> Observações Internas
                        </h4>
                        <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap italic">{minutes.internalNotes}</p>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="space-y-6">
            <div className={cn("bg-white border rounded-2xl p-4 space-y-4", isClient && "hidden")}>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <History className="h-4 w-4" /> Histórico
              </h3>
              <div className="space-y-4 pr-2">
                {history.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma alteração registrada.</p>
                ) : (
                  history.map((h, i) => (
                    <div key={h.id} className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0">
                      <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-foreground">{h.newStatus.toUpperCase()}</p>
                        <p className="text-[9px] text-muted-foreground">{format(new Date(h.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                      {h.changedByName && <p className="text-[9px] text-muted-foreground italic">por {h.changedByName}</p>}
                      {h.changeReason && <p className="text-[10px] mt-1 italic">"{h.changeReason}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={cn("bg-primary/5 rounded-2xl p-4 border border-primary/10", isClient && "hidden")}>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                <Info className="h-4 w-4" /> Auditoria
              </h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="font-medium">{reuniao.createdAt ? format(new Date(reuniao.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}</span>
                  </div>
                  {reuniao.createdByName && (
                    <div className="flex justify-end text-[9px] text-muted-foreground italic">
                      por {reuniao.createdByName}
                    </div>
                  )}
                </div>
                {reuniao.updatedAt && format(new Date(reuniao.updatedAt), 'yyyy-MM-dd HH:mm') !== (reuniao.createdAt ? format(new Date(reuniao.createdAt), 'yyyy-MM-dd HH:mm') : '') && (
                  <div className="flex flex-col gap-1 border-t border-muted/30 pt-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última att:</span>
                      <span className="font-medium">{format(new Date(reuniao.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    </div>
                    {reuniao.updatedByName && (
                      <div className="flex justify-end text-[9px] text-muted-foreground italic">
                        por {reuniao.updatedByName}
                      </div>
                    )}
                  </div>
                )}
                {reuniao.canceledAt && (
                  <div className="flex flex-col gap-1 border-t border-red-100 pt-1">
                    <div className="flex justify-between text-red-600">
                      <span>Cancelado em:</span>
                      <span className="font-bold">{format(new Date(reuniao.canceledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    </div>
                    {reuniao.canceledByName && (
                      <div className="flex justify-end text-[9px] text-red-500 italic">
                        por {reuniao.canceledByName}
                      </div>
                    )}
                    {reuniao.cancelReason && (
                      <div className="bg-red-50 p-1.5 rounded text-red-800 mt-1">
                        Motivo: {reuniao.cancelReason}
                      </div>
                    )}
                  </div>
                )}
                {reuniao.completedAt && (
                  <div className="flex flex-col gap-1 border-t border-green-100 pt-1">
                    <div className="flex justify-between text-green-600">
                      <span>Finalizado em:</span>
                      <span className="font-bold">{format(new Date(reuniao.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    </div>
                    {reuniao.completedByName && (
                      <div className="flex justify-end text-[9px] text-green-500 italic">
                        por {reuniao.completedByName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>

    {reuniao && (
      <>
        <ModalRegistrarAta 
          open={registrarAtaOpen} 
          onClose={() => setRegistrarAtaOpen(false)} 
          meetingId={reuniao.id} 
          meetingTitle={reuniao.title} 
          onSuccess={fetchDetails} 
        />

        <ModalReuniao 
          open={remarcarOpen} 
          onClose={() => setRemarcarOpen(false)} 
          reuniao={reuniao} 
        />
      </>
    )}

    </>
  );
};

