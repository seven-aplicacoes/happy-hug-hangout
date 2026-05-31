-- 1. Ensure only one active 'scheduled' event per meeting_id
-- We first clean up any existing duplicates by marking older scheduled ones as 'superseded'
UPDATE public.meeting_scheduling_events
SET status = 'superseded'
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY meeting_id ORDER BY created_at DESC) as rn
        FROM public.meeting_scheduling_events
        WHERE status = 'scheduled'
    ) t
    WHERE rn > 1
);

-- Now create the unique partial index
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_scheduled_meeting
ON public.meeting_scheduling_events (meeting_id)
WHERE status = 'scheduled';

-- 2. Ensure calendly_invitee_uri is unique when present
CREATE UNIQUE INDEX IF NOT EXISTS unique_calendly_invitee_uri
ON public.meeting_scheduling_events (calendly_invitee_uri)
WHERE calendly_invitee_uri IS NOT NULL;

-- 3. Fix search_path for update_updated_at_column if not already fixed
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
