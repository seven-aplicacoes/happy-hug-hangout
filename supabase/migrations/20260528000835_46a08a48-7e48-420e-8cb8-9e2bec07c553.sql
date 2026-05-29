ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS client_product_id UUID,
ADD COLUMN IF NOT EXISTS methodology_phase_id UUID,
ADD COLUMN IF NOT EXISTS methodology_week_id UUID,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS scheduled_by UUID REFERENCES public.profiles(id);

-- Update grants to ensure roles have access to the new columns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
