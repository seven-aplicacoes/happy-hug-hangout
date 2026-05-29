-- Add duration_weeks to methodology_plan_phases
ALTER TABLE public.methodology_plan_phases ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;

-- Create contract_product_phases table
CREATE TABLE IF NOT EXISTS public.contract_product_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_product_id UUID NOT NULL REFERENCES public.contract_products(id) ON DELETE CASCADE,
    methodology_phase_id UUID REFERENCES public.methodology_plan_phases(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    duration_weeks INTEGER,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'pendente',
    responsible_consultant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    internal_notes TEXT,
    client_notes TEXT,
    client_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add contract_product_phase_id to operational tables
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS contract_product_phase_id UUID REFERENCES public.contract_product_phases(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS contract_product_phase_id UUID REFERENCES public.contract_product_phases(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS contract_product_phase_id UUID REFERENCES public.contract_product_phases(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.contract_product_phases ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_product_phases TO authenticated;
GRANT ALL ON public.contract_product_phases TO service_role;

-- Policies for contract_product_phases
CREATE POLICY "Admins can manage all contract product phases" 
ON public.contract_product_phases FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Consultants can view phases they are responsible for" 
ON public.contract_product_phases FOR SELECT TO authenticated 
USING (responsible_consultant_id = auth.uid());

CREATE POLICY "Consultants can view phases of products in their contracts" 
ON public.contract_product_phases FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.contract_products cp
        JOIN public.contracts c ON cp.contract_id = c.id
        WHERE cp.id = contract_product_phases.contract_product_id
        AND (c.consultant_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.clients cl WHERE cl.id = c.client_id AND cl.consultant_id = auth.uid()
        ))
    )
);

CREATE POLICY "Clients can view their own product phases" 
ON public.contract_product_phases FOR SELECT TO authenticated 
USING (
    client_visible = true AND
    EXISTS (
        SELECT 1 FROM public.contract_products cp
        JOIN public.contracts c ON cp.contract_id = c.id
        JOIN public.clients cl ON c.client_id = cl.id
        WHERE cp.id = contract_product_phases.contract_product_id
        AND cl.id IN (SELECT client_id FROM public.profiles WHERE id = auth.uid())
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contract_product_phases_updated_at
    BEFORE UPDATE ON public.contract_product_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cpp_contract_product_id ON public.contract_product_phases(contract_product_id);
CREATE INDEX IF NOT EXISTS idx_cpp_methodology_phase_id ON public.contract_product_phases(methodology_phase_id);
CREATE INDEX IF NOT EXISTS idx_cpp_responsible_consultant_id ON public.contract_product_phases(responsible_consultant_id);
CREATE INDEX IF NOT EXISTS idx_cpp_status ON public.contract_product_phases(status);
CREATE INDEX IF NOT EXISTS idx_meetings_cpp_id ON public.meetings(contract_product_phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_cpp_id ON public.tasks(contract_product_phase_id);
CREATE INDEX IF NOT EXISTS idx_documents_cpp_id ON public.documents(contract_product_phase_id);
