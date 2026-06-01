import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useReunioes } from '@/hooks/useReunioes';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, Clock, MapPin, Video, ExternalLink, 
  User, CheckCircle2, XCircle, AlertCircle, 
  History, Info, Pencil, Trash2, Loader2, Play, RefreshCcw,
  Copy, Plus, FileText, AlignLeft, ShieldCheck, Eye, EyeOff, Link as LinkIcon,
  Users as UsersIcon, ListChecks as ListChecksIcon, Lock as LockIcon, Save
} from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { syncMicrosoft } = useReunioes();
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
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  const isAdmin = perfil === 'admin';
  const isConsultant = perfil === 'consultor';
  const isClient = perfil === 'cliente';

  const canManageMeeting = isAdmin || isConsultant;

  const canRegisterMinutes = canManageMeeting;
  const canMarkAsCompleted = canManageMeeting;
  const canReschedule = canManageMeeting;
  const canCancel = canManageMeeting;
  const canEditAgenda = canManageMeeting;
  const canEditLink = canManageMeeting;

  console.log('[Meeting Modal] userRole:', perfil);
  console.log('[Meeting Modal] isClient:', isClient);
  console.log('[Meeting Modal] canManageMeeting:', canManageMeeting);

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
        teams_creation_status: r.teams_creation_status as 'created' | 'failed' | 'manual' | null,
        teams_creation_error: r.teams_creation_error,
        microsoft_sync_status: r.microsoft_sync_status as 'success' | 'error' | null,
        microsoft_sync_error: r.microsoft_sync_error,
        microsoft_last_sync_at: r.microsoft_last_sync_at

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
    if (!canManageMeeting) {
      toast({ title: 'Acesso negado', description: 'Você não tem permissão para esta ação.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    console.log(`[Meeting Action] Update status to: ${newStatus}`, { meetingId: reuniao.id, reason });

    try {
      const payload: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      if (newStatus === 'cancelada') {
        payload.canceled_at = new Date().toISOString();
        payload.canceled_by = user?.id;
        payload.cancel_reason = reason;

        // Microsoft Teams Cancellation
        if (reuniao.microsoftEventId) {
          try {
            await syncMicrosoft.mutateAsync({ 
              meetingId: reuniao.id, 
              action: 'cancel' 
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

      console.log('[Meeting Status Update] Payload:', payload);
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
      
      // Invalidations
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      queryClient.invalidateQueries({ queryKey: ['portal-summary', reuniao.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['cliente-historico', reuniao.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['contract-module-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['contract-product-phases'] });
      
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('[Meeting Status Update] Error:', err);
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
    
    console.group('[Teams Sync] Tentar gerar link');
    console.log('Meeting ID:', reuniao.id);
    console.groupEnd();

    try {
      await syncMicrosoft.mutateAsync({ meetingId: reuniao.id, action: 'create' });
      toast({ title: 'Sucesso', description: 'Link do Teams gerado e sincronizado com sucesso.' });
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('[Teams Sync] Erro:', err);
      // O erro já vem formatado pelo hook useReunioes
      toast({ 
        title: 'Falha na Sincronização Microsoft', 
        description: err.message || 'Não foi possível sincronizar com o Microsoft Graph.', 
        variant: 'destructive',
        duration: 10000 // Mostrar por mais tempo se for erro
      });
    } finally {
      setGeneratingTeams(false);
    }
  };

  const { testMicrosoftConnection, testMicrosoftCalendar } = useReunioes();
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingCalendar, setTestingCalendar] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testMicrosoftConnection();
      if (result.success) {
        toast({ 
          title: "Conexão OK", 
          description: `Conectado via ${result.connector}. Usuário: ${result.details ? JSON.parse(result.details).displayName : 'OK'}` 
        });
      } else {
        toast({ 
          title: result.status === 403 ? "Permissão Negada" : "Erro de Conexão", 
          description: result.status === 403 ? "O conector está logado, mas não tem permissão de leitura." : `Status ${result.status}: ${result.details}`,
          variant: "destructive",
          duration: 10000
        });
      }
    } catch (err: any) {
      toast({ title: "Erro na Function", description: err.message, variant: "destructive" });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestCalendar = async () => {
    setTestingCalendar(true);
    try {
      const result = await testMicrosoftCalendar();
      if (result.success) {
        toast({ title: "Calendário OK", description: "Permissões de leitura e listagem de eventos confirmadas." });
      } else {
        const is403 = result.status === 403;
        toast({ 
          title: is403 ? "Falta Permissão Calendars.ReadWrite" : "Erro no Calendário", 
          description: is403 
            ? "O login funciona, mas o aplicativo não tem permissão para gerenciar seu calendário. Reconecte o Microsoft Outlook/Calendar com permissão total."
            : `Erro ao acessar calendário. Status ${result.status}`,
          variant: "destructive",
          duration: 10000
        });
      }
    } catch (err: any) {
      toast({ title: "Erro no teste", description: err.message, variant: "destructive" });
    } finally {
      setTestingCalendar(false);
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

  const handleUpdateDescription = async () => {
    if (!reuniao) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          description: newDescription,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', reuniao.id);

      if (error) throw error;

      await supabase.from('meeting_status_history').insert({
        meeting_id: reuniao.id,
        action: 'description_updated',
        new_status: reuniao.status,
        changed_by: user?.id,
        change_reason: 'Pauta/Descrição atualizada',
        payload: {
          previous_description: reuniao.description,
          new_description: newDescription
        }
      });

      if (reuniao.microsoftEventId) {
        try {
          await syncMicrosoft.mutateAsync({ meetingId: reuniao.id, action: 'update' });
        } catch (syncErr) {
          console.error('Failed to sync description update to Microsoft:', syncErr);
        }
      }

      toast({ title: 'Sucesso', description: 'Pauta atualizada com sucesso.' });
      setIsEditingDescription(false);
      fetchDetails();
    } catch (err: any) {
      console.error('Error updating description:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a pauta.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendada': return <Badge className="bg-blue-500 text-white">Agendado</Badge>;
      case 'em_andamento': return <Badge className="bg-amber-500 text-white animate-pulse">Em Andamento</Badge>;
      case 'realizada': return <Badge className="bg-green-500 text-white">Concluído</Badge>;
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

  const canEditLocal = canReschedule && (reuniao.status === 'agendada' || reuniao.status === 'em_andamento' || reuniao.status === 'reagendada' || reuniao.status === 'aguardando_confirmacao');
  const canCancelLocal = canCancel && !['realizada', 'cancelada', 'realizado'].includes(reuniao.status);
  const canMarkAsRealizadaLocal = canMarkAsCompleted && !['realizada', 'cancelada', 'realizado'].includes(reuniao.status);
  const canRegistrarAtaLocal = canRegisterMinutes && reuniao.status !== 'cancelada';

  const handleMarkAsCompleted = async (withAta = false) => {
    if (!canMarkAsCompleted) {
      toast({ title: 'Acesso negado', description: 'Você não tem permissão para esta ação.', variant: 'destructive' });
      return;
    }
    if (withAta) {
      setRegistrarAtaOpen(true);
    }
    console.log('[Meeting Action] mark as completed:', reuniao.id);
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
            {canReschedule && (reuniao.status === 'cancelada' || !['realizada'].includes(reuniao.status)) && (
              <Button variant="outline" onClick={() => setRemarcarOpen(true)} className="gap-2">
                <Pencil className="h-4 w-4" /> Remarcar
              </Button>
            )}
            {canCancelLocal && !isCancelling && (
              <Button variant="ghost" onClick={() => setIsCancelling(true)} className="text-destructive hover:bg-destructive/5 gap-2">
                <Trash2 className="h-4 w-4" /> Cancelar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {canRegistrarAtaLocal && (
              <Button variant="outline" onClick={() => setRegistrarAtaOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" /> {minutes ? 'Editar Ata' : 'Registrar Ata'}
              </Button>
            )}
            {canMarkAsRealizadaLocal && (
              <Button onClick={() => setIsConfirmingCompletion(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Marcar como Realizada
              </Button>
            )}
            {joinLink && ['agendada', 'reagendada', 'em_andamento', 'agendado', 'reagendado'].includes(reuniao.status) && (
              <Button onClick={() => window.open(joinLink, '_blank', 'noopener,noreferrer')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-6 font-bold shadow-lg">
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
                        
                        {canEditLink && (
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <AlignLeft className="h-4 w-4" /> Pauta / Descrição
                </h3>
                {canEditAgenda && !isEditingDescription && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setNewDescription(reuniao.description || '');
                      setIsEditingDescription(true);
                    }}
                    className="h-7 text-[10px] font-bold uppercase gap-1"
                  >
                    <Pencil className="h-3 w-3" /> Editar pauta
                  </Button>
                )}
              </div>
              
              {isEditingDescription ? (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <Textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Descreva a pauta da reunião..."
                    className="min-h-[120px] text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingDescription(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleUpdateDescription}
                      disabled={submitting}
                      className="gap-2"
                    >
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Salvar pauta
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border rounded-xl p-4 text-xs text-muted-foreground whitespace-pre-wrap min-h-[60px]">
                  {reuniao.description || 'Nenhuma pauta definida para este encontro.'}
                </div>
              )}
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

            {isAdmin && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Diagnóstico Microsoft
                </h3>
                
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Status Sync:</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] h-4",
                      reuniao.microsoft_sync_status === 'success' ? "bg-green-100 text-green-700 border-green-200" : 
                      reuniao.microsoft_sync_status === 'error' ? "bg-red-100 text-red-700 border-red-200" : "bg-gray-100 text-gray-700"
                    )}>
                      {reuniao.microsoft_sync_status || 'Pendente'}
                    </Badge>
                  </div>
                  
                  {reuniao.microsoft_last_sync_at && (
                    <div className="flex justify-between">
                      <span className="text-amber-700">Última Sync:</span>
                      <span className="font-medium">{format(new Date(reuniao.microsoft_last_sync_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                    </div>
                  )}

                  {reuniao.microsoftEventId && (
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-700">Microsoft Event ID:</span>
                      <span className="font-mono text-[8px] break-all bg-white p-1 rounded border">{reuniao.microsoftEventId}</span>
                    </div>
                  )}

                  {reuniao.microsoft_sync_error && (
                    <div className="flex flex-col gap-1">
                      <span className="text-red-700 font-bold">Último Erro:</span>
                      <div className="bg-red-100/50 p-2 rounded text-[9px] text-red-800 break-words border border-red-200">
                        {reuniao.microsoft_sync_error}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleTestConnection} 
                      disabled={testingConnection}
                      className="text-[9px] h-7 gap-1 border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      {testingConnection ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                      1. Testar Conexão Básica
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleTestCalendar} 
                      disabled={testingCalendar}
                      className="text-[9px] h-7 gap-1 border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      {testingCalendar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                      2. Testar Calendário (POST)
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateTeamsLink()} 
                      disabled={generatingTeams}
                      className="text-[9px] h-7 gap-1 border-amber-300 text-amber-800 hover:bg-amber-100 font-bold"
                    >
                      {generatingTeams ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                      3. Forçar Sincronização
                    </Button>
                    
                    <div className="bg-amber-100/50 p-2 rounded text-[9px] text-amber-900 border border-amber-200 mt-2 italic">
                      <strong>Dica:</strong> Se o teste 1 der OK mas o 2 der 403, reconecte o Microsoft Outlook/Calendar com permissão total de Calendário.
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowManualLinkForm(true)}
                      className="text-[9px] h-7 text-amber-700 hover:bg-amber-100"
                    >
                      Vincular Link Manualmente
                    </Button>
                  </div>
                </div>
              </div>
            )}
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

