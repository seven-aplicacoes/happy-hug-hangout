-- Ajustar as políticas da tabela profiles para permitir a listagem de consultores
-- Atualmente, usuários só conseguem ver seu próprio perfil (auth.uid() = id).

-- Remover política restritiva de visualização se necessário ou adicionar novas
-- Vamos adicionar uma política para que administradores vejam tudo e consultores vejam outros consultores (necessário para filtros e selects)

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Authenticated users can view consultant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'consultor');

-- Garantir que a política de visualização própria continue existindo ou seja abrangida
-- (Já existe "Users can view their own profile")
