import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Save } from 'lucide-react';

interface Consultant {
  id: string;
  name: string;
}

interface CalendlyEventType {
  uri: string;
  name: string;
  scheduling_url: string;
  duration: number;
}

interface Mapping {
  consultant_id: string;
  calendly_event_type_uri: string;
  calendly_scheduling_url: string;
  event_type_name: string;
  duration_minutes: number;
}

export function ModalMappingCalendly({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  // Fetch consultants
  const { data: consultants, isLoading: loadingConsultants } = useQuery({
    queryKey: ['consultants-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'consultor');
      if (error) throw error;
      return data.map(p => ({ id: p.id, name: p.full_name || 'Consultor sem nome' }));
    }
  });

  // Fetch event types from central account via Edge Function
  const { data: eventTypes, isLoading: loadingEventTypes, refetch: refetchEventTypes } = useQuery({
    queryKey: ['calendly-event-types'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calendly-api', {
        body: { action: 'get_event_types' }
      });
      if (error) throw error;
      return data.collection as CalendlyEventType[];
    },
    enabled: open
  });

  // Fetch existing mappings
  const { data: mappings, isLoading: loadingMappings } = useQuery({
    queryKey: ['consultant-calendly-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultant_calendly_settings')
        .select('*');
      if (error) throw error;
      return data as Mapping[];
    },
    enabled: open
  });

  const handleSaveMapping = async (consultantId: string, eventTypeUri: string) => {
    setSaving(consultantId);
    try {
      const et = eventTypes?.find(e => e.uri === eventTypeUri);
      if (!et) throw new Error('Event type not found');

      const { error } = await supabase
        .from('consultant_calendly_settings')
        .upsert({
          consultant_id: consultantId,
          calendly_event_type_uri: et.uri,
          calendly_scheduling_url: et.scheduling_url,
          event_type_name: et.name,
          duration_minutes: et.duration,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'consultant_id' });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Mapeamento salvo com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['consultant-calendly-mappings'] });
    } catch (error: any) {
      console.error('Error saving mapping:', error);
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const isLoading = loadingConsultants || loadingEventTypes || loadingMappings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapeamento de Consultores (Calendly Central)</DialogTitle>
          <DialogDescription>
            Vincule cada consultor a um Event Type específico da conta central do Calendly.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Lista de Consultores</h3>
            <Button variant="ghost" size="sm" onClick={() => refetchEventTypes()} disabled={loadingEventTypes}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loadingEventTypes && "animate-spin")} />
              Sincronizar Eventos
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {consultants?.map((consultant) => {
                const currentMapping = mappings?.find(m => m.consultant_id === consultant.id);
                return (
                  <div key={consultant.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{consultant.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {consultant.id.slice(0, 8)}...</p>
                    </div>

                    <div className="w-64">
                      <Select
                        defaultValue={currentMapping?.calendly_event_type_uri}
                        onValueChange={(val) => handleSaveMapping(consultant.id, val)}
                        disabled={saving === consultant.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um evento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes?.map((et) => (
                            <SelectItem key={et.uri} value={et.uri}>
                              {et.name} ({et.duration} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {saving === consultant.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                );
              })}
              {consultants?.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground italic">Nenhum consultor encontrado.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
