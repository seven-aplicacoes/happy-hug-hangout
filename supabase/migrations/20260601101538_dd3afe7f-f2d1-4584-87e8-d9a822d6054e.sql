ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS teams_creation_status TEXT,
ADD COLUMN IF NOT EXISTS teams_creation_error TEXT;
