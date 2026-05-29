-- 1. Create client_products table
CREATE TABLE public.client_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    consultant_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'ativo',
    start_date DATE,
    end_date DATE,
    duration_weeks INTEGER,
    current_phase_id UUID, -- Will add reference after methodology_plan_phases is created
    current_week_id UUID,  -- Will add reference after methodology_weeks is created
    current_week_number INTEGER,
    methodology_plan_id UUID, -- Will add reference after methodology_plans is created
    client_visible BOOLEAN DEFAULT true,
    internal_notes TEXT,
    client_notes TEXT,
    legacy_project_id UUID, -- For traceability
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Create methodology tables
CREATE TABLE public.methodology_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ativo',
    version TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.methodology_plan_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.methodology_plans(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    phase_key TEXT NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    purpose TEXT,
    average_duration TEXT,
    objectives TEXT[],
    deliverables TEXT[],
    tools TEXT[],
    alerts TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.methodology_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES public.methodology_plan_phases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    plan_id UUID REFERENCES public.methodology_plans(id),
    week_number INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    expected_actions TEXT[],
    recommended_meetings TEXT[],
    consultant_content TEXT[],
    client_visible_content TEXT[],
    client_visibility BOOLEAN DEFAULT false,
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add circular references to client_products
ALTER TABLE public.client_products 
ADD CONSTRAINT client_products_current_phase_id_fkey FOREIGN KEY (current_phase_id) REFERENCES public.methodology_plan_phases(id),
ADD CONSTRAINT client_products_current_week_id_fkey FOREIGN KEY (current_week_id) REFERENCES public.methodology_weeks(id),
ADD CONSTRAINT client_products_methodology_plan_id_fkey FOREIGN KEY (methodology_plan_id) REFERENCES public.methodology_plans(id);

-- 4. Create Indexes
CREATE INDEX idx_client_products_client_id ON public.client_products(client_id);
CREATE INDEX idx_client_products_product_id ON public.client_products(product_id);
CREATE INDEX idx_client_products_contract_id ON public.client_products(contract_id);
CREATE INDEX idx_client_products_consultant_id ON public.client_products(consultant_id);
CREATE INDEX idx_client_products_status ON public.client_products(status);
CREATE UNIQUE INDEX idx_client_products_unique_contract ON public.client_products(client_id, product_id, contract_id) WHERE contract_id IS NOT NULL;

-- 5. Data Migration: projects -> client_products
INSERT INTO public.client_products (
    client_id, product_id, contract_id, consultant_id, status, start_date, end_date, legacy_project_id, created_at, updated_at
)
SELECT 
    client_id, product_id, contract_id, consultant_id, status, start_date, end_date, id, created_at, updated_at
FROM public.projects;

-- 6. Update operational tables (Add client_product_id)
-- Meetings
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS client_product_id UUID REFERENCES public.client_products(id);
UPDATE public.meetings m SET client_product_id = cp.id FROM public.client_products cp WHERE m.project_id = cp.legacy_project_id;

-- Documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_product_id UUID REFERENCES public.client_products(id);
UPDATE public.documents d SET client_product_id = cp.id FROM public.client_products cp WHERE d.project_id = cp.legacy_project_id;

-- 7. Rename projects to legacy_projects
ALTER TABLE public.projects RENAME TO legacy_projects;

-- 8. Grants
GRANT ALL ON public.client_products TO authenticated, service_role;
GRANT ALL ON public.methodology_plans TO authenticated, service_role;
GRANT ALL ON public.methodology_plan_phases TO authenticated, service_role;
GRANT ALL ON public.methodology_weeks TO authenticated, service_role;

-- 9. Enable RLS
ALTER TABLE public.client_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_plan_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_weeks ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for client_products
CREATE POLICY "Admins can do everything on client_products"
ON public.client_products FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Consultants can view their clients products"
ON public.client_products FOR SELECT
TO authenticated
USING (
    consultant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_products.client_id AND consultant_id = auth.uid())
);

CREATE POLICY "Clients can view their own products"
ON public.client_products FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_products.client_id AND auth_user_id = auth.uid())
);

-- Methodology tables public read (for authenticated users)
CREATE POLICY "Authenticated users can view methodology"
ON public.methodology_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view methodology phases"
ON public.methodology_plan_phases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view methodology weeks"
ON public.methodology_weeks FOR SELECT TO authenticated USING (true);
