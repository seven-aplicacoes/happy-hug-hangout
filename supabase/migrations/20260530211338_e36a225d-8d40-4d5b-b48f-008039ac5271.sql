-- Re-create is_admin function to be non-recursive and secure
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check user role from profiles table directly, bypassing RLS using SECURITY DEFINER
    -- We use a subquery to avoid any potential recursion if profiles had more complex RLS
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;

    RETURN (user_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also ensure the function is granted to all roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;