import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Booking } from '../../types';
import { AICL_EMAIL, PROMOTION_LABEL } from '../../data/constants';
import { EmailPreview } from '../ui/EmailPreview';
import { fmtDateTime, fmtRange, fmtTimeRange } from '../../lib/dates';
import { naira } from '../../lib/format';
import { passesFor, targetLabel } from '../../lib/passes';
import { Button } from '../ui/Button';

const FROM = `AICL Promotions <${AICL_EMAIL}>`;

function Summary({ b }: { b: Booking }) {
  const rows: Array<[string, ReactNode]> = [
    ['Reference', <b key="r" className="font-mono text-ink">{b.ref}</b>],
    ['Type', PROMOTION_LABEL[b.type]],
    [b.type === 'space' ? 'Space' : 'Zone', targetLabel(b)],
    ['Dates', fmtRange(b.startDate, b.endDate)],
    ['Time', fmtTimeRange(b.startTime, b.endTime)],
    ['Total (incl. VAT)', <b key="t" className="text-ink">{naira(b.total)}</b>],
  ];
  if (b.receiptNo) rows.push(['Receipt', <span key="rc" className="font-mono">{b.receiptNo}</span>]);
  return (
    <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-sand-50 px-4 py-3 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-mute">{k}</dt>
          <dd className="font-medium text-ink-soft">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Notification AICL representatives receive when a business submits a request. */
export function RequestSubmittedEmail({ b, onReview }: { b: Booking; onReview?: () => void }) {
  return (
    <EmailPreview from={`Garki Market Promotions <no-reply@garkimarket.example>`} to={`AICL Promotions Team <${AICL_EMAIL}>`} subject={`New promotion request ${b.ref} — ${b.company}`} time={fmtDateTime(b.submittedAt)}>
      <p>Hello AICL team,</p>
      <p>
        <b className="text-ink">{b.company}</b> has submitted a new request for {targetLabel(b)}. The business is completing payment now — you will be asked to approve or reject
        it as soon as the payment is received.
      </p>
      <Summary b={b} />
      <p>
        Contact: {b.contactName} · {b.email} · {b.phone}
        <br />
        Activity: {b.activity} — {b.product}
      </p>
      <div>
        <Button size="sm" onClick={onReview}>
          Open in AICL dashboard
        </Button>
      </div>
    </EmailPreview>
  );
}

/** Receipt the business gets right after paying — the request is now with AICL. */
export function ReceiptEmail({ b }: { b: Booking }) {
  return (
    <EmailPreview
      from={FROM}
      to={`${b.contactName} <${b.email}>`}
      subject={`Payment received — ${b.ref} is with AICL for approval`}
      time={b.paidAt ? fmtDateTime(b.paidAt) : undefined}
    >
      <p>Dear {b.contactName},</p>
      <p>
        Thank you — we have received your payment of <b className="text-ink">{naira(b.total)}</b>. AICL will now review your request and either <b className="text-ink">approve</b> it (your
        digital passes are then emailed to you) or <b className="text-ink">reject</b> it, in which case your payment is refunded in full.
      </p>
      <Summary b={b} />
      <p>You can follow progress at any time under My Bookings.</p>
      <p>Regards,
        <br />
        AICL Promotions Team</p>
    </EmailPreview>
  );
}

/** What the business receives once AICL approves the (already paid) request. */
export function ApprovalEmail({ b, withButton = true }: { b: Booking; withButton?: boolean }) {
  const passes = passesFor(b);
  return (
    <EmailPreview
      tone="good"
      from={FROM}
      to={`${b.contactName} <${b.email}>`}
      subject={`Approved: ${b.ref} is confirmed — your digital passes are ready`}
      time={b.decidedAt ? fmtDateTime(b.decidedAt) : undefined}
    >
      <p>Dear {b.contactName},</p>
      <p>
        Good news — AICL has <b className="text-st-available-ink">approved</b> your promotion request for {targetLabel(b)}. Your payment is confirmed, the space is booked for you and{' '}
        {passes.length} digital pass{passes.length === 1 ? ' is' : 'es are'} attached — one per promoter.
      </p>
      <Summary b={b} />
      {b.decisionNote && (
        <blockquote className="rounded-xl border-l-4 border-st-available bg-st-available-soft/60 px-4 py-2.5 text-[13px] text-st-available-ink">
          <span className="block text-[11px] font-bold uppercase tracking-wider opacity-70">Note from AICL</span>
          {b.decisionNote}
        </blockquote>
      )}
      {withButton && (
        <div>
          <Button to={`/passes/${b.ref}`} variant="accent" size="lg">
            View digital passes
          </Button>
        </div>
      )}
      <p>Regards,
        <br />
        AICL Promotions Team</p>
    </EmailPreview>
  );
}

export function RejectionEmail({ b }: { b: Booking }) {
  return (
    <EmailPreview
      tone="bad"
      from={FROM}
      to={`${b.contactName} <${b.email}>`}
      subject={`Update on your promotion request ${b.ref}`}
      time={b.decidedAt ? fmtDateTime(b.decidedAt) : undefined}
    >
      <p>Dear {b.contactName},</p>
      <p>
        Thank you for your interest in promoting at Garki Market. After review, AICL is unable to approve your request for {targetLabel(b)} ({fmtRange(b.startDate, b.endDate)}).
      </p>
      <blockquote className="rounded-xl border-l-4 border-slate-500 bg-slate-100 px-4 py-3 text-[13px] text-slate-800">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason from AICL</span>
        {b.decisionNote}
      </blockquote>
      {b.refundRef ? (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-[13px]">
          <b className="text-ink">Refund initiated:</b> {naira(b.total)} is being returned to your original payment method (reference{' '}
          <span className="font-mono text-ink">{b.refundRef}</span>). It usually appears within 3–5 working days.
        </p>
      ) : (
        <p>The space has been released and you have not been charged.</p>
      )}
      <p>You are welcome to submit a new request with adjusted dates, location or activity.</p>
      <div>
        <Button to="/plan" variant="primary" size="sm">
          Plan a new promotion
        </Button>
      </div>
      <p>Regards,
        <br />
        AICL Promotions Team</p>
    </EmailPreview>
  );
}

export function PassesEmail({ b }: { b: Booking }) {
  const passes = passesFor(b);
  return (
    <EmailPreview
      tone="good"
      from={FROM}
      to={`${b.contactName} <${b.email}>`}
      subject={`Your Garki Market digital passes — ${b.ref}`}
      time={b.decidedAt ? fmtDateTime(b.decidedAt) : undefined}
    >
      <p>Dear {b.contactName},</p>
      <p>
        AICL has approved your booking for {targetLabel(b)}. {passes.length} digital pass{passes.length === 1 ? ' is' : 'es are'} attached as PDF, one per promoter. Each
        person must show their QR pass at the gate.
      </p>
      <Summary b={b} />
      <ul className="space-y-1 text-[13px]">
        {passes.map((p) => (
          <li key={p.id} className="flex justify-between rounded-lg bg-sand-50 px-3 py-1.5">
            <span className="font-medium text-ink">{p.holder}</span>
            <span className="font-mono text-ink-mute">{p.id}.pdf</span>
          </li>
        ))}
      </ul>
      <div>
        <Link to={`/passes/${b.ref}`} className="text-sm font-semibold text-brand-600 hover:underline">
          View passes online →
        </Link>
      </div>
    </EmailPreview>
  );
}
