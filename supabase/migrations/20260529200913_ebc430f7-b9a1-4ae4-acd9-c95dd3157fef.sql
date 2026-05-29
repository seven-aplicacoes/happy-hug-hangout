-- Adjust contract_module_meetings
ALTER TABLE public.contract_module_meetings RENAME COLUMN contract_product_id TO product_id;

-- Adjust contract_module_documents
-- Drop the document_id link and add direct file fields
ALTER TABLE public.contract_module_documents DROP COLUMN IF EXISTS document_id;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.contract_products(id);
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.contract_module_documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Ensure RLS and Grants
GRANT ALL ON public.contract_module_meetings TO authenticated;
GRANT ALL ON public.contract_module_meetings TO service_role;
GRANT ALL ON public.contract_module_documents TO authenticated;
GRANT ALL ON public.contract_module_documents TO service_role;

-- Manual sync function for existing data
CREATE OR REPLACE FUNCTION public.sync_contract_module_meetings_manual(phase_id UUID)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    current_count INTEGER;
    phase_record RECORD;
    v_client_id UUID;
    v_contract_id UUID;
BEGIN
    SELECT * INTO phase_record FROM public.contract_product_phases WHERE id = phase_id;
    SELECT COUNT(*) INTO current_count FROM public.contract_module_meetings WHERE module_id = phase_id;

    -- Get client_id and contract_id from contract_products joined with contracts
    SELECT cp.contract_id, c.client_id INTO v_contract_id, v_client_id 
    FROM public.contract_products cp
    JOIN public.contracts c ON c.id = cp.contract_id
    WHERE cp.id = phase_record.contract_product_id;

    IF phase_record.meetings_count > current_count THEN
        FOR i IN (current_count + 1)..phase_record.meetings_count LOOP
            INSERT INTO public.contract_module_meetings (
                client_id,
                contract_id,
                product_id,
                module_id,
                meeting_number,
                title,
                status,
                order_index
            ) VALUES (
                v_client_id,
                v_contract_id,
                phase_record.contract_product_id,
                phase_id,
                i,
                'Encontro ' || i,
                'pendente',
                i
            );
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to sync meetings when a phase is updated or created
CREATE OR REPLACE FUNCTION public.sync_contract_module_meetings()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.sync_contract_module_meetings_manual(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sync_contract_module_meetings
DROP TRIGGER IF EXISTS tr_sync_contract_module_meetings ON public.contract_product_phases;
CREATE TRIGGER tr_sync_contract_module_meetings
AFTER INSERT OR UPDATE OF meetings_count ON public.contract_product_phases
FOR EACH ROW
EXECUTE FUNCTION public.sync_contract_module_meetings();

-- Actually run it for all existing phases
SELECT public.sync_contract_module_meetings_manual(id) FROM public.contract_product_phases;
