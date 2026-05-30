-- 1. Redefinir funções como SECURITY DEFINER para evitar recursão
-- Estas funções agora ignoram o RLS ao consultar a tabela profiles

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_consultant()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'consultor'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'cliente'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_status()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.profiles WHERE id = auth.uid();
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_consultant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_status() TO authenticated;

-- 2. Limpeza e recriação das políticas de PROFILES
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: Admin vê tudo, usuários veem a si mesmos, clientes veem consultores vinculados
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_admin() 
  OR id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.consultant_id = public.profiles.id
    AND c.client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.contract_product_phases cp
    JOIN public.contract_products prd ON cp.contract_product_id = prd.id
    JOIN public.contracts c ON prd.contract_id = c.id
    WHERE cp.responsible_consultant_id = public.profiles.id
    AND c.client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
);

-- Política de UPDATE: Próprio usuário ou Admin
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- Políticas de INSERT/DELETE: Apenas Admin
CREATE POLICY "profiles_admin_policy"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Atualizar políticas em outras tabelas para garantir que usem funções seguras
-- (Isso previne loops cruzados)

-- Contracts
DROP POLICY IF EXISTS "Consultants can manage their contracts" ON public.contracts;
CREATE POLICY "contracts_consultant_manage"
ON public.contracts
FOR ALL
TO authenticated
USING (consultant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Consultants can update operational fields of their contracts" ON public.contracts;
CREATE POLICY "contracts_consultant_update"
ON public.contracts
FOR UPDATE
TO authenticated
USING (public.is_admin() OR (public.is_consultant() AND consultant_id = auth.uid()));

-- Clients
DROP POLICY IF EXISTS "Consultants can view their clients" ON public.clients;
CREATE POLICY "clients_consultant_select"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.is_admin() 
  OR auth.uid() IN (SELECT consultant_id FROM public.contracts WHERE client_id = id)
);

-- Indicators/Alerts (se usarem current_user_role)
-- Estas já usam current_user_role(), que agora é SECURITY DEFINER, então devem estar seguras.
