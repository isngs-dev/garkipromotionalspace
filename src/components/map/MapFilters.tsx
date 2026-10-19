import { CalendarDays, CalendarRange, Clock, Maximize2, SlidersHorizontal, Tag } from 'lucide-react';
import { PEAK_END, PEAK_MULTIPLIER, PEAK_START, RATE_PER_SQFT_PER_DAY, TIME_SLOTS, slotById } from '../../data/constants';
import { slotFactor } from '../../lib/pricing';
import type { SpaceStatus, TimeSlotId } from '../../types';
import { STATUS, STATUS_ORDER } from '../../lib/status';
import { naira, plural } from '../../lib/format';
import { addDays, daysInRange, fmtTimeRange, todayISO } from '../../lib/dates';
import { MAX_BOOKING_DAYS } from '../../data/constants';

export type SizeFilter = 'any' | 'small' | 'medium' | 'large';

export const SIZE_OPTIONS: Array<{ id: SizeFilter; label: string; test: (sqft: number) => boolean }> = [
  { id: 'any', label: 'Any size', test: () => true },
  { id: 'small', label: 'Up to 150 sq ft', test: (a) => a <= 150 },
  { id: 'medium', label: '151 – 250 sq ft', test: (a) => a > 150 && a <= 250 },
  { id: 'large', label: 'Over 250 sq ft', test: (a) => a > 250 },
];

const labelCls = 'mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-mute';
const selectCls =
  'h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25';

/**
 * The floor-plan filter bar. The From / To dates and the time window chosen here are carried all the way
 * through the space page into the booking request, so nothing has to be typed in again.
 */
export function MapFilters({
  mode,
  date,
  onDate,
  toDate,
  onToDate,
  slot,
  onSlot,
  status,
  onStatus,
  size,
  onSize,
  onReset,
}: {
  mode: 'space' | 'mobile';
  date: string;
  onDate: (d: string) => void;
  toDate: string;
  onToDate: (d: string) => void;
  slot: TimeSlotId;
  onSlot: (s: TimeSlotId) => void;
  status: SpaceStatus | 'all';
  onStatus: (s: SpaceStatus | 'all') => void;
  size: SizeFilter;
  onSize: (s: SizeFilter) => void;
  onReset: () => void;
}) {
  const today = todayISO();
  const dirty = status !== 'all' || size !== 'any' || date !== today || toDate !== today || slot !== 'full';
  const days = daysInRange(date, toDate);

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
        <div className="min-w-[150px] flex-1">
          <label className={labelCls} htmlFor="f-date">
            <CalendarDays className="h-3.5 w-3.5" /> From
          </label>
          <input id="f-date" type="date" min={today} value={date} onChange={(e) => e.target.value && onDate(e.target.value)} className={selectCls} />
        </div>
        <div className="min-w-[150px] flex-1">
          <label className={labelCls} htmlFor="f-to">
            <CalendarRange className="h-3.5 w-3.5" /> To
            <span className="ml-auto font-semibold normal-case tracking-normal text-brand-700">{plural(days, 'day')}</span>
          </label>
          <input
            id="f-to"
            type="date"
            min={date}
            max={addDays(date, MAX_BOOKING_DAYS - 1)}
            value={toDate}
            onChange={(e) => e.target.value && onToDate(e.target.value)}
            className={selectCls}
          />
        </div>
        <div className="min-w-[250px] flex-[1.7]">
          <label className={labelCls} htmlFor="f-slot">
            <Clock className="h-3.5 w-3.5" /> {mode === 'mobile' ? 'Roaming hours' : 'Time window'}
          </label>
          <select id="f-slot" value={slot} onChange={(e) => onSlot(e.target.value as TimeSlotId)} className={selectCls}>
            {TIME_SLOTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} · {fmtTimeRange(t.start, t.end)}
              </option>
            ))}
          </select>
        </div>
        {mode === 'space' && (
          <>
            <div className="min-w-[150px] flex-1">
              <label className={labelCls} htmlFor="f-status">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Status
              </label>
              <select id="f-status" value={status} onChange={(e) => onStatus(e.target.value as SpaceStatus | 'all')} className={selectCls}>
                <option value="all">All statuses</option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[150px] flex-1">
              <label className={labelCls} htmlFor="f-size">
                <Maximize2 className="h-3.5 w-3.5" /> Size
              </label>
              <select id="f-size" value={size} onChange={(e) => onSize(e.target.value as SizeFilter)} className={selectCls}>
                {SIZE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[190px] flex-[1.2]">
              <div className={labelCls}>
                <Tag className="h-3.5 w-3.5" /> Price per day
              </div>
              <div
                className="flex h-10 items-center rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-800"
                title={`Full day ${naira(RATE_PER_SQFT_PER_DAY)} per sq ft. Shorter windows cost less; hours inside the peak window (${fmtTimeRange(PEAK_START, PEAK_END)}) count ${PEAK_MULTIPLIER}×.`}
              >
                {naira(Math.round(RATE_PER_SQFT_PER_DAY * slotFactor(slot)))}
                <span className="ml-1 truncate font-medium text-brand-700/80">per sq ft · {slotById(slot).label}</span>
              </div>
            </div>
          </>
        )}
        <button
          onClick={onReset}
          disabled={!dirty}
          className="h-10 rounded-xl px-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:text-ink-mute disabled:hover:bg-transparent"
        >
          Reset filters
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-mute">
        The dates and time window you choose here are used for availability on the map and carried into your booking request automatically.
      </p>
    </div>
  );
}
