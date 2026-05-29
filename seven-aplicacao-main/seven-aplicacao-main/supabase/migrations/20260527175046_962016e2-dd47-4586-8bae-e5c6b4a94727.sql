
-- 1) Fix role escalation: drop the broken update policy and add a strict one + trigger
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
);

-- Strengthen trigger to also block status self-change by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'::public.user_role
    ) THEN
      RAISE EXCEPTION 'Only administrators can change user role or status';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS prevent_role_self_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_role_self_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 2) Restrict consultant profile visibility
DROP POLICY IF EXISTS "Authenticated users can view consultant profiles" ON public.profiles;

-- Consultants and admins can view team profiles (consultants + admins)
CREATE POLICY "Team members can view team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role IN ('consultor'::public.user_role, 'admin'::public.user_role)
  AND (
    public.is_admin()
    OR public.current_user_role() = 'consultor'::public.user_role
  )
);

-- Clients can view only the profile of their assigned consultant
CREATE POLICY "Clients can view their assigned consultant"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'consultor'::public.user_role
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.auth_user_id = auth.uid()
      AND c.consultant_id = profiles.id
  )
);
