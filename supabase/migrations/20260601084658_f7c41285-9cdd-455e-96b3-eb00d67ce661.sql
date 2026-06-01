-- Add Teams integration fields to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS teams_join_url TEXT,
ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT;

-- Add Teams integration fields to contract_module_meetings table
ALTER TABLE public.contract_module_meetings
ADD COLUMN IF NOT EXISTS teams_join_url TEXT,
ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT;

-- Create meeting history table for tracking changes
CREATE TABLE IF NOT EXISTS public.meeting_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT,
    previous_date DATE,
    new_date DATE,
    previous_start_time TIME WITHOUT TIME ZONE,
    new_start_time TIME WITHOUT TIME ZONE,
    changed_by UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions for meeting_history
GRANT SELECT, INSERT ON public.meeting_history TO authenticated;
GRANT ALL ON public.meeting_history TO service_role;

-- Enable RLS for meeting_history
ALTER TABLE public.meeting_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of their meetings" 
ON public.meeting_history 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.meetings m 
        WHERE m.id = meeting_id 
        AND (m.consultant_id = auth.uid() OR m.client_id = auth.uid())
    ) 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
);

-- Function to validate sequential meeting scheduling
CREATE OR REPLACE FUNCTION public.check_sequential_meeting()
RETURNS TRIGGER AS $$
DECLARE
    prev_meeting_status TEXT;
BEGIN
    -- If it's the first meeting, it's always allowed
    IF NEW.meeting_number = 1 THEN
        RETURN NEW;
    END IF;

    -- Get the status of the previous meeting in the same module
    SELECT status INTO prev_meeting_status
    FROM public.contract_module_meetings
    WHERE module_id = NEW.module_id
      AND meeting_number = NEW.meeting_number - 1;

    -- If previous meeting doesn't exist or is in a status that doesn't allow advancing
    -- Statuses that allow advancing: realizada, concluído, cancelado, etc.
    IF prev_meeting_status IS NULL OR NOT (prev_meeting_status IN ('realizada', 'concluído', 'cancelado', 'remarcada_concluido', 'no_show_justificado')) THEN
        RAISE EXCEPTION 'O encontro anterior deve estar finalizado para agendar este.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce sequential scheduling on UPDATE
DROP TRIGGER IF EXISTS tr_check_sequential_scheduling ON public.contract_module_meetings;
CREATE TRIGGER tr_check_sequential_scheduling
BEFORE UPDATE OF scheduled_at ON public.contract_module_meetings
FOR EACH ROW
WHEN (NEW.scheduled_at IS NOT NULL AND (OLD.scheduled_at IS NULL OR NEW.scheduled_at <> OLD.scheduled_at))
EXECUTE FUNCTION public.check_sequential_meeting();
