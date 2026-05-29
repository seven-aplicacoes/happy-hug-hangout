-- Remove potential duplicate/ambiguous foreign key for clients if it exists (check name from previous query)
-- Based on previous query, we have 'documents_client_id_fkey'. If 'fk_documents_client' exists, it might be the cause.
-- Let's drop any extra one that might be lurking or was created incorrectly.
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS fk_documents_client;

-- Remove the redundant profile link on uploaded_by which points to auth.users usually but here was pointing to profiles
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS fk_documents_uploaded_by;

-- Ensure author_id is properly linked to profiles
-- First check if it exists, if not, add it (using a safe approach)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_author_id_fkey') THEN
    ALTER TABLE public.documents 
    ADD CONSTRAINT documents_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Update existing documents to set author_id = uploaded_by where author_id is null
-- (Assuming profiles.id matches auth.users.id which is standard in this project)
UPDATE public.documents 
SET author_id = uploaded_by 
WHERE author_id IS NULL AND uploaded_by IS NOT NULL;
