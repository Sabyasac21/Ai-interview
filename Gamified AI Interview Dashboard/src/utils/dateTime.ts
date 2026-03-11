export const getUserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const KEY_FMT_CACHE = new Map<string, Intl.DateTimeFormat>();

const getKeyFormatter = (timeZone: string) => {
  const cached = KEY_FMT_CACHE.get(timeZone);
  if (cached) return cached;
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  KEY_FMT_CACHE.set(timeZone, fmt);
  return fmt;
};

export const toDateKey = (value: Date | string | number, timeZone: string = getUserTimeZone()): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return getKeyFormatter(timeZone).format(date);
};

export const parseBackendDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== 'string') return null;

  let normalized = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(normalized)) {
    normalized = normalized.replace(/\.(\d{3})\d+$/, '.$1');
    if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
      normalized += 'Z';
    }
  }

  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getLastNDaysKeys = (
  days: number,
  anchor: Date = new Date(),
  timeZone: string = getUserTimeZone()
): string[] => {
  const out: string[] = [];
  const cursor = new Date(anchor);
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    out.push(toDateKey(cursor, timeZone));
    cursor.setDate(cursor.getDate() - 1);
  }
  return out.reverse();
};

