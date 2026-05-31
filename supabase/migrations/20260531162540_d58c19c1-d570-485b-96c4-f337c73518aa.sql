ALTER TABLE public.meeting_scheduling_events 
ADD COLUMN IF NOT EXISTS rescheduled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_event_uri TEXT;

-- Create index for faster lookup by calendly uris
CREATE INDEX IF NOT EXISTS idx_meeting_scheduling_events_calendly_invitee_uri ON public.meeting_scheduling_events(calendly_invitee_uri);
CREATE INDEX IF NOT EXISTS idx_meeting_scheduling_events_calendly_event_uri ON public.meeting_scheduling_events(calendly_event_uri);
