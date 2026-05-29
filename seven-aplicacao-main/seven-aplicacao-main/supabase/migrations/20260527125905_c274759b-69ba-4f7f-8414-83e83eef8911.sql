-- Add new columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;

-- Update profiles table role type if needed (checking if 'cliente' exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'cliente') THEN
        ALTER TYPE public.app_role ADD VALUE 'cliente';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If app_role doesn't exist, we might need to create it or just use text
        NULL;
END $$;

-- Enable RLS for clients if not already enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

-- Policies for clients
CREATE POLICY "Admins can manage all clients" 
ON public.clients 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Consultants can see their assigned clients" 
ON public.clients 
FOR SELECT 
TO authenticated 
USING (
  consultant_id = auth.uid()
);

CREATE POLICY "Clients can see their own data" 
ON public.clients 
FOR SELECT 
TO authenticated 
USING (
  auth_user_id = auth.uid()
);
