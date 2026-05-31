ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS cancel_url TEXT,
ADD COLUMN IF NOT EXISTS reschedule_url TEXT;
