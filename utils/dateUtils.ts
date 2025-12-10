
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Returns YYYY-MM-DD for input values and logic
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Returns DD/MM/YYYY for UI display
export const formatDateDisplay = (date: Date | string): string => {
  if (typeof date === 'string') {
    // Prevent timezone offset issues by manual splitting if string is YYYY-MM-DD
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // Fallback
    return new Date(date).toLocaleDateString('en-GB');
  }
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getDaysDiff = (start: Date, end: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay));
};

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};
