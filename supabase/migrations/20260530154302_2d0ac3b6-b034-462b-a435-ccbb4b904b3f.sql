-- Tabela para armazenar as configurações do Calendly centralizado
CREATE TABLE IF NOT EXISTS public.calendly_central_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    provider_user_uri TEXT,
    organization_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT ALL ON public.calendly_central_auth TO service_role;
GRANT SELECT ON public.calendly_central_auth TO authenticated;

-- Tabela para mapear consultores aos links/eventos do Calendly
CREATE TABLE IF NOT EXISTS public.consultant_calendly_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendly_event_type_uri TEXT,
    calendly_scheduling_url TEXT NOT NULL,
    event_type_name TEXT,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(consultant_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_calendly_settings TO authenticated;
GRANT ALL ON public.consultant_calendly_settings TO service_role;

-- Tabela para gerenciar sessões de agendamento (contexto antes do webhook)
CREATE TABLE IF NOT EXISTS public.calendly_booking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    contract_product_id UUID,
    contract_phase_id UUID,
    contract_module_meeting_id UUID REFERENCES public.contract_module_meetings(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    calendly_event_type_uri TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, canceled, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

GRANT SELECT, INSERT, UPDATE ON public.calendly_booking_sessions TO authenticated;
GRANT ALL ON public.calendly_booking_sessions TO service_role;

-- Garantir que a tabela meetings tenha os campos necessários
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS external_provider TEXT,
ADD COLUMN IF NOT EXISTS external_event_uri TEXT,
ADD COLUMN IF NOT EXISTS external_invitee_uri TEXT,
ADD COLUMN IF NOT EXISTS external_event_type_uri TEXT,
ADD COLUMN IF NOT EXISTS external_cancel_url TEXT,
ADD COLUMN IF NOT EXISTS external_reschedule_url TEXT,
ADD COLUMN IF NOT EXISTS external_payload JSONB,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system';

-- RLS
ALTER TABLE public.calendly_central_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_calendly_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendly_booking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage central auth" ON public.calendly_central_auth
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view consultant calendly settings" ON public.consultant_calendly_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage consultant calendly settings" ON public.consultant_calendly_settings
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can manage their own booking sessions" ON public.calendly_booking_sessions
FOR ALL USING (auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE TRIGGER update_calendly_central_auth_updated_at
BEFORE UPDATE ON public.calendly_central_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultant_calendly_settings_updated_at
BEFORE UPDATE ON public.consultant_calendly_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
