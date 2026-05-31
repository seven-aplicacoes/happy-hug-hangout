-- Ensure indexes for meeting_scheduling_events
CREATE INDEX IF NOT EXISTS idx_mse_meeting_id ON public.meeting_scheduling_events(meeting_id);
CREATE INDEX IF NOT EXISTS idx_mse_consultant_id ON public.meeting_scheduling_events(consultant_id);
CREATE INDEX IF NOT EXISTS idx_mse_client_id ON public.meeting_scheduling_events(client_id);
CREATE INDEX IF NOT EXISTS idx_mse_calendly_event_uri ON public.meeting_scheduling_events(calendly_event_uri);
CREATE INDEX IF NOT EXISTS idx_mse_calendly_invitee_uri ON public.meeting_scheduling_events(calendly_invitee_uri);
CREATE INDEX IF NOT EXISTS idx_mse_status ON public.meeting_scheduling_events(status);
CREATE INDEX IF NOT EXISTS idx_mse_scheduled_start_time ON public.meeting_scheduling_events(scheduled_start_time);

-- Ensure indexes for meeting_history_events
CREATE INDEX IF NOT EXISTS idx_mhe_meeting_id ON public.meeting_history_events(meeting_id);
CREATE INDEX IF NOT EXISTS idx_mhe_client_id ON public.meeting_history_events(client_id);
CREATE INDEX IF NOT EXISTS idx_mhe_consultant_id ON public.meeting_history_events(consultant_id);
CREATE INDEX IF NOT EXISTS idx_mhe_event_type ON public.meeting_history_events(event_type);

-- Ensure indexes for contract_module_meetings
CREATE INDEX IF NOT EXISTS idx_cmm_client_id ON public.contract_module_meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_cmm_module_id ON public.contract_module_meetings(module_id);
CREATE INDEX IF NOT EXISTS idx_cmm_consultant_id ON public.contract_module_meetings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_cmm_status ON public.contract_module_meetings(status);

-- Ensure RLS allows Edge Function (using service role) to bypass, 
-- but we should double check policies for users.
-- Policies were updated in the previous turn, so we just ensure they are enabled.
ALTER TABLE public.meeting_scheduling_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_history_events ENABLE ROW LEVEL SECURITY;
