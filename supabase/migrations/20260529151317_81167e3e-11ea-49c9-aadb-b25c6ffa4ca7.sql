-- Add contract_id to documents if it does not exist
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE;

-- Ensure the check constraint on methodology_plan_phases is correct.
-- If the existing constraint is strict about 'consultor' | 'silvane', ensure our code matches.
-- Recreate the constraint to be safe and include 'consultor' and 'silvane' clearly.
ALTER TABLE public.methodology_plan_phases 
DROP CONSTRAINT IF EXISTS methodology_plan_phases_executor_type_check;

ALTER TABLE public.methodology_plan_phases 
ADD CONSTRAINT methodology_plan_phases_executor_type_check 
CHECK (executor_type IN ('consultor', 'silvane'));
