-- Drop old restrictive/recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view their assigned consultant" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 1. Allow any authenticated user to view profiles
-- This is essential for the UI to display names and roles correctly without recursion
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Keep the update policy strictly for owner or admin
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR is_admin());
