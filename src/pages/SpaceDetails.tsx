import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Footprints, Info, Lock, MapPin, Ruler, Zap } from 'lucide-react';
import { spaceById } from '../data/spaces';
import { PEAK_END, PEAK_MULTIPLIER, PEAK_START, TIME_SLOTS, slotById } from '../data/constants';
import { slotHours, spaceDayPrice } from '../lib/pricing';
import { useStore } from '../store/StoreProvider';
import type { TimeSlotId } from '../types';
import { MarketMap } from '../components/map/MarketMap';
import { AvailabilityCalendar, rangeIsFree } from '../components/booking/AvailabilityCalendar';
import { SpaceLayoutDiagram } from '../components/booking/SpaceLayoutDiagram';
import { RentalHistory } from '../components/booking/RentalHistory';
import { ComingSoonNote, PriceLines, SelectedDates } from '../components/booking/BookingSummary';
import { JourneySteps } from '../components/ui/JourneySteps';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Photo } from '../components/ui/Photo';
import { Card, Container, EmptyState } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { nextAvailableDate, spaceStatusOn } from '../lib/availability';
import { daysInRange, eachDay, fmtRange, fmtShort, fmtTimeRange, todayISO } from '../lib/dates';
import { cn, naira, num } from '../lib/format';
import { Compass } from 'lucide-react';

/** Remounts the page whenever the space or the dates/time in the URL change, so the selection never goes stale. */
export default function SpaceDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  return <SpaceDetailsPage key={`${id}?${params.toString()}`} />;
}

function SpaceDetailsPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookings, history, setDraft } = useStore();
  const space = id ? spaceById(id) : undefined;
  const today = todayISO();

  // Dates + time window chosen on the floor plan arrive as ?date=&to=&slot= and are pre-selected here.
  const preDate = params.get('date');
  const preTo = params.get('to');
  const preSlot = params.get('slot');
  const [photo, setPhoto] = useState(0);
  const [slotId, setSlotId] = useState<TimeSlotId>(TIME_SLOTS.some((t) => t.id === preSlot) ? (preSlot as TimeSlotId) : 'full');
  const initial = useMemo(() => {
    const none = { start: null as string | null, end: null as string | null, trimmed: false };
    if (!space || !preDate || preDate < today) return none;
    const freeOn = (d: string) => spaceStatusOn(space, bookings, d) === 'available';
    const end = preTo && preTo > preDate ? preTo : preDate;
    if (eachDay(preDate, end).every(freeOn)) return { start: preDate, end, trimmed: false };
    // the whole chosen period isn't free for this space: keep the free first day(s) and tell the user
    if (freeOn(preDate)) {
      let last = preDate;
      for (const d of eachDay(preDate, end)) {
        if (!freeOn(d)) break;
        last = d;
      }
      return { start: preDate, end: last, trimmed: true };
    }
    return { ...none, trimmed: true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sel, setSel] = useState<{ start: string | null; end: string | null }>({ start: initial.start, end: initial.end });

  const statusOn = useMemo(
    () => (d: string) => (space ? spaceStatusOn(space, bookings, d) : 'blocked'),
    [space, bookings],
  );

  if (!space) {
    return (
      <Container className="py-20">
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title="Space not found"
          body="That space ID doesn't exist. Head back to the floor plan to pick one."
          action={<Button to="/plan">Back to floor plan</Button>}
        />
      </Container>
    );
  }

  const slot = slotById(slotId);
  const dayPrice = spaceDayPrice(space, slotId);
  const hours = slotHours(slotId);
  const priceNote = `${slot.label} ${fmtTimeRange(slot.start, slot.end)} · ${hours.total}h${hours.peak ? `, ${hours.peak}h of it peak (counts ${PEAK_MULTIPLIER}×)` : ' standard hours'}`;
  const days = sel.start && sel.end ? daysInRange(sel.start, sel.end) : 0;
  const viewDate = sel.start ?? (preDate && preDate >= today ? preDate : today);
  const headStatus = statusOn(viewDate);
  const next = nextAvailableDate(space, bookings, today);
  const spaceHistory = history.filter((h) => h.spaceId === space.id);
  const selectionValid = !!sel.start && !!sel.end && rangeIsFree(statusOn, sel.start, sel.end);

  const request = () => {
    if (!sel.start || !sel.end || !selectionValid) return;
    setDraft({
      type: 'space',
      targetId: space.id,
      startDate: sel.start,
      endDate: sel.end,
      slot: slotId,
      startTime: slot.start,
      endTime: slot.end,
      promoterCount: 2,
    });
    navigate('/book');
  };

  return (
    <>
      <div className="border-b border-line bg-white">
        <Container className="py-5">
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-ink-mute" aria-label="Breadcrumb">
            <Link to="/plan" className="font-medium hover:text-ink">
              Plan Your Promotion
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-ink">{space.id}</span>
          </nav>
          <JourneySteps current={0} />
        </Container>
      </div>

      <Container className="py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-3xl font-extrabold tracking-tight text-ink">{space.id}</h1>
              <StatusPill status={headStatus} />
            </div>
            <p className="mt-1 text-lg font-semibold text-ink-soft">
              {space.name} <span className="font-normal text-ink-mute">· {space.location}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold tracking-tight text-ink">
              {naira(dayPrice)}
              <span className="ml-1 text-base font-semibold text-ink-mute">/ day</span>
            </p>
            <p className="text-xs text-ink-mute">
              {slot.label} · {fmtTimeRange(slot.start, slot.end)} · full day {naira(space.pricePerDay)} ({num(space.areaSqFt)} sq ft) · excl. 7.5% VAT
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8">
            {/* Gallery */}
            <section aria-label="Photos">
              <Photo src={space.images[photo]} alt={`${space.id} — ${space.location}`} className="aspect-[16/9] rounded-3xl shadow-card" eager />
              <div className="mt-3 grid grid-cols-4 gap-3">
                {space.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setPhoto(i)}
                    aria-label={`Photo ${i + 1}`}
                    aria-pressed={photo === i}
                    className={cn('overflow-hidden rounded-xl ring-2 ring-offset-2 transition', photo === i ? 'ring-brand-600' : 'ring-transparent hover:ring-brand-200')}
                  >
                    <Photo src={src} alt="" className="aspect-[4/3]" />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-mute">The last photo shows an example activation; other photos show the surrounding market area.</p>
            </section>

            {/* Key facts */}
            <section>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Ruler, k: 'Area', v: `${num(space.areaSqFt)} sq ft` },
                  { icon: Ruler, k: 'Dimensions', v: `${space.widthFt} × ${space.depthFt} ft` },
                  { icon: Footprints, k: 'Footfall', v: space.footfall },
                  { icon: MapPin, k: 'Location', v: space.location },
                ].map((f) => (
                  <div key={f.k} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <f.icon className="h-4 w-4 text-brand-600" />
                    <dt className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{f.k}</dt>
                    <dd className="mt-0.5 text-[15px] font-bold leading-snug text-ink">{f.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{space.blurb}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {space.amenities.map((a) => (
                  <li key={a} className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-soft">
                    <Zap className="h-3 w-3 text-accent-500" /> {a}
                  </li>
                ))}
              </ul>
              {space.blocked && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-st-blocked-soft px-4 py-3.5 text-sm text-st-blocked-ink">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    <b>Unavailable:</b> {space.blocked.reason}
                  </p>
                </div>
              )}
            </section>

            {/* Layout + mini map */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-bold text-ink">Space layout</h3>
                <SpaceLayoutDiagram space={space} />
              </Card>
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-bold text-ink">Position in the market</h3>
                <div className="overflow-hidden rounded-xl bg-[#e8f0f7]">
                  <MarketMap mini mode="space" date={viewDate} bookings={bookings} highlightId={space.id} />
                </div>
              </Card>
            </section>

            {/* Availability */}
            <section aria-labelledby="avail-h">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="avail-h" className="text-xl font-bold text-ink">
                    Availability
                  </h2>
                  <p className="text-sm text-ink-soft">
                    {space.blocked
                      ? 'This space is not open for booking.'
                      : next
                        ? `Next free date: ${fmtShort(next)}.`
                        : 'No free dates in the next six months.'}
                  </p>
                </div>
              </div>
              {initial.trimmed && preDate && (
                <div className="mb-3 flex items-start gap-3 rounded-2xl bg-st-pending-soft px-4 py-3 text-sm text-st-pending-ink">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {space.id} is not free for all of your chosen dates ({fmtRange(preDate, preTo && preTo > preDate ? preTo : preDate)}).{' '}
                    {initial.start ? 'We selected the days that are free — adjust on the calendar if you like.' : 'Pick other dates on the calendar below.'}
                  </p>
                </div>
              )}
              <Card className="p-5 sm:p-6">
                <AvailabilityCalendar
                  statusOn={statusOn}
                  start={sel.start}
                  end={sel.end}
                  onChange={(s, e) => setSel({ start: s, end: e })}
                  onMessage={(m) => toast({ kind: 'warning', title: 'Date not available', body: m })}
                />
                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="text-sm font-bold text-ink">Activation hours</h3>
                  <p className="mb-3 text-xs leading-relaxed text-ink-mute">
                    <b className="text-ink-soft">The price follows your hours:</b> a shorter window costs less, and every hour in the peak window ({fmtTimeRange(PEAK_START, PEAK_END)}) counts{' '}
                    {PEAK_MULTIPLIER}× a standard hour. The space is reserved for the day; the window also sets when your promoters’ passes are valid.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {TIME_SLOTS.map((t) => {
                      const on = t.id === slotId;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSlotId(t.id)}
                          aria-pressed={on}
                          className={cn(
                            'rounded-xl border-2 px-3.5 py-3 text-left transition',
                            on ? 'border-brand-600 bg-brand-50' : 'border-line bg-white hover:border-brand-300',
                          )}
                        >
                          <span className="flex items-center justify-between text-sm font-bold text-ink">
                            {t.label}
                            {on && <Check className="h-4 w-4 text-brand-600" strokeWidth={3} />}
                          </span>
                          <span className="mt-0.5 block text-xs font-semibold text-brand-700">{fmtTimeRange(t.start, t.end)}</span>
                          <span className="mt-1.5 block text-lg font-extrabold leading-none text-ink">
                            {naira(spaceDayPrice(space, t.id))}
                            <span className="ml-1 text-[11px] font-semibold text-ink-mute">/ day</span>
                          </span>
                          <span className="mt-1 block text-[11px] text-ink-mute">
                            {slotHours(t.id).total}h{slotHours(t.id).peak ? ` · ${slotHours(t.id).peak}h peak` : ''} · {t.note}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </section>

            {/* History */}
            <section aria-labelledby="hist-h">
              <h2 id="hist-h" className="mb-1 text-xl font-bold text-ink">
                Rental history · previous 3 months
              </h2>
              <p className="mb-4 text-sm text-ink-soft">See which brands have used this space and how often it is booked.</p>
              <Card className="p-5">
                <RentalHistory entries={spaceHistory} emptyReason={space.blocked?.reason} />
              </Card>
            </section>
          </div>

          {/* Sticky booking summary */}
          <aside className="lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <div className="bg-brand-800 px-5 py-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">Booking summary</p>
                <p className="mt-0.5 flex items-center justify-between">
                  <span className="font-mono text-lg font-extrabold">{space.id}</span>
                  <span className="text-sm font-semibold text-brand-100">{naira(dayPrice)} / day</span>
                </p>
              </div>
              <div className="space-y-5 p-5">
                <SelectedDates start={sel.start} end={sel.end} startTime={slot.start} endTime={slot.end} />
                {days > 0 && <PriceLines unitPrice={dayPrice} days={days} note={priceNote} />}
                <Button
                  variant="accent"
                  size="lg"
                  full
                  disabled={!selectionValid || !!space.blocked}
                  onClick={request}
                  iconRight={<ArrowRight className="h-4 w-4" />}
                >
                  Request This Space
                </Button>
                <p className="text-center text-xs text-ink-mute">
                  {space.blocked
                    ? 'This space cannot be booked.'
                    : 'Next you pay online, then AICL approves or rejects. Not approved? You are refunded in full.'}
                </p>
                <div className="rounded-xl bg-sand-100 px-4 py-3">
                  <ComingSoonNote />
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
