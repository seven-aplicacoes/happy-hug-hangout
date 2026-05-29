-- Update sample documents to set author_id
UPDATE public.documents 
SET author_id = uploaded_by 
WHERE author_id IS NULL AND uploaded_by IS NOT NULL;

-- Ensure uploaded_by is also handled in policies if needed, 
-- but for now let's just make sure author_id is set.
ALTER TABLE public.documents ALTER COLUMN author_id SET DEFAULT auth.uid();

-- If author_id is the primary field for ownership, we should use it.
