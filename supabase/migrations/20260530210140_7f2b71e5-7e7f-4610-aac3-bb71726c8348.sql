-- 1. Garantir que a função is_admin() é SECURITY DEFINER e está correta
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
    AND role = 'admin'
  );
$$;

-- 2. Remover policies problemáticas da tabela profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view their contract consultants" ON public.profiles;

-- 3. Recriar policies seguras para profiles
-- Policy para o usuário ver seu próprio perfil (simples e sem recursão)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy para Admins verem todos os perfis (usa a função SECURITY DEFINER)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy para Admins inserirem perfis
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Policy para usuários atualizarem seus perfis ou Admins atualizarem qualquer um
-- Removida a subquery recursiva em WITH CHECK
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- Policy para Admins deletarem perfis
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Policy para Clientes visualizarem consultores (ajustada para ser mais performática e segura)
CREATE POLICY "Clients can view their contract consultants"
ON public.profiles
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
