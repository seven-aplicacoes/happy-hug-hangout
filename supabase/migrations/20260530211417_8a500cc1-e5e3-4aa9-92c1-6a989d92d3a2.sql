-- Revoke direct execution to improve security, as it's intended for internal RLS usage
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;

-- Ensure service_role can still use it (though RLS usually bypasses for service_role)
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;