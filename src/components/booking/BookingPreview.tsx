import type { ReactNode } from 'react';
import { CalendarDays, Clock, Footprints, Megaphone, Route, Ruler, Ticket, Wallet } from 'lucide-react';
import type { Booking } from '../../types';
import { spaceById, zoneById } from '../../data/spaces';
import { slotById } from '../../data/constants';
import { useStore } from '../../store/StoreProvider';
import { MarketMap } from '../map/MarketMap';
import { SpaceLayoutDiagram } from './SpaceLayoutDiagram';
import { BookingStatusPill } from '../ui/StatusPill';
import { Photo } from '../ui/Photo';
import { fmtRange, fmtTimeRange } from '../../lib/dates';
import { naira, num, plural } from '../../lib/format';

function Tile({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-2.5">
        <h3 className="text-[13px] font-bold text-ink">{title}</h3>
        {caption && <p className="text-[11px] text-ink-mute">{caption}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Fact({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{label}</dt>
        <dd className="text-sm font-bold leading-snug text-ink">{children}</dd>
      </div>
    </div>
  );
}

/**
 * "What you booked" at a glance — the space (or zone) photo, where it sits on the market map,
 * its layout, and the booked dates / time / price. Shown on the request confirmation.
 */
export function BookingPreview({ b }: { b: Booking }) {
  const { bookings } = useStore();
  const space = b.type === 'space' ? spaceById(b.targetId) : undefined;
  const zone = b.type === 'mobile' ? zoneById(b.targetId) : undefined;
  if (!space && !zone) return null;
  const slot = slotById(b.slot);

  return (
    <section aria-labelledby="preview-h">
      <div className="mb-4">
        <h2 id="preview-h" className="text-lg font-bold text-ink">
          Your booking preview
        </h2>
        <p className="text-sm text-ink-soft">
          The {space ? 'space' : 'zone'} you've requested — how it looks, where it sits in the market and what you've booked.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Photo */}
        <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-line">
          <div className="absolute inset-0">
            <Photo src={space?.images[0] ?? zone?.image} alt={space ? `${space.id} — ${space.location}` : `Zone ${zone!.code}`} className="h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/10 to-transparent" />
          <div className="absolute left-3 top-3">
            <BookingStatusPill status={b.status} size="sm" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="font-mono text-xl font-extrabold tracking-tight">{space ? space.id : `Zone ${zone!.code}`}</p>
            <p className="text-sm font-semibold">{space ? space.name : zone!.name}</p>
            <p className="text-xs text-brand-100">{space ? space.location : zone!.route}</p>
          </div>
        </div>

        {/* Where it sits */}
        <Tile title="Position in the market" caption="Highlighted in blue · colours show live status">
          <div className="bg-[#e8f0f7] p-1.5">
            <MarketMap
              mini
              mode={space ? 'space' : 'mobile'}
              date={b.startDate}
              endDate={b.endDate}
              bookings={bookings}
              highlightId={space?.id}
              highlightZoneId={zone?.id}
            />
          </div>
        </Tile>

        {/* Layout / route */}
        {space ? (
          <Tile title="Space layout" caption={`${space.widthFt} × ${space.depthFt} ft · ${num(space.areaSqFt)} sq ft`}>
            <div className="p-2">
              <SpaceLayoutDiagram space={space} />
            </div>
          </Tile>
        ) : (
          <Tile title="Roaming route" caption={`Zone ${zone!.code} · up to ${zone!.capacity} promoters a day`}>
            <div className="space-y-3 p-4 text-sm">
              <p className="flex items-start gap-2 font-semibold text-ink">
                <Route className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {zone!.route}
              </p>
              <p className="leading-relaxed text-ink-soft">{zone!.description}</p>
              <p className="rounded-xl bg-sand-100 px-3 py-2 text-xs text-ink-soft">
                {naira(b.unitPrice)} per promoter per day · roaming only, no fixed stands or loudspeakers.
              </p>
            </div>
          </Tile>
        )}
      </div>

      {/* What you booked */}
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 rounded-2xl bg-sand-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Fact icon={CalendarDays} label="Dates">
          {fmtRange(b.startDate, b.endDate)}
          <span className="block text-xs font-medium text-ink-mute">{plural(b.days, 'day')}</span>
        </Fact>
        <Fact icon={Clock} label={space ? 'Time window' : 'Roaming hours'}>
          {fmtTimeRange(b.startTime, b.endTime)}
          <span className="block text-xs font-medium text-ink-mute">{slot.label}</span>
        </Fact>
        {space ? (
          <Fact icon={Ruler} label="Size">
            {num(space.areaSqFt)} sq ft
            <span className="block text-xs font-medium text-ink-mute">
              {space.widthFt} × {space.depthFt} ft · {space.footfall} footfall
            </span>
          </Fact>
        ) : (
          <Fact icon={Footprints} label="Promoters">
            {plural(b.promoters.length, 'roaming promoter')}
            <span className="block text-xs font-medium text-ink-mute">{naira(b.unitPrice)} each per day</span>
          </Fact>
        )}
        <Fact icon={Wallet} label="Total (incl. 7.5% VAT)">
          {naira(b.total)}
          <span className="block text-xs font-medium text-ink-mute">
            {naira(b.subtotal)} + {naira(b.vat)} VAT
          </span>
        </Fact>
        <Fact icon={Megaphone} label="Activity">
          {b.activity}
          <span className="block text-xs font-medium text-ink-mute">{b.product}</span>
        </Fact>
        <Fact icon={Ticket} label="Passes (after approval)">
          {plural(b.promoters.length, 'pass', 'passes')}
          <span className="block truncate text-xs font-medium text-ink-mute">{b.promoters.map((p) => p.name.split(' ')[0]).join(', ')}</span>
        </Fact>
      </dl>
    </section>
  );
}
