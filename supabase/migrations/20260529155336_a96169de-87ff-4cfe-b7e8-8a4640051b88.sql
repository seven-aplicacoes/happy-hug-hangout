-- Update contracts constraint
ALTER TABLE public.contracts
DROP CONSTRAINT IF EXISTS contracts_product_id_fkey,
ADD CONSTRAINT contracts_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE SET NULL;

-- Update documents constraint
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_product_id_fkey,
ADD CONSTRAINT documents_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE SET NULL;

-- Update legacy_projects constraint
ALTER TABLE public.legacy_projects
DROP CONSTRAINT IF EXISTS projects_product_id_fkey,
ADD CONSTRAINT projects_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE SET NULL;
