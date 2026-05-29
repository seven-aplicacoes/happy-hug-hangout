-- Drop the overly permissive view created earlier
DROP VIEW IF EXISTS public.team_members;

-- Create a SECURITY DEFINER function that returns only safe team info.
-- This bypasses RLS but exposes ONLY non-sensitive columns.
CREATE OR REPLACE FUNCTION public.list_team_members()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  role public.user_role,
  status text,
  specialty text,
  city text,
  state text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.role, p.status, p.specialty, p.city, p.state
  FROM public.profiles p
$$;

-- Only signed-in users may call it; explicitly revoke from anon/public
REVOKE ALL ON FUNCTION public.list_team_members() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_team_members() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_team_members() TO authenticated;
