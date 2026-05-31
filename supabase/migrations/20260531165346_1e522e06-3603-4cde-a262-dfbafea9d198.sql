-- meeting_scheduling_events policies
ALTER TABLE public.meeting_scheduling_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all scheduling events" ON public.meeting_scheduling_events;
CREATE POLICY "Admins can view all scheduling events" 
ON public.meeting_scheduling_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Consultants can view their own scheduling events" ON public.meeting_scheduling_events;
CREATE POLICY "Consultants can view their own scheduling events" 
ON public.meeting_scheduling_events FOR SELECT 
USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view their own scheduling events" ON public.meeting_scheduling_events;
CREATE POLICY "Clients can view their own scheduling events" 
ON public.meeting_scheduling_events FOR SELECT 
USING (client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()));

-- meeting_history_events policies
ALTER TABLE public.meeting_history_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all history events" ON public.meeting_history_events;
CREATE POLICY "Admins can view all history events" 
ON public.meeting_history_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Consultants can view their own history events" ON public.meeting_history_events;
CREATE POLICY "Consultants can view their own history events" 
ON public.meeting_history_events FOR SELECT 
USING (consultant_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view their own history events" ON public.meeting_history_events;
CREATE POLICY "Clients can view their own history events" 
ON public.meeting_history_events FOR SELECT 
USING (client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()));

-- Ensure consultant_permissions are readable
ALTER TABLE public.consultant_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own permissions" ON public.consultant_permissions;
CREATE POLICY "Users can view their own permissions" 
ON public.consultant_permissions FOR SELECT 
USING (consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
