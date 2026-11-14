// Plan generator — builds a full itinerary from planner inputs
// All logic is deterministic, no randomness, no live APIs

import type {
  PlannerInputs, PlanResult, PlanStop, AppSettings,
  StayType, Priority, Trip,
} from '../types';
import { CITY_MAP, CITIES } from '../data/japan';
import { getTravelLeg } from './travelMatrix';
import { orderCities, airportToCity, findDayTripBase } from './routing';
import { checkFeasibility } from './feasibility';
import { scanDates } from './dates';
import { DESTINATIONS } from '../data/destinations';
import { calcBreakdown } from './calculator';

/** Night multiplier per pace */
const PACE_MULT: Record<string, number> = {
  relaxed: 1.3,
  balanced: 1.0,
  fast: 0.75,
};

/** Allocate nights across cities given total nights and pace */
function allocateNights(
  orderedIds: string[],
  totalNights: number,
  pace: string
): Record<string, number> {
  if (orderedIds.length === 0) return {};

  const mult = PACE_MULT[pace] ?? 1.0;

  // Base ideal nights per city (from data, scaled by pace)
  const ideals = orderedIds.map(id => {
    const city = CITY_MAP[id];
    return Math.max(city?.minNights ?? 2, Math.round((city?.idealNights ?? 2) * mult));
  });

  const idealTotal = ideals.reduce((s, n) => s + n, 0);
  let result: number[];

  if (idealTotal <= totalNights) {
    // We have more nights than ideal — distribute extras to first cities
    result = [...ideals];
    let extra = totalNights - idealTotal;
    for (let i = 0; extra > 0; i = (i + 1) % orderedIds.length) {
      result[i]++;
      extra--;
    }
  } else {
    // Not enough nights — scale down proportionally, respecting minNights
    const minNights = orderedIds.map(id => CITY_MAP[id]?.minNights ?? 1);
    const minTotal = minNights.reduce((s, n) => s + n, 0);
    if (minTotal >= totalNights) {
      // Can't even do mins — just distribute evenly at minimum
      result = minNights.map((m, i) => {
        const extra = Math.floor((totalNights - minTotal) / orderedIds.length);
        return m + (i < (totalNights - minTotal) % orderedIds.length ? extra + 1 : extra);
      });
      result = result.map((n, i) => Math.max(n, minNights[i]));
    } else {
      // Scale down ideals proportionally
      result = ideals.map((ideal, i) => {
        const scaled = Math.max(minNights[i], Math.floor(ideal * totalNights / idealTotal));
        return scaled;
      });
      // Distribute remaining nights
      let remaining = totalNights - result.reduce((s, n) => s + n, 0);
      for (let i = 0; remaining > 0 && i < result.length; i++) {
        result[i]++;
        remaining--;
      }
    }
  }

  const alloc: Record<string, number> = {};
  orderedIds.forEach((id, i) => { alloc[id] = Math.max(1, result[i]); });
  return alloc;
}

/**
 * Score an underrated city candidate for insertion into the plan.
 * Higher = better candidate.
 */
function scoreUnderrated(
  cityId: string,
  interestTags: string[],
  travelMonth: number,
  baseCityIds: string[],
  _budgetJpy: number
): number {
  const city = CITY_MAP[cityId];
  if (!city) return 0;

  const tagMatch = interestTags.length === 0
    ? 0.5
    : city.tags.filter(t => interestTags.includes(t)).length / interestTags.length;

  // Check if it's in avoidMonths
  const isAvoid = city.avoidMonths.some(a => a.months.includes(travelMonth));
  const seasonBonus = isAvoid ? 0.3 : 1.0;

  // Check detour cost (if it has a dayTripFrom base in our plan, it's cheaper to include)
  const hasDayTripBase = city.dayTripFrom.some(b => baseCityIds.includes(b));
  const detourBonus = hasDayTripBase ? 1.3 : 0.8;

  return city.underratedScore * tagMatch * seasonBonus * detourBonus;
}

/**
 * Build a full itinerary plan from planner inputs.
 * Returns PlanResult with stops, feasibility, date suggestions, and warnings.
 */
export function buildPlan(
  inputs: PlannerInputs,
  trip: Trip,
  settings: AppSettings
): PlanResult {
  const {
    requiredCityIds,
    wishlistCityIds,
    totalNights,
    pace,
    interestTags,
    arrivalAirport,
    departureAirport,
    includeUnderratedScore,
  } = inputs;

  const { travelMonth, travelers, exchangeRate, budget } = trip;
  const warnings: string[] = [];
  const underratedInserted: PlanResult['underratedInserted'] = [];

  // 1. Feasibility check
  const feasibility = checkFeasibility(inputs, settings, travelMonth, budget, exchangeRate, travelers);

  // 2. Determine start and end cities from airports
  const arrivalCityId = airportToCity(arrivalAirport) ?? (requiredCityIds[0] || null);
  const departureCityId = airportToCity(departureAirport) ?? null;

  // 3. Build the set of base cities (required + accepted wishlist that fit)
  const baseCityIds = [...new Set(requiredCityIds)];

  // Add wishlist cities that are feasible
  for (const id of wishlistCityIds) {
    if (baseCityIds.includes(id)) continue;
    const city = CITY_MAP[id];
    if (!city) continue;
    // Check if it can be a day trip from an existing base
    const dayTripBase = findDayTripBase(id, baseCityIds);
    if (dayTripBase || baseCityIds.length * 2 < totalNights) {
      baseCityIds.push(id);
    }
  }

  // 4. Order cities geographically
  const orderedIds = orderCities(baseCityIds, arrivalCityId, departureCityId);

  // 5. Allocate nights
  const nightAlloc = allocateNights(orderedIds, totalNights, pace);

  // 6. Try to insert underrated cities if the slider is active
  if (includeUnderratedScore > 0) {
    const usedNights = Object.values(nightAlloc).reduce((s, n) => s + n, 0);
    const freeNights = totalNights - usedNights;

    // Candidates: not already in plan, underratedScore >= threshold
    const threshold = 1 - includeUnderratedScore; // slider 0.7 → threshold 0.3
    const candidates = CITIES
      .filter(c =>
        !baseCityIds.includes(c.id) &&
        c.underratedScore >= threshold &&
        !c.avoidMonths.some(a => a.months.includes(travelMonth) && a.reason.toLowerCase().includes('closed'))
      )
      .map(c => ({
        id: c.id,
        score: scoreUnderrated(c.id, interestTags, travelMonth, orderedIds, budget / exchangeRate),
      }))
      .sort((a, b) => b.score - a.score);

    for (const candidate of candidates.slice(0, 3)) {
      const city = CITY_MAP[candidate.id];
      if (!city) continue;

      const dayTripBase = findDayTripBase(candidate.id, orderedIds);
      if (dayTripBase) {
        // Insert as day-trip note (no extra nights needed)
        const reason = buildSuggestionReason(candidate.id, interestTags, travelMonth, dayTripBase);
        underratedInserted.push({ cityId: candidate.id, cityName: city.name, reason });
      } else if (freeNights >= city.minNights) {
        // Insert as a full stop
        const insertAfter = orderedIds.findIndex(id => {
          const c = CITY_MAP[id];
          return c?.region === city.region;
        });
        const insertIdx = insertAfter >= 0 ? insertAfter + 1 : orderedIds.length - 1;
        orderedIds.splice(insertIdx, 0, candidate.id);
        nightAlloc[candidate.id] = city.minNights;
        const reason = buildSuggestionReason(candidate.id, interestTags, travelMonth, null);
        underratedInserted.push({ cityId: candidate.id, cityName: city.name, reason });
      }
      if (underratedInserted.length >= 2) break;
    }
  }

  // 7. Add warnings
  const dest = DESTINATIONS[trip.destination];
  if (dest) {
    const seasonMult = settings.seasonMultipliers?.[travelMonth - 1] ?? dest.seasonMultipliers[travelMonth - 1] ?? 1;
    if (seasonMult >= 1.3) {
      const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][travelMonth-1];
      warnings.push(`${monthName} is a peak season month (cost multiplier ${seasonMult}×). Expect higher prices and more crowds.`);
    }
  }

  // Check for Sapporo / Okinawa in short trips
  for (const id of orderedIds) {
    const city = CITY_MAP[id];
    if (!city) continue;
    if ((city.region === 'Hokkaido' || city.region === 'Okinawa') && totalNights <= 7) {
      warnings.push(`${city.name} requires a domestic flight and may not be worth it on a ${totalNights}-night trip. Consider replacing with a Honshu destination.`);
    }
  }

  // 8. Build PlanStop array with day ranges and travel legs
  const stops: PlanStop[] = [];
  let dayCounter = 1;

  for (let i = 0; i < orderedIds.length; i++) {
    const cityId = orderedIds[i];
    const city = CITY_MAP[cityId];
    const nights = nightAlloc[cityId] ?? (city?.minNights ?? 2);
    const isRequired = requiredCityIds.includes(cityId);
    const isWishlist = wishlistCityIds.includes(cityId);
    const isUnderrated = underratedInserted.some(u => u.cityId === cityId);
    const source = isRequired ? 'required' : (isWishlist ? 'user' : 'suggested');

    // Check if this is a day trip
    const dayTripInfo = underratedInserted.find(u => u.cityId === cityId);
    const isDayTrip = !isRequired && !isWishlist && dayTripInfo !== undefined &&
      !Object.keys(nightAlloc).includes(cityId);

    if (isDayTrip) continue; // day trips are shown as notes, not full stops

    const travelLeg = i > 0
      ? getTravelLeg(orderedIds[i - 1], cityId)
      : undefined;

    // On travel days, traveler arrives in the new city
    const travelDayOffset = (travelLeg && travelLeg.timeMinsRail > 180) ? 1 : 0;

    const rangeStart = dayCounter;
    const rangeEnd = dayCounter + nights - 1 + travelDayOffset;

    const priority: Priority = isRequired ? 3 : (isWishlist ? 2 : (isUnderrated ? 2 : 1));
    const suggestionReason = isUnderrated
      ? underratedInserted.find(u => u.cityId === cityId)?.reason
      : undefined;

    stops.push({
      cityId,
      cityName: city?.name ?? cityId,
      nights,
      dayRangeStart: rangeStart,
      dayRangeEnd: rangeEnd,
      source,
      required: isRequired,
      stayType: 1 as StayType,
      priority,
      places: [],
      travelLegFromPrev: travelLeg
        ? {
            timeMinsCheap: travelLeg.timeMinsCheap,
            timeMinsRail: travelLeg.timeMinsRail,
            costCheapJpy: travelLeg.costCheapJpy,
            costRailJpy: travelLeg.costRailJpy,
            mode: travelLeg.mode,
            isEstimate: travelLeg.isEstimate,
          }
        : undefined,
      suggestionReason,
      isDayTrip: false,
    });

    dayCounter = rangeEnd + 1;
  }

  // Add day-trip stops at the end (conceptually attached to their base)
  for (const dt of underratedInserted) {
    const dayTripBase = findDayTripBase(dt.cityId, orderedIds);
    if (!dayTripBase) continue;
    // Check if it was already added as a full stop
    if (stops.some(s => s.cityId === dt.cityId)) continue;
    const city = CITY_MAP[dt.cityId];
    const baseStop = stops.find(s => s.cityId === dayTripBase);
    if (!baseStop) continue;
    stops.push({
      cityId: dt.cityId,
      cityName: city?.name ?? dt.cityId,
      nights: 0,
      dayRangeStart: baseStop.dayRangeStart,
      dayRangeEnd: baseStop.dayRangeEnd,
      source: 'suggested',
      required: false,
      stayType: 1 as StayType,
      priority: 2 as Priority,
      places: [],
      suggestionReason: dt.reason,
      isDayTrip: true,
      dayTripFromId: dayTripBase,
    });
  }

  // 9. Compute total cost using calcBreakdown on converted stops
  const convertedStops = stops
    .filter(s => !s.isDayTrip)
    .map(s => ({
      id: s.cityId,
      city: s.cityName,
      nights: s.nights,
      stayType: s.stayType,
      priority: s.priority,
    }));

  const breakdownTrip = {
    ...trip,
    stops: convertedStops,
    totalNights: stops.filter(s => !s.isDayTrip).reduce((sum, s) => sum + s.nights, 0),
  };

  let totalCost = 0;
  if (dest && convertedStops.length > 0) {
    totalCost = calcBreakdown(breakdownTrip as unknown as Trip, dest, settings).total;
  }

  // 10. Date suggestions
  const dateSuggestions = scanDates(trip, settings, orderedIds, travelMonth);

  return {
    stops,
    totalNights: stops.filter(s => !s.isDayTrip).reduce((sum, s) => sum + s.nights, 0),
    totalCost,
    feasibility,
    dateSuggestions,
    warnings,
    underratedInserted,
  };
}

function buildSuggestionReason(
  cityId: string,
  interestTags: string[],
  travelMonth: number,
  dayTripBase: string | null
): string {
  const city = CITY_MAP[cityId];
  if (!city) return 'Underrated destination';

  const matchedTags = city.tags.filter(t => interestTags.includes(t));
  const bestMonth = city.bestMonths.find(b => b.months.includes(travelMonth));

  const parts: string[] = [];
  if (city.underratedScore >= 0.6) parts.push('Highly underrated gem');
  if (matchedTags.length > 0) parts.push(`matches your interests: ${matchedTags.join(', ')}`);
  if (bestMonth) parts.push(bestMonth.reason);
  if (dayTripBase) {
    const baseName = CITY_MAP[dayTripBase]?.name ?? dayTripBase;
    parts.push(`easy day trip from ${baseName}`);
  }

  return parts.length > 0 ? parts.join(' · ') : `Interesting off-the-beaten-path stop`;
}
