-- Update client_products (current_phase_id)
ALTER TABLE public.client_products
DROP CONSTRAINT IF EXISTS client_products_current_phase_id_fkey,
ADD CONSTRAINT client_products_current_phase_id_fkey
    FOREIGN KEY (current_phase_id)
    REFERENCES public.methodology_plan_phases(id)
    ON DELETE SET NULL;

-- Update contract_products (current_phase_id)
ALTER TABLE public.contract_products
DROP CONSTRAINT IF EXISTS contract_products_current_phase_id_fkey,
ADD CONSTRAINT contract_products_current_phase_id_fkey
    FOREIGN KEY (current_phase_id)
    REFERENCES public.methodology_plan_phases(id)
    ON DELETE SET NULL;

-- Update contract_product_phase_consultants
ALTER TABLE public.contract_product_phase_consultants
DROP CONSTRAINT IF EXISTS contract_product_phase_consultants_methodology_phase_id_fkey,
ADD CONSTRAINT contract_product_phase_consultants_methodology_phase_id_fkey
    FOREIGN KEY (methodology_phase_id)
    REFERENCES public.methodology_plan_phases(id)
    ON DELETE CASCADE;

-- Update contract_product_phases
ALTER TABLE public.contract_product_phases
DROP CONSTRAINT IF EXISTS contract_product_phases_methodology_phase_id_fkey,
ADD CONSTRAINT contract_product_phases_methodology_phase_id_fkey
    FOREIGN KEY (methodology_phase_id)
    REFERENCES public.methodology_plan_phases(id)
    ON DELETE SET NULL;
