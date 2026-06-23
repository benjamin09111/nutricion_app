const WEEKDAY_INDEX_BY_NAME: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const normalizePublicCalendarTimeZone = (timeZone?: string | null) =>
  !timeZone || timeZone === 'UTC' ? 'America/Santiago' : timeZone;

export const createDateFromDateKey = (dateKey: string) =>
  new Date(`${dateKey}T12:00:00.000Z`);

export const formatDateKeyInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const read = (type: string) => parts.find((part) => part.type === type)?.value || '0';
  return `${read('year')}-${read('month')}-${read('day')}`;
};

export const isDateKeyBefore = (left: string, right: string) => left < right;

export const getTomorrowDateKeyInTimeZone = (date: Date, timeZone: string) =>
  addDaysToDateKey(formatDateKeyInTimeZone(date, timeZone), 1);

export const addDaysToDateKey = (dateKey: string, days: number) => {
  const date = createDateFromDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

export const getWeekdayIndexInTimeZone = (dateKey: string, timeZone: string) => {
  const ref = createDateFromDateKey(dateKey);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  })
    .format(ref)
    .toLowerCase();

  return WEEKDAY_INDEX_BY_NAME[weekday] ?? ref.getUTCDay();
};

export const getWeekStartKeyInTimeZone = (date: Date, timeZone: string) => {
  const currentDateKey = formatDateKeyInTimeZone(date, timeZone);
  const weekdayIndex = getWeekdayIndexInTimeZone(currentDateKey, timeZone);
  const diff = weekdayIndex === 0 ? -6 : 1 - weekdayIndex;
  return addDaysToDateKey(currentDateKey, diff);
};
