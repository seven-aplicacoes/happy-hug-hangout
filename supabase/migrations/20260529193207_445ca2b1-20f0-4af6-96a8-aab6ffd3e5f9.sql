-- Trigger to sync meeting status to contract module meetings
CREATE OR REPLACE FUNCTION public.sync_meeting_to_contract_meeting()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.contract_module_meeting_id IS NOT NULL) THEN
        UPDATE public.contract_module_meetings
        SET scheduled_meeting_id = NEW.id,
            status = CASE 
                        WHEN NEW.status = 'realizada' THEN 'realizada' 
                        WHEN NEW.status = 'cancelada' THEN 'cancelada'
                        WHEN NEW.status = 'remarcada' THEN 'reagendado'
                        WHEN NEW.status = 'reagendada' THEN 'reagendado'
                        ELSE 'agendado' 
                     END,
            scheduled_at = (NEW.meeting_date || ' ' || NEW.start_time)::timestamp,
            consultant_id = NEW.consultant_id,
            updated_at = now()
        WHERE id = NEW.contract_module_meeting_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_meeting_to_contract_meeting_trigger
AFTER INSERT OR UPDATE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.sync_meeting_to_contract_meeting();

REVOKE EXECUTE ON FUNCTION public.sync_meeting_to_contract_meeting() FROM public;
REVOKE EXECUTE ON FUNCTION public.sync_meeting_to_contract_meeting() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_meeting_to_contract_meeting() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_meeting_to_contract_meeting() TO service_role;
