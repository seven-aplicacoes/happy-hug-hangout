-- Fix consultant_availability RLS
DROP POLICY IF EXISTS "Clients can view availability for their modules" ON public.consultant_availability;

CREATE POLICY "Clients can view availability for their modules" 
ON public.consultant_availability 
FOR SELECT 
TO authenticated 
USING (
  -- Option 1: Direct link (existing)
  (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = consultant_availability.client_id 
    AND c.auth_user_id = auth.uid()
  )) 
  OR
  -- Option 2: Link via contract_module_meeting_id
  (EXISTS (
    SELECT 1 FROM public.contract_module_meetings cmm
    JOIN public.clients c ON c.id = cmm.client_id
    WHERE cmm.id = consultant_availability.contract_module_meeting_id
    AND c.auth_user_id = auth.uid()
  ))
  OR
  -- Option 3: Link via consultant_id and active contract
  (EXISTS (
    SELECT 1 FROM public.contracts ct
    JOIN public.clients c ON c.id = ct.client_id
    WHERE ct.consultant_id = consultant_availability.consultant_id
    AND c.auth_user_id = auth.uid()
    AND ct.status = 'ativo'
  ))
);

-- Fix consultant_available_slots RLS
DROP POLICY IF EXISTS "Clients can view available slots for their modules" ON public.consultant_available_slots;

CREATE POLICY "Clients can view available slots for their modules" 
ON public.consultant_available_slots 
FOR SELECT 
TO authenticated 
USING (
  -- Option 1: Direct link (existing)
  (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = consultant_available_slots.client_id 
    AND c.auth_user_id = auth.uid()
  )) 
  OR
  -- Option 2: Link via contract_module_meeting_id
  (EXISTS (
    SELECT 1 FROM public.contract_module_meetings cmm
    JOIN public.clients c ON c.id = cmm.client_id
    WHERE cmm.id = consultant_available_slots.contract_module_meeting_id
    AND c.auth_user_id = auth.uid()
  ))
  OR
  -- Option 3: Link via consultant_id and active contract
  (EXISTS (
    SELECT 1 FROM public.contracts ct
    JOIN public.clients c ON c.id = ct.client_id
    WHERE ct.consultant_id = consultant_available_slots.consultant_id
    AND c.auth_user_id = auth.uid()
    AND ct.status = 'ativo'
  ))
);