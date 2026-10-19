import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Clock, Info, MapPin, Plus, Send, Sparkles, Trash2, UserRound } from 'lucide-react';
import { useStore, type BookingFormValues } from '../store/StoreProvider';
import { spaceById, zoneById } from '../data/spaces';
import {
  ACTIVITY_TYPES_MOBILE,
  ACTIVITY_TYPES_SPACE,
  DEMO_PERSONA,
  MARKET_CLOSE,
  MARKET_OPEN,
  MAX_BOOKING_DAYS,
  MAX_PROMOTERS_SPACE,
  PROMOTION_LABEL,
  PEAK_MULTIPLIER,
  TIME_SLOTS,
  slotById,
} from '../data/constants';
import type { Promoter } from '../types';
import { JourneySteps } from '../components/ui/JourneySteps';
import { Button } from '../components/ui/Button';
import { Photo } from '../components/ui/Photo';
import { Stepper } from '../components/ui/Stepper';
import { SelectField, TextAreaField, TextField } from '../components/ui/Field';
import { Card, Container, PageHeader } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { ComingSoonNote, PriceLines, SelectionRow } from '../components/booking/BookingSummary';
import { isRangeFree, zoneRemainingForRange } from '../lib/availability';
import { slotHours, spaceDayPrice, zoneDayPrice } from '../lib/pricing';
import { daysInRange, fmtRange, fmtTimeRange, todayISO } from '../lib/dates';
import { cn, naira, plural } from '../lib/format';
import { isEmail, isNgPhone, minLen, timeToMins } from '../lib/validation';

type Errors = Record<string, string>;

/** Where the user can change their selection — the same dates / time window / zone are restored there. */
function changeHref(d: { type: string; targetId: string; startDate: string; endDate: string; slot: string; promoterCount: number }) {
  const q = `date=${d.startDate}&to=${d.endDate}&slot=${d.slot}`;
  return d.type === 'space' ? `/spaces/${d.targetId}?${q}` : `/plan?type=mobile&${q}&zone=${d.targetId}&promoters=${d.promoterCount}`;
}

export default function BookingForm() {
  const { draft, bookings, submitBooking, setDraft } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = todayISO();
  const formRef = useRef<HTMLFormElement>(null);
  const redirected = useRef(false);
  // Set just before a successful submit: the draft is cleared at that moment and we must not bounce to /plan.
  const submitted = useRef(false);

  useEffect(() => {
    if (!draft && !redirected.current && !submitted.current) {
      redirected.current = true;
      toast({ kind: 'info', title: 'Pick a space first', body: 'Choose a space or zone on the floor plan to start your request.' });
    }
  }, [draft, toast]);

  if (!draft) return submitted.current ? null : <Navigate to="/plan" replace />;

  const isSpace = draft.type === 'space';
  const space = isSpace ? spaceById(draft.targetId) : undefined;
  const zone = !isSpace ? zoneById(draft.targetId) : undefined;
  if (!space && !zone) return <Navigate to="/plan" replace />;

  return (
    <FormBody
      key={`${draft.type}-${draft.targetId}`}
      formRef={formRef}
      onSubmitValues={(v) => {
        submitted.current = true;
        const b = submitBooking(v);
        toast({
          kind: 'email',
          title: 'Request submitted',
          body: `AICL representatives have been notified by email. Reference ${b.ref}.`,
        });
        navigate(`/book/confirmation/${b.ref}`);
      }}
      draft={draft}
      bookings={bookings}
      today={today}
      onBack={() => navigate(changeHref(draft))}
      clearDraft={() => setDraft(null)}
    />
  );
}

function FormBody({
  draft,
  bookings,
  today,
  formRef,
  onSubmitValues,
  onBack,
  clearDraft,
}: {
  draft: NonNullable<ReturnType<typeof useStore>['draft']>;
  bookings: ReturnType<typeof useStore>['bookings'];
  today: string;
  formRef: React.RefObject<HTMLFormElement | null>;
  onSubmitValues: (v: BookingFormValues) => void;
  onBack: () => void;
  clearDraft: () => void;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isSpace = draft.type === 'space';
  const space = isSpace ? spaceById(draft.targetId) : undefined;
  const zone = !isSpace ? zoneById(draft.targetId) : undefined;

  const [f, setF] = useState({
    company: '',
    contactName: '',
    email: '',
    phone: '',
    activity: '',
    product: '',
    requirements: '',
    startDate: draft.startDate,
    endDate: draft.endDate,
    startTime: draft.startTime,
    endTime: draft.endTime,
    agree: false,
  });
  const [promoters, setPromoters] = useState<Promoter[]>(() =>
    Array.from({ length: draft.promoterCount }, () => ({ name: '', mobile: '' })),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const days = f.endDate >= f.startDate ? daysInRange(f.startDate, f.endDate) : 0;
  const unitPrice = isSpace ? spaceDayPrice(space!, draft.slot) : zoneDayPrice(zone!, draft.slot);
  const slotInfo = slotById(draft.slot);
  const hrs = slotHours(draft.slot);
  const priceNote = `${slotInfo.label} ${fmtTimeRange(slotInfo.start, slotInfo.end)} · ${hrs.total}h${hrs.peak ? `, ${hrs.peak}h peak (counts ${PEAK_MULTIPLIER}×)` : ' standard hours'}`;

  const maxPromoters = isSpace
    ? MAX_PROMOTERS_SPACE
    : Math.max(1, days > 0 && days <= MAX_BOOKING_DAYS ? Math.min(zoneRemainingForRange(zone!, bookings, f.startDate, f.endDate), zone!.capacity) : zone!.capacity);

  const setCount = (n: number) =>
    setPromoters((prev) => (n > prev.length ? [...prev, ...Array.from({ length: n - prev.length }, () => ({ name: '', mobile: '' }))] : prev.slice(0, n)));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!minLen(f.company, 2)) e.company = 'Enter your company name.';
    if (!minLen(f.contactName, 2)) e.contactName = 'Enter the contact person’s full name.';
    if (!isEmail(f.email)) e.email = 'Enter a valid email address, e.g. name@company.com.';
    if (!isNgPhone(f.phone)) e.phone = 'Enter a valid Nigerian mobile number, e.g. 0803 123 4567.';
    if (!f.activity) e.activity = 'Select the nature of your promotional activity.';
    if (!minLen(f.product, 2)) e.product = 'Tell us which product or brand you are promoting.';

    if (!f.startDate || !f.endDate) e.dates = 'Choose your start and end dates.';
    else if (f.startDate < today) e.dates = 'Start date cannot be in the past.';
    else if (f.endDate < f.startDate) e.dates = 'End date must be on or after the start date.';
    else if (days > MAX_BOOKING_DAYS) e.dates = `Bookings are limited to ${MAX_BOOKING_DAYS} days at a time.`;
    else if (isSpace && !isRangeFree(space!, bookings, f.startDate, f.endDate))
      e.dates = `${space!.id} is not free for all of these dates. Go back and pick a free range.`;
    else if (!isSpace && zoneRemainingForRange(zone!, bookings, f.startDate, f.endDate) < promoters.length)
      e.dates = `Zone ${zone!.code} only has ${zoneRemainingForRange(zone!, bookings, f.startDate, f.endDate)} promoter slot(s) free for these dates.`;

    if (!f.startTime || !f.endTime) e.time = 'Choose a start and end time.';
    else if (timeToMins(f.startTime) >= timeToMins(f.endTime)) e.time = 'End time must be after the start time.';
    else if (timeToMins(f.startTime) < timeToMins(MARKET_OPEN) || timeToMins(f.endTime) > timeToMins(MARKET_CLOSE))
      e.time = `Activations must fall within market hours (${MARKET_OPEN} – ${MARKET_CLOSE}).`;

    if (promoters.length < 1) e.promoters = 'Add at least one promoter — passes are issued per person.';
    promoters.forEach((p, i) => {
      if (!minLen(p.name, 2)) e[`p${i}name`] = 'Enter the promoter’s name.';
      if (!isNgPhone(p.mobile)) e[`p${i}mobile`] = 'Valid mobile number needed.';
    });
    if (!f.agree) e.agree = 'Please accept the AICL promotional guidelines to continue.';
    return e;
  };

  // Live re-validation once the user has tried to submit.
  useEffect(() => {
    if (attempted) setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, promoters, attempted]);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setAttempted(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast({ kind: 'warning', title: 'Please check the highlighted fields', body: `${Object.keys(e).length} item(s) need your attention.` });
      window.setTimeout(() => {
        const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-error="true"]');
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el?.focus?.({ preventScroll: true });
      }, 30);
      return;
    }
    onSubmitValues({
      type: draft.type,
      targetId: draft.targetId,
      startDate: f.startDate,
      endDate: f.endDate,
      slot: draft.slot,
      startTime: f.startTime,
      endTime: f.endTime,
      company: f.company,
      contactName: f.contactName,
      email: f.email,
      phone: f.phone,
      activity: f.activity,
      product: f.product,
      promoters,
      requirements: f.requirements,
    });
  };

  const fillDemo = () => {
    setF((p) => ({
      ...p,
      company: DEMO_PERSONA.company,
      contactName: DEMO_PERSONA.contactName,
      email: DEMO_PERSONA.email,
      phone: DEMO_PERSONA.phone,
      activity: isSpace ? 'Product sampling' : 'Roaming product sampling',
      product: DEMO_PERSONA.product,
      requirements: isSpace ? DEMO_PERSONA.requirements : 'Branded bibs and a cooler bag for samples.',
      agree: true,
    }));
    setPromoters((prev) => prev.map((_, i) => DEMO_PERSONA.promoters[i % DEMO_PERSONA.promoters.length]));
    toast({ kind: 'info', title: 'Demo details filled in' });
  };

  const err = (k: string) => (attempted ? errors[k] : undefined);
  const slotLabel = TIME_SLOTS.find((t) => t.id === draft.slot)?.label;

  const sectionTitle = (n: number, title: string, sub?: string) => (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[13px] font-bold text-white">{n}</span>
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {sub && <p className="text-sm text-ink-soft">{sub}</p>}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Booking request"
        lead="Your space, dates and time are already filled in from your selection. Add your company details and promoters, then submit for approval."
        actions={
          <Button variant="outline" size="sm" icon={<Sparkles className="h-4 w-4 text-accent-500" />} onClick={fillDemo}>
            Fill demo details
          </Button>
        }
      >
        <JourneySteps current={1} type={draft.type} />
      </PageHeader>

      <Container className="py-8">
        <form ref={formRef} onSubmit={submit} noValidate className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-brand-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 bg-brand-50 px-6 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-brand-900">
                  <Check className="h-4 w-4 text-st-available" strokeWidth={3} /> Your selection — filled in automatically
                </p>
                <Link to={changeHref({ ...draft, startDate: f.startDate, endDate: f.endDate, promoterCount: promoters.length })} className="text-sm font-semibold text-brand-600 hover:underline">
                  Change space, dates or time
                </Link>
              </div>
              <dl className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{isSpace ? 'Space' : 'Zone'}</dt>
                    <dd className="text-[15px] font-bold text-ink">{isSpace ? space!.id : `Zone ${zone!.code}`}</dd>
                    <dd className="text-xs text-ink-mute">{isSpace ? `${space!.location} · ${space!.areaSqFt} sq ft` : zone!.name}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Date{days > 1 ? 's' : ''}</dt>
                    <dd className="text-[15px] font-bold text-ink">{days > 0 ? fmtRange(f.startDate, f.endDate) : '—'}</dd>
                    <dd className="text-xs text-ink-mute">{days > 0 ? plural(days, 'day') : ''}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{isSpace ? 'Time window' : 'Roaming hours'}</dt>
                    <dd className="text-[15px] font-bold text-ink">{f.startTime && f.endTime ? fmtTimeRange(f.startTime, f.endTime) : '—'}</dd>
                    <dd className="text-xs text-ink-mute">{slotLabel}</dd>
                  </div>
                </div>
              </dl>
              {(err('dates') || err('time')) && (
                <p className="mx-6 mb-5 rounded-xl bg-st-booked-soft px-4 py-2.5 text-sm font-medium text-st-booked-ink" role="alert" data-error="true">
                  {err('dates') ?? err('time')} <Link to={changeHref({ ...draft, startDate: f.startDate, endDate: f.endDate, promoterCount: promoters.length })} className="underline">Change dates</Link>
                </p>
              )}
              <p className="flex items-center gap-2 border-t border-line bg-sand-50 px-6 py-2.5 text-xs text-ink-mute">
                <Info className="h-3.5 w-3.5 shrink-0" /> Chosen on the previous screens, so there is nothing to type again.{' '}
                {isSpace ? 'The space is reserved for the full day; the time window sets when your passes are valid.' : 'Promoters may roam only during these hours.'}
              </p>
            </Card>

            <Card className="p-6">
              {sectionTitle(1, 'Company & contact')}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField id="company" label="Company name" required value={f.company} onChange={(e) => set('company', e.target.value)} error={err('company')} placeholder="e.g. Zuma Beverages Ltd" autoComplete="organization" />
                <TextField id="contactName" label="Contact person" required value={f.contactName} onChange={(e) => set('contactName', e.target.value)} error={err('contactName')} placeholder="Full name" autoComplete="name" />
                <TextField id="email" type="email" label="Email" required value={f.email} onChange={(e) => set('email', e.target.value)} error={err('email')} placeholder="name@company.com" hint="We'll send your receipt, AICL's decision and your passes here." autoComplete="email" />
                <TextField id="phone" type="tel" label="Phone" required value={f.phone} onChange={(e) => set('phone', e.target.value)} error={err('phone')} placeholder="0803 123 4567" autoComplete="tel" />
              </div>
            </Card>

            <Card className="p-6">
              {sectionTitle(2, 'Your promotion')}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField id="activity" label="Nature of promotional activity" required value={f.activity} onChange={(e) => set('activity', e.target.value)} error={err('activity')}>
                  <option value="">Select an activity…</option>
                  {(isSpace ? ACTIVITY_TYPES_SPACE : ACTIVITY_TYPES_MOBILE).map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </SelectField>
                <TextField id="product" label="Product / brand being promoted" required value={f.product} onChange={(e) => set('product', e.target.value)} error={err('product')} placeholder="e.g. Zuma Chilled Zobo 500ml" />
              </div>
            </Card>

            <Card className="p-6">
              {sectionTitle(3, 'Promoters & staff', 'Each person receives their own digital pass with a QR code. Their name and mobile number are printed on it.')}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Number of promoters / staff</p>
                  <p className="text-xs text-ink-mute">
                    Maximum {maxPromoters} {isSpace ? 'per space' : `for Zone ${zone!.code} on these dates`}
                    {!isSpace && ` · ${naira(unitPrice)} each per day`}
                  </p>
                </div>
                <Stepper value={promoters.length} min={1} max={maxPromoters} onChange={setCount} label="promoters" />
              </div>
              {err('promoters') && (
                <p className="mb-3 text-sm font-medium text-st-booked-ink" role="alert">
                  {err('promoters')}
                </p>
              )}
              <ul className="space-y-3">
                {promoters.map((p, i) => (
                  <li key={i} className="grid grid-cols-1 items-start gap-3 rounded-xl border border-line p-3 sm:grid-cols-[28px_1fr_1fr_40px]">
                    <span className="hidden h-10 items-center justify-center text-sm font-bold text-ink-mute sm:flex">{i + 1}</span>
                    <TextField
                      aria-label={`Promoter ${i + 1} name`}
                      placeholder="Full name"
                      value={p.name}
                      onChange={(e) => setPromoters((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      error={err(`p${i}name`)}
                    />
                    <TextField
                      aria-label={`Promoter ${i + 1} mobile number`}
                      type="tel"
                      placeholder="Mobile, e.g. 0806 555 0121"
                      value={p.mobile}
                      onChange={(e) => setPromoters((prev) => prev.map((x, j) => (j === i ? { ...x, mobile: e.target.value } : x)))}
                      error={err(`p${i}mobile`)}
                    />
                    <button
                      type="button"
                      disabled={promoters.length <= 1}
                      onClick={() => setPromoters((prev) => prev.filter((_, j) => j !== i))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-mute transition hover:bg-st-booked-soft hover:text-st-booked disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-mute"
                      aria-label={`Remove promoter ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={promoters.length >= maxPromoters}
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCount(promoters.length + 1)}
              >
                Add another promoter
              </Button>
            </Card>

            <Card className="p-6">
              {sectionTitle(4, 'Additional requirements', 'Optional')}
              <TextAreaField
                id="requirements"
                aria-label="Additional requirements"
                value={f.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                placeholder="Power needs, banners, tables, tasting equipment, special permissions…"
              />
            </Card>

            <Card className="p-6">
              <label className={cn('flex cursor-pointer items-start gap-3', err('agree') && 'text-st-booked-ink')} data-error={err('agree') ? 'true' : undefined}>
                <input
                  type="checkbox"
                  checked={f.agree}
                  onChange={(e) => set('agree', e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-line text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm leading-snug text-ink-soft">
                  I confirm the information above is correct and my team will follow the <b className="text-ink">AICL promotional guidelines</b> (no obstruction of
                  walkways, no amplified sound outside approved bays, passes worn at all times).
                </span>
              </label>
              {err('agree') && <p className="mt-2 text-xs font-medium text-st-booked-ink">{err('agree')}</p>}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => {
                      clearDraft();
                      toast({ kind: 'info', title: 'Request discarded' });
                      navigate('/plan');
                    }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="accent" size="lg" iconRight={<Send className="h-4 w-4" />}>
                    Submit for Approval
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <Photo src={space?.images[0] ?? zone?.image} alt="" className="h-36" />
              <div className="space-y-5 p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{PROMOTION_LABEL[draft.type]}</p>
                  <h3 className="mt-0.5 text-lg font-extrabold text-ink">
                    {isSpace ? (
                      <>
                        <span className="font-mono">{space!.id}</span> · {space!.name}
                      </>
                    ) : (
                      <>
                        Zone {zone!.code} · {zone!.name}
                      </>
                    )}
                  </h3>
                  <p className="text-sm text-ink-soft">{isSpace ? `${space!.location} · ${space!.areaSqFt} sq ft` : zone!.route}</p>
                </div>
                <div className="space-y-3.5">
                  <SelectionRow icon={<CalendarDays className="h-4 w-4" />} label="Dates">
                    {days > 0 ? fmtRange(f.startDate, f.endDate) : '—'}
                    <span className="block text-xs font-medium text-ink-mute">{days > 0 ? plural(days, 'day') : ''}</span>
                  </SelectionRow>
                  <SelectionRow icon={<Info className="h-4 w-4" />} label={isSpace ? `Activation window${slotLabel ? ` · ${slotLabel}` : ''}` : 'Roaming window'}>
                    {f.startTime && f.endTime ? fmtTimeRange(f.startTime, f.endTime) : '—'}
                  </SelectionRow>
                  <SelectionRow icon={<UserRound className="h-4 w-4" />} label="Passes to be issued">
                    {plural(promoters.length, 'pass', 'passes')}
                  </SelectionRow>
                </div>
                <PriceLines
                  unitPrice={unitPrice}
                  days={Math.max(days, 0)}
                  quantity={isSpace ? 1 : promoters.length}
                  unitLabel={isSpace ? undefined : 'promoter'}
                  note={priceNote}
                />
                <div className="rounded-xl bg-sand-100 px-4 py-3">
                  <ComingSoonNote />
                </div>
                <p className="text-xs leading-relaxed text-ink-mute">
                  Submitting sends your request to AICL. <b>Next you pay online</b>; AICL then approves or rejects the request and a rejected request is refunded in full.
                </p>
              </div>
            </Card>
            <p className="mt-3 text-center text-xs text-ink-mute">
              Changed your mind?{' '}
              <Link to="/plan" className="font-semibold text-brand-600 hover:underline" onClick={clearDraft}>
                Pick a different space
              </Link>
            </p>
          </aside>
        </form>
      </Container>
    </>
  );
}
