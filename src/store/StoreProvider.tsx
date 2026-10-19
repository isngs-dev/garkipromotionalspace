import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppNotification, Booking, Draft, HistoryEntry, MobileZone, PaymentMethod, Promoter, PromotionType, Role, Space, TimeSlotId } from '../types';
import { spaceDayPrice, zoneDayPrice } from '../lib/pricing';
import { DEMO_BUSINESS_ID, slotById } from '../data/constants';
import { createSeed } from '../data/seed';
import { spaceById, zoneById } from '../data/spaces';
import { daysInRange, todayISO } from '../lib/dates';
import { priceBreakdown } from '../lib/format';
import { targetLabel } from '../lib/passes';

/**
 * In-memory "backend". Every mutation below is the single place a real API call would go later:
 *   submitBooking → POST /bookings (status awaiting_payment)   payBooking → POST /bookings/:ref/pay (→ in_review)
 *   approveBooking → POST /bookings/:ref/approve (→ approved, passes issued)
 *   rejectBooking → POST /bookings/:ref/reject (→ rejected, payment refunded)
 */

export interface BookingFormValues {
  type: PromotionType;
  targetId: string;
  startDate: string;
  endDate: string;
  slot: TimeSlotId;
  startTime: string;
  endTime: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  activity: string;
  product: string;
  promoters: Promoter[];
  requirements: string;
}

interface StoreValue {
  role: Role;
  setRole: (r: Role) => void;
  bookings: Booking[];
  history: HistoryEntry[];
  notifications: AppNotification[];
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  patchDraft: (p: Partial<Draft>) => void;
  getBooking: (ref: string) => Booking | undefined;
  myBookings: Booking[];
  submitBooking: (v: BookingFormValues) => Booking;
  approveBooking: (ref: string, note: string) => Booking | undefined;
  rejectBooking: (ref: string, reason: string) => Booking | undefined;
  payBooking: (ref: string, method: PaymentMethod) => Booking | undefined;
  markNotificationsRead: (audience: Role) => void;
  resetDemo: () => void;
  /** Bumped by resetDemo so pages can clear local state if they want to. */
  resetCount: number;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef(createSeed());
  const [role, setRole] = useState<Role>('business');
  const [bookings, setBookings] = useState<Booking[]>(initial.current.bookings);
  const [history, setHistory] = useState<HistoryEntry[]>(initial.current.history);
  const [notifications, setNotifications] = useState<AppNotification[]>(initial.current.notifications);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [resetCount, setResetCount] = useState(0);
  const seq = useRef(initial.current.nextSeq);
  const nid = useRef(1000);

  const notify = useCallback((n: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
    setNotifications((prev) => [
      { ...n, id: `n-${++nid.current}`, at: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const patchDraft = useCallback((p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d)), []);

  const getBooking = useCallback((ref: string) => bookings.find((b) => b.ref === ref), [bookings]);

  const submitBooking = useCallback(
    (v: BookingFormValues): Booking => {
      const target = v.type === 'space' ? spaceById(v.targetId) : zoneById(v.targetId);
      const unitPrice = v.type === 'space' ? spaceDayPrice(target as Space, v.slot) : zoneDayPrice(target as MobileZone, v.slot);
      const days = daysInRange(v.startDate, v.endDate);
      const pb = priceBreakdown(unitPrice, days, v.type === 'mobile' ? v.promoters.length : 1);
      const yymm = todayISO().slice(2, 4) + todayISO().slice(5, 7);
      const booking: Booking = {
        ref: `GKM-${yymm}-${seq.current++}`,
        ownerId: DEMO_BUSINESS_ID,
        type: v.type,
        targetId: v.targetId,
        startDate: v.startDate,
        endDate: v.endDate,
        slot: v.slot,
        startTime: v.startTime || slotById(v.slot).start,
        endTime: v.endTime || slotById(v.slot).end,
        company: v.company.trim(),
        contactName: v.contactName.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        activity: v.activity,
        product: v.product.trim(),
        promoters: v.promoters.map((p) => ({ name: p.name.trim(), mobile: p.mobile.trim() })),
        requirements: v.requirements.trim(),
        unitPrice,
        days,
        subtotal: pb.subtotal,
        vat: pb.vat,
        total: pb.total,
        status: 'awaiting_payment',
        submittedAt: new Date().toISOString(),
      };
      setBookings((prev) => [booking, ...prev]);
      notify({
        audience: 'admin',
        title: `New request ${booking.ref}`,
        body: `${booking.company} requested ${targetLabel(booking)} for ${days} day${days === 1 ? '' : 's'}.`,
        to: `/admin/requests/${booking.ref}`,
      });
      setDraft(null);
      return booking;
    },
    [notify],
  );

  const patchBooking = useCallback((ref: string, fn: (b: Booking) => Booking) => {
    setBookings((prev) => prev.map((b) => (b.ref === ref ? fn(b) : b)));
  }, []);

  const approveBooking = useCallback(
    (ref: string, note: string) => {
      const b = bookings.find((x) => x.ref === ref);
      if (!b || b.status !== 'in_review') return undefined;
      const updated: Booking = {
        ...b,
        status: 'approved',
        decidedAt: new Date().toISOString(),
        decisionNote: note.trim() || 'Approved. Your booking is confirmed and your digital passes have been issued.',
      };
      patchBooking(ref, () => updated);
      notify({
        audience: 'business',
        title: 'Booking approved — passes issued',
        body: `${ref} was approved by AICL. ${targetLabel(b)} is yours — your digital passes are ready.`,
        to: `/passes/${ref}`,
      });
      return updated;
    },
    [bookings, notify, patchBooking],
  );

  const rejectBooking = useCallback(
    (ref: string, reason: string) => {
      const b = bookings.find((x) => x.ref === ref);
      if (!b || (b.status !== 'in_review' && b.status !== 'awaiting_payment')) return undefined;
      const now = new Date().toISOString();
      const updated: Booking = {
        ...b,
        status: 'rejected',
        decidedAt: now,
        decisionNote: reason.trim(),
        // a paid request is refunded automatically
        ...(b.paidAt ? { refundedAt: now, refundRef: `RFD-${ref.slice(4)}` } : {}),
      };
      patchBooking(ref, () => updated);
      notify({
        audience: 'business',
        title: b.paidAt ? 'Request not approved — refund initiated' : 'Request not approved',
        body: `${ref} was rejected${b.paidAt ? ` and ₦${b.total.toLocaleString('en-NG')} is being refunded` : ''}. Tap to read AICL's reason.`,
        to: '/my-bookings',
      });
      return updated;
    },
    [bookings, notify, patchBooking],
  );

  const payBooking = useCallback(
    (ref: string, method: PaymentMethod) => {
      const b = bookings.find((x) => x.ref === ref);
      if (!b || b.status !== 'awaiting_payment') return undefined;
      const updated: Booking = {
        ...b,
        status: 'in_review',
        paidAt: new Date().toISOString(),
        paymentMethod: method,
        receiptNo: `RCT-${ref.slice(4)}`,
      };
      patchBooking(ref, () => updated);
      notify({
        audience: 'business',
        title: 'Payment received — awaiting AICL approval',
        body: `${ref}: we received ₦${updated.total.toLocaleString('en-NG')}. AICL will approve or reject your request shortly.`,
        to: '/my-bookings',
      });
      notify({
        audience: 'admin',
        title: `Payment received — review ${ref}`,
        body: `${b.company} paid ₦${updated.total.toLocaleString('en-NG')} for ${targetLabel(b)}. Approve or reject the request.`,
        to: `/admin/requests/${ref}`,
      });
      return updated;
    },
    [bookings, notify, patchBooking],
  );

  const markNotificationsRead = useCallback((audience: Role) => {
    setNotifications((prev) => prev.map((n) => (n.audience === audience ? { ...n, read: true } : n)));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = createSeed();
    seq.current = fresh.nextSeq;
    setBookings(fresh.bookings);
    setHistory(fresh.history);
    setNotifications(fresh.notifications);
    setDraft(null);
    setRole('business');
    setResetCount((c) => c + 1);
  }, []);

  const myBookings = useMemo(() => bookings.filter((b) => b.ownerId === DEMO_BUSINESS_ID), [bookings]);

  const value = useMemo<StoreValue>(
    () => ({
      role,
      setRole,
      bookings,
      history,
      notifications,
      draft,
      setDraft,
      patchDraft,
      getBooking,
      myBookings,
      submitBooking,
      approveBooking,
      rejectBooking,
      payBooking,
      markNotificationsRead,
      resetDemo,
      resetCount,
    }),
    [
      role,
      bookings,
      history,
      notifications,
      draft,
      patchDraft,
      getBooking,
      myBookings,
      submitBooking,
      approveBooking,
      rejectBooking,
      payBooking,
      markNotificationsRead,
      resetDemo,
      resetCount,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
