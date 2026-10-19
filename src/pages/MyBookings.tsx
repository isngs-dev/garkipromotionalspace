import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, ChevronDown, Clock, CreditCard, FileText, Mail, QrCode, RotateCcw, Ticket, X } from 'lucide-react';
import type { Booking, BookingStatus } from '../types';
import { useStore } from '../store/StoreProvider';
import { RoleGate } from '../components/layout/RoleGate';
import { JourneySteps, stepForBooking } from '../components/ui/JourneySteps';
import { Button } from '../components/ui/Button';
import { BookingStatusPill } from '../components/ui/StatusPill';
import { Card, Container, EmptyState, PageHeader, Tabs } from '../components/ui/misc';
import { ApprovalEmail, PassesEmail, ReceiptEmail, RejectionEmail } from '../components/booking/emails';
import { Modal } from '../components/ui/Modal';
import { fmtDateTime, fmtRange, fmtTimeRange } from '../lib/dates';
import { cn, naira, plural } from '../lib/format';
import { targetLabel } from '../lib/passes';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, PROMOTION_LABEL } from '../data/constants';

type Tab = 'all' | BookingStatus;

/** Request → Payment → AICL decision → Digital passes */
function Timeline({ b }: { b: Booking }) {
  const unpaid = b.status === 'awaiting_payment';
  const rejected = b.status === 'rejected';
  const approved = b.status === 'approved';
  const items: Array<{ icon: typeof Check; title: string; sub: string; state: 'done' | 'active' | 'todo' | 'bad' }> = [
    { icon: FileText, title: 'Request submitted', sub: fmtDateTime(b.submittedAt), state: 'done' },
    {
      icon: CreditCard,
      title: 'Payment',
      sub: b.paidAt ? `${fmtDateTime(b.paidAt)} · ${naira(b.total)}` : 'Due now — within 48 hours',
      state: unpaid ? 'active' : 'done',
    },
    {
      icon: rejected ? X : approved ? Check : Clock,
      title: rejected ? 'Rejected by AICL' : approved ? 'Approved by AICL' : 'AICL approval',
      sub: b.decidedAt ? fmtDateTime(b.decidedAt) : unpaid ? 'After payment' : 'Awaiting AICL decision',
      state: rejected ? 'bad' : approved ? 'done' : unpaid ? 'todo' : 'active',
    },
    {
      icon: Ticket,
      title: 'Digital passes',
      sub: approved ? `${plural(b.promoters.length, 'pass', 'passes')} issued` : rejected ? (b.refundedAt ? 'Not issued · payment refunded' : 'Not issued') : 'After approval',
      state: approved ? 'done' : 'todo',
    },
  ];
  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <li key={it.title} className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              it.state === 'done' && 'bg-brand-600 text-white',
              it.state === 'active' && 'bg-accent-500 text-white shadow-md shadow-accent-500/30',
              it.state === 'bad' && 'bg-slate-500 text-white',
              it.state === 'todo' && 'bg-sand-200 text-ink-mute',
            )}
          >
            <it.icon className="h-4 w-4" />
          </span>
          <div>
            <p className={cn('text-sm font-bold', it.state === 'todo' ? 'text-ink-mute' : 'text-ink')}>{it.title}</p>
            <p className="text-xs text-ink-mute">{it.sub}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EmailLabel() {
  return (
    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-mute">
      <Mail className="h-3.5 w-3.5" /> Notification received
    </p>
  );
}

function BookingCard({ b, defaultOpen }: { b: Booking; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <Card className={cn('overflow-hidden', b.status === 'awaiting_payment' && 'ring-2 ring-accent-400/60')}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 text-left transition hover:bg-sand-50 sm:px-6" aria-expanded={open}>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[15px] font-extrabold text-ink">{b.ref}</span>
            <BookingStatusPill status={b.status} size="sm" />
          </div>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {targetLabel(b)} <span className="font-normal text-ink-mute">· {PROMOTION_LABEL[b.type]}</span>
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-ink">{fmtRange(b.startDate, b.endDate)}</p>
          <p className="text-xs text-ink-mute">{fmtTimeRange(b.startTime, b.endTime)}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-extrabold text-ink">{naira(b.total)}</p>
          <p className="text-xs text-ink-mute">incl. VAT</p>
        </div>
        {b.status === 'awaiting_payment' && <span className="rounded-full bg-accent-500 px-3 py-1 text-xs font-bold text-white">Pay now</span>}
        <ChevronDown className={cn('h-5 w-5 text-ink-mute transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-6 border-t border-line bg-sand-50/50 px-5 py-6 sm:px-6">
          <JourneySteps current={stepForBooking(b)} rejected={b.status === 'rejected'} type={b.type} />
          <Timeline b={b} />

          {b.status === 'awaiting_payment' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
              <div className="flex gap-3 rounded-2xl border border-st-pending/40 bg-st-pending-soft/50 p-5 text-sm leading-relaxed text-st-pending-ink">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  <b>Payment is the next step.</b> AICL has been notified of your request and the space is on hold for you. Pay online and AICL will then approve or reject the request — if it is
                  rejected, you are refunded in full.
                </p>
              </div>
              <div className="h-fit rounded-2xl border border-accent-300 bg-accent-50 p-5">
                <p className="text-sm font-bold text-accent-700">Complete payment</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">{naira(b.total)}</p>
                <p className="mt-1 text-xs text-ink-soft">Card or bank transfer · incl. 7.5% VAT</p>
                <Button to={`/pay/${b.ref}`} variant="accent" size="lg" full className="mt-4" iconRight={<ArrowRight className="h-4 w-4" />}>
                  Pay Now
                </Button>
              </div>
            </div>
          )}

          {b.status === 'in_review' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
              <div>
                <EmailLabel />
                <ReceiptEmail b={b} />
              </div>
              <div className="h-fit rounded-2xl border border-st-pending/40 bg-st-pending-soft/50 p-5 text-sm leading-relaxed text-st-pending-ink">
                <p className="flex items-center gap-2 font-bold">
                  <Clock className="h-4 w-4" /> Waiting for AICL
                </p>
                <p className="mt-2">
                  Your payment is received and the space is on hold. AICL will <b>approve</b> or <b>reject</b> the request — you'll get an email and a notification here as soon as they do.
                </p>
              </div>
            </div>
          )}

          {b.status === 'approved' && (
            <>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
                <div>
                  <EmailLabel />
                  <ApprovalEmail b={b} />
                </div>
                <div className="h-fit rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-st-booked-soft text-st-booked">
                      <QrCode className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">Confirmed · {plural(b.promoters.length, 'pass', 'passes')} ready</p>
                      <p className="text-xs text-ink-mute">
                        Receipt {b.receiptNo} · paid {b.paidAt ? fmtDateTime(b.paidAt) : ''} by {b.paymentMethod === 'transfer' ? 'bank transfer' : 'card'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2.5">
                    <Button to={`/passes/${b.ref}`} size="md" full icon={<Ticket className="h-4 w-4" />}>
                      View digital passes
                    </Button>
                    <Button variant="outline" size="md" full icon={<Mail className="h-4 w-4" />} onClick={() => setEmailOpen(true)}>
                      View passes email
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {b.status === 'rejected' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
              <div>
                <EmailLabel />
                <RejectionEmail b={b} />
              </div>
              <div className="h-fit space-y-4">
                {b.refundRef && (
                  <div className="rounded-2xl border border-st-available/30 bg-st-available-soft/60 p-5 text-sm text-st-available-ink">
                    <p className="flex items-center gap-2 font-bold">
                      <RotateCcw className="h-4 w-4" /> Payment refunded
                    </p>
                    <p className="mt-1.5 leading-snug">
                      {naira(b.total)} is on its way back to your original payment method (ref <span className="font-mono">{b.refundRef}</span>), usually within 3–5 working days.
                    </p>
                  </div>
                )}
                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    <AlertCircle className="h-4 w-4 text-slate-500" /> What you can do
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                    <li>• Adjust the dates, location or activity</li>
                    <li>• Submit a fresh request</li>
                    <li>• Contact AICL with questions</li>
                  </ul>
                  <Button to="/plan" variant="primary" full className="mt-4">
                    Plan a new promotion
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Passes email" size="lg">
        <PassesEmail b={b} />
      </Modal>
    </Card>
  );
}

export default function MyBookings() {
  return (
    <RoleGate need="business">
      <Inner />
    </RoleGate>
  );
}

function Inner() {
  const { myBookings } = useStore();
  const [tab, setTab] = useState<Tab>('all');

  const sorted = useMemo(() => [...myBookings].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [myBookings]);
  const counts = useMemo(() => {
    const c: Record<BookingStatus, number> = { awaiting_payment: 0, in_review: 0, approved: 0, rejected: 0 };
    for (const b of myBookings) c[b.status]++;
    return c;
  }, [myBookings]);
  const list = tab === 'all' ? sorted : sorted.filter((b) => b.status === tab);

  return (
    <>
      <PageHeader
        title="My Bookings"
        lead="Follow each promotion request from payment to AICL's decision and your digital passes."
        actions={
          <Button to="/plan" variant="accent" iconRight={<ArrowRight className="h-4 w-4" />}>
            New promotion
          </Button>
        }
      />
      <Container className="space-y-6 py-8">
        {counts.awaiting_payment > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-4 text-white shadow-lg shadow-accent-600/20">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6" />
              <p className="font-semibold">
                {plural(counts.awaiting_payment, 'request')} waiting for payment — pay now so AICL can review {counts.awaiting_payment === 1 ? 'it' : 'them'}.
              </p>
            </div>
            <Button variant="light" size="sm" onClick={() => setTab('awaiting_payment')}>
              Show unpaid
            </Button>
          </div>
        )}

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'all', label: 'All', count: myBookings.length },
            { id: 'awaiting_payment', label: 'Awaiting payment', count: counts.awaiting_payment },
            { id: 'in_review', label: 'Pending approval', count: counts.in_review },
            { id: 'approved', label: 'Approved', count: counts.approved },
            { id: 'rejected', label: 'Rejected', count: counts.rejected },
          ]}
        />

        {list.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-6 w-6" />}
            title="No bookings here yet"
            body="Requests you submit will appear here, with their status and any notifications from AICL."
            action={<Button to="/plan">Plan a promotion</Button>}
          />
        ) : (
          <div className="space-y-4">
            {list.map((b, i) => (
              <BookingCard key={`${tab}-${b.ref}`} b={b} defaultOpen={i === 0 || b.status === 'awaiting_payment' || (tab !== 'all' && list.length <= 2)} />
            ))}
          </div>
        )}
        <p className="text-center text-xs text-ink-mute">
          Need help? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-600">
            {CONTACT_EMAIL}
          </a>{' '}
          or call{' '}
          <a href={CONTACT_PHONE_HREF} className="font-semibold text-brand-600">
            {CONTACT_PHONE}
          </a>
        </p>
      </Container>
    </>
  );
}
