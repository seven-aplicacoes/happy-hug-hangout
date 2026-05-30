-- Política para permitir que o cliente veja o perfil do consultor responsável pelo seu contrato ou módulos
CREATE POLICY "Clients can view their contract consultants" ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.consultant_id = public.profiles.id
    AND c.client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM public.contract_product_phases cp
    JOIN public.contract_products prd ON cp.contract_product_id = prd.id
    JOIN public.contracts c ON prd.contract_id = c.id
    WHERE cp.responsible_consultant_id = public.profiles.id
    AND c.client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM public.contract_module_meetings m
    WHERE m.consultant_id = public.profiles.id
    AND m.client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
);