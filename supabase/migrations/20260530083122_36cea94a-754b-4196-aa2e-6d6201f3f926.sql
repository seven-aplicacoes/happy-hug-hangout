-- Update booking function to handle updates (rescheduling)
CREATE OR REPLACE FUNCTION public.handle_slot_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's an update and the date/time hasn't changed, do nothing
    IF TG_OP = 'UPDATE' AND OLD.meeting_date = NEW.meeting_date AND OLD.start_time = NEW.start_time THEN
        RETURN NEW;
    END IF;

    -- Book the new slot
    IF NEW.contract_module_meeting_id IS NOT NULL THEN
        UPDATE public.consultant_available_slots
        SET is_booked = true,
            meeting_id = NEW.id
        WHERE consultant_id = NEW.consultant_id
        AND available_date = NEW.meeting_date
        AND start_time = NEW.start_time
        AND contract_module_meeting_id = NEW.contract_module_meeting_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the booking trigger to include UPDATE
DROP TRIGGER IF EXISTS tr_book_slot ON public.meetings;
CREATE TRIGGER tr_book_slot
AFTER INSERT OR UPDATE OF meeting_date, start_time ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.handle_slot_booking();

-- Update unbooking function to handle releases on reschedule
CREATE OR REPLACE FUNCTION public.handle_slot_unbooking()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's an update, only release if date/time changed OR status became 'cancelada'
    IF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'cancelada' OR OLD.meeting_date != NEW.meeting_date OR OLD.start_time != NEW.start_time THEN
            UPDATE public.consultant_available_slots
            SET is_booked = false,
                meeting_id = NULL
            WHERE meeting_id = OLD.id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.consultant_available_slots
        SET is_booked = false,
            meeting_id = NULL
        WHERE meeting_id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
