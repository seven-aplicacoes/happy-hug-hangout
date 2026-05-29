export const minutesToHHMM = (totalMinutes: number | undefined | null): string => {
  if (totalMinutes === undefined || totalMinutes === null) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const hhmmToMinutes = (hhmm: string): number | null => {
  if (!hhmm) return null;
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

export const formatDuration = (totalMinutes: number | undefined | null): string => {
  if (totalMinutes === undefined || totalMinutes === null) return '—';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  
  if (hours === 0 && minutes === 0) return '0h';
  
  const hoursStr = hours > 0 ? `${hours}h` : '';
  const minutesStr = minutes > 0 ? `${minutes}min` : '';
  
  return `${hoursStr}${minutesStr}` || '0h';
};

export const validateHHMM = (val: string): boolean => {
  const regex = /^([0-9]+):([0-5][0-9])$/;
  return regex.test(val);
};
