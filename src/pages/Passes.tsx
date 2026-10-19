import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CircleAlert, Download, Eye, Mail, MailCheck, ScanLine } from 'lucide-react';
import { useStore } from '../store/StoreProvider';
import { JourneySteps } from '../components/ui/JourneySteps';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card, Container, EmptyState } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { PassCard } from '../components/pass/PassCard';
import { PassesEmail } from '../components/booking/emails';
import { downloadAllPassPdfs, downloadPassPdf } from '../lib/pdf';
import { passesFor, targetLabel } from '../lib/passes';
import { fmtRange } from '../lib/dates';
import { plural } from '../lib/format';

export default function Passes() {
  const { ref } = useParams();
  const { getBooking } = useStore();
  const { toast } = useToast();
  const [emailOpen, setEmailOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const b = ref ? getBooking(ref) : undefined;
  if (!b) return <Navigate to="/my-bookings" replace />;

  if (b.status !== 'approved') {
    const copy =
      b.status === 'awaiting_payment'
        ? { title: 'Pay first, then AICL approves', body: 'Digital passes are issued once your request has been paid and approved by AICL.', to: `/pay/${b.ref}`, cta: 'Pay now' }
        : b.status === 'in_review'
          ? { title: 'Passes are issued once AICL approves', body: 'Your payment is received. You will be notified as soon as AICL approves your request — your passes appear here right away.', to: '/my-bookings', cta: 'Back to My Bookings' }
          : { title: 'This request was not approved', body: 'No passes were issued and your payment has been refunded.', to: '/my-bookings', cta: 'Back to My Bookings' };
    return (
      <Container className="py-20">
        <EmptyState icon={<CircleAlert className="h-6 w-6" />} title={copy.title} body={copy.body} action={<Button to={copy.to}>{copy.cta}</Button>} />
      </Container>
    );
  }

  const passes = passesFor(b);

  const run = async (key: string, fn: () => Promise<void>, okMsg: string) => {
    setBusy(key);
    try {
      await fn();
      toast({ kind: 'success', title: okMsg });
    } catch {
      toast({ kind: 'warning', title: 'Could not create the PDF', body: 'Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container className="py-10">
      <JourneySteps current={5} completeAll type={b.type} className="mx-auto mb-10 max-w-4xl" />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Your digital passes</h1>
          <p className="mt-1 text-ink-soft">
            {plural(passes.length, 'pass', 'passes')} for <b className="text-ink">{targetLabel(b)}</b> · {fmtRange(b.startDate, b.endDate)} · <span className="font-mono">{b.ref}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" icon={<ScanLine className="h-4 w-4" />} to="/gate-scan">
            Try the gate scan
          </Button>
          <Button
            variant="accent"
            icon={<Download className="h-4 w-4" />}
            loading={busy === 'all'}
            onClick={() => run('all', () => downloadAllPassPdfs(passes), 'All passes downloaded')}
          >
            Download all ({passes.length})
          </Button>
        </div>
      </div>

      <Card className="mb-8 flex flex-wrap items-center justify-between gap-4 border-st-available/30 bg-st-available-soft/50 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-st-available text-white">
            <MailCheck className="h-5 w-5" />
          </span>
          <p className="min-w-0 text-sm text-st-available-ink [overflow-wrap:anywhere]">
            <b>Approved &amp; emailed.</b> AICL approved your booking — a copy of every pass (PDF) was sent to <b>{b.email}</b>.
          </p>
        </div>
        <button onClick={() => setEmailOpen(true)} className="flex items-center gap-1.5 text-sm font-semibold text-st-available-ink underline underline-offset-2">
          <Eye className="h-4 w-4" /> View email
        </button>
      </Card>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {passes.map((p) => (
          <PassCard
            key={p.id}
            pass={p}
            className="mx-auto w-full max-w-[380px]"
            actions={
              <>
                <Button size="sm" variant="primary" full icon={<Download className="h-4 w-4" />} loading={busy === p.id} onClick={() => run(p.id, () => downloadPassPdf(p), 'Pass downloaded')}>
                  Download PDF
                </Button>
                <Link to={`/gate-scan?pass=${p.id}`} className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-semibold text-brand-600 hover:underline">
                  <ScanLine className="h-3.5 w-3.5" /> Scan this pass in the demo
                </Link>
              </>
            }
          />
        ))}
      </div>

      <p className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-mute">
        <Mail className="h-4 w-4" /> Each promoter must carry their own pass (printed or on their phone) and show it at the gate.
      </p>

      <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Email sent to your business" size="lg">
        <PassesEmail b={b} />
      </Modal>
    </Container>
  );
}
