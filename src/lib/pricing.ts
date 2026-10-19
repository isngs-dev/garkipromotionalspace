import type { MobileZone, Space, TimeSlotId } from '../types';
import { MARKET_CLOSE, MARKET_OPEN, PEAK_END, PEAK_MULTIPLIER, PEAK_START, slotById } from '../data/constants';

const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes in [start, end] that fall inside the peak window. */
function peakMinutes(start: string, end: string): number {
  return Math.max(0, Math.min(mins(end), mins(PEAK_END)) - Math.max(mins(start), mins(PEAK_START)));
}

/** Weighted minutes: standard minutes count 1, peak minutes count PEAK_MULTIPLIER. */
function weight(start: string, end: string): number {
  const total = Math.max(0, mins(end) - mins(start));
  const peak = peakMinutes(start, end);
  return total - peak + peak * PEAK_MULTIPLIER;
}

const FULL_DAY_WEIGHT = weight(MARKET_OPEN, MARKET_CLOSE);

/** Price of a time window as a share of the full-day price (full day = 1). */
export function windowFactor(start: string, end: string): number {
  return weight(start, end) / FULL_DAY_WEIGHT;
}

export const slotFactor = (slot: TimeSlotId): number => {
  const s = slotById(slot);
  return windowFactor(s.start, s.end);
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Price per day of a space for the chosen hours. */
export const spaceDayPrice = (space: Space, slot: TimeSlotId): number => roundTo(space.pricePerDay * slotFactor(slot), 100);

/** Price per promoter per day of a zone for the chosen hours. */
export const zoneDayPrice = (zone: MobileZone, slot: TimeSlotId): number => roundTo(zone.pricePerPromoterPerDay * slotFactor(slot), 50);

/** How many of a slot's hours are peak vs standard (for the pricing explanation). */
export function slotHours(slot: TimeSlotId) {
  const s = slotById(slot);
  const total = (mins(s.end) - mins(s.start)) / 60;
  const peak = peakMinutes(s.start, s.end) / 60;
  return { total, peak, standard: total - peak };
}

export const isPeakSlot = (slot: TimeSlotId) => slotHours(slot).peak > 0;
