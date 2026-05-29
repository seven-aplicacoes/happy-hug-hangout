ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS type_label TEXT;
COMMENT ON COLUMN public.documents.type_label IS 'Rótulo legível do tipo de documento';
