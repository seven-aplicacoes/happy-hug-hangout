-- Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS client_product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS methodology_phase_id UUID REFERENCES public.methodology_phases(id),
ADD COLUMN IF NOT EXISTS methodology_week_id UUID,
ADD COLUMN IF NOT EXISTS demand_type text,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create subtasks table if it doesn't exist (it already exists but let's ensure constraints)
-- Check if subtasks has foreign key to tasks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subtasks_task_id_fkey') THEN
        ALTER TABLE public.subtasks ADD CONSTRAINT subtasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Consultants can manage their tasks" ON public.tasks;

CREATE POLICY "Tasks access policy" ON public.tasks
FOR ALL TO authenticated
USING (
  (auth.uid() = consultant_id) OR 
  (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = tasks.client_id AND clients.consultant_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin'::user_role)))
);

-- Ensure RLS is enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Subtasks policy
CREATE POLICY "Subtasks access policy" ON public.subtasks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = subtasks.task_id 
    AND (
      (auth.uid() = tasks.consultant_id) OR 
      (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = tasks.client_id AND clients.consultant_id = auth.uid())) OR
      (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin'::user_role)))
    )
  )
);
