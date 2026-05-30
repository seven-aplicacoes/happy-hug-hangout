-- Fix contracts RLS for clients
CREATE POLICY "Clients can view their own contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Fix contract_products RLS for clients (refine existing if needed)
-- Assuming the previous one exists, we can replace or ensure a good one
DROP POLICY IF EXISTS "Clients can view their own contract products" ON public.contract_products;
CREATE POLICY "Clients can view their own contract products"
ON public.contract_products
FOR SELECT
TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.contracts WHERE client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  ) AND client_visible = true
);

-- Fix contract_product_phases RLS for clients
DROP POLICY IF EXISTS "Clients can view their own product phases" ON public.contract_product_phases;
CREATE POLICY "Clients can view their own product phases"
ON public.contract_product_phases
FOR SELECT
TO authenticated
USING (
  contract_product_id IN (
    SELECT id FROM public.contract_products WHERE contract_id IN (
      SELECT id FROM public.contracts WHERE client_id IN (
        SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
      )
    )
  ) AND client_visible = true
);

-- Fix contract_module_meetings RLS for clients
DROP POLICY IF EXISTS "Clients can view meetings for their modules" ON public.contract_module_meetings;
CREATE POLICY "Clients can view meetings for their modules"
ON public.contract_module_meetings
FOR SELECT
TO authenticated
USING (
  module_id IN (
    SELECT id FROM public.contract_product_phases WHERE contract_product_id IN (
      SELECT id FROM public.contract_products WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE client_id IN (
          SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
        )
      )
    )
  )
);

-- Fix documents RLS for clients (ensure visibility check)
DROP POLICY IF EXISTS "Clients view their own documents" ON public.documents;
CREATE POLICY "Clients view their own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  ) AND (visibility = 'client' OR visibility = 'all')
);

-- Fix timeline_events for clients
DROP POLICY IF EXISTS "Clients can view their own timeline events" ON public.timeline_events;
CREATE POLICY "Clients can view their own timeline events"
ON public.timeline_events
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);
