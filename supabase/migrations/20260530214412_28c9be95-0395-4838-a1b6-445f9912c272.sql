-- Remover a política que está causando recursão infinita
DROP POLICY IF EXISTS "clients_consultant_select" ON public.clients;

-- Garantir que as políticas existentes no contracts sejam seguras
-- A política "Clients can view their own contracts" no contracts atualmente faz:
-- client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
-- Isso é seguro DESDE QUE a política no clients para o próprio usuário não dependa de contracts.
-- A política "Clients can see their own data" no clients é:
-- auth_user_id = auth.uid()
-- Isso é direto e não causa loop.

-- Se precisarmos que consultores vejam clientes através de contratos (além do consultant_id direto),
-- devemos usar uma função SECURITY DEFINER para evitar a recursão de RLS.

CREATE OR REPLACE FUNCTION public.check_consultant_client_access(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.contracts
    WHERE client_id = p_client_id
      AND consultant_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar acesso público à função por segurança
REVOKE EXECUTE ON FUNCTION public.check_consultant_client_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_consultant_client_access(UUID) TO authenticated;

-- Agora podemos adicionar a política de forma segura
CREATE POLICY "Consultants can see clients via contracts"
ON public.clients
FOR SELECT
TO authenticated
USING (
  consultant_id = auth.uid() OR
  public.check_consultant_client_access(id) OR
  public.is_admin()
);
