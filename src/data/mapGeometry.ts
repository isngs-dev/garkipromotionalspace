import type { MapRect } from '../types';

/** Map coordinate system: viewBox 0 0 1200 800 */
export const MAP_W = 1200;
export const MAP_H = 800;

export const COMPOUND: MapRect = { x: 50, y: 50, w: 1100, h: 630 };
export const PARKING: MapRect = { x: 50, y: 706, w: 1100, h: 80 };

export const WALKWAY_V: MapRect = { x: 545, y: 50, w: 110, h: 630 };
export const WALKWAY_H: MapRect = { x: 50, y: 315, w: 1100, h: 100 };
export const PLAZA = { cx: 600, cy: 365, r: 58 };

export interface ShopBlock extends MapRect {
  id: string;
  label: string;
}

const W = 194;
const H = 80;

export const SHOP_BLOCKS: ShopBlock[] = [
  // North-west
  { id: 'A1', label: 'Textiles & Fabrics', x: 80, y: 80, w: W, h: H },
  { id: 'A2', label: 'Fashion Arcade', x: 330, y: 80, w: W, h: H },
  { id: 'A3', label: 'Tailors Row', x: 80, y: 215, w: W, h: H },
  { id: 'A4', label: 'Footwear', x: 330, y: 215, w: W, h: H },
  // North-east
  { id: 'B1', label: 'Foodstuff Hall', x: 676, y: 80, w: W, h: H },
  { id: 'B2', label: 'Grains & Provisions', x: 926, y: 80, w: W, h: H },
  { id: 'B3', label: 'Spices & Condiments', x: 676, y: 215, w: W, h: H },
  { id: 'B4', label: 'Fresh Produce', x: 926, y: 215, w: W, h: H },
  // South-west
  { id: 'C1', label: 'Electronics Row', x: 80, y: 435, w: W, h: H },
  { id: 'C2', label: 'Phones & Accessories', x: 330, y: 435, w: W, h: H },
  { id: 'C3', label: 'Home & Kitchen', x: 80, y: 570, w: W, h: H },
  { id: 'C4', label: 'Cosmetics & Beauty', x: 330, y: 570, w: W, h: H },
  // South-east
  { id: 'D1', label: 'Pharmacy & Health', x: 676, y: 435, w: W, h: H },
  { id: 'D2', label: 'Household Goods', x: 926, y: 435, w: W, h: H },
  { id: 'D3', label: 'Bakery & Snacks', x: 676, y: 570, w: W, h: H },
  { id: 'D4', label: 'Hardware & Tools', x: 926, y: 570, w: W, h: H },
];

export interface Gate {
  id: string;
  label: string;
  sub: string;
  x: number; // centre
  y: number;
  side: 'n' | 'e' | 's' | 'w';
}

export const GATES: Gate[] = [
  { id: 'G1', label: 'GATE 1', sub: 'North', x: 600, y: 50, side: 'n' },
  { id: 'G2', label: 'GATE 2', sub: 'East', x: 1150, y: 365, side: 'e' },
  { id: 'G3', label: 'GATE 3', sub: 'South', x: 600, y: 680, side: 's' },
  { id: 'G4', label: 'GATE 4', sub: 'West', x: 50, y: 365, side: 'w' },
];

export const TREES: Array<[number, number]> = [
  [68, 70],
  [68, 300],
  [68, 430],
  [68, 664],
  [1132, 70],
  [1132, 300],
  [1132, 430],
  [1132, 664],
  [534, 300],
  [666, 300],
  [534, 430],
  [666, 430],
];
