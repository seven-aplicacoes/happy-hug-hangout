-- Ensure RLS is enabled
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_product_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_module_meetings ENABLE ROW LEVEL SECURITY;

-- Contracts: Consultants can only update operational fields
DROP POLICY IF EXISTS "Consultants can update their own contracts" ON public.contracts;
CREATE POLICY "Consultants can update operational fields of their contracts" 
ON public.contracts 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
    OR (role = 'consultor' AND id = consultant_id)
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
  OR (
    -- For consultants, ensure they aren't changing structural fields
    -- This is a simplified check; in a real scenario, you'd compare OLD and NEW values.
    -- Since RLS doesn't easily allow field-level comparison in WITH CHECK without OLD,
    -- we rely on the application layer for field restriction while keeping this as a safety net.
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'consultor' AND id = consultant_id)
  )
);

-- Contract Products: Consultants read-only
DROP POLICY IF EXISTS "Consultants can update contract products" ON public.contract_products;
CREATE POLICY "Consultants can only view contract products" 
ON public.contract_products 
FOR SELECT 
TO authenticated
USING (true);

-- Contract Product Phases: Consultants read-only
DROP POLICY IF EXISTS "Consultants can update contract product phases" ON public.contract_product_phases;
CREATE POLICY "Consultants can only view contract product phases" 
ON public.contract_product_phases 
FOR SELECT 
TO authenticated
USING (true);

-- Contract Module Meetings: Consultants can update status and scheduling
DROP POLICY IF EXISTS "Consultants can update meetings" ON public.contract_module_meetings;
CREATE POLICY "Consultants can update meeting status and schedule" 
ON public.contract_module_meetings 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
    OR (role = 'consultor' AND id = consultant_id)
  )
);
