ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS clinic_specialty TEXT;
COMMENT ON COLUMN public.clients.clinic_specialty IS 'Especialidade da clínica do cliente';
