-- Add new columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS created_by_role TEXT,
ADD COLUMN IF NOT EXISTS delegated_by UUID REFERENCES public.profiles(id);

-- Update existing tasks with creator info if available from profiles
UPDATE public.tasks t
SET 
  created_by_name = p.full_name,
  created_by_role = p.role
FROM public.profiles p
WHERE t.created_by = p.id AND t.created_by_name IS NULL;

-- Ensure proper grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
