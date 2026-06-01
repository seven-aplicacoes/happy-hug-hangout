-- Add meeting link provider and location_url to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS meeting_link_provider TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS location_url TEXT;

-- Add integration status fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS microsoft_teams_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS microsoft_teams_account TEXT;

-- Update RLS for meetings to include new columns (usually handled by ALL/SELECT/UPDATE)
-- No specific RLS changes needed if using existing policies

-- Update existing meetings to have 'manual' as provider if they don't have teams_join_url
UPDATE public.meetings 
SET meeting_link_provider = 'teams' 
WHERE teams_join_url IS NOT NULL;

-- If contract_module_meetings also needs these for the journey view
ALTER TABLE public.contract_module_meetings 
ADD COLUMN IF NOT EXISTS meeting_link_provider TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS location_url TEXT;
