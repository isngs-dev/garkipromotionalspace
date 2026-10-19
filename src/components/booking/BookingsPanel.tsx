import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, Search, Table2 } from 'lucide-react';
import type { Booking, SpaceStatus } from '../../types';
import { SPACES, ZONES } from '../../data/spaces';
import { spaceStatusOn, zoneStatusOn, zoneUsageOn } from '../../lib/availability';
import { fmtRange, fmtTimeRange, todayISO } from '../../lib/dates';
import { cn } from '../../lib/format';
import { targetShort } from '../../lib/passes';
import { AvailabilityGrid, type GridRow } from './AvailabilityGrid';
import { Legend, StatusPill } from '../ui/StatusPill';

type View = 'table' | 'calendar';

/** Public view of a booking's inventory status (matches the map colours). */
const publicStatus = (b: Booking): SpaceStatus => (b.status === 'approved' ? 'booked' : 'pending');

export function BookingsPanel({ mode, bookings, from }: { mode: 'space' | 'mobile'; bookings: Booking[]; from: string }) {
  const [view, setView] = useState<View>('table');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'booked' | 'pending'>('all');
  const [showAll, setShowAll] = useState(false);
  const today = todayISO();

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bookings
      .filter((b) => b.type === mode && b.status !== 'rejected' && b.endDate >= today)
      .filter((b) => (filter === 'all' ? true : filter === 'booked' ? b.status === 'approved' : b.status !== 'approved'))
      .filter(
        (b) =>
          !needle ||
          b.company.toLowerCase().includes(needle) ||
          targetShort(b).toLowerCase().includes(needle) ||
          b.activity.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.ref.localeCompare(b.ref));
  }, [bookings, mode, q, filter, today]);

  const gridRows: GridRow[] = useMemo(
    () =>
      mode === 'space'
        ? SPACES.map((s) => ({
            id: s.id,
            label: s.id,
            sub: s.location,
            statusOn: (d: string) => spaceStatusOn(s, bookings, d),
            href: (d: string) => `/spaces/${s.id}?date=${d}`,
          }))
        : ZONES.map((z) => ({
            id: z.id,
            label: `Zone ${z.code}`,
            sub: z.name,
            statusOn: (d: string) => zoneStatusOn(z, bookings, d),
            textOn: (d: string) => (z.blocked ? '' : String(zoneUsageOn(z, bookings, d).remaining)),
          })),
    [mode, bookings],
  );

  const visible = showAll ? rows : rows.slice(0, 8);

  return (
    <section className="rounded-2xl border border-line bg-white shadow-card" aria-labelledby="bookings-h">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 id="bookings-h" className="text-lg font-bold text-ink">
            Existing bookings &amp; availability
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            See who is promoting in the market and which dates are still open for {mode === 'space' ? 'spaces' : 'mobile promoters'}.
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-sand-100 p-1" role="tablist" aria-label="View">
          {(
            [
              ['table', 'Table', Table2],
              ['calendar', 'Calendar view', CalendarRange],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                view === id ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        <div className="px-5 py-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search brand, space or activity"
                className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
            <div className="flex gap-1.5">
              {(
                [
                  ['all', 'All'],
                  ['booked', 'Booked'],
                  ['pending', 'Pending'],
                ] as const
              ).map(([id, l]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-[13px] font-semibold ring-1 ring-inset transition',
                    filter === id ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-ink-soft ring-line hover:ring-brand-300',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className="ml-auto text-sm text-ink-mute">{rows.length} upcoming</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-sand-50 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                <tr>
                  <th className="px-4 py-3">{mode === 'space' ? 'Space ID' : 'Zone'}</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Activity type</th>
                  <th className="px-4 py-3">Booking dates</th>
                  <th className="px-4 py-3">Time</th>
                  {mode === 'mobile' && <th className="px-4 py-3">Promoters</th>}
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((b) => (
                  <tr key={b.ref} className="hover:bg-sand-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-bold">
                      {b.type === 'space' ? (
                        <Link to={`/spaces/${b.targetId}`} className="text-brand-700 hover:underline">
                          {b.targetId}
                        </Link>
                      ) : (
                        targetShort(b)
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">{b.company}</td>
                    <td className="px-4 py-3 text-ink-soft">{b.activity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{fmtRange(b.startDate, b.endDate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{fmtTimeRange(b.startTime, b.endTime)}</td>
                    {mode === 'mobile' && <td className="px-4 py-3 text-ink-soft">{b.promoters.length}</td>}
                    <td className="px-4 py-3">
                      <StatusPill status={publicStatus(b)} size="sm" />
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-mute">
                      No bookings match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length > 8 && (
            <button onClick={() => setShowAll((s) => !s)} className="mt-3 text-sm font-semibold text-brand-600 hover:underline">
              {showAll ? 'Show fewer' : `Show all ${rows.length} bookings`}
            </button>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 sm:px-6">
          <AvailabilityGrid rows={gridRows} from={from} days={28} />
          <p className="mt-3 text-xs text-ink-mute">
            {mode === 'space'
              ? 'Click any green cell to open that space on that date. '
              : 'Numbers show promoter slots still free that day. '}
            Showing the next 28 days from {fmtRange(from, from)}.
          </p>
        </div>
      )}
      <div className="border-t border-line bg-sand-50/60 px-5 py-3 sm:px-6">
        <Legend />
      </div>
    </section>
  );
}
