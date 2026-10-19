import type { ReactNode } from 'react';
import { BadgeCheck, CalendarDays, Clock, MapPin, Megaphone, Phone, UserRound } from 'lucide-react';
import type { Pass } from '../../types';
import { QR } from './QR';
import { fmtRange, fmtTimeRange } from '../../lib/dates';
import { MARKET } from '../../data/images';
import { cn } from '../../lib/format';

function Field({ icon: Icon, label, children, className }: { icon: typeof MapPin; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-mute">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-0.5 text-[13px] font-bold leading-snug text-ink">{children}</p>
    </div>
  );
}

/** Event-style digital pass — one per promoter. */
export function PassCard({ pass, actions, className, state }: { pass: Pass; actions?: ReactNode; className?: string; state?: 'valid' | 'expired' }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <article
        className="relative overflow-hidden rounded-[26px] border border-line bg-white shadow-card"
        aria-label={`Digital pass for ${pass.holder}`}
      >
        {/* header */}
        <header className="relative overflow-hidden bg-brand-800 px-5 pb-8 pt-5 text-white">
          <div
            className="absolute inset-0 opacity-25 mix-blend-luminosity"
            style={{ backgroundImage: `url(${MARKET.shops})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-brand-800/85 to-brand-600/80" aria-hidden />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200">Garki Market</p>
              <p className="font-display text-xl font-semibold leading-tight">Promotion Pass</p>
            </div>
            <span className="rounded-full bg-accent-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
              {pass.type === 'space' ? 'Space' : 'Mobile'}
            </span>
          </div>
          {state && (
            <span
              className={cn(
                'absolute right-5 top-14 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
                state === 'valid' ? 'bg-st-available text-white' : 'bg-st-booked text-white',
              )}
            >
              {state === 'valid' ? 'Valid today' : 'Expired'}
            </span>
          )}
        </header>

        {/* body */}
        <div className="-mt-4 rounded-t-[22px] bg-white px-5 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">Company / Brand</p>
          <h3 className="text-[19px] font-extrabold leading-tight tracking-tight text-ink">{pass.company}</h3>
          <p className="mt-0.5 truncate text-xs text-ink-soft">{pass.product}</p>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sand-100 px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">Representative</p>
              <p className="truncate text-[15px] font-extrabold text-ink">{pass.holder}</p>
              <p className="flex items-center gap-1 text-xs font-medium text-ink-soft">
                <Phone className="h-3 w-3" /> {pass.mobile}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Field icon={MapPin} label={pass.type === 'space' ? 'Space ID' : 'Zone'}>
              <span className={pass.type === 'space' ? 'font-mono' : ''}>{pass.targetLabel}</span>
            </Field>
            <Field icon={Megaphone} label="Promotion type">
              {pass.typeLabel}
            </Field>
            <Field icon={CalendarDays} label="Valid date">
              {fmtRange(pass.startDate, pass.endDate)}
            </Field>
            <Field icon={Clock} label="Valid time">
              {fmtTimeRange(pass.startTime, pass.endTime)}
            </Field>
          </div>
        </div>

        {/* perforation */}
        <div className="relative my-5" aria-hidden>
          <div className="mx-5 border-t-2 border-dashed border-line" />
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-sand-50" />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-sand-50" />
        </div>

        {/* stub */}
        <div className="flex flex-col items-center px-5 pb-5">
          <div className="rounded-2xl border border-line bg-white p-2.5 shadow-sm">
            <QR value={pass.qr} size={150} />
          </div>
          <p className="mt-3 font-mono text-[13px] font-bold tracking-wider text-ink">{pass.id}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-ink-mute">
            <BadgeCheck className="h-3.5 w-3.5 text-brand-600" /> Authorised by AICL · scan at the gate
          </p>
        </div>
      </article>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
