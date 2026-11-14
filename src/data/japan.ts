// Japan city data for Trip Budget Planner
// All cost multipliers are relative to a baseline of 1.0
// All activity costs are in JPY per person per stop
// Travel matrix values are ESTIMATES — verify before booking

export type Region =
  | 'Kanto'
  | 'Kansai'
  | 'Chubu'
  | 'Chugoku'
  | 'Kyushu'
  | 'Hokkaido'
  | 'Tohoku'
  | 'Shikoku'
  | 'Okinawa';

export type InterestTag =
  | 'culture'
  | 'food'
  | 'nature'
  | 'hiking'
  | 'onsen'
  | 'history'
  | 'nightlife'
  | 'anime'
  | 'beaches'
  | 'snow'
  | 'art';

export interface MonthNote {
  months: number[]; // 1-12
  reason: string;
}

export interface City {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lng: number;
  minNights: number;    // 2 for bases, 1 for day-trip towns
  idealNights: number;
  multiplier: number;           // cost multiplier vs baseline
  activitiesPerPerson: number;  // JPY per stop
  tags: InterestTag[];
  popularity: number;      // 0-1 (1 = extremely crowded tourist hub)
  underratedScore: number; // derived as 1 - popularity
  bestMonths: MonthNote[];
  avoidMonths: MonthNote[];
  dayTripFrom: string[];   // city IDs this can be done from as a day trip
  accessNote?: string;     // e.g. "needs domestic flight"
  flightCode?: string;     // IATA airport code
}

export const CITIES: City[] = [
  // ── Kanto ───────────────────────────────────────────────────────
  {
    id: 'tokyo',
    name: 'Tokyo',
    region: 'Kanto',
    lat: 35.6762, lng: 139.6503,
    minNights: 3, idealNights: 5,
    multiplier: 1.1,
    activitiesPerPerson: 5000,
    tags: ['culture', 'food', 'nightlife', 'anime', 'history'],
    popularity: 1.0, underratedScore: 0.0,
    bestMonths: [
      { months: [3, 4], reason: 'Cherry blossom (sakura) season — most iconic' },
      { months: [10, 11], reason: 'Autumn leaves (koyo), pleasant weather' },
    ],
    avoidMonths: [
      { months: [4, 5], reason: 'Golden Week crowds and peak prices' },
      { months: [7, 8], reason: 'Hot and humid summer' },
    ],
    dayTripFrom: [],
    flightCode: 'TYO',
  },
  {
    id: 'kamakura',
    name: 'Kamakura',
    region: 'Kanto',
    lat: 35.3192, lng: 139.5467,
    minNights: 1, idealNights: 2,
    multiplier: 1.0,
    activitiesPerPerson: 3000,
    tags: ['history', 'culture', 'nature', 'hiking'],
    popularity: 0.70, underratedScore: 0.30,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura at temples and hills' },
      { months: [6], reason: 'Hydrangeas in bloom — unique and beautiful' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Crowded beach season, very hot' },
    ],
    dayTripFrom: ['tokyo'],
    accessNote: '1 hr from Tokyo by train (Yokosuka Line)',
  },
  {
    id: 'nikko',
    name: 'Nikkō',
    region: 'Kanto',
    lat: 36.7482, lng: 139.6197,
    minNights: 1, idealNights: 2,
    multiplier: 1.0,
    activitiesPerPerson: 3500,
    tags: ['history', 'nature', 'hiking', 'culture'],
    popularity: 0.55, underratedScore: 0.45,
    bestMonths: [
      { months: [4, 5], reason: 'Fresh greenery, mild weather' },
      { months: [10, 11], reason: 'Spectacular autumn foliage' },
    ],
    avoidMonths: [
      { months: [1, 2], reason: 'Heavy snow can limit access' },
    ],
    dayTripFrom: ['tokyo'],
    accessNote: '2 hrs from Tokyo (Tobu Nikko Line / Shinkansen to Utsunomiya)',
  },

  // ── Kansai ──────────────────────────────────────────────────────
  {
    id: 'kyoto',
    name: 'Kyoto',
    region: 'Kansai',
    lat: 35.0116, lng: 135.7681,
    minNights: 2, idealNights: 4,
    multiplier: 1.15,
    activitiesPerPerson: 5000,
    tags: ['culture', 'history', 'food', 'art'],
    popularity: 0.95, underratedScore: 0.05,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura — Maruyama Park and Philosopher\'s Path are magical' },
      { months: [11], reason: 'Autumn leaves at Arashiyama and Tofuku-ji' },
    ],
    avoidMonths: [
      { months: [3, 4], reason: 'Peak crowds late March to early April, prices surge' },
      { months: [11], reason: 'Mid-November: very crowded for koyo' },
    ],
    dayTripFrom: [],
    flightCode: 'ITM', // Osaka Itami
  },
  {
    id: 'osaka',
    name: 'Osaka',
    region: 'Kansai',
    lat: 34.6937, lng: 135.5023,
    minNights: 2, idealNights: 3,
    multiplier: 1.0,
    activitiesPerPerson: 4500,
    tags: ['food', 'nightlife', 'culture', 'history'],
    popularity: 0.90, underratedScore: 0.10,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura at Osaka Castle and Expo Park' },
      { months: [10, 11], reason: 'Great weather, autumn festivals' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Extreme heat and humidity' },
    ],
    dayTripFrom: [],
    flightCode: 'KIX',
  },
  {
    id: 'nara',
    name: 'Nara',
    region: 'Kansai',
    lat: 34.6851, lng: 135.8048,
    minNights: 1, idealNights: 2,
    multiplier: 0.9,
    activitiesPerPerson: 1500,
    tags: ['history', 'culture', 'nature'],
    popularity: 0.75, underratedScore: 0.25,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura in Nara Park with deer' },
      { months: [10, 11], reason: 'Autumn foliage at Yoshino' },
    ],
    avoidMonths: [
      { months: [4, 5], reason: 'Golden Week crowds surge' },
    ],
    dayTripFrom: ['kyoto', 'osaka'],
  },
  {
    id: 'kobe',
    name: 'Kobe',
    region: 'Kansai',
    lat: 34.6901, lng: 135.1955,
    minNights: 1, idealNights: 2,
    multiplier: 1.0,
    activitiesPerPerson: 3000,
    tags: ['food', 'culture', 'history'],
    popularity: 0.60, underratedScore: 0.40,
    bestMonths: [
      { months: [3, 4], reason: 'Cherry blossoms and mild weather' },
      { months: [11], reason: 'Autumn foliage on Rokko-san' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Hot and humid' },
    ],
    dayTripFrom: ['osaka', 'kyoto'],
  },
  {
    id: 'himeji',
    name: 'Himeji',
    region: 'Kansai',
    lat: 34.8394, lng: 134.6939,
    minNights: 1, idealNights: 1,
    multiplier: 0.9,
    activitiesPerPerson: 2500,
    tags: ['history', 'culture'],
    popularity: 0.55, underratedScore: 0.45,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura framing the White Heron Castle — iconic photo' },
    ],
    avoidMonths: [],
    dayTripFrom: ['osaka', 'kyoto'],
    accessNote: '30 min from Osaka by Shinkansen',
  },
  {
    id: 'koyasan',
    name: 'Kōya-san',
    region: 'Kansai',
    lat: 34.2126, lng: 135.5859,
    minNights: 1, idealNights: 2,
    multiplier: 1.1,
    activitiesPerPerson: 3000,
    tags: ['history', 'culture', 'hiking', 'nature'],
    popularity: 0.45, underratedScore: 0.55,
    bestMonths: [
      { months: [5, 6], reason: 'Green mountains, mild temperatures' },
      { months: [10, 11], reason: 'Stunning autumn foliage in the cemetery' },
    ],
    avoidMonths: [
      { months: [1, 2], reason: 'Heavy snow, some temple lodges closed' },
    ],
    dayTripFrom: ['osaka'],
    accessNote: '2 hrs from Osaka (Nankai Rail + cable car)',
  },
  {
    id: 'kinosaki',
    name: 'Kinosaki Onsen',
    region: 'Kansai',
    lat: 35.6305, lng: 134.8088,
    minNights: 1, idealNights: 2,
    multiplier: 1.2,
    activitiesPerPerson: 2000,
    tags: ['onsen', 'culture'],
    popularity: 0.30, underratedScore: 0.70,
    bestMonths: [
      { months: [1, 2], reason: 'Snow onsen experience — unique and romantic' },
      { months: [10, 11], reason: 'Crab season begins October' },
    ],
    avoidMonths: [],
    dayTripFrom: [],
    accessNote: '2.5 hrs from Osaka by Ltd Express Kounotori',
  },

  // ── Chubu ────────────────────────────────────────────────────────
  {
    id: 'hakone',
    name: 'Hakone',
    region: 'Chubu',
    lat: 35.2322, lng: 139.1069,
    minNights: 1, idealNights: 2,
    multiplier: 1.3,
    activitiesPerPerson: 4000,
    tags: ['nature', 'onsen', 'hiking'],
    popularity: 0.85, underratedScore: 0.15,
    bestMonths: [
      { months: [4, 5], reason: 'Mt Fuji views and spring greenery' },
      { months: [10, 11], reason: 'Autumn leaves and clear Fuji views' },
    ],
    avoidMonths: [
      { months: [6, 7], reason: 'Rainy season — Fuji often cloud-covered' },
    ],
    dayTripFrom: ['tokyo'],
    accessNote: '1.5 hrs from Tokyo by Romancecar (Odakyu)',
  },
  {
    id: 'kanazawa',
    name: 'Kanazawa',
    region: 'Chubu',
    lat: 36.5944, lng: 136.6256,
    minNights: 2, idealNights: 3,
    multiplier: 1.0,
    activitiesPerPerson: 2500,
    tags: ['culture', 'history', 'food', 'art'],
    popularity: 0.65, underratedScore: 0.35,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura in Kenroku-en garden' },
      { months: [10, 11], reason: 'Autumn colors in one of Japan\'s top-3 gardens' },
    ],
    avoidMonths: [
      { months: [1, 2], reason: 'Heavy snow (Yukiguni region) — roads can close' },
    ],
    dayTripFrom: [],
    accessNote: '2.5 hrs from Tokyo by Hokuriku Shinkansen',
  },
  {
    id: 'takayama',
    name: 'Takayama',
    region: 'Chubu',
    lat: 36.1461, lng: 137.2520,
    minNights: 1, idealNights: 2,
    multiplier: 1.1,
    activitiesPerPerson: 3000,
    tags: ['culture', 'history', 'food', 'nature'],
    popularity: 0.50, underratedScore: 0.50,
    bestMonths: [
      { months: [4, 5], reason: 'Spring festival (Sanno Matsuri), beautiful Hida folk village' },
      { months: [10, 11], reason: 'Autumn festival and foliage in the Alps' },
    ],
    avoidMonths: [
      { months: [1, 2], reason: 'Deep snow — scenic but travel can be disrupted' },
    ],
    dayTripFrom: [],
    accessNote: '2.5 hrs from Nagoya or 5 hrs from Tokyo by limited express',
  },
  {
    id: 'matsumoto',
    name: 'Matsumoto',
    region: 'Chubu',
    lat: 36.2381, lng: 137.9719,
    minNights: 1, idealNights: 2,
    multiplier: 0.95,
    activitiesPerPerson: 2500,
    tags: ['history', 'nature', 'hiking'],
    popularity: 0.45, underratedScore: 0.55,
    bestMonths: [
      { months: [5, 6], reason: 'Gateway to Kamikochi (open mid-April to mid-November)' },
      { months: [10], reason: 'Autumn in the Japan Alps' },
    ],
    avoidMonths: [
      { months: [1, 2, 3], reason: 'Very cold, Kamikochi closed Nov to mid-April' },
    ],
    dayTripFrom: ['tokyo'],
    accessNote: '2.5 hrs from Tokyo by Ltd Express Azusa',
  },
  {
    id: 'nagano',
    name: 'Nagano / Obuse',
    region: 'Chubu',
    lat: 36.6513, lng: 138.1812,
    minNights: 1, idealNights: 2,
    multiplier: 0.95,
    activitiesPerPerson: 2000,
    tags: ['nature', 'culture', 'snow', 'history'],
    popularity: 0.35, underratedScore: 0.65,
    bestMonths: [
      { months: [1, 2], reason: 'Snow monkeys at Jigokudani — bucket-list experience' },
      { months: [3, 4], reason: 'Zenkoji Temple sakura' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Hot and humid, less distinctive' },
    ],
    dayTripFrom: ['tokyo'],
    accessNote: '1.5 hrs from Tokyo by Hokuriku Shinkansen',
  },

  // ── Chugoku ──────────────────────────────────────────────────────
  {
    id: 'hiroshima',
    name: 'Hiroshima',
    region: 'Chugoku',
    lat: 34.3853, lng: 132.4553,
    minNights: 2, idealNights: 3,
    multiplier: 0.95,
    activitiesPerPerson: 2500,
    tags: ['history', 'culture', 'food'],
    popularity: 0.80, underratedScore: 0.20,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura along the Peace Boulevard, mild weather' },
      { months: [10, 11], reason: 'Autumn colors on Miyajima island' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Very hot and humid — Hiroshima is in a basin' },
    ],
    dayTripFrom: [],
    flightCode: 'HIJ',
  },
  {
    id: 'kurashiki',
    name: 'Kurashiki',
    region: 'Chugoku',
    lat: 34.5853, lng: 133.7714,
    minNights: 1, idealNights: 2,
    multiplier: 0.9,
    activitiesPerPerson: 2000,
    tags: ['art', 'history', 'culture'],
    popularity: 0.40, underratedScore: 0.60,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura along the Bikan canal district' },
      { months: [10, 11], reason: 'Pleasant weather for strolling' },
    ],
    avoidMonths: [],
    dayTripFrom: ['hiroshima', 'osaka'],
    accessNote: '15 min from Okayama by JR; Okayama is 35 min from Osaka by Shinkansen',
  },
  {
    id: 'matsue',
    name: 'Matsue',
    region: 'Chugoku',
    lat: 35.4722, lng: 133.0505,
    minNights: 1, idealNights: 2,
    multiplier: 0.85,
    activitiesPerPerson: 2000,
    tags: ['history', 'culture', 'nature'],
    popularity: 0.25, underratedScore: 0.75,
    bestMonths: [
      { months: [4, 5], reason: 'Castle and lakes in spring green' },
      { months: [10, 11], reason: 'Autumn at Izumo-taisha and onsen' },
    ],
    avoidMonths: [
      { months: [1, 2], reason: 'Cold and grey — San\'in region gets little sun in winter' },
    ],
    dayTripFrom: [],
    accessNote: 'Remote — 5 hrs from Osaka; consider domestic flight to Izumo',
  },
  {
    id: 'tsuwano',
    name: 'Tsuwano',
    region: 'Chugoku',
    lat: 34.4674, lng: 131.7768,
    minNights: 1, idealNights: 1,
    multiplier: 0.8,
    activitiesPerPerson: 1500,
    tags: ['history', 'culture', 'nature'],
    popularity: 0.20, underratedScore: 0.80,
    bestMonths: [
      { months: [4, 5], reason: 'Iris garden and tiny preserved town' },
    ],
    avoidMonths: [
      { months: [1, 2], reason: 'Very cold, sparse transport' },
    ],
    dayTripFrom: ['hiroshima'],
    accessNote: '1.5 hrs from Shin-Yamaguchi by steam-hauled SL Yamaguchi — a train journey worth taking',
  },
  {
    id: 'naoshima',
    name: 'Naoshima',
    region: 'Chugoku',
    lat: 34.4631, lng: 133.9903,
    minNights: 1, idealNights: 2,
    multiplier: 1.1,
    activitiesPerPerson: 3500,
    tags: ['art', 'nature', 'culture'],
    popularity: 0.35, underratedScore: 0.65,
    bestMonths: [
      { months: [4, 5], reason: 'Mild weather, art island at its best' },
      { months: [10, 11], reason: 'Setouchi International Art Festival (Triennale) in Oct' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Hot, some museums close for Obon' },
    ],
    dayTripFrom: ['osaka', 'hiroshima'],
    accessNote: '1 hr ferry from Uno (Okayama); Uno is 15 min by bus from Okayama station',
  },

  // ── Shikoku ───────────────────────────────────────────────────────
  {
    id: 'matsuyama',
    name: 'Matsuyama',
    region: 'Shikoku',
    lat: 33.8392, lng: 132.7657,
    minNights: 1, idealNights: 2,
    multiplier: 0.9,
    activitiesPerPerson: 2000,
    tags: ['history', 'onsen', 'culture'],
    popularity: 0.30, underratedScore: 0.70,
    bestMonths: [
      { months: [3, 4], reason: 'Castle sakura, mild spring weather' },
      { months: [10, 11], reason: 'Dogo Onsen is lovely in autumn' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Very hot — Shikoku summers are brutal' },
    ],
    dayTripFrom: [],
    flightCode: 'MYJ',
    accessNote: '70-min LCC flight from Tokyo; or 90-min ferry from Hiroshima',
  },

  // ── Kyushu ────────────────────────────────────────────────────────
  {
    id: 'fukuoka',
    name: 'Fukuoka',
    region: 'Kyushu',
    lat: 33.5904, lng: 130.4017,
    minNights: 2, idealNights: 3,
    multiplier: 0.9,
    activitiesPerPerson: 2000,
    tags: ['food', 'nightlife', 'culture', 'history'],
    popularity: 0.65, underratedScore: 0.35,
    bestMonths: [
      { months: [3, 4], reason: 'Sakura at Ohori Park, mild and pleasant' },
      { months: [10, 11], reason: 'Festivals (Hakata Dontaku) and comfortable weather' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Hot and rainy' },
    ],
    dayTripFrom: [],
    flightCode: 'FUK',
  },
  {
    id: 'beppu',
    name: 'Beppu / Yufuin',
    region: 'Kyushu',
    lat: 33.2748, lng: 131.4985,
    minNights: 1, idealNights: 2,
    multiplier: 1.0,
    activitiesPerPerson: 2500,
    tags: ['onsen', 'nature', 'culture'],
    popularity: 0.45, underratedScore: 0.55,
    bestMonths: [
      { months: [1, 2], reason: 'Steam from hell springs in winter mist is spectacular' },
      { months: [10, 11], reason: 'Autumn leaves around Yufuin pond' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Busy domestic tourism season, hot' },
    ],
    dayTripFrom: ['fukuoka'],
    accessNote: '2 hrs from Fukuoka by Sonic limited express',
  },
  {
    id: 'nagasaki',
    name: 'Nagasaki',
    region: 'Kyushu',
    lat: 32.7503, lng: 129.8777,
    minNights: 2, idealNights: 2,
    multiplier: 0.9,
    activitiesPerPerson: 2500,
    tags: ['history', 'culture', 'food'],
    popularity: 0.50, underratedScore: 0.50,
    bestMonths: [
      { months: [3, 4], reason: 'Spring flowers at Glover Garden overlook' },
      { months: [11, 12], reason: 'Nagasaki Lantern Festival (Chinese New Year) — magical' },
    ],
    avoidMonths: [
      { months: [6, 7], reason: 'Rainy season — heavy precipitation' },
    ],
    dayTripFrom: ['fukuoka'],
    accessNote: '2 hrs from Fukuoka by Kamome Shinkansen (since 2022)',
  },
  {
    id: 'kagoshima',
    name: 'Kagoshima',
    region: 'Kyushu',
    lat: 31.5966, lng: 130.5571,
    minNights: 1, idealNights: 2,
    multiplier: 0.85,
    activitiesPerPerson: 2000,
    tags: ['nature', 'history', 'food'],
    popularity: 0.40, underratedScore: 0.60,
    bestMonths: [
      { months: [3, 4], reason: 'Cherry blossoms earliest in Japan (late March)' },
      { months: [10, 11], reason: 'Sakurajima volcano views, mild weather' },
    ],
    avoidMonths: [
      { months: [6, 7], reason: 'Rainy season, typhoon risk July–Sept' },
    ],
    dayTripFrom: ['fukuoka'],
    flightCode: 'KOJ',
    accessNote: '1.5 hrs from Fukuoka by Kyushu Shinkansen',
  },

  // ── Tohoku ────────────────────────────────────────────────────────
  {
    id: 'sendai',
    name: 'Sendai',
    region: 'Tohoku',
    lat: 38.2682, lng: 140.8694,
    minNights: 1, idealNights: 2,
    multiplier: 0.95,
    activitiesPerPerson: 2000,
    tags: ['culture', 'food', 'history'],
    popularity: 0.45, underratedScore: 0.55,
    bestMonths: [
      { months: [4], reason: 'Late sakura season — later than Tokyo, avoid crowds' },
      { months: [8], reason: 'Tanabata festival (Aug 6-8) — Japan\'s biggest' },
    ],
    avoidMonths: [
      { months: [1, 2], reason: 'Cold, heavy snow' },
    ],
    dayTripFrom: ['tokyo'],
    flightCode: 'SDJ',
    accessNote: '1.5 hrs from Tokyo by Tohoku Shinkansen',
  },

  // ── Hokkaido ──────────────────────────────────────────────────────
  {
    id: 'sapporo',
    name: 'Sapporo',
    region: 'Hokkaido',
    lat: 43.0618, lng: 141.3545,
    minNights: 2, idealNights: 3,
    multiplier: 1.0,
    activitiesPerPerson: 3000,
    tags: ['food', 'snow', 'nature', 'culture'],
    popularity: 0.75, underratedScore: 0.25,
    bestMonths: [
      { months: [2], reason: 'Sapporo Snow Festival (early February) — massive snow sculptures' },
      { months: [6, 7], reason: 'Lavender in bloom at Furano — uniquely beautiful' },
    ],
    avoidMonths: [
      { months: [12, 1], reason: 'Heavy snow can disrupt travel Dec–Mar; plan extra buffer days' },
    ],
    dayTripFrom: [],
    flightCode: 'CTS',
    accessNote: 'Needs domestic flight from Tokyo/Osaka (1.5 hrs). Shinkansen extension planned 2030.',
  },

  // ── Okinawa ───────────────────────────────────────────────────────
  {
    id: 'naha',
    name: 'Naha (Okinawa)',
    region: 'Okinawa',
    lat: 26.2124, lng: 127.6809,
    minNights: 2, idealNights: 4,
    multiplier: 1.0,
    activitiesPerPerson: 3500,
    tags: ['beaches', 'food', 'culture', 'history'],
    popularity: 0.70, underratedScore: 0.30,
    bestMonths: [
      { months: [4, 5], reason: 'Cherry blossoms in January–February, beaches from April' },
      { months: [10, 11], reason: 'Warm sea, fewer tourists than summer' },
    ],
    avoidMonths: [
      { months: [8, 9], reason: 'Typhoon season — real risk of disrupted travel' },
      { months: [6, 7], reason: 'Heavy rain (tsuyu) in June, then scorching heat' },
    ],
    dayTripFrom: [],
    flightCode: 'OKA',
    accessNote: 'Needs domestic flight from Tokyo (2.5 hrs) or Osaka (2 hrs)',
  },

  // ── Kumano / Wakayama ─────────────────────────────────────────────
  {
    id: 'kumano',
    name: 'Kumano Kodo (Wakayama)',
    region: 'Kansai',
    lat: 33.8900, lng: 135.7636,
    minNights: 2, idealNights: 3,
    multiplier: 1.0,
    activitiesPerPerson: 2000,
    tags: ['hiking', 'history', 'nature', 'culture'],
    popularity: 0.30, underratedScore: 0.70,
    bestMonths: [
      { months: [5, 6], reason: 'Lush green pilgrimage trails, mild weather' },
      { months: [10, 11], reason: 'Autumn foliage on the ancient trails' },
    ],
    avoidMonths: [
      { months: [7, 8], reason: 'Very hot and humid for multi-day hikes' },
      { months: [1, 2], reason: 'Cold and wet, some guesthouses closed' },
    ],
    dayTripFrom: [],
    accessNote: 'Remote — 3-4 hrs from Osaka (Nankai Rail + bus). Pre-book lodging.',
  },
];

// Quick lookup by id
export const CITY_MAP: Record<string, City> = Object.fromEntries(
  CITIES.map(c => [c.id, c])
);

// Compatibility: map old name-based city keys to new IDs
export const NAME_TO_ID: Record<string, string> = {
  Tokyo: 'tokyo', Kyoto: 'kyoto', Osaka: 'osaka', Nara: 'nara',
  Hiroshima: 'hiroshima', Hakone: 'hakone', Kanazawa: 'kanazawa',
  Sapporo: 'sapporo', Fukuoka: 'fukuoka',
  Kamakura: 'kamakura', Nikko: 'nikko', Kobe: 'kobe',
  Himeji: 'himeji', Takayama: 'takayama', Matsumoto: 'matsumoto',
  Kurashiki: 'kurashiki', Matsue: 'matsue', Nagasaki: 'nagasaki',
  Kagoshima: 'kagoshima', Matsuyama: 'matsuyama', Sendai: 'sendai',
  Naoshima: 'naoshima', Tsuwano: 'tsuwano', Beppu: 'beppu',
  Nagano: 'nagano', Okinawa: 'naha', Naha: 'naha',
  Koyasan: 'koyasan', Kumano: 'kumano', Kinosaki: 'kinosaki',
};

/** Haversine distance in km between two lat/lng points */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
