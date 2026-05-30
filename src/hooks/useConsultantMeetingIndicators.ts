import { useMemo } from 'react';
import { useReunioes } from './useReunioes';
import { useConsultantGoals } from './useConsultantGoals';
import { endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function useConsultantMeetingIndicators(consultantId: string | undefined, month: number, year: number) {
  const { reunioes, isLoading: loadingReunioes } = useReunioes();
  const { consultantGoals, isLoading: loadingGoals } = useConsultantGoals(consultantId);

  const stats = useMemo(() => {
    if (!reunioes || !consultantId) {
      return {
        realizadas: 0,
        agendadas: 0,
        previstas: 0,
        saldo: 0,
        aderencia: 0,
        hasGoal: false
      };
    }

    const startDate = new Date(year, month, 1);
    const endDate = endOfMonth(startDate);

    const reunioesMes = reunioes.filter(r => {
      if (!r.meetingDate) return false;
      const rDate = parseISO(r.meetingDate);
      return isWithinInterval(rDate, { start: startDate, end: endDate });
    });

    // Valid statuses for 'realizada' based on the project's StatusReuniao type
    const realizadas = reunioesMes.filter(r => r.status === 'realizada').length;
    const agendadas = reunioesMes.filter(r => r.status === 'agendada').length;

    // Find the meeting goal in the consultant goals
    const meetingGoal = consultantGoals?.find(g => g.indicator_key === 'meetings_completed' && g.is_active);
    const previstas = meetingGoal ? Number(meetingGoal.goal_value) : 0;
    const hasGoal = !!meetingGoal;

    const saldo = previstas - realizadas;
    const aderencia = previstas > 0 ? Math.round((realizadas / previstas) * 100) : 0;

    return {
      realizadas,
      agendadas,
      previstas,
      saldo,
      aderencia,
      hasGoal
    };
  }, [reunioes, consultantGoals, consultantId, month, year]);

  return {
    ...stats,
    isLoading: loadingReunioes || loadingGoals
  };
}
