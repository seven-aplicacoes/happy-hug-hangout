
-- 1. client_products: allow consultants to manage their clients' products
CREATE POLICY "Consultants can manage their clients products"
ON public.client_products
FOR ALL
TO authenticated
USING (
  consultant_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_products.client_id AND c.consultant_id = auth.uid())
)
WITH CHECK (
  consultant_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_products.client_id AND c.consultant_id = auth.uid())
);

-- 2. contract_product_phase_consultants: restrict overly permissive SELECT
DROP POLICY IF EXISTS "Users can view phase consultants" ON public.contract_product_phase_consultants;

CREATE POLICY "Relevant users can view phase consultants"
ON public.contract_product_phase_consultants
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR consultant_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.contract_products cp
    JOIN public.contracts ct ON ct.id = cp.contract_id
    LEFT JOIN public.clients cl ON cl.id = ct.client_id
    WHERE cp.id = contract_product_phase_consultants.contract_product_id
      AND (ct.consultant_id = auth.uid() OR cl.consultant_id = auth.uid())
  )
);

-- 3. csat_surveys: allow clients to insert/select their own
CREATE POLICY "Clients can submit their own CSAT"
ON public.csat_surveys
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Clients can view their own CSAT"
ON public.csat_surveys
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 4. nps_surveys: allow clients to insert/select their own
CREATE POLICY "Clients can submit their own NPS"
ON public.nps_surveys
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Clients can view their own NPS"
ON public.nps_surveys
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 5. timeline_events: allow clients to view their own
CREATE POLICY "Clients can view their own timeline events"
ON public.timeline_events
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 6. Fix mutable search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
