-- Enhance meeting_scheduling_events
ALTER TABLE public.meeting_scheduling_events 
ADD COLUMN IF NOT EXISTS previous_event_uuid uuid,
ADD COLUMN IF NOT EXISTS invitee_uuid uuid,
ADD COLUMN IF NOT EXISTS event_uuid uuid;

-- Create meeting_history_events table
CREATE TABLE IF NOT EXISTS public.meeting_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.contract_module_meetings(id) ON DELETE CASCADE,
  scheduling_event_id uuid REFERENCES public.meeting_scheduling_events(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  consultant_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- scheduled, canceled, rescheduled, completed, updated
  title text NOT NULL,
  description text,
  previous_start_time timestamptz,
  new_start_time timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_history_events TO authenticated;
GRANT ALL ON public.meeting_history_events TO service_role;

-- Enable RLS
ALTER TABLE public.meeting_history_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view meeting history events" ON public.meeting_history_events
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage history events" ON public.meeting_history_events
  FOR ALL USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_meeting_history_events_meeting_id ON public.meeting_history_events(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_history_events_client_id ON public.meeting_history_events(client_id);
