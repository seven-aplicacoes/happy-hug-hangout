ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id);
CREATE INDEX IF NOT EXISTS idx_documents_contract_id ON public.documents(contract_id);
