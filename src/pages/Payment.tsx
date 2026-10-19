import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Banknote, Check, CircleAlert, Clock, CreditCard, Landmark, Lock, ShieldCheck, Ticket } from 'lucide-react';
import { useStore } from '../store/StoreProvider';
import { spaceById, zoneById } from '../data/spaces';
import type { Booking, PaymentMethod } from '../types';
import { RoleGate } from '../components/layout/RoleGate';
import { JourneySteps } from '../components/ui/JourneySteps';
import { Button } from '../components/ui/Button';
import { Photo } from '../components/ui/Photo';
import { TextField } from '../components/ui/Field';
import { Card, Container, EmptyState, KV } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { PriceLines, SelectionRow } from '../components/booking/BookingSummary';
import { fmtDateTime, fmtRange, fmtTimeRange } from '../lib/dates';
import { cn, naira, plural } from '../lib/format';
import { targetLabel } from '../lib/passes';

export default function Payment() {
  return (
    <RoleGate need="business">
      <Inner />
    </RoleGate>
  );
}

const STEPS = ['Contacting your bank…', 'Verifying payment…', 'Confirming your booking with AICL…'];

function formatCard(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function Inner() {
  const { ref } = useParams();
  const { getBooking, payBooking } = useStore();
  const { toast } = useToast();
  const b = ref ? getBooking(ref) : undefined;

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form');
  const [stepIdx, setStepIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [card, setCard] = useState({ name: '', number: '4242 4242 4242 4242', expiry: '12/29', cvv: '123' });
  const [paidSnapshot, setPaidSnapshot] = useState<Booking | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (b && !card.name) setCard((c) => ({ ...c, name: b.contactName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b?.ref]);

  if (!b) return <Navigate to="/my-bookings" replace />;

  const space = b.type === 'space' ? spaceById(b.targetId) : undefined;
  const zone = b.type === 'mobile' ? zoneById(b.targetId) : undefined;

  // Only an unpaid request can be paid (the success screen below handles the moment right after paying)
  if (phase === 'form' && b.status !== 'awaiting_payment') {
    if (b.status === 'approved') return <Navigate to={`/passes/${b.ref}`} replace />;
    return (
      <Container className="py-20">
        <EmptyState
          icon={<CircleAlert className="h-6 w-6" />}
          title={b.status === 'in_review' ? 'Payment received — AICL is reviewing your request' : 'This request was not approved'}
          body={
            b.status === 'in_review'
              ? 'There is nothing more to pay. You will get an email and a notification as soon as AICL approves or rejects the request.'
              : 'Your payment was refunded. See My Bookings for AICL’s reason.'
          }
          action={<Button to="/my-bookings">Back to My Bookings</Button>}
        />
      </Container>
    );
  }

  const view = paidSnapshot ?? b;

  const validateCard = () => {
    const e: Record<string, string> = {};
    if (card.name.trim().length < 2) e.name = 'Enter the name on the card.';
    if (card.number.replace(/\s/g, '').length !== 16) e.number = 'Card number must be 16 digits.';
    const m = /^(\d{2})\/(\d{2})$/.exec(card.expiry);
    if (!m || +m[1] < 1 || +m[1] > 12) e.expiry = 'Use MM/YY.';
    else {
      const now = new Date();
      const exp = new Date(2000 + +m[2], +m[1], 0, 23, 59);
      if (exp < now) e.expiry = 'This card has expired.';
    }
    if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = '3 or 4 digits.';
    return e;
  };

  const pay = () => {
    if (method === 'card') {
      const e = validateCard();
      setErrors(e);
      if (Object.keys(e).length) {
        toast({ kind: 'warning', title: 'Check your card details' });
        return;
      }
    }
    setPhase('processing');
    setStepIdx(0);
    const total = method === 'card' ? 2700 : 2000;
    timers.current.push(window.setTimeout(() => setStepIdx(1), total * 0.38));
    timers.current.push(window.setTimeout(() => setStepIdx(2), total * 0.72));
    timers.current.push(
      window.setTimeout(() => {
        const updated = payBooking(b.ref, method);
        if (updated) setPaidSnapshot(updated);
        setPhase('success');
        window.scrollTo({ top: 0 });
        toast({ kind: 'email', title: 'Payment received', body: `Receipt and ${plural(b.promoters.length, 'pass', 'passes')} emailed to ${b.email}.` });
      }, total),
    );
  };

  /* ------------------------------------------------------------------ success */
  if (phase === 'success') {
    return (
      <Container className="max-w-[920px] py-10">
        <JourneySteps current={4} type={b.type} className="mb-10" />
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-st-available to-emerald-700 px-6 py-10 text-center text-white sm:px-10">
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              <span className="pulse-ring absolute inset-0 rounded-full bg-white/30" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-st-available shadow-lg">
                <Check className="draw-check h-8 w-8" strokeWidth={3.5} />
              </span>
            </div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">Payment successful</h1>
            <p className="mx-auto mt-2 max-w-lg text-emerald-50">
              Your request for {targetLabel(view)} ({fmtRange(view.startDate, view.endDate)}) is now with AICL for <b>approval</b>.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl bg-sand-50 p-5">
              <KV k="Booking" v={<span className="font-mono">{view.ref}</span>} />
              <KV k="Receipt" v={<span className="font-mono">{view.receiptNo}</span>} />
              <KV k="Amount paid" v={naira(view.total)} />
              <KV k="Method" v={view.paymentMethod === 'transfer' ? 'Bank transfer' : 'Card'} />
              <KV k={view.type === 'space' ? 'Space' : 'Zone'} v={targetLabel(view)} />
              <KV k="Paid" v={view.paidAt ? fmtDateTime(view.paidAt) : '—'} />
            </dl>
            <div className="space-y-4">
              <div className="flex gap-3 rounded-2xl border border-st-pending/40 bg-st-pending-soft/50 p-4">
                <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-st-pending" />
                <p className="text-sm leading-snug text-st-pending-ink">
                  <b>Next: AICL approves or rejects.</b> {targetLabel(view)} stays <b>Pending Approval</b> (amber) on the floor plan and turns <b>Booked</b> (red) once approved.
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">
                A receipt was emailed to <b className="text-ink">{view.email}</b>. If AICL can’t approve the request, your payment is refunded in full. Approved bookings receive{' '}
                {plural(view.promoters.length, 'digital pass', 'digital passes')} — one per promoter.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-sand-50 px-6 py-4 sm:px-8">
            <Button to="/my-bookings" size="lg" variant="accent" iconRight={<ArrowRight className="h-4 w-4" />}>
              Go to My Bookings
            </Button>
            <Button to={view.type === 'space' ? `/plan?date=${view.startDate}` : '/plan?type=mobile'} variant="outline" size="lg">
              See floor plan
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  /* ------------------------------------------------------------------ checkout */
  const holdUntil = new Date(new Date(b.submittedAt).getTime() + 48 * 3600 * 1000).toISOString();
  const acct = `30${b.ref.replace(/\D/g, '').padEnd(8, '7').slice(0, 8)}`;

  return (
    <Container className="py-8">
      <JourneySteps current={4} type={b.type} className="mx-auto mb-8 max-w-4xl" />
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Checkout</h1>
        <p className="mt-1 text-ink-soft">Pay now so AICL can review your request. If it isn’t approved, you are refunded in full.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-ink">Payment method</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {(
                [
                  ['card', 'Debit / credit card', 'Visa, Mastercard, Verve', CreditCard],
                  ['transfer', 'Bank transfer', 'Pay from your banking app', Landmark],
                ] as const
              ).map(([id, title, sub, Icon]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={method === id}
                  onClick={() => setMethod(id)}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition',
                    method === id ? 'border-brand-600 bg-brand-50' : 'border-line bg-white hover:border-brand-300',
                  )}
                >
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', method === id ? 'bg-brand-700 text-white' : 'bg-sand-100 text-ink-soft')}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">{title}</span>
                    <span className="block text-xs text-ink-mute">{sub}</span>
                  </span>
                  <span className={cn('ml-auto flex h-5 w-5 items-center justify-center rounded-full border-2', method === id ? 'border-brand-600 bg-brand-600' : 'border-line')}>
                    {method === id && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                  </span>
                </button>
              ))}
            </div>

            {method === 'card' ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField wrapperClassName="sm:col-span-2" id="cn" label="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} error={errors.name} autoComplete="cc-name" />
                <TextField wrapperClassName="sm:col-span-2" id="cc" label="Card number" inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} error={errors.number} autoComplete="cc-number" placeholder="0000 0000 0000 0000" />
                <TextField id="exp" label="Expiry" inputMode="numeric" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} error={errors.expiry} placeholder="MM/YY" autoComplete="cc-exp" />
                <TextField id="cvv" label="CVV" inputMode="numeric" type="password" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} error={errors.cvv} autoComplete="cc-csc" />
                <p className="flex items-start gap-2 rounded-xl bg-sand-100 px-4 py-3 text-xs text-ink-soft sm:col-span-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Demo checkout: test card details are pre-filled and <b>no real payment is taken</b>.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-line bg-sand-50 p-5">
                <p className="text-sm font-semibold text-ink">Transfer exactly {naira(b.total)} to:</p>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KV k="Bank" v="Demo Bank Plc" />
                  <KV k="Account name" v="AICL · Garki Market Promotions" />
                  <KV k="Account number" v={<span className="font-mono text-base tracking-wider">{acct}</span>} />
                  <KV k="Payment reference" v={<span className="font-mono">{b.ref}</span>} />
                </dl>
                <p className="mt-4 flex items-start gap-2 text-xs text-ink-soft">
                  <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> In this demo, clicking “I've made the transfer” simulates the bank confirming your payment.
                </p>
              </div>
            )}
          </Card>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-mute">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-st-available" /> 256-bit encrypted (simulated)</span>
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Card details never stored</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Full refund if AICL doesn’t approve</span>
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <Photo src={space?.images[0] ?? zone?.image} alt="" className="h-32" />
            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Order summary · {b.ref}</p>
                <h3 className="mt-0.5 text-lg font-extrabold text-ink">{targetLabel(b)}</h3>
                <p className="text-sm text-ink-soft">{space ? `${space.location} · ${space.areaSqFt} sq ft` : zone?.route}</p>
              </div>
              <div className="space-y-3.5">
                <SelectionRow icon={<Clock className="h-4 w-4" />} label="Dates & time">
                  {fmtRange(b.startDate, b.endDate)}
                  <span className="block text-xs font-medium text-ink-mute">{fmtTimeRange(b.startTime, b.endTime)}</span>
                </SelectionRow>
                <SelectionRow icon={<Ticket className="h-4 w-4" />} label="Passes (issued once approved)">
                  {plural(b.promoters.length, 'pass', 'passes')} · {b.company}
                </SelectionRow>
              </div>
              <PriceLines unitPrice={b.unitPrice} days={b.days} quantity={b.type === 'mobile' ? b.promoters.length : 1} unitLabel={b.type === 'mobile' ? 'promoter' : undefined} />
              <Button size="lg" variant="accent" full loading={phase === 'processing'} onClick={pay} icon={<Lock className="h-4 w-4" />}>
                {method === 'card' ? `Pay ${naira(b.total)}` : "I've made the transfer"}
              </Button>
              {holdUntil && (
                <p className="text-center text-xs text-ink-mute">
                  Pay by <b className="text-ink-soft">{fmtDateTime(holdUntil)}</b> to keep your space held
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>

      {/* Processing overlay */}
      {phase === 'processing' && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-brand-950/60 p-6 backdrop-blur-sm" role="alertdialog" aria-live="assertive" aria-label="Processing payment">
          <div className="animate-pop-in w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-pop">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <h2 className="text-lg font-bold text-ink">Processing payment</h2>
            <p className="mt-1 text-sm font-medium text-brand-700">{method === 'transfer' && stepIdx === 0 ? 'Waiting for your bank…' : STEPS[stepIdx]}</p>
            <div className="mt-5 flex justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <span key={i} className={cn('h-1.5 w-10 rounded-full transition-colors', i <= stepIdx ? 'bg-brand-600' : 'bg-sand-200')} />
              ))}
            </div>
            <p className="mt-5 text-xs text-ink-mute">Please don't close this window.</p>
          </div>
        </div>
      )}
    </Container>
  );
}
