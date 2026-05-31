-- Create consultant_calendly_event_types table
CREATE TABLE IF NOT EXISTS public.consultant_calendly_event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  calendly_url text NOT NULL,
  event_category text, -- e.g., diagnostic, kickoff, followup, closing
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  module_id uuid, -- Reference to methodology_plan_modules or similar, but keeping as uuid for flexibility
  meeting_template_id uuid,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_calendly_event_types TO authenticated;
GRANT ALL ON public.consultant_calendly_event_types TO service_role;

-- Enable RLS
ALTER TABLE public.consultant_calendly_event_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own event types or all if admin" ON public.consultant_calendly_event_types
  FOR SELECT USING (true); -- Usually viewable by everyone in the company

CREATE POLICY "Consultants can manage their own event types" ON public.consultant_calendly_event_types
  FOR ALL USING (auth.uid() = consultant_id);

-- Create meeting_scheduling_events table
CREATE TABLE IF NOT EXISTS public.meeting_scheduling_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  product_id uuid,
  module_id uuid,
  meeting_id uuid NOT NULL REFERENCES public.contract_module_meetings(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  provider text NOT NULL DEFAULT 'calendly',
  calendly_event_uri text,
  calendly_invitee_uri text,
  calendly_event_uuid text,
  calendly_invitee_uuid text,

  event_name text,
  invitee_name text,
  invitee_email text,

  scheduled_start_time timestamptz,
  scheduled_end_time timestamptz,
  timezone text,

  status text NOT NULL DEFAULT 'pending',
  cancel_url text,
  reschedule_url text,
  canceled_at timestamptz,
  cancellation_reason text,
  raw_payload jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_scheduling_events TO authenticated;
GRANT ALL ON public.meeting_scheduling_events TO service_role;

-- Enable RLS
ALTER TABLE public.meeting_scheduling_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view scheduling events" ON public.meeting_scheduling_events
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage scheduling events" ON public.meeting_scheduling_events
  FOR ALL USING (true); -- Webhooks use service role typically via edge function

-- Add scheduling window to contract_module_meetings
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_module_meetings' AND column_name='available_from') THEN
        ALTER TABLE public.contract_module_meetings ADD COLUMN available_from timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_module_meetings' AND column_name='available_until') THEN
        ALTER TABLE public.contract_module_meetings ADD COLUMN available_until timestamptz;
    END IF;
END $$;

-- Update trigger for updated_at on consultant_calendly_event_types
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultant_calendly_event_types_updated_at
BEFORE UPDATE ON public.consultant_calendly_event_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_scheduling_events_updated_at
BEFORE UPDATE ON public.meeting_scheduling_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
