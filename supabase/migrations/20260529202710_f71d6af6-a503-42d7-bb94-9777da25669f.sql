-- Adicionar colunas de relacionamento à tabela documents se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'contract_id') THEN
        ALTER TABLE public.documents ADD COLUMN contract_id UUID REFERENCES public.contracts(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'product_id') THEN
        ALTER TABLE public.documents ADD COLUMN product_id UUID REFERENCES public.products(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'contract_product_id') THEN
        ALTER TABLE public.documents ADD COLUMN contract_product_id UUID REFERENCES public.contract_products(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'contract_product_phase_id') THEN
        ALTER TABLE public.documents ADD COLUMN contract_product_phase_id UUID REFERENCES public.contract_product_phases(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'module_id') THEN
        ALTER TABLE public.documents ADD COLUMN module_id UUID REFERENCES public.contract_product_phases(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'visibility_type') THEN
        ALTER TABLE public.documents ADD COLUMN visibility_type TEXT DEFAULT 'internal';
    END IF;
END $$;

-- Garantir GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
