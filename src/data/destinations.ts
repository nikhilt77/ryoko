// All base prices are in JPY.
// Edit this file to add new countries / cities.

export interface CityConfig {
  name: string;
  multiplier: number;
  activitiesPerPerson: number; // JPY per stop
  flightCode?: string; // IATA for the city (used in search URLs)
}

export interface DestinationConfig {
  id: string;
  label: string;
  currency: string;
  defaultRate: number; // 1 unit of destination currency = X of user's trip currency? No — rate is "1 JPY = X trip-currency"
  cities: Record<string, CityConfig>;
  seasonMultipliers: number[]; // length 12, index 0 = January
  intercityLegCheap: number;  // JPY per person
  intercityLegRail: number;   // JPY per person
  foodCostPerPersonPerDay: { lean: number; balanced: number; foodie: number };
  localTransportPerPersonPerDay: number;
  airportTransferPerPerson: number;
  hostelPerPersonPerNight: number;
  budgetHotelPerRoomPerNight: number;
  midRangeHotelPerRoomPerNight: number;
  contingencyBuffer: number; // fraction e.g. 0.10
}

export const JAPAN: DestinationConfig = {
  id: 'japan',
  label: 'Japan',
  currency: 'JPY',
  defaultRate: 0.0065,
  cities: {
    Tokyo: {
      name: 'Tokyo',
      multiplier: 1.1,
      activitiesPerPerson: 5000,
      flightCode: 'TYO',
    },
    Kyoto: {
      name: 'Kyoto',
      multiplier: 1.15,
      activitiesPerPerson: 5000,
    },
    Osaka: {
      name: 'Osaka',
      multiplier: 1.0,
      activitiesPerPerson: 4500,
    },
    Nara: {
      name: 'Nara',
      multiplier: 0.9,
      activitiesPerPerson: 1500,
    },
    Hiroshima: {
      name: 'Hiroshima',
      multiplier: 0.95,
      activitiesPerPerson: 2500,
    },
    Hakone: {
      name: 'Hakone',
      multiplier: 1.3,
      activitiesPerPerson: 4000,
    },
    Kanazawa: {
      name: 'Kanazawa',
      multiplier: 1.0,
      activitiesPerPerson: 2500,
    },
    Sapporo: {
      name: 'Sapporo',
      multiplier: 1.0,
      activitiesPerPerson: 3000,
    },
    Fukuoka: {
      name: 'Fukuoka',
      multiplier: 0.9,
      activitiesPerPerson: 2000,
    },
  },
  // Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
  seasonMultipliers: [0.9, 0.9, 1.35, 1.35, 1.1, 0.9, 1.05, 1.1, 1.0, 1.15, 1.25, 1.1],
  intercityLegCheap: 4500,
  intercityLegRail: 9000,
  foodCostPerPersonPerDay: {
    lean: 3000,
    balanced: 5000,
    foodie: 8000,
  },
  localTransportPerPersonPerDay: 700,
  airportTransferPerPerson: 3000,
  hostelPerPersonPerNight: 3500,
  budgetHotelPerRoomPerNight: 9000,
  midRangeHotelPerRoomPerNight: 16000,
  contingencyBuffer: 0.10,
};

export const DESTINATIONS: Record<string, DestinationConfig> = {
  japan: JAPAN,
};

export const DEFAULT_DESTINATION = 'japan';

export const DEFAULT_CITY_PLACES: Record<string, string[]> = {
  Tokyo: ['Shinjuku & Shibuya Crossing', 'Senso-ji Temple (Asakusa)', 'Akihabara Electric Town', 'Meiji Jingu Shrine'],
  Kyoto: ['Fushimi Inari Taisha (Torii Gates)', 'Kinkaku-ji (Golden Pavilion)', 'Arashiyama Bamboo Grove', 'Gion Historic District'],
  Osaka: ['Dotonbori Street Food', 'Osaka Castle & Park', 'Shinsekai District', 'Universal Studios Japan'],
  Nara: ['Nara Park & Sacred Deer', 'Todai-ji (Great Buddha)', 'Kasuga Taisha Shrine'],
  Hiroshima: ['Peace Memorial Park & Museum', 'Itsukushima Shrine (Miyajima Floating Torii)'],
  Hakone: ['Lake Ashi Cruise', 'Mount Fuji Viewpoints', 'Hakone Onsen & Ropeway'],
  Kanazawa: ['Kenroku-en Traditional Garden', 'Higashi Chaya Geisha District', 'Omicho Market'],
  Sapporo: ['Odori Park & TV Tower', 'Susukino Nightlife', 'Sapporo Beer Museum & Garden'],
  Fukuoka: ['Hakata Yatai Food Stalls', 'Ohori Park & Castle Ruins', 'Dazaifu Tenmangu Shrine'],
};

// Popular preset cities/places for quick auto-complete
export const POPULAR_PLACES_SUGGESTIONS = [
  'Tokyo',
  'Kyoto',
  'Osaka',
  'Nara',
  'Hiroshima',
  'Hakone',
  'Kanazawa',
  'Sapporo',
  'Fukuoka',
  'Mount Fuji (Kawaguchiko)',
  'Takayama & Shirakawa-go',
  'Kamakura',
  'Nikko',
  'Kobe',
  'Yokohama',
  'Nagoya',
  'Okinawa',
  'Miyajima',
];

// Suggested plan generator per total nights
export function suggestPlan(nights: number): Array<{ city: string; nights: number; priority: 1 | 2 | 3 }> {
  let cities: Array<{ city: string; priority: 1 | 2 | 3 }>;
  if (nights <= 5) {
    cities = [
      { city: 'Tokyo', priority: 3 },
      { city: 'Kyoto', priority: 3 },
    ];
  } else if (nights <= 8) {
    cities = [
      { city: 'Tokyo', priority: 3 },
      { city: 'Kyoto', priority: 3 },
      { city: 'Osaka', priority: 2 },
    ];
  } else if (nights <= 12) {
    cities = [
      { city: 'Tokyo', priority: 3 },
      { city: 'Kyoto', priority: 3 },
      { city: 'Osaka', priority: 2 },
      { city: 'Hiroshima', priority: 2 },
    ];
  } else {
    cities = [
      { city: 'Tokyo', priority: 3 },
      { city: 'Kyoto', priority: 3 },
      { city: 'Osaka', priority: 2 },
      { city: 'Hiroshima', priority: 2 },
      { city: 'Kanazawa', priority: 1 },
    ];
  }

  const n = cities.length;
  const safeNights = Math.max(n, Math.max(1, Math.round(nights)));
  const base = Math.floor(safeNights / n);
  const leftover = safeNights - base * n;
  return cities.map((c, i) => ({
    city: c.city,
    nights: base + (i < leftover ? 1 : 0),
    priority: c.priority,
  }));
}
