import type { ReactNode } from 'react';
import { CalendarDays, Clock, Sparkles } from 'lucide-react';
import { cn, naira, plural, priceBreakdown } from '../../lib/format';
import { daysInRange, fmtLong, fmtRange, fmtTimeRange } from '../../lib/dates';

/** Reusable price + dates summary. Used on the details page, booking form and payment page. */
export function PriceLines({
  unitLabel,
  unitPrice,
  days,
  quantity = 1,
  quantityLabel = 'promoter',
  note,
  className,
}: {
  unitLabel?: string;
  unitPrice: number;
  days: number;
  quantity?: number;
  quantityLabel?: string;
  /** e.g. "Peak hours 11:00am – 4:00pm · peak hours count 1.5×" */
  note?: string;
  className?: string;
}) {
  const pb = priceBreakdown(unitPrice, days, quantity);
  return (
    <div className={className}>
    {note && <p className="mb-2 rounded-lg bg-brand-50 px-3 py-1.5 text-[12px] font-medium leading-snug text-brand-800">{note}</p>}
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-4 text-ink-soft">
        <dt>
          {naira(unitPrice)}
          {quantity > 1 || unitLabel ? ` × ${plural(quantity, quantityLabel)}` : ''} × {plural(days, 'day')}
        </dt>
        <dd className="shrink-0 font-semibold text-ink">{naira(pb.subtotal)}</dd>
      </div>
      <div className="flex justify-between text-ink-soft">
        <dt>VAT (7.5%)</dt>
        <dd className="font-semibold text-ink">{naira(pb.vat)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-3 text-ink">
        <dt className="text-sm font-bold">Total</dt>
        <dd className="text-2xl font-extrabold tracking-tight">{naira(pb.total)}</dd>
      </div>
    </dl>
    </div>
  );
}

export function SelectionRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{label}</p>
        <div className="text-sm font-semibold text-ink">{children}</div>
      </div>
    </div>
  );
}

export function SelectedDates({ start, end, startTime, endTime }: { start: string | null; end: string | null; startTime: string; endTime: string }) {
  if (!start || !end) {
    return <p className="rounded-xl border border-dashed border-line bg-sand-50 px-4 py-4 text-sm text-ink-mute">Select your dates on the calendar to see the price.</p>;
  }
  return (
    <div className="space-y-3.5">
      <SelectionRow icon={<CalendarDays className="h-4 w-4" />} label="Selected dates">
        {fmtRange(start, end)}
        <span className="block text-xs font-medium text-ink-mute">
          {start === end ? fmtLong(start) : `${plural(daysInRange(start, end), 'day')}`}
        </span>
      </SelectionRow>
      <SelectionRow icon={<Clock className="h-4 w-4" />} label="Activation window">
        {fmtTimeRange(startTime, endTime)}
      </SelectionRow>
    </div>
  );
}

export function ComingSoonNote({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-start gap-2 text-xs leading-snug text-ink-mute', className)}>
      <Sparkles className="mt-px h-3.5 w-3.5 shrink-0 text-accent-500" />
      Weekly / monthly packages and volume discounts coming soon.
    </p>
  );
}
