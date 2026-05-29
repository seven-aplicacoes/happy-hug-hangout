-- Add snapshot columns to contract_products
ALTER TABLE public.contract_products 
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS product_description TEXT,
ADD COLUMN IF NOT EXISTS product_category TEXT,
ADD COLUMN IF NOT EXISTS consultant_hours INTEGER,
ADD COLUMN IF NOT EXISTS silvane_hours INTEGER;

-- Backfill existing data
UPDATE public.contract_products cp
SET 
    product_name = p.name,
    product_description = p.description,
    product_category = p.category,
    consultant_hours = p.consultant_hours,
    silvane_hours = p.silvane_hours
FROM public.products p
WHERE cp.product_id = p.id
AND cp.product_name IS NULL;

-- Ensure contract_product_phases has correct snapshot capability (already exists based on audit, but ensuring types match)
-- The audit showed these already exist: name, duration_minutes, executor_type, meetings_count.
-- We might want to ensure they are not NULL if we want total independence, but we'll use fallbacks in code for now.

-- No changes to RLS needed as these are just new columns on an existing table.
-- Re-grant just in case (standard procedure)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_products TO authenticated;
GRANT ALL ON public.contract_products TO service_role;
