-- 1. Add unique constraint to prevent duplicate meeting numbers in a module
ALTER TABLE public.contract_module_meetings 
ADD CONSTRAINT contract_module_meetings_module_id_meeting_number_key UNIQUE (module_id, meeting_number);

-- 2. Drop the redundant trigger that was causing errors
DROP TRIGGER IF EXISTS sync_contract_phase_meetings_trigger ON public.contract_product_phases;
DROP FUNCTION IF EXISTS public.sync_contract_phase_meetings();

-- 3. Update the main sync function to be more robust and handle duplicates safely
CREATE OR REPLACE FUNCTION public.sync_contract_module_meetings_manual(phase_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    i INTEGER;
    phase_record RECORD;
    v_client_id UUID;
    v_contract_id UUID;
BEGIN
    -- Get phase details
    SELECT * INTO phase_record FROM public.contract_product_phases WHERE id = phase_id;
    
    -- Exit if phase doesn't exist
    IF phase_record IS NULL THEN
        RETURN;
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

    -- 3. Create missing meetings using a loop from 1 to meetings_count
    -- ON CONFLICT DO NOTHING handles cases where the meeting number already exists
    IF phase_record.meetings_count > 0 THEN
        FOR i IN 1..phase_record.meetings_count LOOP
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
    
    -- 4. Optionally: Remove extra meetings if meetings_count decreased
    -- (Only if they are still 'pendente')
    DELETE FROM public.contract_module_meetings
    WHERE module_id = phase_id
      AND meeting_number > phase_record.meetings_count
      AND status = 'pendente';

END;
$function$;