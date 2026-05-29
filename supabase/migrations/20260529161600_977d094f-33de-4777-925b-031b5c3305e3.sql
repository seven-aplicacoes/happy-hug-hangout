-- Add updated_at column to methodology_plan_phases
ALTER TABLE public.methodology_plan_phases 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing rows to have the current timestamp if needed
UPDATE public.methodology_plan_phases SET updated_at = now() WHERE updated_at IS NULL;
