ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

COMMENT ON COLUMN public.clients.contact_name IS 'Nome do responsável na empresa cliente';
COMMENT ON COLUMN public.clients.contact_phone IS 'Telefone do responsável na empresa cliente';