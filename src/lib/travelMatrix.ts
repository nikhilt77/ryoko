// Travel matrix between Japanese cities
// All times and costs are ESTIMATES — verify before booking
// Sources: Hyperdia, Google Maps, Japan Guide, Rome2Rio (approximations)
//
// Matrix values: timeMinsCheap (bus/local), timeMinsRail (shinkansen/express),
//                costCheapJpy (pp), costRailJpy (pp)

import { haversineKm, CITY_MAP } from '../data/japan';

export type TravelMode = 'bus' | 'train' | 'shinkansen' | 'flight' | 'ferry';

export interface TravelLeg {
  fromId: string;
  toId: string;
  timeMinsCheap: number;
  timeMinsRail: number;
  costCheapJpy: number;  // per person
  costRailJpy: number;   // per person
  mode: TravelMode;      // typical rail/fast mode
  isEstimate: boolean;
}

// Known city-pair travel data
// Keys are ALWAYS sorted alphabetically (e.g. 'hiroshima:tokyo' not 'tokyo:hiroshima')
// All values are ESTIMATES
const KNOWN_LEGS: Record<string, Omit<TravelLeg, 'fromId' | 'toId'>> = {
  // Tokyo pairs (t > most others alphabetically, so tokyo is usually second)
  'kyoto:tokyo': {
    timeMinsCheap: 480, timeMinsRail: 140,
    costCheapJpy: 4500, costRailJpy: 14000,
    mode: 'shinkansen', isEstimate: true,
  },
  'osaka:tokyo': {
    timeMinsCheap: 540, timeMinsRail: 150,
    costCheapJpy: 4500, costRailJpy: 15000,
    mode: 'shinkansen', isEstimate: true,
  },
  'hiroshima:tokyo': {
    timeMinsCheap: 720, timeMinsRail: 240,
    costCheapJpy: 6000, costRailJpy: 20000,
    mode: 'shinkansen', isEstimate: true,
  },
  'fukuoka:tokyo': {
    timeMinsCheap: 1200, timeMinsRail: 300,
    costCheapJpy: 8000, costRailJpy: 25000,
    mode: 'shinkansen', isEstimate: true,
  },
  'kanazawa:tokyo': {
    timeMinsCheap: 480, timeMinsRail: 150,
    costCheapJpy: 5000, costRailJpy: 14000,
    mode: 'shinkansen', isEstimate: true,
  },
  'sendai:tokyo': {
    timeMinsCheap: 240, timeMinsRail: 90,
    costCheapJpy: 3500, costRailJpy: 11000,
    mode: 'shinkansen', isEstimate: true,
  },
  'sapporo:tokyo': {
    timeMinsCheap: 120, timeMinsRail: 90,
    costCheapJpy: 8000, costRailJpy: 15000,
    mode: 'flight', isEstimate: true,
  },
  'naha:tokyo': {
    timeMinsCheap: 150, timeMinsRail: 150,
    costCheapJpy: 12000, costRailJpy: 20000,
    mode: 'flight', isEstimate: true,
  },
  'nikko:tokyo': {
    timeMinsCheap: 130, timeMinsRail: 110,
    costCheapJpy: 2000, costRailJpy: 3500,
    mode: 'train', isEstimate: true,
  },
  'kamakura:tokyo': {
    timeMinsCheap: 60, timeMinsRail: 60,
    costCheapJpy: 1000, costRailJpy: 1000,
    mode: 'train', isEstimate: true,
  },
  'hakone:tokyo': {
    timeMinsCheap: 100, timeMinsRail: 85,
    costCheapJpy: 2500, costRailJpy: 4500,
    mode: 'train', isEstimate: true,
  },
  'matsumoto:tokyo': {
    timeMinsCheap: 180, timeMinsRail: 155,
    costCheapJpy: 2500, costRailJpy: 5500,
    mode: 'train', isEstimate: true,
  },
  'nagano:tokyo': {
    timeMinsCheap: 180, timeMinsRail: 90,
    costCheapJpy: 2500, costRailJpy: 8000,
    mode: 'shinkansen', isEstimate: true,
  },
  // Kansai pairs
  'kyoto:osaka': {
    timeMinsCheap: 50, timeMinsRail: 15,
    costCheapJpy: 600, costRailJpy: 1500,
    mode: 'train', isEstimate: true,
  },
  'hiroshima:kyoto': {
    timeMinsCheap: 240, timeMinsRail: 80,
    costCheapJpy: 3500, costRailJpy: 11000,
    mode: 'shinkansen', isEstimate: true,
  },
  'kyoto:nara': {
    timeMinsCheap: 60, timeMinsRail: 45,
    costCheapJpy: 800, costRailJpy: 1200,
    mode: 'train', isEstimate: true,
  },
  'kanazawa:kyoto': {
    timeMinsCheap: 240, timeMinsRail: 75,
    costCheapJpy: 3500, costRailJpy: 8000,
    mode: 'shinkansen', isEstimate: true,
  },
  'kobe:kyoto': {
    timeMinsCheap: 60, timeMinsRail: 30,
    costCheapJpy: 800, costRailJpy: 1500,
    mode: 'train', isEstimate: true,
  },
  'himeji:kyoto': {
    timeMinsCheap: 90, timeMinsRail: 50,
    costCheapJpy: 2000, costRailJpy: 3000,
    mode: 'train', isEstimate: true,
  },
  'koyasan:kyoto': {
    timeMinsCheap: 120, timeMinsRail: 120,
    costCheapJpy: 2000, costRailJpy: 2500,
    mode: 'train', isEstimate: true,
  },
  'hiroshima:osaka': {
    timeMinsCheap: 240, timeMinsRail: 90,
    costCheapJpy: 3500, costRailJpy: 11000,
    mode: 'shinkansen', isEstimate: true,
  },
  'nara:osaka': {
    timeMinsCheap: 55, timeMinsRail: 40,
    costCheapJpy: 800, costRailJpy: 1000,
    mode: 'train', isEstimate: true,
  },
  'kanazawa:osaka': {
    timeMinsCheap: 240, timeMinsRail: 75,
    costCheapJpy: 3000, costRailJpy: 8000,
    mode: 'shinkansen', isEstimate: true,
  },
  'kobe:osaka': {
    timeMinsCheap: 40, timeMinsRail: 20,
    costCheapJpy: 600, costRailJpy: 1000,
    mode: 'train', isEstimate: true,
  },
  'himeji:osaka': {
    timeMinsCheap: 90, timeMinsRail: 40,
    costCheapJpy: 1500, costRailJpy: 2500,
    mode: 'train', isEstimate: true,
  },
  'naoshima:osaka': {
    timeMinsCheap: 120, timeMinsRail: 90,
    costCheapJpy: 2500, costRailJpy: 4000,
    mode: 'train', isEstimate: true,
  },
  'kurashiki:osaka': {
    timeMinsCheap: 120, timeMinsRail: 50,
    costCheapJpy: 2000, costRailJpy: 4000,
    mode: 'shinkansen', isEstimate: true,
  },
  'naha:osaka': {
    timeMinsCheap: 120, timeMinsRail: 120,
    costCheapJpy: 10000, costRailJpy: 18000,
    mode: 'flight', isEstimate: true,
  },
  'osaka:sapporo': {
    timeMinsCheap: 120, timeMinsRail: 120,
    costCheapJpy: 10000, costRailJpy: 18000,
    mode: 'flight', isEstimate: true,
  },
  // Chugoku / west pairs
  'hiroshima:kurashiki': {
    timeMinsCheap: 90, timeMinsRail: 40,
    costCheapJpy: 2000, costRailJpy: 4000,
    mode: 'shinkansen', isEstimate: true,
  },
  'hiroshima:naoshima': {
    timeMinsCheap: 120, timeMinsRail: 90,
    costCheapJpy: 2500, costRailJpy: 5000,
    mode: 'ferry', isEstimate: true,
  },
  'hiroshima:matsue': {
    timeMinsCheap: 150, timeMinsRail: 120,
    costCheapJpy: 2500, costRailJpy: 5000,
    mode: 'train', isEstimate: true,
  },
  'hiroshima:tsuwano': {
    timeMinsCheap: 120, timeMinsRail: 90,
    costCheapJpy: 2000, costRailJpy: 3500,
    mode: 'train', isEstimate: true,
  },
  // Kyushu pairs
  'beppu:fukuoka': {
    timeMinsCheap: 150, timeMinsRail: 115,
    costCheapJpy: 2000, costRailJpy: 4500,
    mode: 'train', isEstimate: true,
  },
  'fukuoka:nagasaki': {
    timeMinsCheap: 120, timeMinsRail: 60,
    costCheapJpy: 1800, costRailJpy: 4000,
    mode: 'shinkansen', isEstimate: true,
  },
  'fukuoka:kagoshima': {
    timeMinsCheap: 240, timeMinsRail: 90,
    costCheapJpy: 3000, costRailJpy: 8000,
    mode: 'shinkansen', isEstimate: true,
  },
  // Chubu pairs
  'kanazawa:takayama': {
    timeMinsCheap: 120, timeMinsRail: 75,
    costCheapJpy: 2000, costRailJpy: 3500,
    mode: 'train', isEstimate: true,
  },
  'matsumoto:takayama': {
    timeMinsCheap: 120, timeMinsRail: 90,
    costCheapJpy: 2000, costRailJpy: 3000,
    mode: 'train', isEstimate: true,
  },
  'matsumoto:nagano': {
    timeMinsCheap: 50, timeMinsRail: 50,
    costCheapJpy: 800, costRailJpy: 1500,
    mode: 'train', isEstimate: true,
  },
};

function sortedKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Get travel leg between two cities (estimated).
 *  Returns bidirectional data — times/costs are the same in both directions. */
export function getTravelLeg(fromId: string, toId: string): TravelLeg {
  if (fromId === toId) {
    return {
      fromId, toId,
      timeMinsCheap: 0, timeMinsRail: 0,
      costCheapJpy: 0, costRailJpy: 0,
      mode: 'train', isEstimate: false,
    };
  }

  const key = sortedKey(fromId, toId);
  const known = KNOWN_LEGS[key];
  if (known) {
    return { fromId, toId, ...known };
  }

  // Fallback: estimate from haversine distance
  const cityA = CITY_MAP[fromId];
  const cityB = CITY_MAP[toId];
  if (!cityA || !cityB) {
    return {
      fromId, toId,
      timeMinsCheap: 240, timeMinsRail: 180,
      costCheapJpy: 4500, costRailJpy: 9000,
      mode: 'train', isEstimate: true,
    };
  }

  const distKm = haversineKm(cityA.lat, cityA.lng, cityB.lat, cityB.lng);

  // Cities on different main islands or >500 km apart likely need a flight
  const needsFlight = distKm > 500 ||
    (cityA.region === 'Hokkaido' && cityB.region !== 'Hokkaido') ||
    (cityB.region === 'Hokkaido' && cityA.region !== 'Hokkaido') ||
    (cityA.region === 'Okinawa') ||
    (cityB.region === 'Okinawa');

  if (needsFlight) {
    // Estimate: flight ~90-150 min, cost depends on distance
    const flightMins = Math.round(60 + distKm * 0.08);
    const cheapFlight = Math.round(distKm * 20 + 5000);
    const railFlight = Math.round(distKm * 30 + 8000);
    return {
      fromId, toId,
      timeMinsCheap: flightMins, timeMinsRail: flightMins,
      costCheapJpy: cheapFlight, costRailJpy: railFlight,
      mode: 'flight', isEstimate: true,
    };
  }

  // Surface: estimate ~1.4 min/km for bullet train, 2.5 min/km for bus
  const timeMinsRail = Math.max(30, Math.round(distKm * 1.4));
  const timeMinsCheap = Math.max(60, Math.round(distKm * 2.5));
  const costRailJpy = Math.round(distKm * 55 + 1000);    // ~¥55/km JR
  const costCheapJpy = Math.round(distKm * 20 + 500);     // ~¥20/km bus

  return {
    fromId, toId,
    timeMinsCheap, timeMinsRail,
    costCheapJpy, costRailJpy,
    mode: distKm > 200 ? 'shinkansen' : 'train', isEstimate: true,
  };
}

/** Total intercity travel cost (pp) for an ordered route in JPY */
export function routeTravelCostJpy(
  orderedCityIds: string[],
  mode: 'cheap' | 'rail'
): number {
  let total = 0;
  for (let i = 1; i < orderedCityIds.length; i++) {
    const leg = getTravelLeg(orderedCityIds[i - 1], orderedCityIds[i]);
    total += mode === 'rail' ? leg.costRailJpy : leg.costCheapJpy;
  }
  return total;
}
