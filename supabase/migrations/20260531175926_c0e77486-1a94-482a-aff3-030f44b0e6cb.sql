-- Remove overly broad read policies from Calendly scheduling/history data
DROP POLICY IF EXISTS "Users can view meeting history events" ON public.meeting_history_events;
DROP POLICY IF EXISTS "Users can view scheduling events" ON public.meeting_scheduling_events;

-- Tighten Calendly event type visibility
DROP POLICY IF EXISTS "Authenticated can view event types" ON public.consultant_calendly_event_types;
DROP POLICY IF EXISTS "Users can view their own event types or all if admin" ON public.consultant_calendly_event_types;

CREATE POLICY "Scoped users can view event types"
ON public.consultant_calendly_event_types
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR auth.uid() = consultant_id
  OR (
    COALESCE(is_active, true) = true
    AND EXISTS (
      SELECT 1
      FROM public.clients c
      LEFT JOIN public.contracts ct
        ON ct.client_id = c.id
       AND ct.consultant_id = consultant_calendly_event_types.consultant_id
      LEFT JOIN public.contract_products cp
        ON cp.contract_id = ct.id
      LEFT JOIN public.contract_product_phases cpp
        ON cpp.contract_product_id = cp.id
      LEFT JOIN public.contract_module_meetings cmm
        ON cmm.client_id = c.id
       AND cmm.consultant_id = consultant_calendly_event_types.consultant_id
      WHERE c.auth_user_id = auth.uid()
        AND c.consultant_id = consultant_calendly_event_types.consultant_id
        AND (
          (
            consultant_calendly_event_types.product_id IS NULL
            AND consultant_calendly_event_types.module_id IS NULL
            AND consultant_calendly_event_types.meeting_template_id IS NULL
            AND COALESCE(consultant_calendly_event_types.is_default, false) = true
          )
          OR consultant_calendly_event_types.product_id = ct.product_id
          OR consultant_calendly_event_types.product_id = cp.product_id
          OR consultant_calendly_event_types.module_id = cpp.id
          OR consultant_calendly_event_types.module_id = cmm.module_id
          OR consultant_calendly_event_types.meeting_template_id = cmm.id
        )
    )
  )
);

-- Add explicit client access to contract methodology phases for their own contracts
DROP POLICY IF EXISTS "Clients view their contract methodology phases" ON public.contract_methodology_phases;

CREATE POLICY "Clients view their contract methodology phases"
ON public.contract_methodology_phases
FOR SELECT
TO authenticated
USING (
  contract_id IN (
    SELECT ct.id
    FROM public.contracts ct
    JOIN public.clients c ON c.id = ct.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);

-- Harden profile role/status updates against self privilege escalation
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    IF COALESCE(auth.role(), '') <> 'service_role'
       AND NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'::public.user_role
      ) THEN
      RAISE EXCEPTION 'Only administrators can change user role or status';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS prevent_role_self_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_self_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_escalation();