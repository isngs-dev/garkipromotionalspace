export type SpaceStatus = 'available' | 'booked' | 'pending' | 'blocked';
export type PromotionType = 'space' | 'mobile';
/**
 * Business flow: request → pay → AICL decides → passes.
 *  awaiting_payment  requested, not paid yet (space held)
 *  in_review         paid, waiting for AICL to approve or reject (space still held)
 *  approved          AICL approved → space Booked, passes issued
 *  rejected          AICL rejected → space released, payment refunded
 */
export type BookingStatus = 'awaiting_payment' | 'in_review' | 'approved' | 'rejected';
export type TimeSlotId = 'full' | 'morning' | 'afternoon' | 'peak';
export type Role = 'business' | 'admin';
export type PaymentMethod = 'card' | 'transfer';

export interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Space {
  id: string; // GM-PS-01
  name: string;
  location: string; // "Near Gate 2"
  zone: string;
  areaSqFt: number;
  widthFt: number;
  depthFt: number;
  pricePerDay: number;
  footfall: 'Medium' | 'High' | 'Very high';
  amenities: string[];
  blocked?: { reason: string };
  map: MapRect;
  images: string[];
  blurb: string;
}

export interface MobileZone {
  id: string; // zone-a
  code: string; // A
  name: string;
  description: string;
  route: string;
  pricePerPromoterPerDay: number;
  capacity: number; // max promoters per day
  blocked?: { reason: string };
  map: MapRect;
  image: string;
}

export interface Promoter {
  name: string;
  mobile: string;
}

export interface Booking {
  ref: string;
  ownerId: string;
  type: PromotionType;
  targetId: string; // space id or zone id
  startDate: string; // YYYY-MM-DD
  endDate: string;
  slot: TimeSlotId;
  startTime: string; // HH:mm
  endTime: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  activity: string;
  product: string;
  promoters: Promoter[];
  requirements: string;
  unitPrice: number; // per day (space) or per promoter per day (mobile)
  days: number;
  subtotal: number;
  vat: number;
  total: number;
  status: BookingStatus;
  submittedAt: string; // ISO
  paidAt?: string;
  receiptNo?: string;
  paymentMethod?: PaymentMethod;
  decidedAt?: string;
  decisionNote?: string; // approval message or rejection reason
  refundedAt?: string; // set when a paid request is rejected
  refundRef?: string;
}

export interface HistoryEntry {
  spaceId: string;
  brand: string;
  startDate: string;
  endDate: string;
  days: number;
  rate: number;
}

export interface Draft {
  type: PromotionType;
  targetId: string;
  startDate: string;
  endDate: string;
  slot: TimeSlotId;
  startTime: string;
  endTime: string;
  promoterCount: number;
}

export interface AppNotification {
  id: string;
  audience: Role;
  title: string;
  body: string;
  at: string;
  read: boolean;
  to?: string; // route
}

export interface Pass {
  id: string;
  bookingRef: string;
  company: string;
  product: string;
  holder: string;
  mobile: string;
  targetId: string;
  targetLabel: string;
  type: PromotionType;
  typeLabel: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  qr: string;
}
