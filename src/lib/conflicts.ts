import { supabase } from '@/integrations/supabase/client';

interface ConflictParams {
  consultantId: string;
  date: string;
  startTime: string;
  endTime: string;
  ignoreMeetingId?: string;
}

export async function checkConsultantConflict({
  consultantId,
  date,
  startTime,
  endTime,
  ignoreMeetingId
}: ConflictParams): Promise<{ hasConflict: boolean; conflictingMeeting?: any }> {
  let query = supabase
    .from('meetings')
    .select('*')
    .eq('consultant_id', consultantId)
    .eq('meeting_date', date)
    .in('status', ['agendada', 'confirmada', 'em_andamento', 'realizada']);

  if (ignoreMeetingId) {
    query = query.neq('id', ignoreMeetingId);
  }

  const { data: meetings, error } = await query;

  if (error) {
    console.error('Error checking conflict:', error);
    throw error;
  }

  // Overlap logic: novo_inicio < reuniao_existente_fim E novo_fim > reuniao_existente_inicio
  // Assuming start_time and end_time are in 'HH:mm' format
  const newStart = startTime;
  const newEnd = endTime;

  for (const meeting of meetings) {
    const existingStart = meeting.start_time;
    // Calculate end time based on duration if not present, but meetings table usually has duration
    const duration = meeting.duration || 60;
    const existingEnd = calculateEndTime(existingStart, duration);

    if (newStart < existingEnd && newEnd > existingStart) {
      return { hasConflict: true, conflictingMeeting: meeting };
    }
  }

  return { hasConflict: false };
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
