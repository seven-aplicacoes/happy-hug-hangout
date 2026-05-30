-- Fix search_path for security definer functions
ALTER FUNCTION public.generate_slots_from_availability() SET search_path = public;
ALTER FUNCTION public.handle_slot_booking() SET search_path = public;
ALTER FUNCTION public.handle_slot_unbooking() SET search_path = public;

-- Revoke execute from public/anon for these sensitive functions
REVOKE EXECUTE ON FUNCTION public.generate_slots_from_availability() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_slot_booking() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_slot_unbooking() FROM PUBLIC, anon;

-- Grant to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.generate_slots_from_availability() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_slot_booking() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_slot_unbooking() TO authenticated, service_role;
