import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Copy, CreditCard, Eye, Mail, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/StoreProvider';
import { PROMOTION_LABEL } from '../data/constants';
import { JourneySteps } from '../components/ui/JourneySteps';
import { Button } from '../components/ui/Button';
import { BookingStatusPill } from '../components/ui/StatusPill';
import { Modal } from '../components/ui/Modal';
import { Card, Container, KV } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { RequestSubmittedEmail } from '../components/booking/emails';
import { BookingPreview } from '../components/booking/BookingPreview';
import { fmtDateTime } from '../lib/dates';
import { naira } from '../lib/format';
import { targetLabel } from '../lib/passes';

const NEXT = [
  { t: 'Pay now', d: 'Pay online by card or bank transfer. Your space stays on hold while AICL reviews.' },
  { t: 'Track it in My Bookings', d: 'Follow the status of your request and read every notification from AICL.' },
  { t: 'AICL approves or rejects', d: 'Usually within one business day. If it is rejected, your payment is refunded in full.' },
  { t: 'Receive your digital passes', d: 'Once approved, the space turns red (Booked) and one QR pass per promoter is emailed to you.' },
];

export default function Confirmation() {
  const { ref } = useParams();
  const { getBooking, setRole } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const b = ref ? getBooking(ref) : undefined;
  if (!b) return <Navigate to="/my-bookings" replace />;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(b.ref);
    } catch {
      /* clipboard may be unavailable (non-secure context) */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const goAdmin = () => {
    setRole('admin');
    toast({ kind: 'info', title: 'Now viewing as AICL Admin', body: 'Open the request to approve or reject it.' });
    navigate(`/admin/requests/${b.ref}`);
  };

  return (
    <Container className="max-w-[1000px] py-10">
      <JourneySteps current={3} type={b.type} className="mb-10" />

      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 px-6 py-10 text-center text-white sm:px-10">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <span className="pulse-ring absolute inset-0 rounded-full bg-white/30" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg">
              <Check className="draw-check h-8 w-8" strokeWidth={3.5} />
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Request submitted</h1>
          <p className="mx-auto mt-2 max-w-lg text-brand-100">
            Thank you, {b.contactName.split(' ')[0]}. Pay now so AICL can review and approve your request.
          </p>
          <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-inset ring-white/20 backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-200">Reference</span>
            <span className="font-mono text-xl font-extrabold tracking-wide">{b.ref}</span>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/25"
              aria-label="Copy reference number"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-ink-soft">Status</span>
              <BookingStatusPill status={b.status} />
            </div>

            <div className="flex gap-3 rounded-2xl border border-st-pending/40 bg-st-pending-soft/50 p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-st-pending-ink" />
              <div className="text-sm leading-relaxed text-st-pending-ink">
                <b>AICL representatives have been notified by email.</b> After you pay, they will approve or reject your request and we'll email you at <b>{b.email}</b>.
                <button onClick={() => setShowEmail(true)} className="mt-2 flex items-center gap-1.5 font-semibold underline decoration-st-pending-ink/40 underline-offset-2 hover:decoration-st-pending-ink">
                  <Eye className="h-4 w-4" /> View the email sent to AICL
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl bg-sand-50 p-5">
              <KV k="Promotion type" v={PROMOTION_LABEL[b.type]} />
              <KV k={b.type === 'space' ? 'Space' : 'Zone'} v={targetLabel(b)} />
              <KV k="Company" v={b.company} />
              <KV k="Contact" v={b.contactName} />
              <KV k="Submitted" v={fmtDateTime(b.submittedAt)} />
              <KV k="Total (incl. VAT)" v={naira(b.total)} />
            </dl>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-mute">What happens next</h2>
            <ol className="mt-4 space-y-5">
              {NEXT.map((n, i) => (
                <li key={n.t} className="relative flex gap-4">
                  {i < NEXT.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-4px)] w-px bg-line" aria-hidden />}
                  <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-accent-500 text-white' : 'bg-sand-200 text-ink-mute'}`}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-bold text-ink">{n.t}</p>
                    <p className="mt-0.5 text-sm leading-snug text-ink-soft">{n.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="border-t border-line px-6 py-8 sm:px-8">
          <BookingPreview b={b} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sand-50 px-6 py-4 sm:px-8">
          <div className="flex flex-wrap gap-3">
            {b.status === 'awaiting_payment' && (
              <Button to={`/pay/${b.ref}`} variant="accent" size="lg" icon={<CreditCard className="h-5 w-5" />}>
                Pay Now · {naira(b.total)}
              </Button>
            )}
            <Button to="/my-bookings" variant={b.status === 'awaiting_payment' ? 'outline' : 'primary'} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Go to My Bookings
            </Button>
          </div>
          <Link to="/plan" className="text-sm font-semibold text-brand-600 hover:underline">
            Plan another promotion
          </Link>
        </div>
      </Card>

      {/* Presenter hint */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-brand-300 bg-brand-50/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-brand-600" />
          <div>
            <p className="text-sm font-bold text-brand-900">Demo tip: after paying, play the AICL reviewer</p>
            <p className="text-sm text-brand-800/80">Once the payment is made, switch the role in the header to approve or reject the request and watch the business side update.</p>
          </div>
        </div>
        <Button variant="accent" size="sm" onClick={goAdmin}>
          Switch to AICL Admin
        </Button>
      </div>

      <Modal open={showEmail} onClose={() => setShowEmail(false)} title="Email sent to AICL" subtitle="This is what the AICL promotions team received." size="lg">
        <RequestSubmittedEmail b={b} onReview={goAdmin} />
      </Modal>
    </Container>
  );
}
