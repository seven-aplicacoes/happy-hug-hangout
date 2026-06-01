
-- Client SELECT policies for methodology hierarchy
CREATE POLICY "Clients can view their methodology modules"
ON public.contract_methodology_modules
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contract_product_phases cpp
    JOIN public.contract_products cp ON cp.id = cpp.contract_product_id
    JOIN public.contracts ct ON ct.id = cp.contract_id
    JOIN public.clients cl ON cl.id = ct.client_id
    WHERE cpp.id = contract_methodology_modules.contract_phase_id
      AND cl.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their methodology meetings"
ON public.contract_methodology_meetings
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contract_methodology_modules cmm
    JOIN public.contract_product_phases cpp ON cpp.id = cmm.contract_phase_id
    JOIN public.contract_products cp ON cp.id = cpp.contract_product_id
    JOIN public.contracts ct ON ct.id = cp.contract_id
    JOIN public.clients cl ON cl.id = ct.client_id
    WHERE cmm.id = contract_methodology_meetings.contract_module_id
      AND cl.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their methodology deliverables"
ON public.contract_methodology_deliverables
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contract_methodology_meetings cmtg
    JOIN public.contract_methodology_modules cmm ON cmm.id = cmtg.contract_module_id
    JOIN public.contract_product_phases cpp ON cpp.id = cmm.contract_phase_id
    JOIN public.contract_products cp ON cp.id = cpp.contract_product_id
    JOIN public.contracts ct ON ct.id = cp.contract_id
    JOIN public.clients cl ON cl.id = ct.client_id
    WHERE cmtg.id = contract_methodology_deliverables.contract_meeting_id
      AND cl.auth_user_id = auth.uid()
  )
);

-- Consultant write policies on contract_products
CREATE POLICY "Consultants can insert contract products for their contracts"
ON public.contract_products
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_products.contract_id
      AND c.consultant_id = auth.uid()
  )
);

CREATE POLICY "Consultants can update contract products for their contracts"
ON public.contract_products
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_products.contract_id
      AND c.consultant_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_products.contract_id
      AND c.consultant_id = auth.uid()
  )
);

CREATE POLICY "Consultants can delete contract products for their contracts"
ON public.contract_products
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_products.contract_id
      AND c.consultant_id = auth.uid()
  )
);

-- INSERT policy for meeting_csat
CREATE POLICY "Clients can submit their CSAT"
ON public.meeting_csat
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients cl
    WHERE cl.id = meeting_csat.client_id
      AND cl.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Consultants can submit CSAT for their meetings"
ON public.meeting_csat
FOR INSERT TO authenticated
WITH CHECK (
  meeting_csat.consultant_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
  )
);

-- Fix mutable search_path on function
ALTER FUNCTION public.check_sequential_meeting() SET search_path = public;
