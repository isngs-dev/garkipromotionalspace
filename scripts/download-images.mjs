// One-off helper: downloads every demo photo into public/images so the prototype works fully offline.
// Usage: node scripts/download-images.mjs   (re-run only if you change the manifest below)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
const UA = 'garki-prototype/0.1 (it@isngs.com)';

const wm = (p, w = 960) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${p}/${w}px-${p.split('/').pop()}`;
const us = (id) => `https://images.unsplash.com/photo-${id}?fm=jpg&fit=crop&w=1200&q=72`;

// name -> remote URL (the app references these as /images/<name>.jpg)
export const MANIFEST = {
  'market-cross-section': wm('f/f2/A_cross_section_of_Garki_Model_Market_Abuja%2CNigeria.jpg', 1280),
  'market-shops': wm('0/0c/Shops_in_Garki_Market.jpg', 1280),
  'market-street': wm('c/c4/Garki_Market.jpg', 1280),
  'market-intl-01': wm('5/55/Garki_International_Market_01.jpg'),
  'market-intl-02': wm('1/12/Garki_International_Market_02.jpg'),
  'market-intl-03': wm('b/bd/Garki_International_Market_03.jpg'),
  'market-intl-04': wm('d/db/Garki_International_Market_04.jpg'),
  'market-intl-05': wm('1/1a/Garki_International_Market_05.jpg'),
  'market-intl-07': wm('2/24/Garki_International_Market_07.jpg'),
  'market-wuse': wm('4/44/Wuse_Market_Abuja_Nigeria.jpg'),
  'market-hustle-3': wm('3/38/Everyday_Hustle_in_Nigeria_3.jpg'),
  'market-hustle-6': wm('3/3b/Everyday_Hustle_in_Nigeria_6.jpg'),
  'market-mile12': wm('4/42/A_Busy_Market_in_Mile_12%2C_Lagos-_Nigeria.jpg'),
  'act-indoor-booth': us('1785123379754-ecfd121729d5'),
  'act-outdoor-stall': us('1777731052038-f185fb0c3292'),
  'act-sampling': us('1785062776539-0855f37ad2fb'),
  'act-food-table': us('1780867657489-dc9af28402d8'),
  'act-popup': us('1766384093125-f00a4eb8a392'),
  'act-tasting': us('1768489529354-b441f0ea2e1c'),
  'act-mall': us('1741099915777-0011cf9fd4d7'),
  'act-crowd-street': us('1650499311129-5dc75c1038e6'),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const type = res.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error(`unexpected content-type ${type}`);
      return Buffer.from(await res.arrayBuffer());
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('too many retries');
}

fs.mkdirSync(OUT, { recursive: true });
let failed = 0;
for (const [name, url] of Object.entries(MANIFEST)) {
  const file = path.join(OUT, `${name}.jpg`);
  try {
    const buf = await get(url);
    fs.writeFileSync(file, buf);
    console.log(`ok   ${name}.jpg  ${(buf.length / 1024).toFixed(0)} KB`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}  ${e.message}  ${url}`);
  }
  await sleep(400);
}
process.exit(failed ? 1 : 0);
