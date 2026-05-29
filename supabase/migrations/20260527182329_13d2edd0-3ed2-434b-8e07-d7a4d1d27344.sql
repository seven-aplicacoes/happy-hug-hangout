-- 1. Update clients table with new fields
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS pains text[],
ADD COLUMN IF NOT EXISTS success_factors text[],
ADD COLUMN IF NOT EXISTS current_objective text,
ADD COLUMN IF NOT EXISTS briefing text;

-- 2. Create methodology_fases table
CREATE TABLE IF NOT EXISTS public.methodology_phases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_key text NOT NULL UNIQUE, -- 'diagnostico', 'planejamento', etc.
  name text NOT NULL,
  order_index integer NOT NULL,
  average_duration text,
  purpose text,
  objectives text[],
  deliverables text[],
  tools text[],
  alerts text[],
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.methodology_phases TO authenticated;
GRANT ALL ON public.methodology_phases TO service_role;
ALTER TABLE public.methodology_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Methodology phases are viewable by everyone authenticated" ON public.methodology_phases FOR SELECT TO authenticated USING (true);

-- 3. Create methodology_materials table
CREATE TABLE IF NOT EXISTS public.methodology_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id uuid REFERENCES public.methodology_phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL, -- 'pdf', 'video', 'planilha', etc.
  description text,
  duration text, -- for videos
  pages integer, -- for PDFs
  url text,
  tag text, -- 'novo', 'atualizado', 'essencial'
  is_general boolean DEFAULT false,
  category text, -- 'cultura', 'comercial', etc.
  updated_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.methodology_materials TO authenticated;
GRANT ALL ON public.methodology_materials TO service_role;
ALTER TABLE public.methodology_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Methodology materials are viewable by everyone authenticated" ON public.methodology_materials FOR SELECT TO authenticated USING (true);

-- 4. Create methodology_templates table
CREATE TABLE IF NOT EXISTS public.methodology_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id uuid REFERENCES public.methodology_phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  format text,
  description text,
  examples text[],
  url text,
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.methodology_templates TO authenticated;
GRANT ALL ON public.methodology_templates TO service_role;
ALTER TABLE public.methodology_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Methodology templates are viewable by everyone authenticated" ON public.methodology_templates FOR SELECT TO authenticated USING (true);

-- 5. Create methodology_questions table
CREATE TABLE IF NOT EXISTS public.methodology_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id uuid REFERENCES public.methodology_phases(id) ON DELETE CASCADE,
  question text NOT NULL,
  objective text,
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.methodology_questions TO authenticated;
GRANT ALL ON public.methodology_questions TO service_role;
ALTER TABLE public.methodology_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Methodology questions are viewable by everyone authenticated" ON public.methodology_questions FOR SELECT TO authenticated USING (true);

-- 6. Create client_alerts table
CREATE TABLE IF NOT EXISTS public.client_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  consultant_id uuid REFERENCES public.profiles(id),
  type text NOT NULL, -- 'acelerado', 'dificuldade', etc.
  severity text NOT NULL, -- 'alta', 'media', 'baixa'
  reason text NOT NULL,
  next_action text,
  evidence text,
  status text DEFAULT 'active', -- 'active', 'resolved', 'ignored'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.client_alerts TO authenticated;
GRANT ALL ON public.client_alerts TO service_role;
ALTER TABLE public.client_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultants can view alerts for their clients" ON public.client_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Consultants can create/update alerts" ON public.client_alerts FOR ALL TO authenticated USING (true);

-- 7. Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  provider text NOT NULL,
  category text NOT NULL, -- 'agenda', 'reuniao', etc.
  status text NOT NULL, -- 'conectado', 'disponivel', etc.
  description text,
  benefits text[],
  capabilities text[],
  scopes text[],
  connected_at timestamp with time zone,
  linked_account text,
  last_sync timestamp with time zone,
  synced_items_count integer DEFAULT 0,
  documentation_url text,
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Integrations are viewable by everyone authenticated" ON public.integrations FOR SELECT TO authenticated USING (true);

-- 8. Create integration_events table
CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid REFERENCES public.integrations(id) ON DELETE CASCADE,
  title text NOT NULL,
  detail text,
  occurred_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Integration events are viewable by everyone authenticated" ON public.integration_events FOR SELECT TO authenticated USING (true);

-- 9. Create client_indicators table
CREATE TABLE IF NOT EXISTS public.client_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  value numeric NOT NULL,
  unit text,
  date date NOT NULL,
  category text, -- 'financeiro', 'operacional', etc.
  is_baseline boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.client_indicators TO authenticated;
GRANT ALL ON public.client_indicators TO service_role;
ALTER TABLE public.client_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client indicators are viewable by everyone authenticated" ON public.client_indicators FOR SELECT TO authenticated USING (true);
