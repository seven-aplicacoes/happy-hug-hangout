-- Remove week-related columns from contract_products
ALTER TABLE public.contract_products 
DROP COLUMN IF EXISTS duration_weeks,
DROP COLUMN IF EXISTS current_week_id,
DROP COLUMN IF EXISTS current_week_number;

-- Remove week-related columns from phases
ALTER TABLE public.methodology_plan_phases DROP COLUMN IF EXISTS duration_weeks;
ALTER TABLE public.contract_product_phases DROP COLUMN IF EXISTS duration_weeks;

-- Remove week-related columns from activities
ALTER TABLE public.meetings DROP COLUMN IF EXISTS methodology_week_id;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS methodology_week_id;
ALTER TABLE public.documents DROP COLUMN IF EXISTS methodology_week_id;

-- Drop methodology_weeks table as it is no longer used
DROP TABLE IF EXISTS public.methodology_weeks CASCADE;
