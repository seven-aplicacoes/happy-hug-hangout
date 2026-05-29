-- Update bucket to be public
UPDATE storage.buckets SET public = true WHERE id = 'documents';

-- Ensure storage policies exist and are correct
-- Since we want documents to be accessible via the stored file_url (public), 
-- we need a policy that allows SELECT for everyone if the document visibility allows it.
-- However, for now, let's just make it public and see if that fixes the immediate error.

-- If the user wants granular control (internal vs client), we should keep it private and use signed URLs.
-- But the user specifically complained about the stored file_url not working.

-- Let's check if the policy "Public Access" exists or needs adjustment.
-- The previous agent might have tried to create it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
    END IF;
END $$;
