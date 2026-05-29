-- Rename columns to match suggested names
ALTER TABLE public.meetings RENAME COLUMN date TO meeting_date;
ALTER TABLE public.meetings RENAME COLUMN agenda TO title;

-- Add missing columns
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Add RLS policy for clients to see their own meetings
CREATE POLICY "Clients can view their own meetings" 
ON public.meetings 
FOR SELECT 
TO authenticated 
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Ensure correct grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
