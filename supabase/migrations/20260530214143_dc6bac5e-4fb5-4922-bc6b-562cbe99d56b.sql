-- Recriar políticas de meeting_csat com TO authenticated
DROP POLICY IF EXISTS "Admins can view all CSATs" ON public.meeting_csat;
DROP POLICY IF EXISTS "Clients can update their own CSATs" ON public.meeting_csat;
DROP POLICY IF EXISTS "Clients can view their own CSATs" ON public.meeting_csat;
DROP POLICY IF EXISTS "Consultants can view CSATs for their clients" ON public.meeting_csat;

CREATE POLICY "Admins can view all CSATs"
ON public.meeting_csat
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Clients can view their own CSATs"
ON public.meeting_csat
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = meeting_csat.client_id
      AND c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update their own CSATs"
ON public.meeting_csat
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = meeting_csat.client_id
      AND c.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = meeting_csat.client_id
      AND c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Consultants can view CSATs for their clients"
ON public.meeting_csat
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = meeting_csat.client_id
      AND c.consultant_id = auth.uid()
  )
);

-- Recriar políticas de module_documents com TO authenticated
DROP POLICY IF EXISTS "Admins can manage module_documents" ON public.module_documents;
DROP POLICY IF EXISTS "Authenticated users can view module_documents" ON public.module_documents;

CREATE POLICY "Admins can manage module_documents"
ON public.module_documents
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view module_documents"
ON public.module_documents
FOR SELECT
TO authenticated
USING (true);

-- Revogar execução de funções SECURITY DEFINER para anônimos
REVOKE EXECUTE ON FUNCTION public.is_consultant() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_client() FROM PUBLIC, anon;
