import { Check } from 'lucide-react';
import type { Booking } from '../../types';
import { cn } from '../../lib/format';

export const JOURNEY = ['Select Space', 'Details', 'Request', 'Payment', 'Approval', 'Pass'] as const;

/** Which journey step a booking is currently on (0-based): Request → Payment → Approval → Pass. */
export function stepForBooking(b: Pick<Booking, 'status'>): number {
  switch (b.status) {
    case 'awaiting_payment':
      return 3; // payment due
    case 'in_review':
      return 4; // paid, waiting for AICL
    case 'rejected':
      return 4; // AICL said no
    case 'approved':
      return 5; // pass issued
  }
}

/** current: 0-based index of the active step. `completeAll` renders every step as done. */
export function JourneySteps({
  current,
  completeAll,
  rejected,
  mobileLabel = 'Select Zone',
  type = 'space',
  className,
}: {
  current: number;
  completeAll?: boolean;
  rejected?: boolean;
  type?: 'space' | 'mobile';
  mobileLabel?: string;
  className?: string;
}) {
  const labels = JOURNEY.map((l, i) => (i === 0 && type === 'mobile' ? mobileLabel : l));
  return (
    <nav aria-label="Booking journey" className={cn('w-full', className)}>
      <ol className="flex items-start">
        {labels.map((label, i) => {
          const done = completeAll || i < current;
          const active = !completeAll && i === current;
          const bad = active && rejected;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && (
                <span
                  className={cn(
                    'absolute left-[-50%] right-[50%] top-[15px] h-[3px] rounded-full',
                    done || active ? 'bg-brand-600' : 'bg-line',
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ring-4 ring-sand-50 transition-colors',
                  done && 'bg-brand-600 text-white',
                  active && !bad && 'bg-accent-500 text-white shadow-md shadow-accent-500/40',
                  bad && 'bg-slate-500 text-white',
                  !done && !active && 'bg-white text-ink-mute ring-1 ring-inset ring-line',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  'mt-2 px-1 text-[11px] font-semibold leading-tight sm:text-xs',
                  active ? 'text-ink' : done ? 'text-brand-700' : 'text-ink-mute',
                  !active && 'hidden sm:block',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
