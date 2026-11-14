// Japan events and seasons dataset
// All dates are APPROXIMATE — Japan doesn't publish exact dates years in advance
// Golden Week, Obon, and New Year are fixed; natural events vary by year/location

export interface EventRecord {
  id: string;
  name: string;
  months: number[];     // which months this applies to (1-12)
  halfMonthStart?: 1|2; // if it only applies to first (1) or second (2) half
  halfMonthEnd?: 1|2;
  cityIds: string[];    // empty = nationwide
  crowdImpact: 0|1|2;  // 0=none, 1=moderate, 2=high
  priceImpact: 0|1|2;  // 0=none, 1=moderate, 2=high
  description: string;
  isPositive: boolean;  // true=recommended to attend, false=avoid
}

export const JAPAN_EVENTS: EventRecord[] = [
  // ── Cherry blossom (Sakura) ──────────────────────────────────────
  {
    id: 'sakura-kyushu',
    name: 'Cherry Blossom (Kyushu)',
    months: [3],
    halfMonthStart: 2,
    cityIds: ['fukuoka', 'kagoshima', 'nagasaki'],
    crowdImpact: 1, priceImpact: 1,
    description: 'Earliest sakura in Japan — Kyushu blooms late March',
    isPositive: true,
  },
  {
    id: 'sakura-kansai-kanto',
    name: 'Cherry Blossom (Kansai & Kanto)',
    months: [3, 4],
    halfMonthStart: 2,
    halfMonthEnd: 1,
    cityIds: ['tokyo', 'kyoto', 'osaka', 'nara', 'kobe', 'hiroshima', 'kamakura', 'nikko', 'himeji'],
    crowdImpact: 2, priceImpact: 2,
    description: 'Peak sakura season — most iconic but also most crowded and expensive',
    isPositive: true,
  },
  {
    id: 'sakura-tohoku',
    name: 'Cherry Blossom (Tohoku)',
    months: [4],
    halfMonthStart: 1,
    halfMonthEnd: 2,
    cityIds: ['sendai', 'nagano'],
    crowdImpact: 1, priceImpact: 1,
    description: 'Sakura arrives 2–3 weeks later in Tohoku — fewer crowds than Tokyo/Kyoto',
    isPositive: true,
  },
  {
    id: 'sakura-hokkaido',
    name: 'Cherry Blossom (Hokkaido)',
    months: [4, 5],
    halfMonthStart: 2,
    halfMonthEnd: 1,
    cityIds: ['sapporo'],
    crowdImpact: 1, priceImpact: 1,
    description: 'Sapporo sakura blooms late April to early May — cool and uncrowded',
    isPositive: true,
  },
  // ── Golden Week ──────────────────────────────────────────────────
  {
    id: 'golden-week',
    name: 'Golden Week',
    months: [4, 5],
    halfMonthStart: 2,
    halfMonthEnd: 1,
    cityIds: [],
    crowdImpact: 2, priceImpact: 2,
    description: 'Apr 29 – May 5: Japan\'s biggest holiday week. Trains full, prices surge, accommodation books out',
    isPositive: false,
  },
  // ── Rainy season ────────────────────────────────────────────────
  {
    id: 'tsuyu-kanto-kansai',
    name: 'Rainy Season (Tsuyu)',
    months: [6, 7],
    halfMonthStart: 1,
    halfMonthEnd: 1,
    cityIds: ['tokyo', 'kyoto', 'osaka', 'hiroshima', 'fukuoka'],
    crowdImpact: 0, priceImpact: 0,
    description: 'Rainy season mid-June to mid-July — fewer tourists but grey skies and humidity',
    isPositive: false,
  },
  // ── Obon ────────────────────────────────────────────────────────
  {
    id: 'obon',
    name: 'Obon Holiday',
    months: [8],
    halfMonthStart: 1,
    halfMonthEnd: 2,
    cityIds: [],
    crowdImpact: 2, priceImpact: 2,
    description: 'Aug 13–16: Major domestic travel week — flights and trains fully booked',
    isPositive: false,
  },
  // ── Typhoon season ───────────────────────────────────────────────
  {
    id: 'typhoon',
    name: 'Typhoon Risk',
    months: [8, 9],
    cityIds: ['naha', 'kagoshima', 'osaka', 'tokyo'],
    crowdImpact: 0, priceImpact: 0,
    description: 'Peak typhoon season Aug–Sept — can disrupt flights and outdoor plans',
    isPositive: false,
  },
  // ── Autumn leaves ────────────────────────────────────────────────
  {
    id: 'koyo-hokkaido',
    name: 'Autumn Leaves (Hokkaido)',
    months: [10],
    halfMonthStart: 1,
    cityIds: ['sapporo'],
    crowdImpact: 1, priceImpact: 1,
    description: 'Spectacular koyo arrives in Hokkaido first (early Oct)',
    isPositive: true,
  },
  {
    id: 'koyo-kansai',
    name: 'Autumn Leaves (Kansai)',
    months: [11],
    cityIds: ['kyoto', 'nara', 'osaka', 'kobe', 'koyasan'],
    crowdImpact: 2, priceImpact: 1,
    description: 'Kyoto koyo mid-November: Arashiyama, Tofuku-ji stunning but very crowded',
    isPositive: true,
  },
  {
    id: 'koyo-kanto',
    name: 'Autumn Leaves (Kanto)',
    months: [11],
    cityIds: ['tokyo', 'nikko', 'kamakura', 'hakone'],
    crowdImpact: 1, priceImpact: 1,
    description: 'Autumn leaves in Nikko are spectacular; Tokyo\'s parks turn late November',
    isPositive: true,
  },
  // ── Winter / Snow festivals ───────────────────────────────────────
  {
    id: 'sapporo-snow-festival',
    name: 'Sapporo Snow Festival',
    months: [2],
    halfMonthStart: 1,
    halfMonthEnd: 1,
    cityIds: ['sapporo'],
    crowdImpact: 2, priceImpact: 2,
    description: 'Early February: massive snow sculptures, draws 2 million visitors — book months ahead',
    isPositive: true,
  },
  {
    id: 'snow-monkeys',
    name: 'Snow Monkeys (Jigokudani)',
    months: [1, 2, 3],
    cityIds: ['nagano'],
    crowdImpact: 1, priceImpact: 0,
    description: 'Japanese macaques bathing in hot springs — best Jan–March with snow around them',
    isPositive: true,
  },
  // ── New Year ─────────────────────────────────────────────────────
  {
    id: 'new-year',
    name: 'New Year Holiday',
    months: [1, 12],
    halfMonthStart: 2,
    cityIds: [],
    crowdImpact: 2, priceImpact: 2,
    description: 'Dec 28 – Jan 3: Japan New Year — many restaurants and shops close; temple hatsumode crowds',
    isPositive: false,
  },
  // ── Gion Matsuri ─────────────────────────────────────────────────
  {
    id: 'gion-matsuri',
    name: 'Gion Matsuri (Kyoto)',
    months: [7],
    cityIds: ['kyoto'],
    crowdImpact: 2, priceImpact: 1,
    description: 'July: Kyoto\'s grandest festival — Yamaboko Junko parade on July 17 is spectacular',
    isPositive: true,
  },
  // ── Lavender ─────────────────────────────────────────────────────
  {
    id: 'lavender-hokkaido',
    name: 'Lavender Bloom (Furano)',
    months: [7],
    halfMonthStart: 1,
    halfMonthEnd: 2,
    cityIds: ['sapporo'],
    crowdImpact: 1, priceImpact: 1,
    description: 'Furano lavender fields in full bloom mid-July — uniquely beautiful Hokkaido experience',
    isPositive: true,
  },
  // ── Tanabata ─────────────────────────────────────────────────────
  {
    id: 'tanabata-sendai',
    name: 'Tanabata Festival (Sendai)',
    months: [8],
    halfMonthStart: 1,
    halfMonthEnd: 1,
    cityIds: ['sendai'],
    crowdImpact: 1, priceImpact: 0,
    description: 'Aug 6–8: Japan\'s biggest Tanabata — ornate paper decorations fill the arcades',
    isPositive: true,
  },
  // ── Kamikochi closure ────────────────────────────────────────────
  {
    id: 'kamikochi-closed',
    name: 'Kamikochi CLOSED',
    months: [11, 12, 1, 2, 3],
    halfMonthStart: 2,
    halfMonthEnd: 1,
    cityIds: ['matsumoto'],
    crowdImpact: 0, priceImpact: 0,
    description: 'Kamikochi valley is officially closed mid-November to mid-April',
    isPositive: false,
  },
  // ── Okinawa typhoon season ───────────────────────────────────────
  {
    id: 'okinawa-typhoon',
    name: 'Okinawa Typhoon Peak',
    months: [8, 9],
    cityIds: ['naha'],
    crowdImpact: 0, priceImpact: 0,
    description: 'Peak typhoon risk for Okinawa Aug–Sept — flights cancelled, beaches closed',
    isPositive: false,
  },
  // ── Nagasaki Lantern Festival ─────────────────────────────────────
  {
    id: 'nagasaki-lantern',
    name: 'Nagasaki Lantern Festival',
    months: [1, 2],
    halfMonthStart: 2,
    halfMonthEnd: 1,
    cityIds: ['nagasaki'],
    crowdImpact: 1, priceImpact: 1,
    description: 'Chinese New Year festival with 15,000 lanterns — magical evening atmosphere',
    isPositive: true,
  },
];

/** Get events applicable to a given month and optional list of city IDs */
export function getEventsForMonth(month: number, cityIds: string[] = []): EventRecord[] {
  return JAPAN_EVENTS.filter(ev => {
    if (!ev.months.includes(month)) return false;
    if (ev.cityIds.length === 0) return true; // nationwide
    return ev.cityIds.some(id => cityIds.includes(id));
  });
}

/** Is the given month a peak-price window? */
export function isExpensiveWindow(month: number): boolean {
  // April (sakura + GW), May (GW), August (Obon), December (Christmas/NYE), January (NYE end)
  return [3, 4, 5, 8, 12, 1].includes(month);
}

/** Is the given month a peak-crowd window? */
export function isCrowdedWindow(month: number): boolean {
  return [3, 4, 5, 8, 11].includes(month);
}

/** Crowd score 0-1 for a month and set of city IDs (1 = max crowded) */
export function crowdScore(month: number, cityIds: string[]): number {
  const events = getEventsForMonth(month, cityIds);
  const maxImpact = events.reduce((m, e) => Math.max(m, e.crowdImpact), 0);
  const baseCrowd = isCrowdedWindow(month) ? 0.5 : 0.2;
  return Math.min(1, baseCrowd + maxImpact * 0.25);
}

/** Weather score 0-1 for a month (1 = best weather) based on avoid events */
export function weatherScore(month: number, cityIds: string[]): number {
  const badEvents = getEventsForMonth(month, cityIds).filter(e => !e.isPositive);
  if (badEvents.length > 0) return 0.3;
  if ([6, 7].includes(month)) return 0.4; // rainy season
  if ([8, 9].includes(month)) return 0.5; // hot
  if ([1, 2].includes(month)) return 0.5; // cold (but can be good for onsen/snow)
  return 0.9;
}
