// All dates are handled as local-time "YYYY-MM-DD" strings so there are no timezone surprises.

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);
}

/** Inclusive number of days in a range. */
export function daysInRange(start: string, end: string): number {
  return diffDays(start, end) + 1;
}

export function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  for (let i = 0, n = daysInRange(start, end); i < n; i++) out.push(addDays(start, i));
  return out;
}

export function startOfMonth(iso: string): string {
  const d = fromISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const monthName = (i: number) => MONTHS_LONG[i];
export const shortMonth = (i: number) => MONTHS[i];
export const weekdayShort = (iso: string) => DAYS[fromISO(iso).getDay()];

/** "12 Oct" */
export function fmtShort(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Mon, 12 Oct 2026" */
export function fmtLong(iso: string): string {
  const d = fromISO(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12 Oct 2026" */
export function fmtDate(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12 – 15 Oct 2026" or "12 Oct" for a single day */
export function fmtRange(start: string, end: string): string {
  if (start === end) return fmtDate(start);
  const a = fromISO(start);
  const b = fromISO(end);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  }
  return `${fmtShort(start)} – ${fmtDate(end)}`;
}

export function fmtDateTime(isoTs: string): string {
  const d = new Date(isoTs);
  const h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${h12}:${pad(d.getMinutes())}${ampm}`;
}

/** "08:00" -> "8:00am" */
export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${pad(m)}${ampm}`;
}

export function fmtTimeRange(a: string, b: string): string {
  return `${fmtTime(a)} – ${fmtTime(b)}`;
}

export function timeAgo(isoTs: string): string {
  const diff = Date.now() - new Date(isoTs).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** ISO timestamp for N days ago at a given hour (local) */
export function tsDaysAgo(n: number, hour = 10, minute = 15): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
