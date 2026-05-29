-- Fix search_path and permissions for sync_contract_phase_meetings
ALTER FUNCTION public.sync_contract_phase_meetings() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.sync_contract_phase_meetings() FROM public;
REVOKE EXECUTE ON FUNCTION public.sync_contract_phase_meetings() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_contract_phase_meetings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_contract_phase_meetings() TO service_role;
