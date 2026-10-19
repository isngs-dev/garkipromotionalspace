import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/format';

export function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  label,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-line bg-white', className)} role="group" aria-label={label}>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-l-xl text-ink-soft hover:bg-sand-100 disabled:text-ink-mute/40 disabled:hover:bg-transparent"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-r-xl text-ink-soft hover:bg-sand-100 disabled:text-ink-mute/40 disabled:hover:bg-transparent"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
