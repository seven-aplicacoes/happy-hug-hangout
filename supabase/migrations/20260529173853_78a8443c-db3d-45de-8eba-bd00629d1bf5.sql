-- Add foreign keys to documents table
ALTER TABLE public.documents
ADD CONSTRAINT fk_documents_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Seed some sample documents if none exist
DO $$
DECLARE
    v_consultant_id UUID := '2aebbc38-515f-4ca7-8444-2997602ab9d9';
    v_client_id UUID;
BEGIN
    -- Get a client for this consultant
    SELECT id INTO v_client_id FROM public.clients WHERE consultant_id = v_consultant_id LIMIT 1;
    
    IF v_client_id IS NOT NULL THEN
        -- Insert sample documents
        INSERT INTO public.documents (client_id, title, type, status, visibility, uploaded_by, file_name, file_path)
        VALUES 
        (v_client_id, 'Ata de Reunião Inicial', 'ata', 'aprovado', 'all', v_consultant_id, 'ata_inicial.pdf', 'seeds/ata_inicial.pdf'),
        (v_client_id, 'Diagnóstico de Processos', 'entregavel', 'pendente', 'internal', v_consultant_id, 'diagnostico.pdf', 'seeds/diagnostico.pdf');
    END IF;
END $$;