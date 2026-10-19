import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { spaceById, zoneById } from '../../data/spaces';
import { fmtRange, fmtShort, fromISO, monthName, toISO } from '../../lib/dates';
import { cn, naira, nairaCompact, plural } from '../../lib/format';

/** One revenue line that makes up a month's bar, dated to the day it is counted in that month. */
export interface RevenueItem {
  targetId: string;
  type: 'space' | 'mobile';
  brand: string;
  date: string; // YYYY-MM-DD the revenue is counted on
  startDate: string;
  endDate: string;
  days: number;
  amount: number;
}

export interface MonthRevenue {
  key: string; // YYYY-MM
  label: string;
  current: boolean;
  value: number;
  items: RevenueItem[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function targetInfo(it: Pick<RevenueItem, 'targetId' | 'type'>) {
  if (it.type === 'space') {
    const s = spaceById(it.targetId);
    return { code: it.targetId, name: s?.name ?? it.targetId, where: s?.location ?? '' };
  }
  const z = zoneById(it.targetId);
  return { code: z ? `Zone ${z.code}` : it.targetId, name: z?.name ?? it.targetId, where: 'Mobile promotion' };
}

export function MonthRevenueModal({ month, onClose }: { month: MonthRevenue | null; onClose: () => void }) {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(null), [month?.key]);

  const data = useMemo(() => {
    if (!month) return null;
    const first = `${month.key}-01`;
    const firstDate = fromISO(first);
    const daysInMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0).getDate();
    const byDay = new Map<string, RevenueItem[]>();
    for (const it of month.items) byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);

    const bySpace = new Map<string, { code: string; name: string; where: string; amount: number; bookings: number; days: number; brands: Set<string> }>();
    for (const it of month.items) {
      const info = targetInfo(it);
      const row = bySpace.get(it.targetId) ?? { ...info, amount: 0, bookings: 0, days: 0, brands: new Set<string>() };
      row.amount += it.amount;
      row.bookings += 1;
      row.days += it.days;
      row.brands.add(it.brand);
      bySpace.set(it.targetId, row);
    }
    const spaces = [...bySpace.values()].sort((a, b) => b.amount - a.amount);
    const peak = Math.max(1, ...[...byDay.values()].map((l) => l.reduce((n, i) => n + i.amount, 0)));
    return { first, firstDate, daysInMonth, byDay, spaces, peak };
  }, [month]);

  if (!month || !data) return null;

  const { firstDate, daysInMonth, byDay, spaces, peak } = data;
  const lead = firstDate.getDay();
  const cells: Array<string | null> = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(firstDate.getFullYear(), firstDate.getMonth(), i + 1))),
  ];
  const dayItems = day ? (byDay.get(day) ?? []) : [];
  const top = spaces[0]?.amount ?? 1;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`${monthName(firstDate.getMonth())} ${firstDate.getFullYear()} · ${naira(month.value)}`}
      subtitle={`${month.current ? 'Month to date' : 'Full month'} · excl. VAT · ${plural(spaces.length, 'space')} earned revenue from ${plural(month.items.length, 'booking')}`}
    >
      {month.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">No promotion revenue recorded for this month.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Calendar view */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-mute">Calendar view · earnings per day</h4>
            <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase text-ink-mute">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {cells.map((iso, i) => {
                if (!iso) return <span key={`b${i}`} />;
                const list = byDay.get(iso) ?? [];
                const sum = list.reduce((n, it) => n + it.amount, 0);
                const selected = day === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={!list.length}
                    onClick={() => setDay(selected ? null : iso)}
                    aria-pressed={selected}
                    aria-label={list.length ? `${fmtShort(iso)}: ${naira(sum)}` : `${fmtShort(iso)}: no revenue`}
                    className={cn(
                      'relative flex min-h-[62px] flex-col rounded-xl border p-1.5 text-left transition',
                      list.length ? 'cursor-pointer border-[#99d9d0] hover:border-[#0d9488]' : 'cursor-default border-line bg-sand-50/60',
                      selected && 'border-[#0f766e] ring-2 ring-[#14b8a6]/40',
                    )}
                    style={list.length ? { backgroundColor: `rgba(20,184,166,${0.1 + 0.4 * (sum / peak)})` } : undefined}
                  >
                    <span className={cn('text-[11px] font-bold', list.length ? 'text-ink' : 'text-ink-mute')}>{Number(iso.slice(8))}</span>
                    {list.length > 0 && (
                      <>
                        <span className="mt-auto text-[11px] font-extrabold leading-tight text-ink">{nairaCompact(sum)}</span>
                        <span className="truncate text-[9px] font-semibold leading-tight text-ink-soft">
                          {list.length === 1 ? targetInfo(list[0]).code : `${targetInfo(list[0]).code} +${list.length - 1}`}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-mute">
              {month.current
                ? 'Current-month revenue is counted on the day AICL-approved bookings were paid.'
                : 'Revenue is counted on the day each rental starts. Tap a day to see what earned it.'}
            </p>
          </div>

          {/* Breakdown */}
          <div>
            {day ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-mute">{fmtShort(day)} · bookings</h4>
                  <button type="button" onClick={() => setDay(null)} className="text-xs font-semibold text-brand-600 hover:underline">
                    Show all spaces
                  </button>
                </div>
                <ul className="mt-3 space-y-2">
                  {dayItems.map((it, i) => {
                    const info = targetInfo(it);
                    return (
                      <li key={i} className="rounded-xl border border-line p-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-mono text-[13px] font-bold text-ink">{info.code}</span>
                          <span className="font-extrabold text-ink">{naira(it.amount)}</span>
                        </div>
                        <p className="text-sm text-ink-soft">{info.name}</p>
                        <p className="mt-1 text-xs text-ink-mute">
                          {it.brand} · {fmtRange(it.startDate, it.endDate)} · {plural(it.days, 'day')}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-mute">Earned by space</h4>
                <ul className="mt-3 space-y-3">
                  {spaces.map((s) => (
                    <li key={s.code}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="font-mono text-[13px] font-bold text-ink">{s.code}</span>
                          <span className="ml-2 truncate text-ink-soft">{s.name}</span>
                        </span>
                        <span className="shrink-0 font-extrabold text-ink">{naira(s.amount)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand-200">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(3, (s.amount / top) * 100)}%` }} />
                      </div>
                      <p className="mt-0.5 text-xs text-ink-mute">
                        {Math.round((s.amount / month.value) * 100)}% of month · {plural(s.bookings, 'booking')} · {plural(s.days, 'day')} · {[...s.brands].slice(0, 2).join(', ')}
                        {s.brands.size > 2 ? ` +${s.brands.size - 2}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
