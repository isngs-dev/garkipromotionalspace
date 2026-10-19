import type { ReactNode } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/format';

/** A mock email, rendered like a message in an inbox. Used everywhere emails are "sent". */
export function EmailPreview({
  from,
  to,
  subject,
  time,
  children,
  tone = 'brand',
  className,
}: {
  from: string;
  to: string;
  subject: string;
  time?: string;
  children: ReactNode;
  tone?: 'brand' | 'good' | 'bad';
  className?: string;
}) {
  const bar = tone === 'good' ? 'bg-st-available' : tone === 'bad' ? 'bg-slate-500' : 'bg-brand-700';
  return (
    <article className={cn('overflow-hidden rounded-2xl border border-line bg-white shadow-card', className)}>
      <header className="border-b border-line bg-sand-50 px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
            <Mail className="h-3.5 w-3.5" />
            Simulated email
          </div>
          {time && <span className="text-xs text-ink-mute">{time}</span>}
        </div>
        <h4 className="mt-1.5 text-[15px] font-bold leading-snug text-ink">{subject}</h4>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-ink-soft">
          <dt className="font-semibold text-ink-mute">From</dt>
          <dd>{from}</dd>
          <dt className="font-semibold text-ink-mute">To</dt>
          <dd>{to}</dd>
        </dl>
      </header>
      <div className={cn('h-1', bar)} />
      <div className="space-y-3 px-5 py-5 text-sm leading-relaxed text-ink-soft">{children}</div>
      <footer className="flex items-center gap-2 border-t border-line px-5 py-3 text-[11px] text-ink-mute">
        <ShieldCheck className="h-3.5 w-3.5" />
        AICL · Garki Market Management · This is a demo message — no real email was sent.
      </footer>
    </article>
  );
}
