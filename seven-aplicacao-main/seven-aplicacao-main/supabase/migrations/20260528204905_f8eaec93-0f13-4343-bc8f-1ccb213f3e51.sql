-- Índices para otimizar a nova hierarquia
CREATE INDEX IF NOT EXISTS idx_meetings_cp_id ON public.meetings(contract_product_id);
CREATE INDEX IF NOT EXISTS idx_meetings_cpp_id ON public.meetings(contract_product_phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_cp_id ON public.tasks(contract_product_id);
CREATE INDEX IF NOT EXISTS idx_tasks_cpp_id ON public.tasks(contract_product_phase_id);
CREATE INDEX IF NOT EXISTS idx_documents_cp_id ON public.documents(contract_product_id);
CREATE INDEX IF NOT EXISTS idx_documents_cpp_id ON public.documents(contract_product_phase_id);

-- Políticas de RLS para Meetings
DROP POLICY IF EXISTS "Admins can manage all meetings" ON public.meetings;
CREATE POLICY "Admins can manage all meetings" 
ON public.meetings FOR ALL TO authenticated 
USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Consultants can view their own meetings" ON public.meetings;
CREATE POLICY "Consultants can view their own meetings" 
ON public.meetings FOR SELECT TO authenticated 
USING (
    consultant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.contracts WHERE id = meetings.contract_id AND consultant_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.clients WHERE id = meetings.client_id AND consultant_id = auth.uid())
);

DROP POLICY IF EXISTS "Clients can view their own meetings" ON public.meetings;
CREATE POLICY "Clients can view their own meetings" 
ON public.meetings FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = meetings.client_id AND auth_user_id = auth.uid())
);

-- Políticas de RLS para Tasks
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
CREATE POLICY "Admins can manage all tasks" 
ON public.tasks FOR ALL TO authenticated 
USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Consultants can manage their own tasks" ON public.tasks;
CREATE POLICY "Consultants can manage their own tasks" 
ON public.tasks FOR ALL TO authenticated 
USING (
    consultant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.contracts WHERE id = tasks.contract_id AND consultant_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.clients WHERE id = tasks.client_id AND consultant_id = auth.uid())
)
WITH CHECK (
    consultant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.contracts WHERE id = tasks.contract_id AND consultant_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.clients WHERE id = tasks.client_id AND consultant_id = auth.uid())
);

DROP POLICY IF EXISTS "Clients can view their own tasks" ON public.tasks;
CREATE POLICY "Clients can view their own tasks" 
ON public.tasks FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = tasks.client_id AND auth_user_id = auth.uid())
);

-- Políticas de RLS para Documents
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
CREATE POLICY "Admins can manage all documents" 
ON public.documents FOR ALL TO authenticated 
USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Consultants can manage their own documents" ON public.documents;
CREATE POLICY "Consultants can manage their own documents" 
ON public.documents FOR ALL TO authenticated 
USING (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.clients WHERE id = documents.client_id AND consultant_id = auth.uid())
)
WITH CHECK (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.clients WHERE id = documents.client_id AND consultant_id = auth.uid())
);

DROP POLICY IF EXISTS "Clients can view their own documents" ON public.documents;
CREATE POLICY "Clients can view their own documents" 
ON public.documents FOR SELECT TO authenticated 
USING (
    (visibility IN ('client', 'all')) AND
    EXISTS (SELECT 1 FROM public.clients WHERE id = documents.client_id AND auth_user_id = auth.uid())
);
