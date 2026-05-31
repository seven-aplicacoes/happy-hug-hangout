import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UseCalendlyLinkProps {
  consultantId: string;
  productId?: string;
  moduleId?: string;
  meetingTemplateId?: string;
  eventCategory?: string;
}

const DEFAULT_CALENDLY_URL = import.meta.env.VITE_CALENDLY_DEFAULT_URL || 'https://calendly.com';

export function useCalendlyLink({
  consultantId,
  productId,
  moduleId,
  meetingTemplateId,
  eventCategory,
}: UseCalendlyLinkProps) {
  return useQuery({
    queryKey: ['calendly-link', consultantId, productId, moduleId, meetingTemplateId, eventCategory],
    queryFn: async () => {
      if (!consultantId) return DEFAULT_CALENDLY_URL;

      // 1. Check for specific event types for this consultant
      const { data: eventTypes, error } = await supabase
        .from('consultant_calendly_event_types' as any)
        .select('*')
        .eq('consultant_id', consultantId)
        .eq('is_active', true);


      if (error) {
        console.error('Error fetching Calendly event types:', error);
      }

      if (eventTypes && (eventTypes as any).length > 0) {
        const types = eventTypes as any[];
        // Hierarchy resolution
        
        // 1. Link specific to meeting_template_id
        if (meetingTemplateId) {
          const match = types.find(et => et.meeting_template_id === meetingTemplateId);
          if (match) return match.calendly_url;
        }

        // 2. Link specific to module_id
        if (moduleId) {
          const match = types.find(et => et.module_id === moduleId);
          if (match) return match.calendly_url;
        }

        // 3. Link specific to product_id
        if (productId) {
          const match = types.find(et => et.product_id === productId);
          if (match) return match.calendly_url;
        }

        // 4. Default link for event_category
        if (eventCategory) {
          const match = types.find(et => et.event_category === eventCategory && et.is_default);
          if (match) return match.calendly_url;
        }
      }


      // 5. Fallback to consultant's general calendly_url in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('calendly_url')
        .eq('id', consultantId)
        .single();

      if (profile?.calendly_url) {
        return profile.calendly_url;
      }

      // 6. Final fallback to global default
      return DEFAULT_CALENDLY_URL;
    },
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
