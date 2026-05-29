-- First, ensure all snapshot columns exist (they should, but let's be safe)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_products' AND column_name = 'product_name') THEN
        ALTER TABLE public.contract_products ADD COLUMN product_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_products' AND column_name = 'product_description') THEN
        ALTER TABLE public.contract_products ADD COLUMN product_description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_products' AND column_name = 'product_category') THEN
        ALTER TABLE public.contract_products ADD COLUMN product_category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_products' AND column_name = 'consultant_hours') THEN
        ALTER TABLE public.contract_products ADD COLUMN consultant_hours INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_products' AND column_name = 'silvane_hours') THEN
        ALTER TABLE public.contract_products ADD COLUMN silvane_hours INTEGER;
    END IF;
END $$;

-- Backfill contract_products from global products where snapshot is missing
UPDATE public.contract_products cp
SET 
    product_name = COALESCE(cp.product_name, p.name),
    product_description = COALESCE(cp.product_description, p.description),
    product_category = COALESCE(cp.product_category, p.category),
    consultant_hours = COALESCE(cp.consultant_hours, p.consultant_hours),
    silvane_hours = COALESCE(cp.silvane_hours, p.silvane_hours)
FROM public.products p
WHERE cp.product_id = p.id
AND (cp.product_name IS NULL OR cp.product_description IS NULL OR cp.product_category IS NULL OR cp.consultant_hours IS NULL OR cp.silvane_hours IS NULL);

-- Backfill contract_product_phases from global methodology_plan_phases where snapshot is missing
UPDATE public.contract_product_phases cpp
SET 
    name = COALESCE(cpp.name, mpp.name),
    duration_minutes = COALESCE(cpp.duration_minutes, mpp.duration_minutes),
    executor_type = COALESCE(cpp.executor_type, mpp.executor_type),
    meetings_count = COALESCE(cpp.meetings_count, mpp.meetings_count)
FROM public.methodology_plan_phases mpp
WHERE cpp.methodology_phase_id = mpp.id
AND (cpp.name IS NULL OR cpp.duration_minutes IS NULL OR cpp.executor_type IS NULL OR cpp.meetings_count IS NULL);

-- Add comment to explain these are snapshot columns
COMMENT ON COLUMN public.contract_products.product_name IS 'Historical snapshot of product name at time of contract creation';
COMMENT ON COLUMN public.contract_products.product_description IS 'Historical snapshot of product description';
COMMENT ON COLUMN public.contract_products.product_category IS 'Historical snapshot of product category';
COMMENT ON COLUMN public.contract_products.consultant_hours IS 'Historical snapshot of consultant hours';
COMMENT ON COLUMN public.contract_products.silvane_hours IS 'Historical snapshot of silvane hours';

-- Similar for phases
COMMENT ON COLUMN public.contract_product_phases.name IS 'Historical snapshot of phase name';
COMMENT ON COLUMN public.contract_product_phases.duration_minutes IS 'Historical snapshot of phase duration';
COMMENT ON COLUMN public.contract_product_phases.executor_type IS 'Historical snapshot of phase executor type';
COMMENT ON COLUMN public.contract_product_phases.meetings_count IS 'Historical snapshot of phase meetings count';

-- Ensure RLS is enabled and permissions are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_products TO authenticated;
GRANT ALL ON public.contract_products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_product_phases TO authenticated;
GRANT ALL ON public.contract_product_phases TO service_role;
