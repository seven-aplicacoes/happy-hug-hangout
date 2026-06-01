-- Grant permissions on meetings table
GRANT SELECT, INSERT, UPDATE ON public.meetings TO authenticated;

-- Drop existing policies if they are too restrictive for clients
DROP POLICY IF EXISTS "Clients can insert meetings for themselves" ON public.meetings;
DROP POLICY IF EXISTS "Clients can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Clients can view their own meetings" ON public.meetings;

-- Create comprehensive policies for meetings
CREATE POLICY "Clients can view their own meetings" 
ON public.meetings 
FOR SELECT 
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  ) OR 
  consultant_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Clients can insert meetings for themselves" 
ON public.meetings 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update their own meetings" 
ON public.meetings 
FOR UPDATE 
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Ensure consultant_available_slots has a policy allowing clients to view slots for their consultants
DROP POLICY IF EXISTS "Clients can view consultant slots" ON public.consultant_available_slots;

CREATE POLICY "Clients can view consultant slots"
ON public.consultant_available_slots
FOR SELECT
USING (
  -- Option 1: Direct link via client_id
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()) OR
  -- Option 2: Link via consultant who has a contract with the client
  consultant_id IN (
    SELECT ct.consultant_id FROM public.contracts ct
    JOIN public.clients c ON c.id = ct.client_id
    WHERE c.auth_user_id = auth.uid() AND ct.status = 'ativo'
  ) OR
  -- Option 3: Link via contract_module_meeting_id
  contract_module_meeting_id IN (
    SELECT cmm.id FROM public.contract_module_meetings cmm
    JOIN public.clients c ON c.id = cmm.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);
