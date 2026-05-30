-- Add avatar_path column to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- Create client-avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-avatars', 'client-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for client-avatars bucket

-- 1. Public read access
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'client-avatars');

-- 2. Authenticated Insert (Admins and Consultants)
CREATE POLICY "Authenticated Insert" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'client-avatars' AND 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE consultant_id = auth.uid() AND (storage.foldername(name))[1] = id::text
    )
  )
);

-- 3. Authenticated Update
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'client-avatars' AND 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE consultant_id = auth.uid() AND (storage.foldername(name))[1] = id::text
    )
  )
);

-- 4. Authenticated Delete
CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'client-avatars' AND 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE consultant_id = auth.uid() AND (storage.foldername(name))[1] = id::text
    )
  )
);
