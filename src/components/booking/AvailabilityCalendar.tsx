import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SpaceStatus } from '../../types';
import { STATUS } from '../../lib/status';
import { addDays, daysInRange, eachDay, fmtLong, fromISO, monthName, toISO, todayISO } from '../../lib/dates';
import { cn } from '../../lib/format';
import { MAX_BOOKING_DAYS } from '../../data/constants';

interface Props {
  statusOn: (date: string) => SpaceStatus;
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  onMessage?: (msg: string) => void;
  initialMonth?: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthGrid(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const count = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array(lead).fill(null);
  for (let d = 1; d <= count; d++) cells.push(toISO(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function AvailabilityCalendar({ statusOn, start, end, onChange, onMessage, initialMonth }: Props) {
  const today = todayISO();
  const base = fromISO(initialMonth ?? start ?? today);
  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const [picking, setPicking] = useState(false);
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  const months = useMemo(() => {
    const second = new Date(cursor.y, cursor.m + 1, 1);
    return [
      { y: cursor.y, m: cursor.m },
      { y: second.getFullYear(), m: second.getMonth() },
    ];
  }, [cursor]);

  const shift = (n: number) => {
    const d = new Date(cursor.y, cursor.m + n, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const atCurrent = cursor.y === fromISO(today).getFullYear() && cursor.m === fromISO(today).getMonth();

  const rangeFree = (a: string, b: string) => eachDay(a, b).every((d) => statusOn(d) === 'available');

  const click = (d: string) => {
    if (d < today) return;
    if (statusOn(d) !== 'available') {
      onMessage?.(`${fmtLong(d)} is ${STATUS[statusOn(d)].label.toLowerCase()} — choose a green date.`);
      return;
    }
    if (picking && start && d >= start) {
      if (daysInRange(start, d) > MAX_BOOKING_DAYS) {
        onMessage?.(`Bookings are limited to ${MAX_BOOKING_DAYS} days at a time.`);
        return;
      }
      if (!rangeFree(start, d)) {
        onMessage?.('That range includes dates that are already taken. Pick a shorter range.');
        onChange(d, d);
        setPicking(true);
        return;
      }
      onChange(start, d);
      setPicking(false);
      return;
    }
    onChange(d, d);
    setPicking(true);
  };

  const previewEnd = picking && start && hoverDay && hoverDay > start && rangeFree(start, hoverDay) ? hoverDay : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => shift(-1)}
          disabled={atCurrent}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-sand-100 disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-ink-soft">
          {picking ? 'Now pick your last day (or click the same day for a one-day booking)' : 'Pick your first day, then your last day'}
        </p>
        <button
          onClick={() => shift(1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-sand-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {months.map(({ y, m }) => (
          <div key={`${y}-${m}`}>
            <h4 className="mb-2 text-center text-[15px] font-bold text-ink">
              {monthName(m)} {y}
            </h4>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid(y, m).map((d, i) => {
                if (!d) return <span key={`e-${i}`} />;
                const past = d < today;
                const st = statusOn(d);
                const selEnd = end ?? start;
                const isStart = d === start;
                const isEnd = d === selEnd;
                const inRange = !!start && !!selEnd && d > start && d < selEnd;
                const inPreview = !!previewEnd && !!start && d > start && d <= previewEnd;
                const selected = isStart || isEnd;
                const clickable = !past && st === 'available';
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => click(d)}
                    onMouseEnter={() => setHoverDay(d)}
                    onMouseLeave={() => setHoverDay(null)}
                    aria-pressed={selected}
                    aria-label={`${fmtLong(d)} — ${past ? 'past date' : STATUS[st].label}`}
                    title={past ? 'Past date' : STATUS[st].label}
                    className={cn(
                      'relative flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition',
                      past && 'cursor-not-allowed text-ink-mute/40',
                      !past && !selected && !inRange && !inPreview && st === 'available' && 'bg-st-available-soft text-st-available-ink hover:ring-2 hover:ring-st-available',
                      !past && st === 'booked' && !selected && 'cursor-not-allowed bg-st-booked-soft text-st-booked-ink line-through decoration-st-booked/50',
                      !past && st === 'pending' && !selected && 'cursor-not-allowed bg-st-pending-soft text-st-pending-ink',
                      !past && st === 'blocked' && !selected && 'cursor-not-allowed text-st-blocked-ink',
                      (inRange || inPreview) && 'bg-brand-100 text-brand-800',
                      selected && 'bg-brand-700 text-white shadow-md shadow-brand-900/30',
                      d === today && !selected && 'ring-2 ring-inset ring-brand-400',
                      !clickable && !selected && 'cursor-not-allowed',
                    )}
                    style={st === 'blocked' && !past && !selected ? { backgroundImage: 'repeating-linear-gradient(45deg,#d7dde6 0 3px,#eef1f5 3px 6px)' } : undefined}
                  >
                    {fromISO(d).getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          {(['available', 'pending', 'booked', 'blocked'] as SpaceStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-2 font-medium text-ink">
              <span
                className={cn('h-3.5 w-3.5 rounded-[5px] ring-1 ring-inset ring-black/10', STATUS[s].dot)}
                style={s === 'blocked' ? { backgroundImage: 'repeating-linear-gradient(45deg,#cbd5e1 0 3px,#e2e8f0 3px 6px)' } : undefined}
              />
              {STATUS[s].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 font-medium text-ink">
            <span className="h-3.5 w-3.5 rounded-[5px] bg-brand-700" />
            Your selection
          </span>
        </div>
        {start && (
          <button
            onClick={() => {
              onChange(null, null);
              setPicking(false);
            }}
            className="text-[13px] font-semibold text-brand-600 hover:underline"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}

/** Helper for consumers: is every day in the range free? */
export function rangeIsFree(statusOn: (d: string) => SpaceStatus, a: string, b: string): boolean {
  let d = a;
  while (d <= b) {
    if (statusOn(d) !== 'available') return false;
    d = addDays(d, 1);
  }
  return true;
}
