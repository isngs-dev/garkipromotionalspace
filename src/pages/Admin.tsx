import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Banknote, ClipboardList, Gauge, Search, TrendingUp } from 'lucide-react';
import type { Booking, BookingStatus } from '../types';
import { SPACES } from '../data/spaces';
import { useStore } from '../store/StoreProvider';
import { RoleGate } from '../components/layout/RoleGate';
import { BookingStatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Card, Container, EmptyState, PageHeader, Tabs } from '../components/ui/misc';
import { occupancyPct } from '../lib/availability';
import { fmtRange, fmtShort, monthKey, shortMonth, timeAgo, todayISO, addDays, fromISO } from '../lib/dates';
import { cn, naira, nairaCompact, plural } from '../lib/format';
import { targetShort } from '../lib/passes';
import { MonthRevenueModal, type MonthRevenue } from '../components/admin/MonthRevenueModal';

/** pending = paid & waiting for an AICL decision · paid = payments received · awaiting = not paid yet */
type Tab = 'pending' | 'approved' | 'rejected' | 'paid' | 'awaiting';

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  sub: string;
  tone: 'brand' | 'accent' | 'green' | 'amber';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    accent: 'bg-accent-100 text-accent-700',
    green: 'bg-st-available-soft text-st-available-ink',
    amber: 'bg-st-pending-soft text-st-pending-ink',
  } as const;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[34px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-[13px] text-ink-soft">{sub}</p>
    </Card>
  );
}

export default function Admin() {
  return (
    <RoleGate need="admin">
      <Inner />
    </RoleGate>
  );
}

const TAB_FILTER: Record<Tab, (b: Booking) => boolean> = {
  pending: (b) => b.status === 'in_review',
  approved: (b) => b.status === 'approved',
  rejected: (b) => b.status === 'rejected',
  paid: (b) => !!b.paidAt && b.status !== 'rejected', // payments received (refunded ones excluded)
  awaiting: (b) => b.status === 'awaiting_payment',
};

function Inner() {
  const { bookings, history } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const [q, setQ] = useState('');
  const today = todayISO();
  const thisMonth = monthKey(today);

  const stats = useMemo(() => {
    const monthReq = bookings.filter((b) => monthKey(b.submittedAt.slice(0, 10)) === thisMonth);
    const approved = bookings.filter((b) => b.status === 'approved');
    const inReview = bookings.filter((b) => b.status === 'in_review');
    const awaiting = bookings.filter((b) => b.status === 'awaiting_payment');
    // Revenue is recognised once AICL approves; money paid but not yet approved is "held"
    const revenueMonth = approved.filter((b) => b.paidAt && monthKey(b.paidAt.slice(0, 10)) === thisMonth).reduce((n, b) => n + b.subtotal, 0);
    const heldValue = inReview.reduce((n, b) => n + b.subtotal, 0);
    const awaitingValue = awaiting.reduce((n, b) => n + b.subtotal, 0);
    const occ = occupancyPct(SPACES, bookings, today, 14);
    return {
      monthReq: monthReq.length,
      inReview: inReview.length,
      awaitingPay: awaiting.length,
      approved: approved.length,
      revenueMonth,
      heldValue,
      awaitingValue,
      occ,
    };
  }, [bookings, thisMonth, today]);

  // Monthly revenue: 3 previous months from rental history + current month from approved (paid) bookings.
  const revenueByMonth = useMemo<MonthRevenue[]>(() => {
    const d = fromISO(today);
    const months: MonthRevenue[] = [-3, -2, -1, 0].map((o) => {
      const m = new Date(d.getFullYear(), d.getMonth() + o, 1);
      return { key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, label: shortMonth(m.getMonth()), value: 0, current: o === 0, items: [] };
    });
    for (const h of history) {
      const m = months.find((x) => x.key === monthKey(h.startDate));
      if (m && !m.current) {
        const amount = h.days * h.rate;
        m.value += amount;
        m.items.push({ targetId: h.spaceId, type: 'space', brand: h.brand, date: h.startDate, startDate: h.startDate, endDate: h.endDate, days: h.days, amount });
      }
    }
    const cur = months[3];
    for (const b of bookings) {
      if (b.status === 'approved' && b.paidAt && monthKey(b.paidAt.slice(0, 10)) === cur.key) {
        cur.value += b.subtotal;
        cur.items.push({ targetId: b.targetId, type: b.type, brand: b.company, date: b.paidAt.slice(0, 10), startDate: b.startDate, endDate: b.endDate, days: b.days, amount: b.subtotal });
      }
    }
    return months;
  }, [history, bookings, today]);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const maxRev = Math.max(1, ...revenueByMonth.map((m) => m.value));
  const mtdVsLast = revenueByMonth[2].value ? Math.round((revenueByMonth[3].value / revenueByMonth[2].value) * 100) : 0;

  const counts = useMemo(() => {
    const c: Record<BookingStatus, number> = { awaiting_payment: 0, in_review: 0, approved: 0, rejected: 0 };
    for (const b of bookings) c[b.status]++;
    return c;
  }, [bookings]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bookings
      .filter((b) => TAB_FILTER[tab](b))
      .filter((b) => !needle || b.company.toLowerCase().includes(needle) || b.ref.toLowerCase().includes(needle) || targetShort(b).toLowerCase().includes(needle))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [bookings, tab, q]);

  const open = (b: Booking) => navigate(`/admin/requests/${b.ref}`);

  return (
    <>
      <PageHeader
        title="Promotion requests"
        lead="Brands pay when they request a space. Review paid requests, approve or reject them, and track the revenue Garki Market earns from promotions."
        actions={
          <Button to="/plan" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
            View floor plan
          </Button>
        }
      />
      <Container className="space-y-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={ClipboardList} tone="brand" label="Requests this month" value={String(stats.monthReq)} sub={`${stats.inReview} to review · ${stats.awaitingPay} awaiting payment`} />
          <Metric icon={BadgeCheck} tone="green" label="Approved bookings" value={String(stats.approved)} sub={`${stats.inReview} paid and waiting for your decision`} />
          <Metric icon={Banknote} tone="accent" label="Revenue this month" value={nairaCompact(stats.revenueMonth)} sub={`${naira(stats.heldValue)} more held pending approval`} />
          <Metric icon={Gauge} tone="amber" label="Occupancy · next 14 days" value={`${stats.occ.confirmed}%`} sub={`${stats.occ.withPending}% incl. pending requests`} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">Promotion revenue by month</h2>
                <p className="text-xs text-ink-mute">Excl. VAT · current month is month-to-date · tap a bar for the space-wise breakdown</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-700">
                <TrendingUp className="h-3.5 w-3.5" /> {mtdVsLast}% of {revenueByMonth[2].label} so far
              </span>
            </div>
            <svg viewBox="0 0 520 190" className="mt-4 w-full" role="img" aria-label="Revenue by month">
              {[0, 0.5, 1].map((t) => (
                <g key={t}>
                  <line x1="40" x2="510" y1={150 - t * 120} y2={150 - t * 120} stroke="#e2e8f0" strokeDasharray={t ? '3 4' : undefined} />
                  <text x="34" y={154 - t * 120} textAnchor="end" fontSize="10" fill="#64748b">
                    {t ? nairaCompact(maxRev * t) : '₦0'}
                  </text>
                </g>
              ))}
              {revenueByMonth.map((m, i) => {
                const h = (m.value / maxRev) * 120;
                const x = 70 + i * 115;
                return (
                  <g
                    key={m.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`${m.label} revenue ${nairaCompact(m.value)} — show breakdown by space`}
                    onClick={() => setOpenMonth(m.key)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpenMonth(m.key))}
                    className="group cursor-pointer outline-none"
                  >
                    <rect x={x - 10} y={20} width="90" height="150" fill="transparent" />
                    <rect x={x} y={150 - h} width="70" height={h} rx="8" fill={m.current ? '#059669' : '#3b82f6'} opacity={m.current ? 1 : 0.9} className="transition group-hover:opacity-70 group-focus-visible:opacity-70" />
                    <text x={x + 35} y={142 - h} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f1f3d">
                      {nairaCompact(m.value)}
                    </text>
                    <text x={x + 35} y={170} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
                      {m.label}
                      {m.current ? ' (now)' : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Card>
          <MonthRevenueModal month={revenueByMonth.find((m) => m.key === openMonth) ?? null} onClose={() => setOpenMonth(null)} />

          <Card className="p-5">
            <h2 className="text-sm font-bold text-ink">Pipeline value</h2>
            <p className="text-xs text-ink-mute">From request to revenue (excl. VAT)</p>
            <ul className="mt-4 space-y-4">
              {[
                { l: 'Awaiting payment', n: counts.awaiting_payment, v: stats.awaitingValue, c: 'bg-st-pending/60' },
                { l: 'Paid · pending your approval', n: counts.in_review, v: stats.heldValue, c: 'bg-st-pending' },
                { l: 'Approved · revenue this month', n: counts.approved, v: stats.revenueMonth, c: 'bg-st-booked' },
              ].map((r) => {
                const max = Math.max(stats.heldValue, stats.awaitingValue, stats.revenueMonth, 1);
                return (
                  <li key={r.l}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-ink">{r.l}</span>
                      <span className="font-extrabold text-ink">{naira(r.v)}</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sand-200">
                      <div className={cn('h-full rounded-full transition-all duration-700', r.c)} style={{ width: `${Math.max(3, (r.v / max) * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-ink-mute">{plural(r.n, 'booking')}</p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { id: 'pending', label: 'Pending', count: counts.in_review },
                { id: 'approved', label: 'Approved', count: counts.approved },
                { id: 'rejected', label: 'Rejected', count: counts.rejected },
                { id: 'paid', label: 'Paid', count: bookings.filter(TAB_FILTER.paid).length },
                { id: 'awaiting', label: 'Awaiting payment', count: counts.awaiting_payment },
              ]}
            />
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company, reference or space"
                className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title={tab === 'pending' ? 'Inbox zero — nothing waiting for a decision' : 'No requests in this tab'}
                body={tab === 'pending' ? 'Requests appear here once the business has paid, ready for you to approve or reject.' : 'Requests will appear here as they move through the flow.'}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-sand-50 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Space / Zone</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Promoters</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((b) => (
                    <tr key={b.ref} onClick={() => open(b)} className="cursor-pointer transition hover:bg-brand-50/50">
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] font-bold text-ink">{b.ref}</td>
                      <td className="px-4 py-3.5">
                        <span className="block font-semibold text-ink">{b.company}</span>
                        <span className="block text-xs text-ink-mute">{b.activity}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[13px] font-bold text-ink-soft">{targetShort(b)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-ink-soft">{fmtRange(b.startDate, b.endDate)}</td>
                      <td className="px-4 py-3.5 text-ink-soft">{b.promoters.length}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-ink">{naira(b.total)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-ink-mute">{timeAgo(b.submittedAt)}</td>
                      <td className="px-4 py-3.5">
                        <BookingStatusPill status={b.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
                          {b.status === 'in_review' ? 'Review' : 'Open'} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <p className="text-center text-xs text-ink-mute">
          Occupancy is measured over {fmtShort(today)} – {fmtShort(addDays(today, 13))} across {SPACES.filter((s) => !s.blocked).length} bookable spaces.
        </p>
      </Container>
    </>
  );
}
