
-- Trigger-only functions: no role needs EXECUTE
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_escalation() FROM PUBLIC, anon, authenticated;

-- Admin-only helper, callable only via service_role/edge functions
REVOKE EXECUTE ON FUNCTION public.seed_default_consultant_permissions(uuid) FROM PUBLIC, anon, authenticated;

-- RLS helpers: signed-in users only, never anon
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.current_user_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_status() TO authenticated;
