
-- 1. Make documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- 2. Storage RLS policies for documents bucket
DROP POLICY IF EXISTS "Documents admins all" ON storage.objects;
DROP POLICY IF EXISTS "Documents consultants access" ON storage.objects;
DROP POLICY IF EXISTS "Documents clients read" ON storage.objects;

CREATE POLICY "Documents admins all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND public.is_admin())
WITH CHECK (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Documents consultants access"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.consultant_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.consultant_id = auth.uid()
  )
);

CREATE POLICY "Documents clients read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.auth_user_id = auth.uid()
  )
);

-- 3. Fix projects SELECT policy
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR auth.uid() = consultant_id
  OR client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);
