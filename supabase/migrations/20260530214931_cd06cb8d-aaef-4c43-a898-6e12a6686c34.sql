-- 1. Melhorar a função is_admin para ser mais performática e segura
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Criar função auxiliar para verificar se um cliente pode ver um perfil (consultor)
CREATE OR REPLACE FUNCTION public.check_client_access_to_profile(p_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o usuário atual é um cliente que tem contrato com o consultor dono do perfil
  RETURN EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.clients cl ON c.client_id = cl.id
    WHERE cl.auth_user_id = auth.uid()
    AND (
      c.consultant_id = p_profile_id OR 
      EXISTS (
        SELECT 1 FROM public.contract_product_phases cp
        JOIN public.contract_products prd ON cp.contract_product_id = prd.id
        WHERE prd.contract_id = c.id
        AND cp.responsible_consultant_id = p_profile_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar execução pública
REVOKE EXECUTE ON FUNCTION public.check_client_access_to_profile(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_client_access_to_profile(UUID) TO authenticated;

-- 3. Limpar e simplificar as políticas de profiles para evitar loops
DROP POLICY IF EXISTS "profiles_admin_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR 
  id = auth.uid() OR 
  public.check_client_access_to_profile(id)
);

CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_admin_all"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Corrigir políticas de clients que ainda acessavam profiles diretamente
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Consultants can manage their clients" ON public.clients;

CREATE POLICY "Admins can manage all clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Consultants can manage their clients"
ON public.clients
FOR ALL
TO authenticated
USING (consultant_id = auth.uid() OR public.is_admin())
WITH CHECK (consultant_id = auth.uid() OR public.is_admin());
