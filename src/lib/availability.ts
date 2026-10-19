import type { Booking, MobileZone, Space, SpaceStatus } from '../types';
import { addDays, eachDay } from './dates';

/** A booking "holds" its space/zone until it is rejected. */
export const holdsInventory = (b: Booking) => b.status !== 'rejected';
export const covers = (b: Booking, date: string) => b.startDate <= date && date <= b.endDate;
const overlaps = (b: Booking, start: string, end: string) => b.startDate <= end && start <= b.endDate;

export function spaceBookingsOn(spaceId: string, bookings: Booking[], date: string): Booking[] {
  return bookings.filter((b) => b.type === 'space' && b.targetId === spaceId && holdsInventory(b) && covers(b, date));
}

/**
 * Status of a space on a given day:
 *  - blocked  → permanently unavailable (AICL)
 *  - booked   → an approved booking covers the day
 *  - pending  → a request (awaiting payment OR paid & awaiting AICL) covers the day
 *  - available otherwise
 */
export function spaceStatusOn(space: Space, bookings: Booking[], date: string): SpaceStatus {
  if (space.blocked) return 'blocked';
  const hits = spaceBookingsOn(space.id, bookings, date);
  if (hits.some((b) => b.status === 'approved')) return 'booked';
  if (hits.length) return 'pending';
  return 'available';
}

/** Status of a space across a whole date range: booked if any day is booked, pending if any is held, else available. */
export function spaceStatusOverRange(space: Space, bookings: Booking[], start: string, end: string): SpaceStatus {
  if (space.blocked) return 'blocked';
  let held = false;
  for (const d of eachDay(start, end)) {
    const st = spaceStatusOn(space, bookings, d);
    if (st === 'booked') return 'booked';
    if (st === 'pending') held = true;
  }
  return held ? 'pending' : 'available';
}

export function isRangeFree(space: Space, bookings: Booking[], start: string, end: string, ignoreRef?: string): boolean {
  if (space.blocked) return false;
  return !bookings.some(
    (b) =>
      b.type === 'space' &&
      b.targetId === space.id &&
      holdsInventory(b) &&
      b.ref !== ignoreRef &&
      overlaps(b, start, end),
  );
}

/** First date on/after `from` (within 180 days) the space is free. */
export function nextAvailableDate(space: Space, bookings: Booking[], from: string): string | null {
  if (space.blocked) return null;
  for (let i = 0; i < 180; i++) {
    const d = addDays(from, i);
    if (spaceStatusOn(space, bookings, d) === 'available') return d;
  }
  return null;
}

// ---------- Mobile zones (capacity measured in promoters per day) ----------

export interface ZoneUsage {
  confirmed: number; // approved by AICL
  held: number; // awaiting payment or awaiting AICL decision
  remaining: number;
}

export function zoneUsageOn(zone: MobileZone, bookings: Booking[], date: string, ignoreRef?: string): ZoneUsage {
  let confirmed = 0;
  let held = 0;
  for (const b of bookings) {
    if (b.type !== 'mobile' || b.targetId !== zone.id || !holdsInventory(b) || b.ref === ignoreRef || !covers(b, date))
      continue;
    if (b.status === 'approved') confirmed += b.promoters.length;
    else held += b.promoters.length;
  }
  return { confirmed, held, remaining: Math.max(0, zone.capacity - confirmed - held) };
}

export function zoneStatusOn(zone: MobileZone, bookings: Booking[], date: string): SpaceStatus {
  if (zone.blocked) return 'blocked';
  const u = zoneUsageOn(zone, bookings, date);
  if (u.remaining > 0) return 'available';
  return u.confirmed >= zone.capacity ? 'booked' : 'pending';
}

/** Status of a mobile zone across a date range (available only if promoter slots are free on every day). */
export function zoneStatusOverRange(zone: MobileZone, bookings: Booking[], start: string, end: string): SpaceStatus {
  if (zone.blocked) return 'blocked';
  if (zoneRemainingForRange(zone, bookings, start, end) > 0) return 'available';
  return eachDay(start, end).some((d) => zoneStatusOn(zone, bookings, d) === 'booked') ? 'booked' : 'pending';
}

/** Promoters that can still be added across the whole range (minimum remaining on any day). */
export function zoneRemainingForRange(zone: MobileZone, bookings: Booking[], start: string, end: string): number {
  if (zone.blocked) return 0;
  return Math.min(...eachDay(start, end).map((d) => zoneUsageOn(zone, bookings, d).remaining));
}

export function nextZoneAvailableDate(zone: MobileZone, bookings: Booking[], from: string): string | null {
  if (zone.blocked) return null;
  for (let i = 0; i < 180; i++) {
    const d = addDays(from, i);
    if (zoneUsageOn(zone, bookings, d).remaining > 0) return d;
  }
  return null;
}

/** Share of bookable space-days that are approved (confirmed) over a window. */
export function occupancyPct(spaces: Space[], bookings: Booking[], from: string, days: number) {
  const bookable = spaces.filter((s) => !s.blocked);
  const total = bookable.length * days;
  let confirmed = 0;
  let held = 0;
  for (const s of bookable) {
    for (let i = 0; i < days; i++) {
      const st = spaceStatusOn(s, bookings, addDays(from, i));
      if (st === 'booked') confirmed++;
      else if (st === 'pending') held++;
    }
  }
  return {
    confirmed: total ? Math.round((confirmed / total) * 100) : 0,
    withPending: total ? Math.round(((confirmed + held) / total) * 100) : 0,
  };
}
