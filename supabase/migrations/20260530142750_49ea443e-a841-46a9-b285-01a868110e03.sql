
-- 1. consultant_indicator_goals: recreate policies for authenticated only
DROP POLICY IF EXISTS "Admins can manage all consultant goals" ON public.consultant_indicator_goals;
DROP POLICY IF EXISTS "Consultants can view their own goals" ON public.consultant_indicator_goals;

CREATE POLICY "Admins can manage all consultant goals"
ON public.consultant_indicator_goals
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

CREATE POLICY "Consultants can view their own goals"
ON public.consultant_indicator_goals
FOR SELECT
TO authenticated
USING (consultant_id = auth.uid());

-- 2. default_indicator_goals: authenticated only
DROP POLICY IF EXISTS "Admins can manage default goals" ON public.default_indicator_goals;
DROP POLICY IF EXISTS "Everyone authenticated can view default goals" ON public.default_indicator_goals;

CREATE POLICY "Admins can manage default goals"
ON public.default_indicator_goals
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

CREATE POLICY "Authenticated users can view default goals"
ON public.default_indicator_goals
FOR SELECT
TO authenticated
USING (true);

-- 3. contract_module_documents: authenticated only
DROP POLICY IF EXISTS "Admins can manage contract_module_documents" ON public.contract_module_documents;
DROP POLICY IF EXISTS "Users can view contract_module_documents of their clients" ON public.contract_module_documents;

CREATE POLICY "Admins can manage contract_module_documents"
ON public.contract_module_documents
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY "Users can view contract_module_documents of their clients"
ON public.contract_module_documents
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid()
  AND (
    p.role = 'admin'::user_role
    OR EXISTS (
      SELECT 1 FROM public.contracts ct
      WHERE ct.id = contract_module_documents.contract_id AND ct.consultant_id = p.id
    )
  )
));

-- 4. contract_module_meetings: authenticated only
DROP POLICY IF EXISTS "Admins can manage contract_module_meetings" ON public.contract_module_meetings;
DROP POLICY IF EXISTS "Users can view contract_module_meetings of their clients" ON public.contract_module_meetings;
DROP POLICY IF EXISTS "Consultants can update contract_module_meetings they are respon" ON public.contract_module_meetings;

CREATE POLICY "Admins can manage contract_module_meetings"
ON public.contract_module_meetings
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY "Users can view contract_module_meetings of their clients"
ON public.contract_module_meetings
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid()
  AND (
    p.role = 'admin'::user_role
    OR EXISTS (
      SELECT 1 FROM public.contracts ct
      WHERE ct.id = contract_module_meetings.contract_id AND ct.consultant_id = p.id
    )
  )
));

CREATE POLICY "Consultants can update their contract_module_meetings"
ON public.contract_module_meetings
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid()
  AND (
    p.role = 'admin'::user_role
    OR EXISTS (
      SELECT 1 FROM public.contracts ct
      WHERE ct.id = contract_module_meetings.contract_id AND ct.consultant_id = p.id
    )
  )
));

-- 5. Fix function search_path for availability functions
ALTER FUNCTION public.generate_slots_from_availability() SET search_path = public;
ALTER FUNCTION public.handle_slot_booking() SET search_path = public;
ALTER FUNCTION public.handle_slot_unbooking() SET search_path = public;
