-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ensure products table has the required fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS service_track_position INTEGER;

-- 2. methodology_plans (Link between product and its methodology)
CREATE TABLE IF NOT EXISTS public.methodology_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    status TEXT DEFAULT 'active',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_plans TO authenticated;
GRANT ALL ON public.methodology_plans TO service_role;
ALTER TABLE public.methodology_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.methodology_plans FOR ALL TO authenticated USING (true);

-- 3. methodology_plan_phases (Versions like Signature 1.0, 2.0)
-- Note: We already have methodology_plan_phases, but we need to ensure it has all requested fields.
-- We'll adjust it instead of recreating if possible, but the user requested specific fields.
DO $$ 
BEGIN
    -- Add missing columns to existing table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'methodology_plan_phases') THEN
        ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS subtitle TEXT;
        ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS objective TEXT;
        ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS strategic_name TEXT;
        ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS result_summary TEXT;
        ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        -- Ensure it references methodology_plans if we want the full hierarchy
        -- For now, it already has product_id which might be enough or we link it to plans.
        ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS methodology_plan_id UUID REFERENCES public.methodology_plans(id) ON DELETE CASCADE;
    ELSE
        CREATE TABLE public.methodology_plan_phases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            methodology_plan_id UUID REFERENCES public.methodology_plans(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            subtitle TEXT,
            description TEXT,
            objective TEXT,
            strategic_name TEXT,
            result_summary TEXT,
            order_index INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_plan_phases TO authenticated;
        GRANT ALL ON public.methodology_plan_phases TO service_role;
        ALTER TABLE public.methodology_plan_phases ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable all access for authenticated users" ON public.methodology_plan_phases FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- 4. methodology_plan_modules (Areas like Gente & Gestão, Marketing)
CREATE TABLE IF NOT EXISTS public.methodology_plan_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES public.methodology_plan_phases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    responsible_role TEXT,
    estimated_hours INTEGER,
    estimated_meetings INTEGER,
    order_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_plan_modules TO authenticated;
GRANT ALL ON public.methodology_plan_modules TO service_role;
ALTER TABLE public.methodology_plan_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.methodology_plan_modules FOR ALL TO authenticated USING (true);

-- 5. methodology_plan_meetings (Encontros/Etapas)
CREATE TABLE IF NOT EXISTS public.methodology_plan_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.methodology_plan_modules(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    title TEXT NOT NULL,
    area TEXT,
    theme TEXT,
    objective TEXT,
    what_is_structured TEXT,
    duration_meeting INTEGER,
    duration_development INTEGER,
    order_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_plan_meetings TO authenticated;
GRANT ALL ON public.methodology_plan_meetings TO service_role;
ALTER TABLE public.methodology_plan_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.methodology_plan_meetings FOR ALL TO authenticated USING (true);

-- 6. methodology_plan_deliverables
CREATE TABLE IF NOT EXISTS public.methodology_plan_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.methodology_plan_meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_plan_deliverables TO authenticated;
GRANT ALL ON public.methodology_plan_deliverables TO service_role;
ALTER TABLE public.methodology_plan_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.methodology_plan_deliverables FOR ALL TO authenticated USING (true);

-- 7. methodology_plan_documents (Relationship between meetings and existing documents)
-- Assuming a 'documents' table exists or generic link
CREATE TABLE IF NOT EXISTS public.document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID, -- If there's a documents table
    entity_type TEXT NOT NULL, -- product, methodology_plan, phase, module, meeting, deliverable, contract, client
    entity_id UUID NOT NULL,
    title TEXT,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_links TO authenticated;
GRANT ALL ON public.document_links TO service_role;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.document_links FOR ALL TO authenticated USING (true);

-- 8. Snapshot tables for Contracts
CREATE TABLE IF NOT EXISTS public.contract_methodology_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL,
    original_phase_id UUID,
    name TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    objective TEXT,
    strategic_name TEXT,
    result_summary TEXT,
    order_index INTEGER,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_methodology_phases TO authenticated;
GRANT ALL ON public.contract_methodology_phases TO service_role;
ALTER TABLE public.contract_methodology_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.contract_methodology_phases FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.contract_methodology_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_phase_id UUID REFERENCES public.contract_methodology_phases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    responsible_role TEXT,
    estimated_hours INTEGER,
    estimated_meetings INTEGER,
    order_index INTEGER,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_methodology_modules TO authenticated;
GRANT ALL ON public.contract_methodology_modules TO service_role;
ALTER TABLE public.contract_methodology_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.contract_methodology_modules FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.contract_methodology_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_module_id UUID REFERENCES public.contract_methodology_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    meeting_number INTEGER,
    area TEXT,
    theme TEXT,
    objective TEXT,
    what_is_structured TEXT,
    duration_meeting INTEGER,
    duration_development INTEGER,
    order_index INTEGER,
    status TEXT DEFAULT 'pending', -- pending, scheduled, completed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_methodology_meetings TO authenticated;
GRANT ALL ON public.contract_methodology_meetings TO service_role;
ALTER TABLE public.contract_methodology_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.contract_methodology_meetings FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.contract_methodology_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_meeting_id UUID REFERENCES public.contract_methodology_meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_methodology_deliverables TO authenticated;
GRANT ALL ON public.contract_methodology_deliverables TO service_role;
ALTER TABLE public.contract_methodology_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.contract_methodology_deliverables FOR ALL TO authenticated USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_methodology_plans_updated_at BEFORE UPDATE ON public.methodology_plans FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_methodology_plan_phases_updated_at BEFORE UPDATE ON public.methodology_plan_phases FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_methodology_plan_modules_updated_at BEFORE UPDATE ON public.methodology_plan_modules FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_methodology_plan_meetings_updated_at BEFORE UPDATE ON public.methodology_plan_meetings FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_methodology_plan_deliverables_updated_at BEFORE UPDATE ON public.methodology_plan_deliverables FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
