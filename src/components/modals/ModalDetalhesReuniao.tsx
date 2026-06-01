import { useState, useEffect, useMemo } from 'react';
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
  Calendar, Clock, Video, ExternalLink, 
  User, CheckCircle2, AlertCircle, 
  Info, Pencil, Trash2, Loader2, Play, RefreshCcw,
  Copy, FileText, ShieldCheck, Link as LinkIcon,
  Users as UsersIcon, XCircle, FileEdit
} from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
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
  const { syncGoogle } = useReunioes();
  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingMeet, setGeneratingMeet] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
  const [registrarAtaOpen, setRegistrarAtaOpen] = useState(false);
  const [remarcarOpen, setRemarcarOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showManualLinkForm, setShowManualLinkForm] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const isAdminOrConsultant = perfil === 'admin' || perfil === 'consultor';
  const isClient = perfil === 'cliente';

  const fetchDetails = async () => {
    if (!reuniaoId) return;
    setLoading(true);
    try {
      const { data: r, error } = await supabase
        .from('meetings')
        .select(`
          *,
          client:client_id (trade_name, corporate_name, email),
          profile:profiles!meetings_consultant_id_fkey (full_name, email)
        `)
        .eq('id', reuniaoId)
        .maybeSingle();

      if (error) throw error;
      if (!r) throw new Error('Reunião não encontrada');

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
        meet_join_url: r.meet_join_url,
        meetingLinkProvider: r.meeting_link_provider as any,
        google_event_id: r.google_event_id,
        calendar_sync_status: r.calendar_sync_status,
        calendar_sync_error: r.calendar_sync_error,
        participantes: Array.isArray(r.participants) ? (r.participants as unknown as string[]) : [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };

      setReuniao(mappedReuniao);
      setManualUrl(r.location_url || '');

      // Fetch minutes
      const { data: mData } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('meeting_id', reuniaoId)
        .maybeSingle();
      
      if (mData) setMinutes({
        id: mData.id,
        meetingId: mData.meeting_id,
        summary: mData.summary,
        discussionPoints: mData.discussion_points,
        decisions: mData.decisions,
        nextSteps: mData.next_steps,
        internalNotes: mData.internal_notes,
        visibleToClient: mData.visible_to_client,
        createdBy: mData.created_by,
        updatedBy: mData.updated_by,
        createdAt: mData.created_at,
        updatedAt: mData.updated_at
      });

    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && reuniaoId) {
      fetchDetails();
    }
  }, [open, reuniaoId]);

  const joinLink = useMemo(() => {
    if (!reuniao) return null;
    return reuniao.meet_join_url || reuniao.teamsJoinUrl || reuniao.locationUrl || reuniao.meetingUrl || reuniao.location;
  }, [reuniao]);

  const handleGenerateMeetLink = async () => {
    if (!reuniao) return;
    setGeneratingMeet(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-meet-meeting', {
        body: { 
          meeting_id: reuniao.id, 
          action: reuniao.google_event_id ? 'update' : 'create' 
        }
      });
      
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);

      toast({ title: 'Sucesso', description: 'Link do Google Meet processado com sucesso.' });
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({ title: 'Erro na Sincronização', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingMeet(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Reuniao['status'], reason?: string) => {
    if (!reuniao) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ 
          status: newStatus,
          canceled_at: newStatus === 'cancelada' ? new Date().toISOString() : null,
          canceled_by: newStatus === 'cancelada' ? user?.id : null,
          cancel_reason: reason || null,
          completed_at: newStatus === 'realizada' ? new Date().toISOString() : null,
          completed_by: newStatus === 'realizada' ? user?.id : null
        })
        .eq('id', reuniao.id);

      if (error) throw error;

      if (newStatus === 'cancelada' && reuniao.google_event_id) {
          await supabase.functions.invoke('create-google-meet-meeting', {
              body: { meeting_id: reuniao.id, action: 'cancel' }
          });
      }

      toast({ title: 'Sucesso', description: `Reunião marcada como ${newStatus}.` });
      setIsConfirmingCompletion(false);
      setIsCancelling(false);
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveManualLink = async () => {
    if (!reuniao) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          location_url: manualUrl,
          meeting_link_provider: 'manual'
        })
        .eq('id', reuniao.id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Link manual atualizado.' });
      setShowManualLinkForm(false);
      fetchDetails();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !reuniao) {
    return (
      <BaseModal open={open} onClose={onClose} titulo="Carregando..." size="lg">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo={reuniao.title} 
      size="full"
      footer={
        <div className="flex flex-wrap justify-between items-center w-full gap-4">
          <div className="flex flex-wrap gap-2">
            {isAdminOrConsultant && (
              <>
                <Button variant="outline" onClick={() => setRemarcarOpen(true)} className="gap-2">
                  <Pencil className="h-4 w-4" /> Reagendar
                </Button>
                <Button variant="outline" onClick={() => setIsCancelling(true)} className="gap-2 text-destructive hover:bg-destructive/10">
                  <XCircle className="h-4 w-4" /> Cancelar
                </Button>
                <Button variant="outline" onClick={() => setRegistrarAtaOpen(true)} className="gap-2">
                  <FileEdit className="h-4 w-4" /> Registrar Ata
                </Button>
                {reuniao.status !== 'realizada' && (
                  <Button variant="default" onClick={() => setIsConfirmingCompletion(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Finalizar
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            {joinLink && (
              <Button onClick={() => window.open(joinLink, '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-lg">
                <Play className="h-4 w-4" /> Entrar na Reunião
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-muted/30 rounded-2xl p-6 border border-muted/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Info className="h-4 w-4" /> Informações Gerais
                </h3>
                <Badge variant={reuniao.status === 'realizada' ? 'default' : 'outline'} className={cn(
                    reuniao.status === 'realizada' && "bg-emerald-500",
                    reuniao.status === 'cancelada' && "bg-destructive text-white border-none"
                )}>
                  {reuniao.status.toUpperCase()}
                </Badge>
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
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">Data e Hora</span>
                  <span className="text-xs font-bold">
                    {reuniao.meetingDate} às {reuniao.startTime} ({formatDuration(reuniao.duracao)})
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-muted/60">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 flex items-center gap-2">
                      <Video className="h-3 w-3" /> Link da Reunião
                    </span>
                    {isAdminOrConsultant && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase font-bold" onClick={() => setShowManualLinkForm(true)}>
                            Editar Link
                        </Button>
                    )}
                </div>
                
                {joinLink ? (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-blue-600 p-2.5 rounded-lg shrink-0">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-900 truncate">
                            {reuniao.meet_join_url ? 'Google Meet' : 'Link da Reunião'}
                        </p>
                        <p className="text-[10px] text-blue-700 truncate">{joinLink}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => {
                        navigator.clipboard.writeText(joinLink!);
                        toast({ title: 'Copiado!' });
                      }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(joinLink!, '_blank')}>
                        Acessar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-dashed rounded-xl p-6 text-center space-y-4">
                    <p className="text-xs text-muted-foreground italic">Nenhum link gerado para esta reunião.</p>
                    {isAdminOrConsultant && (
                      <div className="flex justify-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleGenerateMeetLink} disabled={generatingMeet}>
                          {generatingMeet ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                          Gerar Google Meet
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowManualLinkForm(true)}>
                          Adicionar Manual
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/30 rounded-2xl p-6 border border-muted/60">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                <UsersIcon className="h-4 w-4" /> Pauta e Descrição
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {reuniao.description || 'Nenhuma descrição informada.'}
              </p>
            </div>

            {minutes && (
                <div className="bg-muted/30 rounded-2xl p-6 border border-muted/60 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Ata da Reunião
                    </h3>
                    <div className="space-y-3">
                        {minutes.summary && (
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60">Resumo</p>
                                <p className="text-xs text-foreground whitespace-pre-wrap">{minutes.summary}</p>
                            </div>
                        )}
                        {minutes.decisions && (
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60">Decisões</p>
                                <p className="text-xs text-foreground whitespace-pre-wrap">{minutes.decisions}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {remarcarOpen && (
        <ModalReuniao 
          open={remarcarOpen} 
          onClose={() => { setRemarcarOpen(false); fetchDetails(); }} 
          reuniao={reuniao} 
        />
      )}

      <ModalRegistrarAta
        open={registrarAtaOpen}
        onClose={() => { setRegistrarAtaOpen(false); fetchDetails(); }}
        reuniaoId={reuniao.id}
      />
      
      {showManualLinkForm && (
        <BaseModal open={showManualLinkForm} onClose={() => setShowManualLinkForm(false)} titulo="Editar Link da Reunião" size="sm">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>URL da Reunião</Label>
              <Input value={manualUrl} onChange={e => setManualUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowManualLinkForm(false)}>Cancelar</Button>
              <Button onClick={handleSaveManualLink} disabled={submitting}>Salvar</Button>
            </div>
          </div>
        </BaseModal>
      )}

      {isConfirmingCompletion && (
        <BaseModal open={isConfirmingCompletion} onClose={() => setIsConfirmingCompletion(false)} titulo="Finalizar Reunião" size="sm">
            <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">Deseja marcar esta reunião como realizada? Isso atualizará o progresso do módulo.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsConfirmingCompletion(false)}>Voltar</Button>
                    <Button onClick={() => handleUpdateStatus('realizada')} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">Confirmar</Button>
                </div>
            </div>
        </BaseModal>
      )}

      {isCancelling && (
        <BaseModal open={isCancelling} onClose={() => setIsCancelling(false)} titulo="Cancelar Reunião" size="sm">
            <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">Informe o motivo do cancelamento:</p>
                <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Motivo..." />
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsCancelling(false)}>Voltar</Button>
                    <Button onClick={() => handleUpdateStatus('cancelada', cancelReason)} disabled={submitting} variant="destructive">Confirmar Cancelamento</Button>
                </div>
            </div>
        </BaseModal>
      )}
    </BaseModal>
  );
};
