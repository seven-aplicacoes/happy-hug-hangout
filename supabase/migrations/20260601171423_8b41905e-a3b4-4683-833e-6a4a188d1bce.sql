-- Alter the google_connections table to support global connections
ALTER TABLE public.google_connections 
ADD COLUMN IF NOT EXISTS scope_type TEXT DEFAULT 'global',
ADD COLUMN IF NOT EXISTS connected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Modify user_id to be nullable if it's currently NOT NULL
ALTER TABLE public.google_connections ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing policies to recreate them with global scope support
DROP POLICY IF EXISTS "Users can view their own google connections" ON public.google_connections;
DROP POLICY IF EXISTS "Users can management their own google connections" ON public.google_connections;

-- Allow all authenticated users to view active global connections
CREATE POLICY "Authenticated users can view global google connections" 
ON public.google_connections 
FOR SELECT 
TO authenticated
USING (scope_type = 'global' AND status = 'active');

-- Allow users to view their own connections (even if not global)
CREATE POLICY "Users can view their own google connections" 
ON public.google_connections 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can manage global connections
CREATE POLICY "Admins can manage all google connections" 
ON public.google_connections 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin')
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_connections TO authenticated;
GRANT ALL ON public.google_connections TO service_role;
