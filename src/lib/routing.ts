// Geographic routing — greedy nearest-neighbor TSP for Japanese cities
// Respects arrival airport (first city) and departure airport (last city)
// Groups cities by region to avoid backtracking

import { CITY_MAP, CITIES } from '../data/japan';
import { getTravelLeg } from './travelMatrix';

/** Convert airport code to city id (best effort) */
export function airportToCity(airport: string): string | null {
  const code = airport.toUpperCase();
  const found = CITIES.find(c =>
    c.flightCode?.toUpperCase() === code ||
    c.name.toUpperCase() === code ||
    c.id.toUpperCase() === code
  );
  return found?.id ?? null;
}

/** Travel time (mins, rail) between two city IDs */
function timeBetween(aId: string, bId: string): number {
  if (aId === bId) return 0;
  return getTravelLeg(aId, bId).timeMinsRail;
}

/**
 * Order cities for a route:
 * 1. Start at arrivalCityId (if provided and in list)
 * 2. End at departureCityId (if provided and different from arrival)
 * 3. Use greedy nearest-neighbor for the rest
 * 4. Region grouping heuristic: prefer cities in the same region before jumping
 */
export function orderCities(
  cityIds: string[],
  arrivalCityId?: string | null,
  departureCityId?: string | null
): string[] {
  if (cityIds.length <= 1) return [...cityIds];

  const ids = [...new Set(cityIds)]; // deduplicate
  if (ids.length === 1) return ids;

  // Determine pinned start and end
  const startId = arrivalCityId && ids.includes(arrivalCityId) ? arrivalCityId : null;
  const endId = departureCityId && ids.includes(departureCityId) && departureCityId !== startId
    ? departureCityId
    : null;

  // Cities to route (excluding pinned start and end)
  const middle = ids.filter(id => id !== startId && id !== endId);

  if (middle.length === 0) {
    const result: string[] = [];
    if (startId) result.push(startId);
    if (endId) result.push(endId);
    return result;
  }

  // Greedy nearest-neighbor from current position
  const ordered: string[] = [];
  const remaining = new Set(middle);

  let current = startId ?? middle[0];
  if (!startId) {
    // Pick the city that is most "eastern" as a starting point (Tokyo = good start)
    // Sort by longitude descending (east = higher lng in Japan)
    const easternmost = [...remaining].sort((a, b) => {
      const ca = CITY_MAP[a];
      const cb = CITY_MAP[b];
      return (cb?.lng ?? 135) - (ca?.lng ?? 135);
    })[0];
    current = easternmost;
    ordered.push(current);
    remaining.delete(current);
  }

  while (remaining.size > 0) {
    // Find nearest unvisited city (by rail time)
    // Prefer same region first (region bonus: subtract 60 mins from same-region cities)
    const currentCity = CITY_MAP[current];
    const currentRegion = currentCity?.region;

    let bestId = '';
    let bestScore = Infinity;

    for (const id of remaining) {
      const time = timeBetween(current, id);
      const city = CITY_MAP[id];
      // Region bonus: same-region cities feel 60 min closer
      const regionBonus = (city?.region === currentRegion) ? -60 : 0;
      const score = time + regionBonus;
      if (score < bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    ordered.push(bestId);
    remaining.delete(bestId);
    current = bestId;
  }

  // Assemble result
  const result: string[] = [];
  if (startId) result.push(startId);
  result.push(...ordered);
  if (endId) result.push(endId);
  return result;
}

/** Given an ordered list of city IDs, return total estimated travel time in minutes (rail) */
export function totalRouteTimeMins(orderedCityIds: string[]): number {
  let total = 0;
  for (let i = 1; i < orderedCityIds.length; i++) {
    total += timeBetween(orderedCityIds[i - 1], orderedCityIds[i]);
  }
  return total;
}

/** Check if a city can be a day trip from another city (< 2 hrs each way, in dayTripFrom list) */
export function canBeDayTrip(cityId: string, fromCityId: string): boolean {
  const city = CITY_MAP[cityId];
  if (!city) return false;
  if (city.dayTripFrom.includes(fromCityId)) return true;
  // Fallback: if rail time < 90 mins each way
  const leg = getTravelLeg(fromCityId, cityId);
  return leg.timeMinsRail <= 90;
}

/** Find the nearest base city (from a list) for a potential day-trip city */
export function findDayTripBase(
  dayTripCityId: string,
  candidateBaseIds: string[]
): string | null {
  const city = CITY_MAP[dayTripCityId];
  if (!city) return null;

  // Check explicit dayTripFrom list first
  for (const baseId of city.dayTripFrom) {
    if (candidateBaseIds.includes(baseId)) return baseId;
  }

  // Fallback: nearest base by rail time
  let best: string | null = null;
  let bestTime = Infinity;
  for (const baseId of candidateBaseIds) {
    if (baseId === dayTripCityId) continue;
    const t = getTravelLeg(baseId, dayTripCityId).timeMinsRail;
    if (t < 90 && t < bestTime) {
      bestTime = t;
      best = baseId;
    }
  }
  return best;
}
