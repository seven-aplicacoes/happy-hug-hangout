-- Ensure the bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'methodology-materials';

-- Drop existing restricted policies if they exist to avoid confusion
DROP POLICY IF EXISTS "Anyone can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view methodology materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage methodology materials" ON storage.objects;

-- Create a truly public SELECT policy (anon and authenticated)
CREATE POLICY "Public Access - Anyone can view methodology materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'methodology-materials');

-- Create full management policy for admins
CREATE POLICY "Admin Full Access - methodology materials"
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
