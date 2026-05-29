-- Create table for meetings linked to contract modules
CREATE TABLE public.contract_module_meetings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_product_id UUID NOT NULL REFERENCES public.contract_products(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.contract_product_phases(id) ON DELETE CASCADE,
    meeting_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    scheduled_meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    consultant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for linking methodology documents to modules (generic methodology)
CREATE TABLE public.module_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES public.methodology_plan_modules(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    visibility_type TEXT NOT NULL DEFAULT 'internal', -- 'internal' or 'client'
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(module_id, document_id)
);

-- Table for linking specific documents to contract modules (client specific)
CREATE TABLE public.contract_module_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.contract_product_phases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    visibility_type TEXT NOT NULL DEFAULT 'internal', -- 'internal' or 'client'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(module_id, document_id)
);

-- Add column to meetings to link back to contract_module_meetings
ALTER TABLE public.meetings ADD COLUMN contract_module_meeting_id UUID REFERENCES public.contract_module_meetings(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.contract_module_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_module_documents ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_module_meetings TO authenticated;
GRANT ALL ON public.contract_module_meetings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_documents TO authenticated;
GRANT ALL ON public.module_documents TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_module_documents TO authenticated;
GRANT ALL ON public.contract_module_documents TO service_role;

-- Policies for contract_module_meetings
CREATE POLICY "Users can view contract_module_meetings of their clients" 
ON public.contract_module_meetings FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND (p.role = 'admin' OR EXISTS (
            SELECT 1 FROM public.contracts ct 
            WHERE ct.id = contract_module_meetings.contract_id 
            AND ct.consultant_id = p.id
        ))
    )
);

CREATE POLICY "Admins can manage contract_module_meetings" 
ON public.contract_module_meetings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Consultants can update contract_module_meetings they are responsible for" 
ON public.contract_module_meetings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND (p.role = 'admin' OR EXISTS (
            SELECT 1 FROM public.contracts ct 
            WHERE ct.id = contract_module_meetings.contract_id 
            AND ct.consultant_id = p.id
        ))
    )
);

-- Policies for module_documents
CREATE POLICY "Authenticated users can view module_documents" 
ON public.module_documents FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage module_documents" 
ON public.module_documents FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Policies for contract_module_documents
CREATE POLICY "Users can view contract_module_documents of their clients" 
ON public.contract_module_documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND (p.role = 'admin' OR EXISTS (
            SELECT 1 FROM public.contracts ct 
            WHERE ct.id = contract_module_documents.contract_id 
            AND ct.consultant_id = p.id
        ))
    )
);

CREATE POLICY "Admins can manage contract_module_documents" 
ON public.contract_module_documents FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Function to seed meetings when a phase is created/updated
CREATE OR REPLACE FUNCTION public.sync_contract_phase_meetings()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
BEGIN
    -- Only if meetings_count changed or new row
    IF (TG_OP = 'INSERT') OR (OLD.meetings_count IS DISTINCT FROM NEW.meetings_count) THEN
        FOR i IN 1..NEW.meetings_count LOOP
            INSERT INTO public.contract_module_meetings (
                contract_id, client_id, contract_product_id, module_id, 
                meeting_number, title, status, order_index
            )
            SELECT 
                cp.contract_id, c.id, NEW.contract_product_id, NEW.id,
                i, 'Encontro ' || i, 'pendente', i
            FROM public.contract_products cp
            JOIN public.contracts c ON c.id = cp.contract_id
            WHERE cp.id = NEW.contract_product_id
            AND NOT EXISTS (
                SELECT 1 FROM public.contract_module_meetings cmm 
                WHERE cmm.module_id = NEW.id AND cmm.meeting_number = i
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on contract_product_phases
CREATE TRIGGER sync_contract_phase_meetings_trigger
AFTER INSERT OR UPDATE ON public.contract_product_phases
FOR EACH ROW EXECUTE FUNCTION public.sync_contract_phase_meetings();
