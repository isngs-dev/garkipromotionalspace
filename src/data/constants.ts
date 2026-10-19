import type { TimeSlotId } from '../types';

export const MARKET_NAME = 'Garki Market';
export const OPERATOR = 'AICL';
/** Mailbox shown inside the *simulated* emails (AICL's side of the demo). */
export const AICL_EMAIL = 'promotions@aicl.example';

/** Public contact details shown on the website (footer, "Need help?" lines). */
export const CONTACT_EMAIL = 'contact@gsds.ng';
export const CONTACT_PHONE = '+234 803 426 1372';
export const CONTACT_PHONE_HREF = 'tel:+2348034261372';

export interface TimeSlot {
  id: TimeSlotId;
  label: string;
  start: string;
  end: string;
  note: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'full', label: 'Full day', start: '08:00', end: '18:00', note: 'Maximum exposure' },
  { id: 'morning', label: 'Morning', start: '08:00', end: '13:00', note: 'Early-bird shoppers' },
  { id: 'afternoon', label: 'Afternoon', start: '13:00', end: '18:00', note: 'After-lunch crowd' },
  { id: 'peak', label: 'Peak hours', start: '11:00', end: '16:00', note: 'Busiest shopper window' },
];

/**
 * Time-based pricing. The fixed full-day price stays the reference; a shorter window costs proportionally
 * less, and every hour that falls inside the peak window counts PEAK_MULTIPLIER × a standard hour.
 */
export const PEAK_START = '11:00';
export const PEAK_END = '16:00';
export const PEAK_MULTIPLIER = 1.5;

export const slotById = (id: TimeSlotId) => TIME_SLOTS.find((s) => s.id === id) ?? TIME_SLOTS[0];

export const MARKET_OPEN = '08:00';
export const MARKET_CLOSE = '18:00';

export const ACTIVITY_TYPES_SPACE = [
  'Product sampling',
  'Brand booth / kiosk',
  'Product display',
  'Product demonstration',
  'Lead generation / sign-ups',
  'Pop-up shop',
  'Other',
];

export const ACTIVITY_TYPES_MOBILE = [
  'Flyer distribution',
  'Roaming product sampling',
  'Brand ambassadors / roaming',
  'Lead generation / sign-ups',
  'Other',
];

export const PROMOTION_LABEL = {
  space: 'Rent a Promotional Space',
  mobile: 'Mobile Promotion',
} as const;

/** One fixed rate for every promotional space: price per day = area (sq ft) × this rate. */
export const RATE_PER_SQFT_PER_DAY = 300;

export const MAX_BOOKING_DAYS = 30;
export const MAX_PROMOTERS_SPACE = 6;

export const DEMO_BUSINESS_ID = 'demo-business';

export const DEMO_PERSONA = {
  company: 'Zuma Beverages Ltd',
  contactName: 'Chidinma Okafor',
  email: 'chidinma.okafor@zumabeverages.example',
  phone: '0803 555 0142',
  product: 'Zuma Chilled Zobo (500ml)',
  requirements:
    'Two branded umbrellas, one chiller unit (needs a 13A socket), and permission to play light background music.',
  promoters: [
    { name: 'Amaka Eze', mobile: '0803 555 0188' },
    { name: 'Tunde Bakare', mobile: '0806 555 0121' },
    { name: 'Hauwa Bello', mobile: '0810 555 0176' },
  ],
};

export const LANDING_STATS = {
  dailyVisitors: 567,
  shops: 3200,
  peakHours: '7am – 6pm',
  fridayPeak: 657,
  profile: [
    { label: 'Women shoppers', value: 58 },
    { label: 'Aged 18 – 34', value: 46 },
    { label: 'Household buyers', value: 64 },
    { label: 'Weekly repeat visitors', value: 71 },
  ],
  // relative footfall by hour, 7am..6pm (each bar = the hour starting at that time)
  hourly: [
    { h: '7', v: 22 },
    { h: '8', v: 38 },
    { h: '9', v: 56 },
    { h: '10', v: 74 },
    { h: '11', v: 90 },
    { h: '12', v: 100 },
    { h: '1', v: 97 },
    { h: '2', v: 88 },
    { h: '3', v: 76 },
    { h: '4', v: 55 },
    { h: '5', v: 32 },
  ],
};

export const BRANDS = [
  'Kora Telecom',
  'Naija Fresh Dairy',
  'Sunrise Cosmetics',
  'BrightPay',
  'Tasty Bites Noodles',
  'MamaGold Rice',
  'Oba Detergents',
  'Pulse Mobile',
  'Halo Foods',
  'Amaka Skincare',
  'Nuvo Insurance',
  'Lagos Loop Telecom',
  'VoltPlus Batteries',
  'Savanna Soap',
];
