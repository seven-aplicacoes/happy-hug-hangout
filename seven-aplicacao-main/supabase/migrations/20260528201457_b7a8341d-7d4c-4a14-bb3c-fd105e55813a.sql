-- 1. Create client_contacts table
CREATE TABLE public.client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    area TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_financial BOOLEAN DEFAULT false,
    is_decision_maker BOOLEAN DEFAULT false,
    portal_access BOOLEAN DEFAULT false,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create contract_products table (replacing/enhancing client_products logic)
CREATE TABLE public.contract_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    status TEXT NOT NULL DEFAULT 'ativo',
    start_date DATE,
    end_date DATE,
    duration_weeks INTEGER,
    value NUMERIC,
    current_phase_id UUID REFERENCES public.methodology_plan_phases(id),
    current_week_id UUID REFERENCES public.methodology_weeks(id),
    current_week_number INTEGER,
    client_visible BOOLEAN DEFAULT true,
    internal_notes TEXT,
    client_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 3. Create consultants by phase table
CREATE TABLE public.contract_product_phase_consultants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_product_id UUID NOT NULL REFERENCES public.contract_products(id) ON DELETE CASCADE,
    methodology_phase_id UUID NOT NULL REFERENCES public.methodology_plan_phases(id),
    consultant_id UUID NOT NULL REFERENCES public.profiles(id),
    role TEXT, -- 'lead', 'support', etc.
    is_primary BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Expand clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS institutional_email TEXT;

-- 5. Data Migration: client_products -> contract_products
-- Only for records that have a contract_id
INSERT INTO public.contract_products (
    id, contract_id, product_id, status, start_date, end_date, duration_weeks, 
    current_phase_id, current_week_id, current_week_number, client_visible, 
    internal_notes, client_notes, created_at, updated_at, created_by, updated_by
)
SELECT 
    id, contract_id, product_id, status, start_date, end_date, duration_weeks, 
    current_phase_id, current_week_id, current_week_number, client_visible, 
    internal_notes, client_notes, created_at, updated_at, created_by, updated_by
FROM public.client_products
WHERE contract_id IS NOT NULL;

-- 6. Update operational tables to reference contract_product_id instead of client_product_id
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS contract_product_id UUID REFERENCES public.contract_products(id);
UPDATE public.meetings SET contract_product_id = client_product_id WHERE client_product_id IS NOT NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS contract_product_id UUID REFERENCES public.contract_products(id);
UPDATE public.tasks SET contract_product_id = client_product_id WHERE client_product_id IS NOT NULL;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS contract_product_id UUID REFERENCES public.contract_products(id);
UPDATE public.documents SET contract_product_id = client_product_id WHERE client_product_id IS NOT NULL;

-- 7. Grants
GRANT ALL ON public.client_contacts TO authenticated, service_role;
GRANT ALL ON public.contract_products TO authenticated, service_role;
GRANT ALL ON public.contract_product_phase_consultants TO authenticated, service_role;

-- 8. Enable RLS
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_product_phase_consultants ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- client_contacts
CREATE POLICY "Admins can manage client_contacts" ON public.client_contacts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Consultants can view their clients contacts" ON public.client_contacts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_contacts.client_id AND consultant_id = auth.uid()));
CREATE POLICY "Clients can view their own contacts" ON public.client_contacts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_contacts.client_id AND auth_user_id = auth.uid()));

-- contract_products
CREATE POLICY "Admins can manage contract_products" ON public.contract_products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Consultants can view their clients contract products" ON public.contract_products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.contracts c JOIN public.clients cl ON c.client_id = cl.id WHERE c.id = contract_products.contract_id AND cl.consultant_id = auth.uid()));
CREATE POLICY "Clients can view their own contract products" ON public.contract_products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.contracts c JOIN public.clients cl ON c.client_id = cl.id WHERE c.id = contract_products.contract_id AND cl.auth_user_id = auth.uid()) AND client_visible = true);

-- contract_product_phase_consultants
CREATE POLICY "Admins can manage phase consultants" ON public.contract_product_phase_consultants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view phase consultants" ON public.contract_product_phase_consultants FOR SELECT TO authenticated USING (true);
