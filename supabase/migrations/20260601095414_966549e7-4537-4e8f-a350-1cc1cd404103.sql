-- Add missing columns to meeting_status_history
ALTER TABLE public.meeting_status_history 
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS previous_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS new_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS previous_link TEXT,
ADD COLUMN IF NOT EXISTS new_link TEXT;

-- Grant permissions (standard procedure)
GRANT SELECT, INSERT ON public.meeting_status_history TO authenticated;
GRANT ALL ON public.meeting_status_history TO service_role;
