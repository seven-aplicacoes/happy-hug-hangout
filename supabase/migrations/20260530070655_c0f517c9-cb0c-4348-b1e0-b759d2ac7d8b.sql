CREATE OR REPLACE FUNCTION public.sync_contract_phase_meetings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    i INTEGER;
    v_contract_id UUID;
    v_client_id UUID;
BEGIN
    -- Get contract_id and client_id from contract_products joined with contracts
    SELECT cp.contract_id, ct.client_id INTO v_contract_id, v_client_id 
    FROM public.contract_products cp
    JOIN public.contracts ct ON ct.id = cp.contract_id
    WHERE cp.id = NEW.contract_product_id;

    -- Only if meetings_count changed or new row
    IF (TG_OP = 'INSERT') OR (OLD.meetings_count IS DISTINCT FROM NEW.meetings_count) THEN
        FOR i IN 1..NEW.meetings_count LOOP
            INSERT INTO public.contract_module_meetings (
                contract_id, client_id, product_id, module_id, 
                meeting_number, title, status, order_index, consultant_id
            )
            VALUES (
                v_contract_id, v_client_id, NEW.contract_product_id, NEW.id,
                i, 'Encontro ' || i, 'pendente', i, NEW.responsible_consultant_id
            )
            ON CONFLICT DO NOTHING; -- Avoid duplicates if already exists
        END LOOP;
    END IF;
    RETURN NEW;
END;
$function$;