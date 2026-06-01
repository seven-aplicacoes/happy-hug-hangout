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
  Users as UsersIcon
} from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
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
  const [history, setHistory] = useState<MeetingStatusHistory[]>([]);
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

  const canManageMeeting = perfil === 'admin' || perfil === 'consultor';

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
    console.log("Iniciando geração de Google Meet", { meetingId: reuniao.id, action: reuniao.google_event_id ? 'update' : 'create' });
    
    try {
      const { data, error } = await supabase.functions.invoke('create-google-meet-meeting', {
        body: { 
          meeting_id: reuniao.id, 
          action: reuniao.google_event_id ? 'update' : 'create' 
        }
      });
      
      if (error) {
        console.error("Erro ao chamar Edge Function create-google-meet-meeting:", error);
        throw new Error(error.message || "Erro de conexão com a Edge Function");
      }

      if (data?.success === false) {
        console.error("Edge Function retornou erro:", data);
        throw new Error(data.error || "Falha ao processar link no Google");
      }

      toast({ title: 'Sucesso', description: 'Link do Google Meet processado com sucesso.' });
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Erro completo handleGenerateMeetLink:", err);
      toast({ 
        title: 'Erro na Sincronização', 
        description: err.message.includes("Failed to send a request") 
          ? "Não foi possível alcançar a Edge Function. Verifique se ela foi deployada corretamente no Supabase." 
          : err.message, 
        variant: 'destructive' 
      });
    } finally {
      setGeneratingMeet(false);
    }
  };

  const handleTestConnection = async () => {
    setSubmitting(true);
    console.log("Iniciando diagnóstico de conexão Google");
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-google-connection');
      
      if (error) {
        console.error("Erro ao chamar Edge Function diagnose-google-connection:", error);
        throw new Error(error.message || "Erro de conexão com a Edge Function");
      }

      if (data?.success === false) {
        toast({ title: 'Atenção', description: data.error || 'Não conectado', variant: 'warning' as any });
      } else {
        toast({ 
          title: 'Conexão OK', 
          description: `Conectado como ${data.data?.email}. Token: ${data.data?.tokenStatus}` 
        });
      }
    } catch (err: any) {
      console.error("Erro completo handleTestConnection:", err);
      toast({ 
        title: 'Erro no Diagnóstico', 
        description: err.message.includes("Failed to send a request")
          ? "Edge Function 'diagnose-google-connection' não encontrada ou erro de CORS."
          : err.message, 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestEdgeFunction = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-google-edge-function');
      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Teste OK', description: data.message });
      }
    } catch (err: any) {
      toast({ title: 'Erro no Teste', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddManualLink = async () => {
    if (!reuniao || !manualUrl) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          location_url: manualUrl,
          meeting_link_provider: 'manual',
          sync_status: 'manual'
        })
        .eq('id', reuniao.id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Link manual adicionado.' });
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
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            {canManageMeeting && (
              <Button variant="outline" onClick={() => setRemarcarOpen(true)} className="gap-2">
                <Pencil className="h-4 w-4" /> Remarcar
              </Button>
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
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 flex items-center gap-2 mb-3">
                  <Video className="h-3 w-3" /> Link da Reunião
                </span>
                
                {joinLink ? (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-blue-600 p-2.5 rounded-lg shrink-0">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-900 truncate">{reuniao.meet_join_url ? 'Google Meet' : 'Link da Reunião'}</p>
                        <p className="text-[10px] text-blue-700 truncate">{joinLink}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => {
                        navigator.clipboard.writeText(joinLink);
                        toast({ title: 'Copiado!' });
                      }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(joinLink, '_blank')}>
                        Acessar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-dashed rounded-xl p-6 text-center space-y-4">
                    <p className="text-xs text-muted-foreground italic">Nenhum link gerado para esta reunião.</p>
                    {canManageMeeting && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex justify-center gap-3">
                          <Button variant="outline" size="sm" onClick={handleGenerateMeetLink} disabled={generatingMeet}>
                            {generatingMeet ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                            Gerar Google Meet
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setShowManualLinkForm(true)}>
                            Adicionar Manual
                          </Button>
                        </div>
                        <Button variant="link" size="sm" className="text-[10px] text-muted-foreground" onClick={handleTestConnection} disabled={submitting}>
                          {submitting ? 'Testando...' : 'Diagnosticar Conexão Google'}
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
          </div>
        </div>
      </div>

      {remarcarOpen && (
        <ModalReuniao 
          open={remarcarOpen} 
          onClose={() => setRemarcarOpen(false)} 
          reuniao={reuniao} 
        />
      )}
      
      {showManualLinkForm && (
        <BaseModal open={showManualLinkForm} onClose={() => setShowManualLinkForm(false)} titulo="Link Manual" size="sm">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>URL da Reunião</Label>
              <Input value={manualUrl} onChange={e => setManualUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowManualLinkForm(false)}>Cancelar</Button>
              <Button onClick={handleAddManualLink} disabled={submitting}>Salvar</Button>
            </div>
          </div>
        </BaseModal>
      )}
    </BaseModal>
  );
};
