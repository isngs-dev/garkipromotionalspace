import type { AppNotification, Booking, BookingStatus, HistoryEntry, PaymentMethod, Promoter, TimeSlotId, MobileZone, Space } from '../types';
import { addDays, daysInRange, startOfMonth, todayISO } from '../lib/dates';
import { spaceDayPrice, zoneDayPrice } from '../lib/pricing';
import { priceBreakdown } from '../lib/format';
import { BRANDS, DEMO_BUSINESS_ID, DEMO_PERSONA, slotById } from './constants';
import { SPACES, spaceById, zoneById } from './spaces';

// ---------------------------------------------------------------------------------------------
// Everything is generated relative to "today" so the demo always looks current and every status
// (Available / Pending / Booked / Unavailable) is visible on the floor plan on first load.
// ---------------------------------------------------------------------------------------------

interface Company {
  contact: string;
  domain: string;
  phone: string;
  product: string;
}

const COMPANIES: Record<string, Company> = {
  'Kora Telecom': { contact: 'Tunde Bakare', domain: 'koratelecom', phone: '0803 412 0098', product: 'Kora 4G SIM & data bundles' },
  'Naija Fresh Dairy': { contact: 'Amina Yusuf', domain: 'naijafreshdairy', phone: '0805 773 2210', product: 'Fresh Strawberry Yoghurt 250ml' },
  'Sunrise Cosmetics': { contact: 'Ngozi Adeyemi', domain: 'sunrisecosmetics', phone: '0812 664 3301', product: 'Glow Shea Body Butter range' },
  BrightPay: { contact: 'Emeka Nwosu', domain: 'brightpay', phone: '0809 118 4477', product: 'BrightPay wallet app' },
  'Tasty Bites Noodles': { contact: 'Funke Adebayo', domain: 'tastybites', phone: '0816 290 5512', product: 'Tasty Bites Jollof Instant Noodles' },
  'MamaGold Rice': { contact: 'Ibrahim Sani', domain: 'mamagoldrice', phone: '0802 551 7843', product: 'MamaGold Parboiled Rice 5kg' },
  'Oba Detergents': { contact: 'Segun Ogunleye', domain: 'obadetergents', phone: '0807 338 9120', product: 'Oba Power Wash 1kg' },
  'Pulse Mobile': { contact: 'Hauwa Bello', domain: 'pulsemobile', phone: '0813 447 0069', product: 'Pulse Smartphones A-series' },
  'Halo Foods': { contact: 'Chukwudi Eze', domain: 'halofoods', phone: '0806 902 1135', product: 'Halo Plantain Chips' },
  'Amaka Skincare': { contact: 'Amaka Obi', domain: 'amakaskincare', phone: '0811 783 6624', product: 'Amaka Even-Tone Serum' },
  'Nuvo Insurance': { contact: 'Bola Lawal', domain: 'nuvoinsurance', phone: '0818 220 4358', product: 'Nuvo Micro-Insurance plans' },
  'Lagos Loop Telecom': { contact: 'Daniel Ekong', domain: 'lagosloop', phone: '0805 614 3382', product: 'Loop Home Wi-Fi Router' },
  'VoltPlus Batteries': { contact: 'Musa Danjuma', domain: 'voltplus', phone: '0803 099 7716', product: 'VoltPlus Solar Lanterns' },
  'Savanna Soap': { contact: 'Ruth Akpan', domain: 'savannasoap', phone: '0814 502 6671', product: 'Savanna Black Soap' },
  'QuickLoans Ltd': { contact: 'Peter Obasi', domain: 'quickloans', phone: '0809 771 0245', product: 'QuickLoans instant credit' },
};

const FIRST = ['Aisha', 'Chinedu', 'Folake', 'Garba', 'Ifeoma', 'Jide', 'Kemi', 'Lawal', 'Maryam', 'Nkechi', 'Obinna', 'Peace', 'Rasheed', 'Sade', 'Tobi', 'Uche', 'Yetunde', 'Zainab'];
const LAST = ['Adamu', 'Balogun', 'Chukwu', 'Dauda', 'Eze', 'Falana', 'Gbadamosi', 'Hassan', 'Idowu', 'Johnson', 'Kalu', 'Musa', 'Nnamdi', 'Okoro', 'Peters', 'Salisu', 'Thomas', 'Umar'];
const PREFIX = ['0803', '0805', '0806', '0810', '0813', '0816', '0902', '0703'];

function promotersFor(seed: number, n: number): Promoter[] {
  return Array.from({ length: n }, (_, i) => {
    const k = seed * 7 + i * 3;
    const tail = String(1000000 + ((k * 7919) % 8999999)).slice(0, 7);
    return {
      name: `${FIRST[k % FIRST.length]} ${LAST[(k * 5 + 2) % LAST.length]}`,
      mobile: `${PREFIX[k % PREFIX.length]} ${tail.slice(0, 3)} ${tail.slice(3, 7)}`,
    };
  });
}

interface SeedSpec {
  type: 'space' | 'mobile';
  target: string;
  from: number; // day offset from today
  len: number;
  status: BookingStatus;
  brand: string;
  activity: string;
  slot?: TimeSlotId;
  promoters?: number;
  agoHours?: number;
  note?: string;
  requirements?: string;
}

const Z = 'Zuma Beverages Ltd';

const SPECS: SeedSpec[] = [
  // ---- approved & booked (red on the map)
  { type: 'space', target: 'GM-PS-02', from: -2, len: 5, status: 'approved', brand: 'Kora Telecom', activity: 'Brand booth / kiosk' },
  { type: 'space', target: 'GM-PS-02', from: 6, len: 3, status: 'approved', brand: 'Kora Telecom', activity: 'Brand booth / kiosk' },
  { type: 'space', target: 'GM-PS-06', from: -1, len: 6, status: 'approved', brand: 'Naija Fresh Dairy', activity: 'Product sampling' },
  { type: 'space', target: 'GM-PS-06', from: 8, len: 3, status: 'approved', brand: 'Naija Fresh Dairy', activity: 'Product sampling' },
  { type: 'space', target: 'GM-PS-09', from: 0, len: 4, status: 'approved', brand: Z, activity: 'Product sampling', slot: 'peak', promoters: 3, agoHours: 120 },
  { type: 'space', target: 'GM-PS-12', from: -3, len: 5, status: 'approved', brand: 'Sunrise Cosmetics', activity: 'Product demonstration' },
  { type: 'space', target: 'GM-PS-12', from: 5, len: 3, status: 'approved', brand: 'Sunrise Cosmetics', activity: 'Product demonstration' },
  { type: 'space', target: 'GM-PS-16', from: 0, len: 7, status: 'approved', brand: 'VoltPlus Batteries', activity: 'Product display' },
  // ---- paid, waiting for AICL to approve or reject (amber)
  { type: 'space', target: 'GM-PS-03', from: 0, len: 2, status: 'in_review', brand: 'BrightPay', activity: 'Lead generation / sign-ups', slot: 'full', agoHours: 26 },
  { type: 'space', target: 'GM-PS-08', from: 0, len: 3, status: 'in_review', brand: 'Tasty Bites Noodles', activity: 'Product sampling', slot: 'peak', agoHours: 3, requirements: 'Gas cooker for noodle tasting; branded tasting cups; two foldable tables.' },
  { type: 'space', target: 'GM-PS-10', from: 5, len: 2, status: 'in_review', brand: Z, activity: 'Product sampling', slot: 'afternoon', promoters: 2, agoHours: 40 },
  { type: 'mobile', target: 'zone-b', from: 0, len: 2, status: 'in_review', brand: 'BrightPay', activity: 'Lead generation / sign-ups', promoters: 2, agoHours: 9 },
  // ---- requested, payment still due (amber)
  { type: 'space', target: 'GM-PS-15', from: 0, len: 2, status: 'awaiting_payment', brand: 'MamaGold Rice', activity: 'Product sampling', slot: 'full', agoHours: 52 },
  { type: 'space', target: 'GM-PS-17', from: 9, len: 2, status: 'awaiting_payment', brand: Z, activity: 'Product sampling', slot: 'peak', promoters: 3, agoHours: 30 },
  { type: 'mobile', target: 'zone-a', from: 7, len: 3, status: 'awaiting_payment', brand: 'Savanna Soap', activity: 'Flyer distribution', promoters: 3, agoHours: 22 },
  // ---- more approved bookings (future occupancy)
  { type: 'space', target: 'GM-PS-03', from: 4, len: 5, status: 'approved', brand: 'Lagos Loop Telecom', activity: 'Brand booth / kiosk' },
  { type: 'space', target: 'GM-PS-08', from: 5, len: 5, status: 'approved', brand: 'Halo Foods', activity: 'Product sampling' },
  { type: 'space', target: 'GM-PS-15', from: 4, len: 3, status: 'approved', brand: 'MamaGold Rice', activity: 'Product sampling' },
  { type: 'space', target: 'GM-PS-01', from: 3, len: 4, status: 'approved', brand: 'Oba Detergents', activity: 'Product display' },
  { type: 'space', target: 'GM-PS-01', from: 9, len: 4, status: 'approved', brand: 'Oba Detergents', activity: 'Product display' },
  { type: 'space', target: 'GM-PS-05', from: 2, len: 3, status: 'approved', brand: 'Pulse Mobile', activity: 'Brand booth / kiosk' },
  { type: 'space', target: 'GM-PS-05', from: 8, len: 4, status: 'approved', brand: 'Pulse Mobile', activity: 'Brand booth / kiosk' },
  { type: 'space', target: 'GM-PS-07', from: 2, len: 3, status: 'approved', brand: 'Amaka Skincare', activity: 'Product demonstration' },
  { type: 'space', target: 'GM-PS-07', from: 7, len: 7, status: 'approved', brand: 'Halo Foods', activity: 'Product sampling' },
  { type: 'space', target: 'GM-PS-10', from: 8, len: 5, status: 'approved', brand: 'Savanna Soap', activity: 'Product display' },
  { type: 'space', target: 'GM-PS-11', from: 1, len: 5, status: 'approved', brand: 'Nuvo Insurance', activity: 'Lead generation / sign-ups' },
  { type: 'space', target: 'GM-PS-11', from: 9, len: 5, status: 'approved', brand: 'Nuvo Insurance', activity: 'Lead generation / sign-ups' },
  { type: 'space', target: 'GM-PS-14', from: 4, len: 2, status: 'approved', brand: 'Amaka Skincare', activity: 'Product demonstration' },
  { type: 'space', target: 'GM-PS-14', from: 8, len: 3, status: 'approved', brand: 'Sunrise Cosmetics', activity: 'Product demonstration' },
  { type: 'space', target: 'GM-PS-17', from: 3, len: 4, status: 'approved', brand: 'Kora Telecom', activity: 'Brand booth / kiosk' },
  { type: 'space', target: 'GM-PS-18', from: 1, len: 3, status: 'approved', brand: 'Lagos Loop Telecom', activity: 'Brand booth / kiosk' },
  { type: 'space', target: 'GM-PS-18', from: 6, len: 4, status: 'approved', brand: 'Pulse Mobile', activity: 'Product display' },
  { type: 'space', target: 'GM-PS-20', from: 3, len: 6, status: 'approved', brand: 'VoltPlus Batteries', activity: 'Product demonstration' },
  { type: 'space', target: 'GM-PS-20', from: 10, len: 3, status: 'approved', brand: 'Oba Detergents', activity: 'Product display' },
  { type: 'space', target: 'GM-PS-16', from: 9, len: 4, status: 'approved', brand: 'Halo Foods', activity: 'Product sampling' },
  // ---- mobile
  { type: 'mobile', target: 'zone-a', from: -1, len: 4, status: 'approved', brand: 'Pulse Mobile', activity: 'Flyer distribution', promoters: 3 },
  { type: 'mobile', target: 'zone-a', from: 3, len: 3, status: 'approved', brand: 'Halo Foods', activity: 'Roaming product sampling', promoters: 2 },
  { type: 'mobile', target: 'zone-b', from: 0, len: 5, status: 'approved', brand: 'Naija Fresh Dairy', activity: 'Roaming product sampling', promoters: 4 },
  { type: 'mobile', target: 'zone-c', from: -2, len: 6, status: 'approved', brand: 'Kora Telecom', activity: 'Flyer distribution', promoters: 4 },
  // ---- completed earlier (gives the gate-scan demo a genuinely expired pass)
  { type: 'space', target: 'GM-PS-20', from: -12, len: 3, status: 'approved', brand: 'Savanna Soap', activity: 'Product display', promoters: 2 },
  // ---- rejected after payment (space released, payment refunded)
  { type: 'space', target: 'GM-PS-14', from: 11, len: 2, status: 'rejected', brand: Z, activity: 'Product sampling', slot: 'full', promoters: 2, agoHours: 70, note: 'Amplified music is not permitted in the Textile Lane bay — noise limits apply for neighbouring tailors. Please resubmit without amplified sound, or choose Central Plaza (GM-PS-05) which supports PA systems.' },
  { type: 'space', target: 'GM-PS-05', from: 13, len: 2, status: 'rejected', brand: 'QuickLoans Ltd', activity: 'Lead generation / sign-ups', agoHours: 96, note: 'Consumer lending promotions are not permitted inside the market premises under AICL promotional guidelines.' },
];

const monthStartTs = () => new Date(`${startOfMonth(todayISO())}T09:30:00`).getTime();

function build(): { bookings: Booking[]; notifications: AppNotification[]; nextSeq: number } {
  const today = todayISO();
  const now = Date.now();
  const ms = monthStartTs();
  const yymm = today.slice(2, 4) + today.slice(5, 7);
  let seq = 1001;

  const bookings: Booking[] = SPECS.map((spec, idx) => {
    const isDemo = spec.brand === Z;
    const co = COMPANIES[spec.brand];
    const startDate = addDays(today, spec.from);
    const endDate = addDays(startDate, spec.len - 1);
    const days = daysInRange(startDate, endDate);
    const slot = slotById(spec.slot ?? 'full');
    const target = spec.type === 'space' ? spaceById(spec.target)! : zoneById(spec.target)!;
    const unitPrice = spec.type === 'space' ? spaceDayPrice(target as Space, slot.id) : zoneDayPrice(target as MobileZone, slot.id);
    const promoterCount = spec.promoters ?? (spec.type === 'space' ? 2 : 2);
    const promoters = isDemo ? DEMO_PERSONA.promoters.slice(0, promoterCount) : promotersFor(idx + 1, promoterCount);
    const pb = priceBreakdown(unitPrice, days, spec.type === 'mobile' ? promoters.length : 1);

    const agoH = spec.agoHours ?? Math.max(24, (6 - spec.from) * 24 + (idx % 5) * 3);
    const submitted = Math.min(now - 30 * 60000, Math.max(ms, now - agoH * 3600000));
    const paid = Math.min(now - 15 * 60000, submitted + (1 + (idx % 3)) * 3600000);
    const decided = Math.min(now - 5 * 60000, paid + (3 + (idx % 6)) * 3600000);

    const b: Booking = {
      ref: `GKM-${yymm}-${seq++}`,
      ownerId: isDemo ? DEMO_BUSINESS_ID : `seed-${idx}`,
      type: spec.type,
      targetId: spec.target,
      startDate,
      endDate,
      slot: slot.id,
      startTime: slot.start,
      endTime: slot.end,
      company: spec.brand,
      contactName: isDemo ? DEMO_PERSONA.contactName : co.contact,
      email: isDemo ? DEMO_PERSONA.email : `${co.contact.split(' ')[0].toLowerCase()}@${co.domain}.example`,
      phone: isDemo ? DEMO_PERSONA.phone : co.phone,
      activity: spec.activity,
      product: isDemo ? DEMO_PERSONA.product : co.product,
      promoters,
      requirements: spec.requirements ?? (isDemo ? DEMO_PERSONA.requirements : 'Branded banner, one table and two chairs.'),
      unitPrice,
      days,
      subtotal: pb.subtotal,
      vat: pb.vat,
      total: pb.total,
      status: spec.status,
      submittedAt: new Date(submitted).toISOString(),
    };
    if (spec.status !== 'awaiting_payment') {
      b.paidAt = new Date(paid).toISOString();
      b.receiptNo = `RCT-${yymm}-${b.ref.slice(-4)}`;
      b.paymentMethod = (idx % 3 === 0 ? 'transfer' : 'card') as PaymentMethod;
    }
    if (spec.status === 'approved' || spec.status === 'rejected') {
      b.decidedAt = new Date(decided).toISOString();
      b.decisionNote =
        spec.note ?? (spec.status === 'approved' ? 'Approved. Your booking is confirmed and your digital passes have been issued.' : undefined);
    }
    if (spec.status === 'rejected') {
      b.refundedAt = b.decidedAt;
      b.refundRef = `RFD-${yymm}-${b.ref.slice(-4)}`;
    }
    return b;
  });

  const notifications: AppNotification[] = [];
  let n = 1;
  const label = (b: Booking) => (b.type === 'space' ? b.targetId : `Zone ${b.targetId.slice(-1).toUpperCase()}`);
  const ageH = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3600000;
  for (const b of bookings) {
    // AICL side: payments waiting for a decision, plus fresh unpaid requests
    if (b.status === 'in_review') {
      notifications.push({
        id: `n-${n++}`,
        audience: 'admin',
        title: `Payment received — review ${b.ref}`,
        body: `${b.company} paid ₦${b.total.toLocaleString('en-NG')} for ${label(b)}. Approve or reject the request.`,
        at: b.paidAt ?? b.submittedAt,
        read: ageH(b.paidAt ?? b.submittedAt) > 30,
        to: `/admin/requests/${b.ref}`,
      });
    } else if (b.status === 'awaiting_payment') {
      notifications.push({
        id: `n-${n++}`,
        audience: 'admin',
        title: `New request ${b.ref}`,
        body: `${b.company} requested ${label(b)} for ${b.days} day${b.days === 1 ? '' : 's'} — awaiting payment.`,
        at: b.submittedAt,
        read: true,
        to: `/admin/requests/${b.ref}`,
      });
    }
    // Business side (the demo company only)
    if (b.ownerId === DEMO_BUSINESS_ID) {
      const base = { id: `n-${n++}`, audience: 'business' as const, to: '/my-bookings' };
      if (b.status === 'awaiting_payment') {
        notifications.push({ ...base, title: 'Payment due — complete your request', body: `${b.ref} is waiting for payment before AICL can review it.`, at: b.submittedAt, read: false });
      } else if (b.status === 'in_review') {
        notifications.push({ ...base, title: 'Payment received — awaiting AICL approval', body: `${b.ref}: ₦${b.total.toLocaleString('en-NG')} received. AICL will approve or reject shortly.`, at: b.paidAt ?? b.submittedAt, read: true });
      } else if (b.status === 'approved') {
        notifications.push({ ...base, title: 'Booking approved — passes issued', body: `${b.ref} is confirmed. Your digital passes were emailed to ${b.email}.`, at: b.decidedAt ?? b.submittedAt, read: true, to: `/passes/${b.ref}` });
      } else {
        notifications.push({ ...base, title: 'Request not approved — refund initiated', body: `${b.ref} was rejected and your payment is being refunded. Tap to read AICL's reason.`, at: b.decidedAt ?? b.submittedAt, read: false });
      }
    }
  }
  notifications.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return { bookings, notifications, nextSeq: seq };
}

// --------- Rental history: previous three months, deterministic per space ---------

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHistory(): HistoryEntry[] {
  const today = todayISO();
  const out: HistoryEntry[] = [];
  SPACES.forEach((space, si) => {
    if (space.blocked) return;
    const rnd = mulberry32(si * 977 + 13);
    let cursor = -88 + Math.floor(rnd() * 8);
    while (cursor < -6) {
      const len = 1 + Math.floor(rnd() * 7);
      const start = addDays(today, cursor);
      const end = addDays(start, len - 1);
      if (addDays(today, -5) < end) break;
      out.push({
        spaceId: space.id,
        brand: BRANDS[Math.floor(rnd() * BRANDS.length)],
        startDate: start,
        endDate: end,
        days: len,
        rate: space.pricePerDay,
      });
      cursor += len + 2 + Math.floor(rnd() * 12);
    }
  });
  return out;
}

export interface SeedState {
  bookings: Booking[];
  history: HistoryEntry[];
  notifications: AppNotification[];
  nextSeq: number;
}

export function createSeed(): SeedState {
  const { bookings, notifications, nextSeq } = build();
  return { bookings, notifications, nextSeq, history: buildHistory() };
}
