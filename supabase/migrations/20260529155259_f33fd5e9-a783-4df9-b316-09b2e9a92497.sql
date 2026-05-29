-- Update methodology_plan_phases constraint
ALTER TABLE public.methodology_plan_phases
DROP CONSTRAINT IF EXISTS methodology_plan_phases_product_id_fkey,
ADD CONSTRAINT methodology_plan_phases_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE CASCADE;

-- Update methodology_plans constraint
ALTER TABLE public.methodology_plans
DROP CONSTRAINT IF EXISTS methodology_plans_product_id_fkey,
ADD CONSTRAINT methodology_plans_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE CASCADE;

-- Update client_products constraint
ALTER TABLE public.client_products
DROP CONSTRAINT IF EXISTS client_products_product_id_fkey,
ADD CONSTRAINT client_products_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE CASCADE;

-- Update contract_products constraint
ALTER TABLE public.contract_products
DROP CONSTRAINT IF EXISTS contract_products_product_id_fkey,
ADD CONSTRAINT contract_products_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE CASCADE;
