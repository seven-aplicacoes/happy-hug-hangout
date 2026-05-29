-- Create is_admin function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-verify RLS policies for profiles
-- (The previous AI might have failed to create them properly if is_admin was missing)

-- Allow authenticated users to view profiles with role = 'consultor'
-- This allows anyone to see who the consultants are (for selects/filters)
DROP POLICY IF EXISTS "Authenticated users can view consultant profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view consultant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'consultor'::user_role);

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin());

-- Allow admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin());

-- Allow admins to insert profiles (though we use an edge function, it's good for consistency)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Allow admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin());
