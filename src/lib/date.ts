/** Calendar-day helpers. "Today" is always computed on the server in APP_TIMEZONE. */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function appTimeZone(): string {
  const tz = process.env.APP_TIMEZONE;
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    console.warn(`Invalid APP_TIMEZONE "${tz}", falling back to UTC`);
    return "UTC";
  }
}

/** YYYY-MM-DD for `now` in the app timezone. */
export function todayKey(now: Date = new Date(), timeZone: string = appTimeZone()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

/** A YYYY-MM-DD key → the UTC-midnight Date Prisma expects for a @db.Date column. */
export function dateKeyToDb(key: string): Date {
  if (!isDateKey(key)) throw new Error(`Invalid date key: ${key}`);
  return new Date(`${key}T00:00:00.000Z`);
}

export function dbToDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** True when `key` is today ±1 day (absorbs midnight/timezone edges); bounds client-supplied dates. */
export function isNearToday(key: string, now: Date = new Date()): boolean {
  if (!isDateKey(key)) return false;
  const today = todayKey(now);
  return [addDays(today, -1), today, addDays(today, 1)].includes(key);
}

export function addDays(key: string, days: number): string {
  const d = dateKeyToDb(key);
  d.setUTCDate(d.getUTCDate() + days);
  return dbToDateKey(d);
}
