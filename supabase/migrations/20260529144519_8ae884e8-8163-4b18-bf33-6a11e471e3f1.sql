-- 1) Drop overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- 2) Add tighter SELECT policies: self + admin
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 3) Create a safe public view exposing only non-sensitive columns so joins
--    that just need full_name / avatar continue to work for any authenticated user.
CREATE OR REPLACE VIEW public.team_members
WITH (security_invoker = on) AS
SELECT
  id,
  full_name,
  avatar_url,
  role,
  status,
  specialty,
  city,
  state
FROM public.profiles;

-- The view inherits RLS via security_invoker. We need a permissive helper policy
-- so authenticated users can read basic data of teammates through the view.
CREATE POLICY "Authenticated users can view basic teammate info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Wait: that re-opens the table. Instead we make the view SECURITY DEFINER-like
-- by re-creating it without security_invoker so it bypasses RLS for safe columns.
DROP POLICY IF EXISTS "Authenticated users can view basic teammate info" ON public.profiles;

DROP VIEW IF EXISTS public.team_members;

CREATE VIEW public.team_members AS
SELECT
  id,
  full_name,
  avatar_url,
  role,
  status,
  specialty,
  city,
  state
FROM public.profiles;

-- Grant SELECT on safe view to all authenticated users
GRANT SELECT ON public.team_members TO authenticated;
GRANT SELECT ON public.team_members TO anon;
