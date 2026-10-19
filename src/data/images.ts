// Placeholder photography. Market photos are real Garki / Abuja / Lagos shots from Wikimedia Commons
// (CC BY-SA 4.0 — credited in the footer and public/images/CREDITS.txt). Activation photos are from Unsplash.
// Every <Photo> still falls back to a branded illustration if a file can't load.

// All photos are bundled in /public/images so the demo works fully offline (see scripts/download-images.mjs).
const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.jpg`;

export const MARKET = {
  crossSection: img('market-cross-section'),
  shops: img('market-shops'),
  streetView: img('market-street'),
  intl01: img('market-intl-01'),
  intl02: img('market-intl-02'),
  intl03: img('market-intl-03'),
  intl04: img('market-intl-04'),
  intl05: img('market-intl-05'),
  intl07: img('market-intl-07'),
  wuse: img('market-wuse'),
  hustle3: img('market-hustle-3'),
  hustle6: img('market-hustle-6'),
  mile12: img('market-mile12'),
};

export const ACTIVATION = {
  indoorBooth: img('act-indoor-booth'),
  outdoorStall: img('act-outdoor-stall'),
  sampling: img('act-sampling'),
  foodTable: img('act-food-table'),
  popup: img('act-popup'),
  tasting: img('act-tasting'),
  mall: img('act-mall'),
  crowdStreet: img('act-crowd-street'),
};

export interface GalleryItem {
  src: string;
  brand: string;
  activity: string;
  when: string;
  tall?: boolean;
}

export const GALLERY: GalleryItem[] = [
  { src: ACTIVATION.foodTable, brand: 'MamaGold Rice', activity: 'Cook-and-taste demo', when: 'Aug 2026', tall: true },
  { src: ACTIVATION.indoorBooth, brand: 'Kora Telecom', activity: 'SIM registration booth', when: 'Jul 2026' },
  { src: ACTIVATION.sampling, brand: 'Naija Fresh Dairy', activity: 'Yoghurt tasting stall', when: 'Sep 2026' },
  { src: ACTIVATION.tasting, brand: 'Tasty Bites Noodles', activity: 'Street-food tasting', when: 'Sep 2026', tall: true },
  { src: ACTIVATION.popup, brand: 'Sunrise Cosmetics', activity: 'Pop-up beauty counter', when: 'Jun 2026' },
  { src: ACTIVATION.outdoorStall, brand: 'Halo Foods', activity: 'Plantain-chip stall', when: 'Aug 2026' },
  { src: ACTIVATION.mall, brand: 'Lagos Loop Telecom', activity: 'Router launch pop-up', when: 'Jun 2026' },
  { src: MARKET.shops, brand: 'Oba Detergents', activity: 'Flyer & coupon walk-through', when: 'Jul 2026' },
  { src: ACTIVATION.crowdStreet, brand: 'Pulse Mobile', activity: 'Roaming promoters', when: 'May 2026' },
  { src: MARKET.intl03, brand: 'Savanna Soap', activity: 'Gate 2 roadshow', when: 'Sep 2026' },
];

export const SAMPLE_PHOTOS = [
  ACTIVATION.sampling,
  ACTIVATION.indoorBooth,
  ACTIVATION.popup,
  ACTIVATION.foodTable,
];

/** Location photo pool — each space picks a stable set from here. */
export const LOCATION_POOL = [
  MARKET.shops,
  MARKET.intl01,
  MARKET.intl03,
  MARKET.hustle3,
  MARKET.intl05,
  MARKET.intl07,
  MARKET.streetView,
  MARKET.intl02,
  MARKET.hustle6,
  MARKET.intl04,
  MARKET.wuse,
  MARKET.mile12,
  MARKET.crossSection,
];

export function spacePhotos(index: number): string[] {
  const n = LOCATION_POOL.length;
  return [
    LOCATION_POOL[index % n],
    LOCATION_POOL[(index + 4) % n],
    LOCATION_POOL[(index + 7) % n],
    SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length],
  ];
}
