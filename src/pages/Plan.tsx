import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Footprints, Info, LayoutGrid, Store } from 'lucide-react';
import type { MobileZone, Space, SpaceStatus, TimeSlotId } from '../types';
import { SPACES, ZONES } from '../data/spaces';
import { useStore } from '../store/StoreProvider';
import { MarketMap } from '../components/map/MarketMap';
import { MapFilters, SIZE_OPTIONS, type SizeFilter } from '../components/map/MapFilters';
import { BookingsPanel } from '../components/booking/BookingsPanel';
import { JourneySteps } from '../components/ui/JourneySteps';
import { Legend, StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Stepper } from '../components/ui/Stepper';
import { Card, Container, PageHeader } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import {
  nextAvailableDate,
  spaceStatusOverRange,
  zoneRemainingForRange,
  zoneStatusOverRange,
} from '../lib/availability';
import { addDays, daysInRange, fmtRange, fmtShort, fmtTimeRange, todayISO } from '../lib/dates';
import { MAX_BOOKING_DAYS, TIME_SLOTS, slotById } from '../data/constants';
import { spaceDayPrice, zoneDayPrice } from '../lib/pricing';
import { cn, naira, num, plural, priceBreakdown } from '../lib/format';
import { STATUS, STATUS_ORDER } from '../lib/status';

const TYPE_CARDS = [
  {
    id: 'space' as const,
    icon: Store,
    title: 'Rent a Promotional Space',
    body: 'A fixed location for your booth, kiosk, display, demo or sampling.',
  },
  {
    id: 'mobile' as const,
    icon: Footprints,
    title: 'Mobile Promotion',
    body: 'Promoters move around designated zones handing out flyers and samples. No fixed space.',
  },
];

export default function Plan() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookings, setDraft } = useStore();
  const today = todayISO();

  const type: 'space' | 'mobile' = params.get('type') === 'mobile' ? 'mobile' : 'space';
  // The period + time window chosen here travel with the user: map -> space page -> booking request.
  const dateParam = params.get('date');
  const startInit = dateParam && dateParam >= today ? dateParam : today;
  const toParam = params.get('to');
  const toInit = toParam && toParam >= startInit && toParam <= addDays(startInit, MAX_BOOKING_DAYS - 1) ? toParam : startInit;
  const slotParam = params.get('slot');
  const slotInit: TimeSlotId = TIME_SLOTS.some((t) => t.id === slotParam) ? (slotParam as TimeSlotId) : 'full';
  const zoneParam = params.get('zone');

  const [date, setDateRaw] = useState(startInit);
  const [toDate, setToDate] = useState(toInit);
  const [slot, setSlot] = useState<TimeSlotId>(slotInit);
  const [status, setStatus] = useState<SpaceStatus | 'all'>('all');
  const [size, setSize] = useState<SizeFilter>('any');

  const [zoneId, setZoneId] = useState<string>(ZONES.some((z) => z.id === zoneParam) ? (zoneParam as string) : 'zone-a');
  const [promoters, setPromoters] = useState(Math.max(1, Number(params.get('promoters')) || 2));

  const setDate = (d: string) => {
    setDateRaw(d);
    setToDate((prev) => (prev < d ? d : prev > addDays(d, MAX_BOOKING_DAYS - 1) ? addDays(d, MAX_BOOKING_DAYS - 1) : prev));
  };
  const days = daysInRange(date, toDate);
  const slotInfo = slotById(slot);
  const periodShort = date === toDate ? fmtShort(date) : `${fmtShort(date)} – ${fmtShort(toDate)}`;
  const periodLong = fmtRange(date, toDate);
  const spaceHref = (id: string) => `/spaces/${id}?date=${date}&to=${toDate}&slot=${slot}`;

  const setType = (t: 'space' | 'mobile') => {
    const next = new URLSearchParams(params);
    next.set('type', t);
    setParams(next, { replace: true });
  };

  const sizeTest = SIZE_OPTIONS.find((o) => o.id === size)!.test;
  const matches = useMemo(
    () => (s: Space, st: SpaceStatus) =>
      (status === 'all' || st === status) && sizeTest(s.areaSqFt),
    [status, sizeTest],
  );

  const spaceRows = useMemo(
    () => SPACES.map((s) => ({ space: s, status: spaceStatusOverRange(s, bookings, date, toDate) })),
    [bookings, date, toDate],
  );
  const counts = useMemo(() => {
    const c: Record<SpaceStatus, number> = { available: 0, booked: 0, pending: 0, blocked: 0 };
    for (const r of spaceRows) c[r.status]++;
    return c;
  }, [spaceRows]);
  const matching = spaceRows.filter((r) => matches(r.space, r.status));
  const openMatches = matching.filter((r) => r.status === 'available').sort((a, b) => spaceDayPrice(a.space, slot) - spaceDayPrice(b.space, slot));

  // ---- mobile quote
  const zone = ZONES.find((z) => z.id === zoneId)!;
  const zoneSt = zoneStatusOverRange(zone, bookings, date, toDate);
  const slotsFree = zoneRemainingForRange(zone, bookings, date, toDate);
  const maxPromoters = Math.max(1, Math.min(slotsFree, zone.capacity));
  useEffect(() => {
    if (promoters > maxPromoters) setPromoters(maxPromoters);
  }, [maxPromoters, promoters]);
  const unitPrice = zoneDayPrice(zone, slot);
  const quote = priceBreakdown(unitPrice, days, promoters);
  const canRequest = !zone.blocked && slotsFree > 0;

  const requestMobile = () => {
    setDraft({
      type: 'mobile',
      targetId: zone.id,
      startDate: date,
      endDate: toDate,
      slot,
      startTime: slotInfo.start,
      endTime: slotInfo.end,
      promoterCount: promoters,
    });
    navigate('/book');
  };

  const resetFilters = () => {
    setStatus('all');
    setSize('any');
    setDateRaw(today);
    setToDate(today);
    setSlot('full');
  };

  const onUnavailable = (s: Space, st: SpaceStatus) => {
    const next = nextAvailableDate(s, bookings, date);
    toast({
      kind: 'warning',
      title: `${s.id} is ${STATUS[st].label.toLowerCase()} ${date === toDate ? 'on' : 'for part of'} ${periodShort}`,
      body:
        st === 'blocked'
          ? s.blocked?.reason
          : next
            ? `Next available: ${fmtShort(next)}. Pick a green space or change your dates.`
            : 'Pick a green space or change your dates.',
    });
  };

  return (
    <>
      <PageHeader
        title="Plan Your Promotion"
        lead="Choose how you want to reach Garki Market's shoppers, check live availability on the floor plan, then send a request to AICL."
      >
        <JourneySteps current={0} type={type} mobileLabel="Select Zone" />
      </PageHeader>

      <Container className="space-y-6 py-8">
        {/* Promotion type toggle */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="tablist" aria-label="Promotion type">
          {TYPE_CARDS.map((t) => {
            const active = type === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setType(t.id)}
                className={cn(
                  'flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all',
                  active ? 'border-brand-600 bg-brand-50 shadow-card' : 'border-line bg-white hover:border-brand-300',
                )}
              >
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                    active ? 'bg-brand-700 text-white' : 'bg-sand-100 text-ink-soft',
                  )}
                >
                  <t.icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-bold text-ink">
                    {t.id === 'space' ? 'A · ' : 'B · '}
                    {t.title}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">{t.body}</span>
                </span>
              </button>
            );
          })}
        </div>

        <MapFilters
          mode={type}
          date={date}
          onDate={setDate}
          toDate={toDate}
          onToDate={setToDate}
          slot={slot}
          onSlot={setSlot}
          status={status}
          onStatus={setStatus}
          size={size}
          onSize={setSize}
          onReset={resetFilters}
        />

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* MAP */}
          <Card className="overflow-hidden xl:sticky xl:top-24">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-base font-bold text-ink">
                  {type === 'space' ? 'Promotional spaces' : 'Mobile promotion zones'} · {periodLong}
                </h2>
                <p className="text-xs text-ink-mute">
                  {type === 'space'
                    ? `${slotInfo.label} ${fmtTimeRange(slotInfo.start, slotInfo.end)} · hover a space for details, click a green space to view and book.`
                    : `${slotInfo.label} ${fmtTimeRange(slotInfo.start, slotInfo.end)} · hover a zone for pricing and open slots, click a zone to select it.`}
                </p>
              </div>
              {type === 'space' && (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
                  {matching.length} of {SPACES.length} spaces match
                </span>
              )}
            </div>
            <div className="bg-[#e8f0f7] p-2 sm:p-4">
              <MarketMap
                mode={type}
                date={date}
                endDate={toDate}
                slot={slot}
                bookings={bookings}
                matches={type === 'space' ? matches : undefined}
                selectedZoneId={zoneId}
                onSelectZone={(z: MobileZone) => setZoneId(z.id)}
                onSpaceClick={(s) => navigate(spaceHref(s.id))}
                onUnavailableClick={onUnavailable}
                className="mx-auto max-w-[1100px]"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-5 py-3.5">
              <Legend />
              <p className="flex items-center gap-1.5 text-xs text-ink-mute">
                <Info className="h-3.5 w-3.5" /> Grey blocks are shop units and cannot be booked.
              </p>
            </div>
          </Card>

          {/* SIDE PANEL */}
          <aside className="space-y-6">
            {type === 'space' ? (
              <>
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-ink">Availability · {periodShort}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus((cur) => (cur === s ? 'all' : s))}
                        aria-pressed={status === s}
                        className={cn(
                          'rounded-xl p-3 text-left ring-1 ring-inset transition',
                          STATUS[s].pill,
                          status === s ? 'ring-2 ring-offset-1' : 'hover:brightness-95',
                        )}
                      >
                        <span className="block text-2xl font-extrabold tabular-nums">{counts[s]}</span>
                        <span className="text-xs font-semibold">{STATUS[s].label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-ink-mute">Tap a tile to filter the map by that status.</p>
                </Card>

                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <h3 className="text-sm font-bold text-ink">Open spaces · {periodShort}</h3>
                    <span className="text-xs font-semibold text-ink-mute">{openMatches.length}</span>
                  </div>
                  <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
                    {openMatches.length === 0 && (
                      <li className="px-5 py-8 text-center text-sm text-ink-mute">
                        No available spaces match these filters.
                      </li>
                    )}
                    {openMatches.map(({ space }) => (
                      <li key={space.id}>
                        <Link
                          to={spaceHref(space.id)}
                          className="group flex items-center gap-3 px-5 py-3 transition hover:bg-sand-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-st-available text-[13px] font-extrabold text-white">
                            {space.id.slice(-2)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">{space.location}</span>
                            <span className="block text-xs text-ink-mute">
                              {space.id} · {num(space.areaSqFt)} sq ft
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-sm font-bold text-ink">{naira(spaceDayPrice(space, slot))}</span>
                            <span className="block text-[11px] text-ink-mute">per day</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="border-b border-line px-5 py-3.5">
                    <h3 className="text-sm font-bold text-ink">Designated zones</h3>
                    <p className="text-xs text-ink-mute">Priced per promoter per day.</p>
                  </div>
                  <ul className="divide-y divide-line">
                    {ZONES.map((z) => {
                      const st = zoneStatusOverRange(z, bookings, date, toDate);
                      const free = zoneRemainingForRange(z, bookings, date, toDate);
                      const sel = z.id === zoneId;
                      return (
                        <li key={z.id}>
                          <button
                            onClick={() => setZoneId(z.id)}
                            className={cn('flex w-full items-center gap-3 px-5 py-3.5 text-left transition', sel ? 'bg-brand-50' : 'hover:bg-sand-50')}
                          >
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-extrabold ring-1 ring-inset ring-black/10"
                              style={{ background: st === 'blocked' ? '#e2e8f0' : STATUS[st].fill, color: STATUS[st].ink }}
                            >
                              {z.code}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">{z.name}</span>
                              <span className="mt-0.5 block text-xs text-ink-mute">
                                {z.blocked ? 'Not permitted' : `${free} of ${z.capacity} slots free`}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block text-sm font-bold text-ink">{naira(zoneDayPrice(z, slot))}</span>
                              <StatusPill status={st} size="sm" className="mt-1" />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>

                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Your mobile promotion</p>
                      <h3 className="mt-1 text-base font-bold text-ink">
                        Zone {zone.code} · {zone.name}
                      </h3>
                    </div>
                    <StatusPill status={zoneSt} size="sm" />
                  </div>
                  <p className="mt-2 text-sm leading-snug text-ink-soft">{zone.description}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-mute">Route: {zone.route}</p>

                  {zone.blocked ? (
                    <div className="mt-4 rounded-xl bg-st-blocked-soft px-4 py-3 text-sm text-st-blocked-ink">{zone.blocked.reason}</div>
                  ) : (
                    <>
                      <div className="mt-4 rounded-xl bg-sand-100 px-4 py-3 text-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">From your filters above</p>
                        <p className="mt-1 font-semibold text-ink">
                          {periodLong} <span className="font-medium text-ink-mute">· {plural(days, 'day')}</span>
                        </p>
                        <p className="text-ink-soft">
                          {slotInfo.label} · {fmtTimeRange(slotInfo.start, slotInfo.end)}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-[13px] font-semibold text-ink">Promoters</p>
                        <Stepper value={promoters} min={1} max={maxPromoters} onChange={setPromoters} label="promoters" />
                      </div>
                      <p className="mt-2 text-xs text-ink-mute">
                        {slotsFree > 0
                          ? `Up to ${slotsFree} promoter${slotsFree === 1 ? '' : 's'} can be added for ${periodShort}.`
                          : 'No promoter slots are free for these dates. Try other dates.'}
                      </p>
                      <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                        <div className="flex justify-between text-ink-soft">
                          <dt>
                            {naira(unitPrice)} × {promoters} promoter{promoters === 1 ? '' : 's'} × {days} day{days === 1 ? '' : 's'}
                          </dt>
                          <dd className="font-semibold text-ink">{naira(quote.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between text-ink-soft">
                          <dt>VAT (7.5%)</dt>
                          <dd className="font-semibold text-ink">{naira(quote.vat)}</dd>
                        </div>
                        <div className="flex justify-between pt-1 text-base font-extrabold text-ink">
                          <dt>Estimated total</dt>
                          <dd>{naira(quote.total)}</dd>
                        </div>
                      </dl>
                    </>
                  )}
                  <Button variant="accent" size="lg" full className="mt-5" disabled={!canRequest} onClick={requestMobile} iconRight={<ArrowRight className="h-4 w-4" />}>
                    Request Mobile Promotion
                  </Button>
                  <p className="mt-3 text-center text-xs text-ink-mute">Weekly packages and volume discounts coming soon.</p>
                </Card>
              </>
            )}

            <Card className="flex gap-3 bg-brand-50/60 p-4 text-sm text-ink-soft">
              <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <p>
                {type === 'space'
                  ? 'Spaces are reserved for the full day. Your chosen time window sets the hours your promoters’ passes are valid.'
                  : 'Roaming promoters must carry their AICL digital pass and may not set up fixed stands, tables or loudspeakers.'}
              </p>
            </Card>
          </aside>
        </div>

        <BookingsPanel mode={type} bookings={bookings} from={date} />
      </Container>
    </>
  );
}
