import type { Booking, Pass } from '../types';
import { PROMOTION_LABEL } from '../data/constants';
import { zoneById } from '../data/spaces';
import { fmtDate, todayISO } from './dates';

export function targetLabel(b: Pick<Booking, 'type' | 'targetId'>): string {
  if (b.type === 'space') return b.targetId;
  const z = zoneById(b.targetId);
  return z ? `Zone ${z.code} · ${z.name}` : b.targetId;
}

export function targetShort(b: Pick<Booking, 'type' | 'targetId'>): string {
  if (b.type === 'space') return b.targetId;
  const z = zoneById(b.targetId);
  return z ? `Zone ${z.code}` : b.targetId;
}

/** One pass per promoter — issued only once AICL has approved the (paid) booking. */
export function passesFor(b: Booking): Pass[] {
  if (b.status !== 'approved') return [];
  const tail = b.ref.split('-').slice(1).join('-');
  return b.promoters.map((p, i) => {
    const id = `GKP-${tail}-${String(i + 1).padStart(2, '0')}`;
    return {
      id,
      bookingRef: b.ref,
      company: b.company,
      product: b.product,
      holder: p.name,
      mobile: p.mobile,
      targetId: b.targetId,
      targetLabel: targetLabel(b),
      type: b.type,
      typeLabel: PROMOTION_LABEL[b.type],
      startDate: b.startDate,
      endDate: b.endDate,
      startTime: b.startTime,
      endTime: b.endTime,
      qr: `GKM|${id}|${b.ref}|${b.targetId}|${b.startDate}|${b.endDate}`,
    };
  });
}

export type ScanResult =
  | { valid: true; pass: Pass; booking: Booking }
  | { valid: false; reason: 'unknown' | 'expired' | 'not-yet' | 'not-approved'; message: string; pass?: Pass; booking?: Booking };

/** Validate a scanned QR payload (or a typed pass ID) against the current bookings. */
export function verifyScan(raw: string, bookings: Booking[], onDate = todayISO()): ScanResult {
  const text = raw.trim();
  let passId = text;
  if (text.startsWith('GKM|')) passId = text.split('|')[1] ?? '';
  const all = bookings.flatMap((b) => passesFor(b).map((p) => ({ p, b })));
  const hit = all.find(({ p }) => p.id.toLowerCase() === passId.toLowerCase());
  if (!hit) {
    // maybe it's a code for a booking AICL never approved
    const ref = /GKP-(\d{4}-\d+)-\d+/i.exec(passId)?.[1];
    const b = ref ? bookings.find((x) => x.ref === `GKM-${ref}`) : undefined;
    if (b && b.status !== 'approved') {
      return { valid: false, reason: 'not-approved', message: 'Booking was not approved by AICL — no pass was issued.', booking: b };
    }
    return { valid: false, reason: 'unknown', message: 'QR code not recognised by the AICL pass register.' };
  }
  const { p, b } = hit;
  if (onDate > b.endDate) {
    return { valid: false, reason: 'expired', message: `Pass expired on ${fmtDate(b.endDate)}.`, pass: p, booking: b };
  }
  if (onDate < b.startDate) {
    return { valid: false, reason: 'not-yet', message: `Pass is only valid from ${fmtDate(b.startDate)}.`, pass: p, booking: b };
  }
  return { valid: true, pass: p, booking: b };
}
