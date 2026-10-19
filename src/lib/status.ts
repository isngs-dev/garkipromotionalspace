import type { BookingStatus, SpaceStatus } from '../types';

export interface StatusMeta {
  label: string;
  /** Pill: soft background + dark ink */
  pill: string;
  /** Solid dot / swatch */
  dot: string;
  /** Hex used in SVG */
  fill: string;
  stroke: string;
  ink: string;
  hint: string;
}

export const STATUS: Record<SpaceStatus, StatusMeta> = {
  available: {
    label: 'Available',
    pill: 'bg-st-available-soft text-st-available-ink ring-st-available/30',
    dot: 'bg-st-available',
    fill: '#22c55e',
    stroke: '#15803d',
    ink: '#ffffff',
    hint: 'Open for booking',
  },
  booked: {
    label: 'Booked',
    pill: 'bg-st-booked-soft text-st-booked-ink ring-st-booked/30',
    dot: 'bg-st-booked',
    fill: '#ef4444',
    stroke: '#b91c1c',
    ink: '#ffffff',
    hint: 'Paid and confirmed',
  },
  pending: {
    label: 'Pending Approval',
    pill: 'bg-st-pending-soft text-st-pending-ink ring-st-pending/40',
    dot: 'bg-st-pending',
    fill: '#fbbf24',
    stroke: '#b45309',
    ink: '#4a2a03',
    hint: 'Request awaiting AICL decision or payment',
  },
  blocked: {
    label: 'Unavailable',
    pill: 'bg-st-blocked-soft text-st-blocked-ink ring-st-blocked/40',
    dot: 'bg-st-blocked',
    fill: '#cbd5e1',
    stroke: '#64748b',
    ink: '#334155',
    hint: 'Blocked by AICL',
  },
};

export const STATUS_ORDER: SpaceStatus[] = ['available', 'pending', 'booked', 'blocked'];

/** Business booking status mapped onto the shared status colour system. */
export const BOOKING_STATUS: Record<
  BookingStatus,
  { label: string; pill: string; dot: string; tone: SpaceStatus | 'rejected' }
> = {
  // Requested but unpaid: the space is held, so it is amber like on the map.
  awaiting_payment: {
    label: 'Awaiting Payment',
    pill: STATUS.pending.pill,
    dot: STATUS.pending.dot,
    tone: 'pending',
  },
  // Paid, waiting for AICL: still amber (Pending Approval) on the map.
  in_review: {
    label: 'Pending Approval',
    pill: STATUS.pending.pill,
    dot: STATUS.pending.dot,
    tone: 'pending',
  },
  // Approved by AICL → the space is Booked (red).
  approved: {
    label: 'Approved · Booked',
    pill: STATUS.booked.pill,
    dot: STATUS.booked.dot,
    tone: 'booked',
  },
  // Rejected releases the space and refunds the payment; grey = not going ahead.
  rejected: {
    label: 'Rejected',
    pill: 'bg-slate-200 text-slate-700 ring-slate-400/40',
    dot: 'bg-slate-500',
    tone: 'rejected',
  },
};
