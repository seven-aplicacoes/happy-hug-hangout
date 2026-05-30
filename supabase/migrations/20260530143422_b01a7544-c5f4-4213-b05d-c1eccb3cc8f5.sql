
-- 1. Create consultant_calendar_integrations table
CREATE TABLE IF NOT EXISTS public.consultant_calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'calendly',
  provider_user_uri TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(consultant_id, provider)
);

-- 2. Add grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_calendar_integrations TO authenticated;
GRANT ALL ON public.consultant_calendar_integrations TO service_role;

-- 3. Enable RLS
ALTER TABLE public.consultant_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Users can view their own calendar integrations" 
ON public.consultant_calendar_integrations 
FOR SELECT 
USING (auth.uid() = consultant_id);

CREATE POLICY "Users can update their own calendar integrations" 
ON public.consultant_calendar_integrations 
FOR UPDATE 
USING (auth.uid() = consultant_id);

CREATE POLICY "Users can insert their own calendar integrations" 
ON public.consultant_calendar_integrations 
FOR INSERT 
WITH CHECK (auth.uid() = consultant_id);

-- 5. Add trigger for timestamps
CREATE TRIGGER update_consultant_calendar_integrations_updated_at
BEFORE UPDATE ON public.consultant_calendar_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Add new columns to meetings table for external integrations
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS external_provider TEXT,
ADD COLUMN IF NOT EXISTS external_event_uri TEXT,
ADD COLUMN IF NOT EXISTS external_invitee_uri TEXT,
ADD COLUMN IF NOT EXISTS external_event_type_uri TEXT,
ADD COLUMN IF NOT EXISTS external_cancel_url TEXT,
ADD COLUMN IF NOT EXISTS external_reschedule_url TEXT,
ADD COLUMN IF NOT EXISTS external_payload JSONB,
ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 7. Create table for CSAT
CREATE TABLE IF NOT EXISTS public.meeting_csat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contract_product_id UUID REFERENCES public.contract_products(id) ON DELETE CASCADE,
  contract_module_meeting_id UUID REFERENCES public.contract_module_meetings(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES public.profiles(id),
  rating_meeting INTEGER CHECK (rating_meeting >= 0 AND rating_meeting <= 5),
  rating_consultant INTEGER CHECK (rating_consultant >= 0 AND rating_consultant <= 5),
  rating_clarity INTEGER CHECK (rating_clarity >= 0 AND rating_clarity <= 5),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  comment TEXT,
  status TEXT DEFAULT 'pending',
  released_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(meeting_id)
);

-- 8. Add grants for CSAT
GRANT SELECT, INSERT, UPDATE ON public.meeting_csat TO authenticated;
GRANT ALL ON public.meeting_csat TO service_role;

-- 9. Enable RLS for CSAT
ALTER TABLE public.meeting_csat ENABLE ROW LEVEL SECURITY;

-- 10. Create policies for CSAT
CREATE POLICY "Clients can view their own CSATs" 
ON public.meeting_csat 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.clients 
  WHERE clients.id = meeting_csat.client_id 
  AND clients.auth_user_id = auth.uid()
));

CREATE POLICY "Clients can update their own CSATs" 
ON public.meeting_csat 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.clients 
  WHERE clients.id = meeting_csat.client_id 
  AND clients.auth_user_id = auth.uid()
));

CREATE POLICY "Consultants can view CSATs for their clients" 
ON public.meeting_csat 
FOR SELECT 
USING (consultant_id = auth.uid());

CREATE POLICY "Admins can view all CSATs" 
ON public.meeting_csat 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- 11. Trigger for updated_at on CSAT
CREATE TRIGGER update_meeting_csat_updated_at
BEFORE UPDATE ON public.meeting_csat
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
