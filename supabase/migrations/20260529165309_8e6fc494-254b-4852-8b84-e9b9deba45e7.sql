ALTER TABLE public.methodology_materials ADD COLUMN file_url TEXT;

-- Update existing records if any
UPDATE public.methodology_materials SET file_url = url WHERE file_url IS NULL AND url IS NOT NULL;
