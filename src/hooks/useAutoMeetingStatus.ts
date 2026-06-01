import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to automatically update meeting statuses based on current time.
 * - Future meetings: 'agendada'
 * - Current meetings: 'em_andamento'
 * - Past meetings (not yet completed/cancelled): 'aguardando_confirmacao'
 */
export function useAutoMeetingStatus() {
  useEffect(() => {
    const updateStatuses = async () => {
      try {
        const now = new Date();
        const nowISO = now.toISOString();

        // 1. Get meetings that are not in final states (realizada, cancelada, no_show)
        const { data: meetings, error } = await supabase
          .from('meetings')
          .select('id, status, meeting_date, start_time, duration')
          .not('status', 'in', '("realizada","cancelada","no_show")');

        if (error) throw error;
        if (!meetings) return;

        for (const meeting of meetings) {
          if (!meeting.meeting_date || !meeting.start_time) continue;

          const start = new Date(`${meeting.meeting_date}T${meeting.start_time}`);
          const duration = meeting.duration || 60;
          const end = new Date(start.getTime() + duration * 60000);
          
          let newStatus = meeting.status;

          if (now < start) {
            newStatus = 'agendada';
          } else if (now >= start && now <= end) {
            newStatus = 'em_andamento';
          } else if (now > end) {
            newStatus = 'aguardando_confirmacao';
          }

          if (newStatus !== meeting.status) {
            console.log(`Updating meeting ${meeting.id} status from ${meeting.status} to ${newStatus}`);
            
            // Update meeting
            await supabase
              .from('meetings')
              .update({ status: newStatus })
              .eq('id', meeting.id);

            // Log history
            await supabase.from('meeting_status_history').insert({
              meeting_id: meeting.id,
              previous_status: meeting.status,
              new_status: newStatus,
              change_reason: 'Atualização automática por horário'
            });
          }
        }
      } catch (err) {
        console.error('Error auto-updating meeting statuses:', err);
      }
    };

    // Run on mount
    updateStatuses();

    // Run every 5 minutes
    const interval = setInterval(updateStatuses, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
