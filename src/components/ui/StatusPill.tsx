import type { BookingStatus, SpaceStatus } from '../../types';
import { BOOKING_STATUS, STATUS, STATUS_ORDER } from '../../lib/status';
import { cn } from '../../lib/format';

export function StatusPill({
  status,
  label,
  size = 'md',
  className,
}: {
  status: SpaceStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const m = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        m.pill,
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', m.dot)} />
      {label ?? m.label}
    </span>
  );
}

export function BookingStatusPill({
  status,
  size = 'md',
  className,
}: {
  status: BookingStatus;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const m = BOOKING_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        m.pill,
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

/** The status legend — shown beside every map / calendar. */
export function Legend({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-soft', className)}
      role="list"
      aria-label="Status legend"
    >
      {!compact && <span className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Legend</span>}
      {STATUS_ORDER.map((s) => (
        <span key={s} role="listitem" className="inline-flex items-center gap-2">
          <span
            className={cn('h-3.5 w-3.5 rounded-[5px] ring-1 ring-inset ring-black/10', STATUS[s].dot)}
            style={s === 'blocked' ? { backgroundImage: 'repeating-linear-gradient(45deg,#cbd5e1 0 3px,#e2e8f0 3px 6px)' } : undefined}
          />
          <span className="font-medium text-ink">{STATUS[s].label}</span>
        </span>
      ))}
    </div>
  );
}
