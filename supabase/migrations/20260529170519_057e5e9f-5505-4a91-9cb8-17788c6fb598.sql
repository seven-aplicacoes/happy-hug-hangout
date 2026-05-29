-- Ensure tables have all required columns
ALTER TABLE public.methodology_materials 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

ALTER TABLE public.methodology_transversal_materials 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Grants
GRANT ALL ON TABLE public.methodology_materials TO authenticated;
GRANT ALL ON TABLE public.methodology_materials TO service_role;
GRANT SELECT ON TABLE public.methodology_materials TO anon;

GRANT ALL ON TABLE public.methodology_transversal_materials TO authenticated;
GRANT ALL ON TABLE public.methodology_transversal_materials TO service_role;
GRANT SELECT ON TABLE public.methodology_transversal_materials TO anon;

-- Storage Policies for methodology-materials bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('methodology-materials', 'methodology-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admin Full Access - methodology-materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Select - methodology-materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Select - methodology-materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin All Access - methodology-materials" ON storage.objects;

-- Policy for Admin: Full Access
CREATE POLICY "Admin Full Access - methodology-materials"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'methodology-materials' 
  AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
)
WITH CHECK (
  bucket_id = 'methodology-materials' 
  AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
);

-- Policy for Authenticated: Select Access (Consultants and Admins)
CREATE POLICY "Authenticated Select - methodology-materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'methodology-materials');

-- Policy for Anon: Select Access (if needed for public access)
CREATE POLICY "Public Select - methodology-materials"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'methodology-materials');
