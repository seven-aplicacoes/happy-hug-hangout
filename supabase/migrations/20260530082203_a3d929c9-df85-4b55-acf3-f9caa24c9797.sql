-- Function to generate slots for a specific availability rule
CREATE OR REPLACE FUNCTION public.generate_slots_from_availability()
RETURNS TRIGGER AS $$
DECLARE
    current_date_var DATE;
    slot_start_time TIME;
    slot_end_time TIME;
BEGIN
    -- Delete future unbooked slots for this availability rule if updating
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM public.consultant_available_slots
        WHERE consultant_id = OLD.consultant_id
        AND contract_phase_id = OLD.contract_phase_id
        AND available_date >= CURRENT_DATE
        AND is_booked = false;
    END IF;

    -- Only proceed if active
    IF NEW.is_active = false THEN
        RETURN NEW;
    END IF;

    current_date_var := GREATEST(NEW.start_date, CURRENT_DATE);
    
    WHILE current_date_var <= NEW.end_date LOOP
        -- Check if current_date_var is the correct weekday
        -- EXTRACT(DOW FROM ...) returns 0 for Sunday, 1 for Monday, etc.
        IF EXTRACT(DOW FROM current_date_var) = NEW.weekday THEN
            slot_start_time := NEW.start_time;
            
            -- Simple one-slot generation per day/rule for now based on start/end
            -- If we wanted multiple slots (breaks, etc), we'd loop here.
            -- But the UI currently allows adding multiple rules for the same day.
            
            WHILE slot_start_time + (NEW.slot_duration_minutes || ' minutes')::interval <= NEW.end_time LOOP
                slot_end_time := slot_start_time + (NEW.slot_duration_minutes || ' minutes')::interval;
                
                INSERT INTO public.consultant_available_slots (
                    client_id,
                    contract_id,
                    contract_product_id,
                    contract_phase_id,
                    consultant_id,
                    available_date,
                    start_time,
                    end_time,
                    duration_minutes,
                    is_booked
                ) VALUES (
                    NEW.client_id,
                    NEW.contract_id,
                    NEW.contract_product_id,
                    NEW.contract_phase_id,
                    NEW.consultant_id,
                    current_date_var,
                    slot_start_time,
                    slot_end_time,
                    NEW.slot_duration_minutes,
                    false
                );
                
                -- Move to next potential slot
                slot_start_time := slot_end_time;
            END LOOP;
        END IF;
        
        current_date_var := current_date_var + INTERVAL '1 day';
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for availability changes
CREATE TRIGGER tr_generate_slots
AFTER INSERT OR UPDATE ON public.consultant_availability
FOR EACH ROW
EXECUTE FUNCTION public.generate_slots_from_availability();

-- Function to handle booking when a meeting is created
CREATE OR REPLACE FUNCTION public.handle_slot_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_module_meeting_id IS NOT NULL THEN
        UPDATE public.consultant_available_slots
        SET is_booked = true,
            meeting_id = NEW.id
        WHERE consultant_id = NEW.consultant_id
        AND available_date = NEW.meeting_date
        AND start_time = NEW.start_time;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for meeting creation (booking)
CREATE TRIGGER tr_book_slot
AFTER INSERT ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.handle_slot_booking();

-- Function to handle unbooking when a meeting is cancelled or deleted
CREATE OR REPLACE FUNCTION public.handle_slot_unbooking()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelada') THEN
        UPDATE public.consultant_available_slots
        SET is_booked = false,
            meeting_id = NULL
        WHERE meeting_id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for meeting update/deletion (unbooking)
CREATE TRIGGER tr_unbook_slot
AFTER UPDATE OR DELETE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.handle_slot_unbooking();
