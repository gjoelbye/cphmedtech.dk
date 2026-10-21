const TIME_ZONE = 'Europe/Copenhagen';

// Content dates are parsed as UTC midnight, so the UTC date is the calendar date.
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayInCopenhagen(now: Date): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// An event counts as upcoming until the end of its day in Copenhagen.
export function isEventUpcoming(eventDate: Date | string, now: Date = new Date()): boolean {
  const date = typeof eventDate === 'string' ? eventDate : toIsoDate(eventDate);
  return date >= todayInCopenhagen(now);
}
