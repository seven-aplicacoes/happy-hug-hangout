-- Corrigir RLS para public.meetings
DROP POLICY IF EXISTS "Consultants can manage their meetings" ON public.meetings;
DROP POLICY IF EXISTS "Clients can view their meetings" ON public.meetings;

-- Policy para Admin e Consultores
CREATE POLICY "Admin and Consultants can manage meetings" 
ON public.meetings 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'consultor'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'consultor'))
);

-- Policy para Clientes (Apenas leitura)
CREATE POLICY "Clients can view their meetings" 
ON public.meetings 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE auth_user_id = auth.uid() AND id = client_id
  )
);

-- Corrigir RLS para public.meeting_minutes
DROP POLICY IF EXISTS "Consultants can manage their minutes" ON public.meeting_minutes;
DROP POLICY IF EXISTS "Clients can view their minutes" ON public.meeting_minutes;

-- Policy para Admin e Consultores
CREATE POLICY "Admin and Consultants can manage minutes" 
ON public.meeting_minutes 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'consultor'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'consultor'))
);

-- Policy para Clientes (Apenas leitura, se visível)
CREATE POLICY "Clients can view visible minutes" 
ON public.meeting_minutes 
FOR SELECT 
TO authenticated 
USING (
  visible_to_client = true AND
  EXISTS (
    SELECT 1 FROM public.meetings m
    JOIN public.clients c ON m.client_id = c.id
    WHERE m.id = meeting_id AND c.auth_user_id = auth.uid()
  )
);

-- Criar tabela de histórico/auditoria se não existir (renomeando para manter padrão do projeto se necessário)
-- Já notei meeting_status_history sendo usada no código, vamos garantir que ela exista com os campos necessários.
CREATE TABLE IF NOT EXISTS public.meeting_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    action TEXT,
    previous_status TEXT,
    new_status TEXT,
    changed_by UUID REFERENCES public.profiles(id),
    change_reason TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT ON public.meeting_status_history TO authenticated;
GRANT ALL ON public.meeting_status_history TO service_role;

ALTER TABLE public.meeting_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view meeting history" 
ON public.meeting_status_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Consultants can insert meeting history" 
ON public.meeting_status_history FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'consultor')));

-- Garantir GRANTs para as tabelas principais
GRANT ALL ON public.meetings TO authenticated;
GRANT ALL ON public.meeting_minutes TO authenticated;
GRANT ALL ON public.meeting_status_history TO authenticated;
