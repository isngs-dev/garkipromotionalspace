import { useNavigate } from 'react-router-dom';
import type { SpaceStatus } from '../../types';
import { STATUS } from '../../lib/status';
import { addDays, fmtLong, fromISO, todayISO, weekdayShort } from '../../lib/dates';
import { cn } from '../../lib/format';

export interface GridRow {
  id: string;
  label: string;
  sub: string;
  statusOn: (date: string) => SpaceStatus;
  textOn?: (date: string) => string;
  href?: (date: string) => string | null;
}

/** Spaces/zones × days heat-grid: the "calendar view" of availability. */
export function AvailabilityGrid({ rows, from, days = 28 }: { rows: GridRow[]; from: string; days?: number }) {
  const navigate = useNavigate();
  const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
  const today = todayISO();

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[180px] border-b border-line bg-sand-50 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-mute">
              Space
            </th>
            {dates.map((d) => {
              const day = fromISO(d);
              const isToday = d === today;
              const weekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <th
                  key={d}
                  className={cn(
                    'border-b border-line px-0 py-1.5 text-center font-semibold',
                    weekend ? 'bg-sand-100' : 'bg-sand-50',
                    isToday && 'bg-brand-100 text-brand-800',
                    day.getDate() === 1 && 'border-l border-line',
                  )}
                >
                  <div className="text-[10px] font-medium uppercase text-ink-mute">{weekdayShort(d).slice(0, 2)}</div>
                  <div className="text-[12px] text-ink">{day.getDate()}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="group">
              <th className="sticky left-0 z-10 border-b border-line bg-white px-3 py-1.5 text-left font-normal group-hover:bg-sand-50">
                <div className="font-mono text-[12px] font-bold text-ink">{r.label}</div>
                <div className="truncate text-[11px] text-ink-mute">{r.sub}</div>
              </th>
              {dates.map((d) => {
                const st = r.statusOn(d);
                const href = st === 'available' ? r.href?.(d) : null;
                const text = r.textOn?.(d);
                return (
                  <td key={d} className="border-b border-line p-[2px]">
                    <button
                      type="button"
                      disabled={!href}
                      onClick={() => href && navigate(href)}
                      title={`${r.label} · ${fmtLong(d)} · ${STATUS[st].label}${href ? ' — click to book' : ''}`}
                      className={cn(
                        'flex h-7 w-full min-w-[26px] items-center justify-center rounded-md text-[10px] font-bold ring-1 ring-inset ring-black/5 transition',
                        STATUS[st].dot,
                        st === 'pending' ? 'text-amber-950' : 'text-white',
                        href && 'cursor-pointer hover:scale-110 hover:shadow-md hover:ring-2 hover:ring-white',
                        !href && 'cursor-default',
                      )}
                      style={st === 'blocked' ? { backgroundImage: 'repeating-linear-gradient(45deg,#cbd5e1 0 3px,#e5e9ef 3px 6px)' } : undefined}
                    >
                      {text}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
