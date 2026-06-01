DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.contract_product_phases LOOP
        PERFORM public.sync_contract_module_meetings_manual(r.id);
    END LOOP;
END $$;