CREATE OR REPLACE FUNCTION public.sync_contract_module_meetings_manual(phase_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    i INTEGER;
    phase_record RECORD;
    methodology_record RECORD;
    v_client_id UUID;
    v_contract_id UUID;
    v_target_meetings_count INTEGER;
BEGIN
    -- Get phase details
    SELECT * INTO phase_record FROM public.contract_product_phases WHERE id = phase_id;
    
    -- Exit if phase doesn't exist
    IF phase_record IS NULL THEN
        RETURN;
    END IF;

    -- Get methodology details to sync meetings_count if it differs
    IF phase_record.methodology_phase_id IS NOT NULL THEN
        SELECT meetings_count INTO methodology_record FROM public.methodology_plan_phases WHERE id = phase_record.methodology_phase_id;
        
        IF methodology_record IS NOT NULL AND (phase_record.meetings_count IS NULL OR phase_record.meetings_count != methodology_record.meetings_count) THEN
            UPDATE public.contract_product_phases 
            SET meetings_count = methodology_record.meetings_count
            WHERE id = phase_id;
            
            v_target_meetings_count := methodology_record.meetings_count;
        ELSE
            v_target_meetings_count := COALESCE(phase_record.meetings_count, 0);
        END IF;
    ELSE
        v_target_meetings_count := COALESCE(phase_record.meetings_count, 0);
    END IF;

    -- Get client_id and contract_id from contract_products joined with contracts
    SELECT cp.contract_id, c.client_id INTO v_contract_id, v_client_id 
    FROM public.contract_products cp
    JOIN public.contracts c ON c.id = cp.contract_id
    WHERE cp.id = phase_record.contract_product_id;

    -- 1. Update existing meetings consultant if they are not realized
    UPDATE public.contract_module_meetings 
    SET consultant_id = phase_record.responsible_consultant_id
    WHERE module_id = phase_id 
      AND (status != 'realizada' OR consultant_id IS NULL);

    -- 2. Update real scheduled meetings (in 'meetings' table) linked to these module encounters
    UPDATE public.meetings m
    SET consultant_id = phase_record.responsible_consultant_id
    FROM public.contract_module_meetings cmm
    WHERE cmm.scheduled_meeting_id = m.id
      AND cmm.module_id = phase_id
      AND m.status != 'realizada';

    -- 3. Create missing meetings using a loop from 1 to v_target_meetings_count
    IF v_target_meetings_count > 0 THEN
        FOR i IN 1..v_target_meetings_count LOOP
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
            ) 
            VALUES (
                v_client_id,
                v_contract_id,
                phase_record.contract_product_id,
                phase_id,
                i,
                'Encontro ' || i,
                'pendente',
                i,
                phase_record.responsible_consultant_id
            )
            ON CONFLICT (module_id, meeting_number) DO NOTHING;
        END LOOP;
    END IF;
    
    -- 4. Remove extra meetings if meetings_count decreased
    -- (Only if they are still 'pendente')
    DELETE FROM public.contract_module_meetings
    WHERE module_id = phase_id
      AND meeting_number > v_target_meetings_count
      AND status = 'pendente';

END;
$function$;