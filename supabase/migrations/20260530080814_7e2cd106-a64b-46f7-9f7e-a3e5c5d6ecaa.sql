
-- Fix 1: Remove overly permissive "true" SELECT policies on contract_products / contract_product_phases
DROP POLICY IF EXISTS "Consultants can only view contract products" ON public.contract_products;
DROP POLICY IF EXISTS "Consultants can only view contract product phases" ON public.contract_product_phases;

-- Fix 2: meeting_csat_responses INSERT must verify client_id belongs to the authenticated user
DROP POLICY IF EXISTS "Clients can create their own csat responses" ON public.meeting_csat_responses;
CREATE POLICY "Clients can create their own csat responses"
  ON public.meeting_csat_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
  );

-- Fix 3: meeting_csat_responses SELECT — match clients by auth_user_id instead of email
DROP POLICY IF EXISTS "Users can view their own csat responses" ON public.meeting_csat_responses;
CREATE POLICY "Users can view their own csat responses"
  ON public.meeting_csat_responses
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR consultant_id = auth.uid()
    OR client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
  );

-- Fix 4: ia_insights — allow clients to view insights about themselves
CREATE POLICY "Clients can view their own insights"
  ON public.ia_insights
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
  );

-- Fix 5: Revoke anon EXECUTE on SECURITY DEFINER function (only callable from authenticated context)
REVOKE EXECUTE ON FUNCTION public.sync_contract_module_meetings_manual(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_contract_module_meetings_manual(uuid) TO authenticated, service_role;
