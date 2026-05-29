import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientContact {
  id: string;
  clientId: string;
  name: string;
  role?: string;
  area?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  isPrimary: boolean;
  isFinancial: boolean;
  isDecisionMaker: boolean;
  portalAccess: boolean;
  notes?: string;
  status: string;
  createdAt: string;
}

export function useClientContacts(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['client-contacts', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('name');

      if (error) throw error;

      return (data || []).map((c: any) => ({
        id: c.id,
        clientId: c.client_id,
        name: c.name,
        role: c.role,
        area: c.area,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        isPrimary: c.is_primary,
        isFinancial: c.is_financial,
        isDecisionMaker: c.is_decision_maker,
        portalAccess: c.portal_access,
        notes: c.notes,
        status: c.status,
        createdAt: c.created_at,
      })) as ClientContact[];
    },
    enabled: !!clientId,
  });

  const upsertContact = useMutation({
    mutationFn: async (contact: Partial<ClientContact>) => {
      const payload: any = {
        client_id: contact.clientId,
        name: contact.name,
        role: contact.role,
        area: contact.area,
        email: contact.email,
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        is_primary: contact.isPrimary,
        is_financial: contact.isFinancial,
        is_decision_maker: contact.isDecisionMaker,
        portal_access: contact.portalAccess,
        notes: contact.notes,
        status: contact.status || 'active',
      };

      if (contact.id) payload.id = contact.id;

      const { data, error } = await supabase
        .from('client_contacts')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
      toast({ title: 'Sucesso', description: 'Contato salvo.' });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
      toast({ title: 'Sucesso', description: 'Contato removido.' });
    },
  });

  return { contacts, isLoading, error, upsertContact, deleteContact };
}
