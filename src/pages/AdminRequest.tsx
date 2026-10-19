import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, ChevronRight, CreditCard, Eye, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { useStore } from '../store/StoreProvider';
import { spaceById, zoneById } from '../data/spaces';
import { DEMO_BUSINESS_ID, PROMOTION_LABEL } from '../data/constants';
import { RoleGate } from '../components/layout/RoleGate';
import { JourneySteps, stepForBooking } from '../components/ui/JourneySteps';
import { Button } from '../components/ui/Button';
import { BookingStatusPill } from '../components/ui/StatusPill';
import { Modal } from '../components/ui/Modal';
import { Photo } from '../components/ui/Photo';
import { TextAreaField } from '../components/ui/Field';
import { Card, Container, KV } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { ApprovalEmail, RejectionEmail } from '../components/booking/emails';
import { isRangeFree, zoneRemainingForRange } from '../lib/availability';
import { fmtDateTime, fmtRange, fmtTimeRange } from '../lib/dates';
import { naira, plural } from '../lib/format';
import { targetLabel } from '../lib/passes';
import { minLen } from '../lib/validation';

const REASONS = [
  'The requested location is not available on those dates (maintenance / reserved by AICL).',
  'This type of activity is not permitted in the requested area. Please choose another location.',
  'Some information is incomplete or unclear. Please resubmit with full details.',
  'The product category conflicts with AICL promotional guidelines for the market.',
];

export default function AdminRequest() {
  return (
    <RoleGate need="admin">
      <Inner />
    </RoleGate>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">{title}</h2>
      {children}
    </Card>
  );
}

function Inner() {
  const { ref } = useParams();
  const { bookings, getBooking, approveBooking, rejectBooking, setRole } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const b = ref ? getBooking(ref) : undefined;

  const [modal, setModal] = useState<'approve' | 'reject' | 'email' | null>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [justDecided, setJustDecided] = useState(false);

  if (!b) return <Navigate to="/admin" replace />;

  const space = b.type === 'space' ? spaceById(b.targetId) : undefined;
  const zone = b.type === 'mobile' ? zoneById(b.targetId) : undefined;

  // Availability check (ignoring this booking itself)
  const conflict =
    b.status === 'rejected'
      ? null
      : space
        ? !isRangeFree(space, bookings, b.startDate, b.endDate, b.ref)
        : zone
          ? zoneRemainingForRange(zone, bookings.filter((x) => x.ref !== b.ref), b.startDate, b.endDate) < b.promoters.length
          : false;

  const doApprove = () => {
    approveBooking(b.ref, note);
    setModal(null);
    setJustDecided(true);
    toast({ kind: 'email', title: 'Request approved', body: `Booking confirmed — approval email and passes sent to ${b.email}.` });
  };

  const doReject = () => {
    if (!minLen(reason, 10)) {
      setReasonErr('Please give the business a clear reason (at least 10 characters).');
      return;
    }
    rejectBooking(b.ref, reason);
    setModal(null);
    setJustDecided(true);
    toast({ kind: 'email', title: 'Request rejected', body: `${b.paidAt ? 'Refund initiated. ' : ''}Rejection email with your reason sent to ${b.email}.` });
  };

  const switchToBusiness = () => {
    setRole('business');
    navigate('/my-bookings');
  };

  const decided = b.status === 'approved' || b.status === 'rejected';

  return (
    <Container className="py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link to="/admin" className="inline-flex items-center gap-1.5 font-medium hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Promotion requests
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-mono font-semibold text-ink">{b.ref}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-extrabold tracking-tight text-ink">{b.ref}</h1>
            <BookingStatusPill status={b.status} />
          </div>
          <p className="mt-1 text-ink-soft">
            {b.company} · submitted {fmtDateTime(b.submittedAt)}
          </p>
        </div>
        <p className="text-right">
          <span className="block text-3xl font-extrabold tracking-tight text-ink">{naira(b.total)}</span>
          <span className="text-xs text-ink-mute">incl. 7.5% VAT</span>
        </p>
      </div>

      <JourneySteps current={stepForBooking(b)} rejected={b.status === 'rejected'} type={b.type} className="mb-8 max-w-4xl" />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Section title="Promotion">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[200px_1fr]">
              <Photo src={space?.images[0] ?? zone?.image} alt="" className="h-36 rounded-xl sm:h-full sm:min-h-[140px]" />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <KV k="Type" v={PROMOTION_LABEL[b.type]} />
                <KV k={b.type === 'space' ? 'Space' : 'Zone'} v={targetLabel(b)} />
                <KV k="Activity" v={b.activity} />
                <KV k="Product / brand" v={b.product} />
                <KV k="Dates" v={`${fmtRange(b.startDate, b.endDate)} (${plural(b.days, 'day')})`} />
                <KV k="Time window" v={fmtTimeRange(b.startTime, b.endTime)} />
              </dl>
            </div>
            <div
              className={`mt-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
                conflict ? 'bg-st-booked-soft text-st-booked-ink' : 'bg-st-available-soft text-st-available-ink'
              }`}
            >
              {conflict ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              <p>
                <b>Availability check:</b>{' '}
                {b.status === 'rejected'
                  ? 'Rejected — the space was released.'
                  : conflict
                    ? 'Another booking overlaps these dates.'
                    : b.type === 'space'
                      ? `${b.targetId} is free for all requested dates.`
                      : `Zone ${zone!.code} has enough promoter slots for these dates.`}
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Section title="Company & contact">
              <dl className="grid gap-4">
                <KV k="Company" v={b.company} />
                <KV k="Contact person" v={b.contactName} />
                <KV k="Email" v={<a className="text-brand-600 hover:underline" href={`mailto:${b.email}`}>{b.email}</a>} />
                <KV k="Phone" v={b.phone} />
              </dl>
            </Section>
            <Section title="Pricing">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <dt>
                    {naira(b.unitPrice)} × {b.type === 'mobile' ? `${plural(b.promoters.length, 'promoter')} × ` : ''}
                    {plural(b.days, 'day')}
                  </dt>
                  <dd className="font-semibold text-ink">{naira(b.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <dt>VAT (7.5%)</dt>
                  <dd className="font-semibold text-ink">{naira(b.vat)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold text-ink">
                  <dt>Total</dt>
                  <dd>{naira(b.total)}</dd>
                </div>
              </dl>
            </Section>
          </div>

          <Section title={`Promoters (${b.promoters.length}) — one digital pass each`}>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand-50 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Mobile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {b.promoters.map((p, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-ink-mute">{i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold text-ink">{p.name}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{p.mobile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Additional requirements">
            <p className="text-sm leading-relaxed text-ink-soft">{b.requirements || 'None provided.'}</p>
          </Section>
        </div>

        {/* Decision panel */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-brand-800 px-5 py-3.5 text-white">
              <ShieldCheck className="h-4 w-4 text-accent-300" />
              <p className="text-sm font-bold">AICL decision</p>
            </div>
            <div className="space-y-4 p-5">
              {b.status === 'in_review' ? (
                <>
                  <div className="flex items-start gap-3 rounded-xl bg-st-available-soft/70 px-4 py-3 text-sm text-st-available-ink">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      <b>Payment received</b> — {naira(b.total)} {b.paidAt && `on ${fmtDateTime(b.paidAt)}`} by {b.paymentMethod === 'transfer' ? 'bank transfer' : 'card'} (receipt{' '}
                      <span className="font-mono">{b.receiptNo}</span>).
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Review the submitted information, then approve to confirm the booking and issue the passes, or reject with a reason (the payment is refunded).
                  </p>
                  <Button variant="success" size="lg" full icon={<Check className="h-5 w-5" />} onClick={() => { setNote(''); setModal('approve'); }}>
                    Approve request
                  </Button>
                  <Button variant="outline" size="lg" full className="border-st-booked/40 text-st-booked-ink hover:border-st-booked hover:bg-st-booked-soft" icon={<X className="h-5 w-5" />} onClick={() => { setReason(''); setReasonErr(''); setModal('reject'); }}>
                    Reject…
                  </Button>
                </>
              ) : b.status === 'awaiting_payment' ? (
                <>
                  <div className="flex items-center gap-3">
                    <BookingStatusPill status={b.status} />
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    The business has submitted this request but <b className="text-ink">has not paid yet</b>. Approval opens as soon as the payment of {naira(b.total)} is received — you will be
                    notified. The space is on hold for them in the meantime.
                  </p>
                  <Button variant="success" size="lg" full icon={<Check className="h-5 w-5" />} disabled>
                    Approve request
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <BookingStatusPill status={b.status} />
                    {b.decidedAt && <span className="text-xs text-ink-mute">{fmtDateTime(b.decidedAt)}</span>}
                  </div>
                  {b.decisionNote && (
                    <blockquote className="rounded-xl bg-sand-100 px-4 py-3 text-sm leading-relaxed text-ink-soft">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                        {b.status === 'rejected' ? 'Reason sent to business' : 'Message to business'}
                      </span>
                      {b.decisionNote}
                    </blockquote>
                  )}
                  {b.paidAt && (
                    <p className="text-sm text-ink-soft">
                      Paid {fmtDateTime(b.paidAt)} by {b.paymentMethod === 'transfer' ? 'bank transfer' : 'card'} · receipt <b className="font-mono">{b.receiptNo}</b>
                      {b.refundRef && (
                        <>
                          <br />
                          <b className="text-ink">Refunded</b> · <span className="font-mono">{b.refundRef}</span>
                        </>
                      )}
                    </p>
                  )}
                  <Button variant="outline" full icon={<Eye className="h-4 w-4" />} onClick={() => setModal('email')}>
                    View email sent to business
                  </Button>
                </>
              )}
            </div>
          </Card>

          {justDecided && decided && b.ownerId === DEMO_BUSINESS_ID && (
            <Card className="border-dashed border-brand-300 bg-brand-50/70 p-5">
              <p className="text-sm font-bold text-brand-900">Decision sent</p>
              <p className="mt-1 text-sm leading-snug text-brand-800/80">
                {b.status === 'approved'
                  ? 'Switch back to the business view to see the approval notification and the digital passes.'
                  : 'Switch to the business view to see the rejection notice, AICL’s reason and the refund.'}
              </p>
              <Button variant="accent" size="sm" className="mt-3" onClick={switchToBusiness}>
                Switch to Business
              </Button>
            </Card>
          )}
        </aside>
      </div>

      {/* Approve */}
      <Modal
        open={modal === 'approve'}
        onClose={() => setModal(null)}
        title="Approve this request?"
        subtitle={`${b.company} · ${targetLabel(b)} · ${fmtRange(b.startDate, b.endDate)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="success" icon={<Check className="h-4 w-4" />} onClick={doApprove}>
              Approve &amp; issue passes
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm leading-relaxed text-ink-soft">
          The business has already paid <b className="text-ink">{naira(b.total)}</b>. Approving confirms the booking: {targetLabel(b)} turns <b className="text-ink">Booked</b> on the floor plan
          and {plural(b.promoters.length, 'digital pass', 'digital passes')} {b.promoters.length === 1 ? 'is' : 'are'} issued to the promoters.
        </p>
        <TextAreaField id="note" label="Message to the business (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please keep chiller units inside your bay footprint." />
      </Modal>

      {/* Reject */}
      <Modal
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        title="Reject this request"
        subtitle="A reason is required — it is sent to the business by email, and their payment is refunded in full."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<X className="h-4 w-4" />} onClick={doReject}>
              Reject &amp; refund
            </Button>
          </>
        }
      >
        <p className="mb-2 text-[13px] font-semibold text-ink">Quick reasons</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setReason(r);
                setReasonErr('');
              }}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs font-medium text-ink-soft transition hover:border-brand-300 hover:bg-brand-50"
            >
              {r.split('.')[0].split('(')[0].trim()}
            </button>
          ))}
        </div>
        <TextAreaField
          id="reason"
          label="Reason / comment"
          required
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonErr) setReasonErr('');
          }}
          error={reasonErr}
          placeholder="Explain why this request can't be approved…"
        />
      </Modal>

      {/* Email preview */}
      <Modal open={modal === 'email'} onClose={() => setModal(null)} title="Email sent to business" size="lg">
        {b.status === 'rejected' ? <RejectionEmail b={b} /> : <ApprovalEmail b={b} withButton={false} />}
      </Modal>
    </Container>
  );
}
