-- Update documents table with missing columns
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS methodology_phase_id UUID REFERENCES public.methodology_phases(id),
ADD COLUMN IF NOT EXISTS methodology_week_id UUID, 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'internal' CHECK (visibility IN ('internal', 'client', 'all')),
ADD COLUMN IF NOT EXISTS feedbacks JSONB DEFAULT '[]'::jsonb;

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Admin and consultants can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins have full access to documents" ON public.documents;
DROP POLICY IF EXISTS "Consultants can view relevant documents" ON public.documents;
DROP POLICY IF EXISTS "Consultants can manage their own documents" ON public.documents;
DROP POLICY IF EXISTS "Clients can view released documents" ON public.documents;

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access to documents"
ON public.documents
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy: Consultants can view relevant documents
CREATE POLICY "Consultants can view relevant documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
    is_admin() OR 
    auth.uid() = author_id OR 
    (current_user_role() = 'consultor'::user_role AND (
        client_id IN (SELECT id FROM public.clients WHERE consultant_id = auth.uid()) OR
        project_id IN (SELECT id FROM public.projects WHERE consultant_id = auth.uid())
    ))
);

-- Policy: Consultants can manage documents they authored
CREATE POLICY "Consultants can manage their own documents"
ON public.documents
FOR ALL
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Policy: Clients can view documents released to them
CREATE POLICY "Clients can view released documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
    (current_user_role() = 'cliente'::user_role AND 
     visibility IN ('client', 'all') AND 
     client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()))
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
