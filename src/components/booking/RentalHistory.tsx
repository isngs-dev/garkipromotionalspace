import { useMemo } from 'react';
import type { HistoryEntry } from '../../types';
import { addDays, diffDays, fmtRange, todayISO } from '../../lib/dates';
import { naira } from '../../lib/format';
import { EmptyState } from '../ui/misc';
import { History } from 'lucide-react';

/** Previous three months of rentals for a space: summary tiles, a 30-day-period bar chart and a table. */
export function RentalHistory({ entries, emptyReason }: { entries: HistoryEntry[]; emptyReason?: string }) {
  const today = todayISO();
  const sorted = useMemo(() => [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate)), [entries]);

  const periods = useMemo(() => {
    // three 30-day windows ending today: [-90,-61], [-60,-31], [-30,-1]
    return [0, 1, 2].map((i) => {
      const from = addDays(today, -90 + i * 30);
      const to = addDays(from, 29);
      let days = 0;
      for (const e of entries) {
        const a = e.startDate > from ? e.startDate : from;
        const b = e.endDate < to ? e.endDate : to;
        if (a <= b) days += diffDays(a, b) + 1;
      }
      return { from, to, days };
    });
  }, [entries, today]);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6" />}
        title="No rental history"
        body={emptyReason ?? 'This space has not been rented in the last three months.'}
      />
    );
  }

  const totalDays = entries.reduce((n, e) => n + e.days, 0);
  const revenue = entries.reduce((n, e) => n + e.days * e.rate, 0);
  const max = Math.max(30, ...periods.map((p) => p.days));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <div className="space-y-4">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-xl bg-sand-100 px-3.5 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Rentals</dt>
            <dd className="text-xl font-extrabold text-ink">{entries.length}</dd>
          </div>
          <div className="rounded-xl bg-sand-100 px-3.5 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Days booked</dt>
            <dd className="text-xl font-extrabold text-ink">
              {totalDays} <span className="text-sm font-semibold text-ink-mute">/ 90 · {Math.round((totalDays / 90) * 100)}%</span>
            </dd>
          </div>
          <div className="rounded-xl bg-sand-100 px-3.5 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Revenue</dt>
            <dd className="text-xl font-extrabold text-ink">{naira(revenue)}</dd>
          </div>
        </dl>

        <figure>
          <svg viewBox="0 0 240 130" className="w-full" role="img" aria-label="Days booked per 30-day period">
            {periods.map((p, i) => {
              const bh = (p.days / max) * 80;
              const x = 20 + i * 76;
              return (
                <g key={p.from}>
                  <rect x={x} y={92 - bh} width="52" height={bh} rx="6" fill={i === 2 ? '#3b82f6' : '#93c5fd'} />
                  <text x={x + 26} y={86 - bh} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f1f3d">
                    {p.days}d
                  </text>
                  <text x={x + 26} y={108} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#64748b">
                    {i === 2 ? 'Last 30 days' : i === 1 ? '31 – 60 days ago' : '61 – 90 days ago'}
                  </text>
                </g>
              );
            })}
            <line x1="10" y1="92" x2="230" y2="92" stroke="#e2e8f0" />
          </svg>
          <figcaption className="text-center text-[11px] text-ink-mute">Days booked per 30-day period</figcaption>
        </figure>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-sand-50 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3 text-right">Rate / day</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.slice(0, 9).map((e, i) => (
              <tr key={i} className="hover:bg-sand-50/70">
                <td className="px-4 py-2.5 font-semibold text-ink">{e.brand}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{fmtRange(e.startDate, e.endDate)}</td>
                <td className="px-4 py-2.5 text-ink-soft">
                  {e.days} day{e.days === 1 ? '' : 's'}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-ink">{naira(e.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 9 && <p className="border-t border-line bg-sand-50 px-4 py-2 text-xs text-ink-mute">Showing the 9 most recent of {sorted.length} rentals.</p>}
      </div>
    </div>
  );
}
