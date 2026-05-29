-- Fix search_path for functions
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.seed_default_consultant_permissions(UUID) SET search_path = public;

-- Revoke public execute on security definer function
REVOKE EXECUTE ON FUNCTION public.seed_default_consultant_permissions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_consultant_permissions(UUID) TO authenticated, service_role;

-- Seed permissions for existing consultants
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles WHERE role = 'consultor'
    LOOP
        PERFORM public.seed_default_consultant_permissions(r.id);
    END LOOP;
END $$;
