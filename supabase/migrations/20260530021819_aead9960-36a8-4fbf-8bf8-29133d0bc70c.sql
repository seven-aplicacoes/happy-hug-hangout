-- 1. Update the manual sync function to handle consultant_id and propagate to scheduled meetings
CREATE OR REPLACE FUNCTION public.sync_contract_module_meetings_manual(phase_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    i INTEGER;
    current_count INTEGER;
    phase_record RECORD;
    v_client_id UUID;
    v_contract_id UUID;
BEGIN
    SELECT * INTO phase_record FROM public.contract_product_phases WHERE id = phase_id;
    
    -- Exit if phase doesn't exist
    IF phase_record IS NULL THEN
        RETURN;
    END IF;

    -- Get current meetings count
    SELECT COUNT(*) INTO current_count FROM public.contract_module_meetings WHERE module_id = phase_id;

    -- Get client_id and contract_id from contract_products joined with contracts
    SELECT cp.contract_id, c.client_id INTO v_contract_id, v_client_id 
    FROM public.contract_products cp
    JOIN public.contracts c ON c.id = cp.contract_id
    WHERE cp.id = phase_record.contract_product_id;

    -- 1. Update existing meetings consultant if they are not realized or if they have no consultant
    -- Also update them if the phase responsible has changed
    UPDATE public.contract_module_meetings 
    SET consultant_id = phase_record.responsible_consultant_id
    WHERE module_id = phase_id 
      AND (status != 'realizada' OR consultant_id IS NULL OR consultant_id != phase_record.responsible_consultant_id);

    -- 2. Update real scheduled meetings (in 'meetings' table) linked to these module encounters
    UPDATE public.meetings m
    SET consultant_id = phase_record.responsible_consultant_id
    FROM public.contract_module_meetings cmm
    WHERE cmm.scheduled_meeting_id = m.id
      AND cmm.module_id = phase_id
      AND (m.status != 'realizada' OR m.consultant_id IS NULL OR m.consultant_id != phase_record.responsible_consultant_id);

    -- 3. Create missing meetings with the consultant_id already set
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
                order_index,
                consultant_id
            ) VALUES (
                v_client_id,
                v_contract_id,
                phase_record.contract_product_id,
                phase_id,
                i,
                'Encontro ' || i,
                'pendente',
                i,
                phase_record.responsible_consultant_id
            );
        END LOOP;
    END IF;
END;
$function$;

-- 2. Update the trigger to fire when responsible_consultant_id changes
DROP TRIGGER IF EXISTS tr_sync_contract_module_meetings ON public.contract_product_phases;

CREATE TRIGGER tr_sync_contract_module_meetings 
AFTER INSERT OR UPDATE OF meetings_count, responsible_consultant_id 
ON public.contract_product_phases 
FOR EACH ROW 
EXECUTE FUNCTION sync_contract_module_meetings();

-- 3. Run sync for all existing phases to fix any "Não definido" or outdated consultants
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.contract_product_phases LOOP
        PERFORM public.sync_contract_module_meetings_manual(r.id);
    END LOOP;
END;
$$;
