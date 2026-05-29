-- Check and Create Custom Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'consultor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
        CREATE TYPE public.contract_status AS ENUM ('ativo', 'em_onboarding', 'em_renovacao', 'renovado', 'bloqueado', 'suspenso', 'cancelado', 'churn', 'encerrado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'methodology_phase') THEN
        CREATE TYPE public.methodology_phase AS ENUM ('diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
        CREATE TYPE public.risk_level AS ENUM ('baixo', 'medio', 'alto', 'critico');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE public.task_status AS ENUM ('a_fazer', 'em_andamento', 'impedida', 'concluida');
    END IF;
END
$$;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    specialty TEXT,
    role public.user_role DEFAULT 'consultor',
    phone TEXT,
    city TEXT,
    state TEXT,
    entry_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    segment TEXT,
    region TEXT,
    consultant_id UUID REFERENCES public.profiles(id),
    methodology_phase public.methodology_phase DEFAULT 'diagnostico',
    seven_index INTEGER CHECK (seven_index BETWEEN 0 AND 100) DEFAULT 0,
    upsell_potential BOOLEAN DEFAULT FALSE,
    monthly_revenue NUMERIC(15,2),
    status public.contract_status DEFAULT 'em_onboarding',
    start_date DATE,
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can manage their clients" ON public.clients;
CREATE POLICY "Consultants can manage their clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = consultant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.profiles(id),
    type TEXT NOT NULL,
    value NUMERIC(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status public.contract_status DEFAULT 'ativo',
    risk_level public.risk_level DEFAULT 'baixo',
    current_phase public.methodology_phase DEFAULT 'diagnostico',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can manage their contracts" ON public.contracts;
CREATE POLICY "Consultants can manage their contracts" ON public.contracts FOR ALL TO authenticated USING (auth.uid() = consultant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Meetings
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id),
    consultant_id UUID REFERENCES public.profiles(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration INTEGER,
    type TEXT,
    agenda TEXT,
    status TEXT DEFAULT 'agendada',
    meeting_minutes TEXT,
    participants JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can manage their meetings" ON public.meetings;
CREATE POLICY "Consultants can manage their meetings" ON public.meetings FOR ALL TO authenticated USING (auth.uid() = consultant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id),
    consultant_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    status public.task_status DEFAULT 'a_fazer',
    priority public.risk_level DEFAULT 'medio',
    due_date TIMESTAMPTZ,
    origin TEXT,
    impediment_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can manage their tasks" ON public.tasks;
CREATE POLICY "Consultants can manage their tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = consultant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Subtasks
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtasks TO authenticated;
GRANT ALL ON public.subtasks TO service_role;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage subtasks of their tasks" ON public.subtasks;
CREATE POLICY "Users can manage subtasks of their tasks" ON public.subtasks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND (consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))));

-- 7. Timeline Events
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    ia_summary TEXT,
    ia_status TEXT DEFAULT 'pendente',
    phase public.methodology_phase,
    evidence_urls TEXT[]
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can manage timeline of their clients" ON public.timeline_events;
CREATE POLICY "Consultants can manage timeline of their clients" ON public.timeline_events FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND (consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))));

-- 8. Surveys
CREATE TABLE IF NOT EXISTS public.nps_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.profiles(id),
    score INTEGER CHECK (score BETWEEN 0 AND 10),
    comment TEXT,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'concluida'
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_surveys TO authenticated;
GRANT ALL ON public.nps_surveys TO service_role;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view NPS of their clients" ON public.nps_surveys;
CREATE POLICY "Consultants can view NPS of their clients" ON public.nps_surveys FOR ALL TO authenticated USING (consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.csat_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    score NUMERIC(2,1) CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    date DATE DEFAULT CURRENT_DATE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.csat_surveys TO authenticated;
GRANT ALL ON public.csat_surveys TO service_role;
ALTER TABLE public.csat_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view CSAT of their meetings" ON public.csat_surveys;
CREATE POLICY "Consultants can view CSAT of their meetings" ON public.csat_surveys FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_id AND (consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))));

-- 9. IA Insights
CREATE TABLE IF NOT EXISTS public.ia_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    confidence INTEGER DEFAULT 0,
    variant TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.ia_insights TO authenticated;
GRANT ALL ON public.ia_insights TO service_role;
ALTER TABLE public.ia_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view insights for their clients" ON public.ia_insights;
CREATE POLICY "Consultants can view insights for their clients" ON public.ia_insights FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND (consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))));

-- Indices
CREATE INDEX IF NOT EXISTS idx_clients_consultant ON public.clients(consultant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_date ON public.meetings(client_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON public.tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_timeline_client_date ON public.timeline_events(client_id, date);