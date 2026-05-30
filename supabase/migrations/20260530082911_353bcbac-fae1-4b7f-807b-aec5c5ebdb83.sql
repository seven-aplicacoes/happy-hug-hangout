-- Add meeting ID to availability tables
ALTER TABLE public.consultant_availability 
ADD COLUMN contract_module_meeting_id UUID REFERENCES public.contract_module_meetings(id);

ALTER TABLE public.consultant_available_slots 
ADD COLUMN contract_module_meeting_id UUID REFERENCES public.contract_module_meetings(id);

-- Add indexes for better performance
CREATE INDEX idx_consultant_availability_meeting ON public.consultant_availability(contract_module_meeting_id);
CREATE INDEX idx_consultant_available_slots_meeting ON public.consultant_available_slots(contract_module_meeting_id);

-- Update slot generation function to respect existing meetings and link to specific meeting
CREATE OR REPLACE FUNCTION public.generate_slots_from_availability()
RETURNS TRIGGER AS $$
DECLARE
    current_date_var DATE;
    slot_start_time TIME;
    slot_end_time TIME;
    has_conflict BOOLEAN;
BEGIN
    -- Delete future unbooked slots for this availability rule if updating
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM public.consultant_available_slots
        WHERE consultant_id = OLD.consultant_id
        AND contract_module_meeting_id = OLD.contract_module_meeting_id
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
        IF EXTRACT(DOW FROM current_date_var) = NEW.weekday THEN
            slot_start_time := NEW.start_time;
            
            WHILE slot_start_time + (NEW.slot_duration_minutes || ' minutes')::interval <= NEW.end_time LOOP
                slot_end_time := slot_start_time + (NEW.slot_duration_minutes || ' minutes')::interval;
                
                -- Check for existing meetings for this consultant at this time
                SELECT EXISTS (
                    SELECT 1 FROM public.meetings
                    WHERE consultant_id = NEW.consultant_id
                    AND meeting_date = current_date_var
                    AND status != 'cancelada'
                    AND (
                        (start_time, (start_time + (duration || ' minutes')::interval)) OVERLAPS 
                        (slot_start_time, slot_end_time)
                    )
                ) INTO has_conflict;

                IF NOT has_conflict THEN
                    INSERT INTO public.consultant_available_slots (
                        client_id,
                        contract_id,
                        contract_product_id,
                        contract_phase_id,
                        contract_module_meeting_id,
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
                        NEW.contract_module_meeting_id,
                        NEW.consultant_id,
                        current_date_var,
                        slot_start_time,
                        slot_end_time,
                        NEW.slot_duration_minutes,
                        false
                    );
                END IF;
                
                -- Move to next potential slot
                slot_start_time := slot_end_time;
            END LOOP;
        END IF;
        
        current_date_var := current_date_var + INTERVAL '1 day';
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update booking handler to use meeting-specific slots
CREATE OR REPLACE FUNCTION public.handle_slot_booking()
RETURNS TRIGGER AS $$
BEGIN
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
