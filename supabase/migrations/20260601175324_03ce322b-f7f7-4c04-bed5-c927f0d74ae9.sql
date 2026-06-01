-- Drop the trigger that enforces sequential scheduling
DROP TRIGGER IF EXISTS tr_check_sequential_scheduling ON public.contract_module_meetings;

-- Drop the function that checks for sequential meeting status
DROP FUNCTION IF EXISTS public.check_sequential_meeting();