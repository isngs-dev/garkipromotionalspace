export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/** Nigerian mobile: 0803…, +234803…, with optional spaces/dashes */
export function isNgPhone(s: string): boolean {
  const d = s.replace(/[\s-]/g, '');
  return /^(\+?234|0)[789][01]\d{8}$/.test(d);
}

export const minLen = (s: string, n: number) => s.trim().length >= n;

export const timeToMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
