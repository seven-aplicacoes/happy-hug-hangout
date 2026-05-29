-- Function to sync meeting status to module encounter
CREATE OR REPLACE FUNCTION public.sync_meeting_to_module_encounter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_module_meeting_id IS NOT NULL THEN
        UPDATE public.contract_module_meetings
        SET 
            status = CASE 
                WHEN NEW.status = 'realizada' THEN 'realizada'
                WHEN NEW.status = 'cancelada' THEN 'cancelada'
                ELSE 'agendado'
            END,
            scheduled_meeting_id = NEW.id,
            scheduled_at = (NEW.meeting_date || ' ' || NEW.start_time)::timestamp with time zone,
            updated_at = now()
        WHERE id = NEW.contract_module_meeting_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sync_meeting_to_module_encounter
DROP TRIGGER IF EXISTS tr_sync_meeting_to_module_encounter ON public.meetings;
CREATE TRIGGER tr_sync_meeting_to_module_encounter
AFTER INSERT OR UPDATE OF status, meeting_date, start_time, contract_module_meeting_id ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.sync_meeting_to_module_encounter();
