-- Drop conflicting or recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view their assigned consultant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 1. Simple policy for users to see themselves (Base case, no recursion)
-- This already exists as "Users can view their own profile", keeping it.

-- 2. Admins can view everyone ELSE (The id != auth.uid() guard breaks the recursion)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  (id != auth.uid()) AND 
  is_admin()
);

-- 3. Team members can view other team members
CREATE POLICY "Team members can view team profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  (id != auth.uid()) AND 
  (role IN ('consultor', 'admin')) AND 
  (is_admin() OR current_user_role() = 'consultor')
);

-- 4. Clients can view their assigned consultant
CREATE POLICY "Clients can view their assigned consultant" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  (id != auth.uid()) AND 
  (role = 'consultor') AND 
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.auth_user_id = auth.uid() AND c.consultant_id = profiles.id
  )
);

-- 5. Simplified Update Policy
-- We trust the trigger 'prevent_role_self_escalation' to handle role/status protection.
-- The policy itself should just ensure the user is updating their own row.
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
