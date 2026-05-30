ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Garantir que a coluna seja visível para os papéis necessários
GRANT SELECT, UPDATE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
