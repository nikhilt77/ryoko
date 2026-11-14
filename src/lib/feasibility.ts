// Feasibility checker — evaluates whether a set of required cities is achievable
// given the total nights, budget, travelers, and travel month.

import type { FeasibilityItem, FeasibilityReport, PlannerInputs, AppSettings } from '../types';
import { CITY_MAP } from '../data/japan';
import { getTravelLeg } from './travelMatrix';
import { crowdScore } from './events';

/** Minimum budget (in JPY) for a city with given nights — hostel + cheap transport + lean food */
function minCityBudgetJpy(
  cityId: string,
  nights: number,
  travelers: number,
  settings: AppSettings,
  seasonMult: number
): number {
  const city = CITY_MAP[cityId];
  const mult = (city?.multiplier ?? 1.0) * seasonMult;
  const hostelPerNight = settings.hostelPerPersonPerNight * travelers * mult;
  const stay = hostelPerNight * nights;
  const days = nights + 1;
  const food = settings.foodLean * travelers * days;
  const localTransport = settings.localTransportPerPersonPerDay * travelers * days;
  const activities = (city?.activitiesPerPerson ?? 2000) * travelers;
  return stay + food + localTransport + activities;
}

/** Travel days consumed between N cities (conservative: 1 travel day per intercity leg if >3 hrs) */
function estimateTravelDays(orderedCityIds: string[]): number {
  let days = 0;
  for (let i = 1; i < orderedCityIds.length; i++) {
    const leg = getTravelLeg(orderedCityIds[i - 1], orderedCityIds[i]);
    // Count as a travel day if it takes > 3 hours by any mode
    if (leg.timeMinsRail > 180 || leg.mode === 'flight') {
      days += 1;
    }
  }
  return days;
}

export function checkFeasibility(
  inputs: PlannerInputs,
  settings: AppSettings,
  travelMonth: number,
  budget: number,          // in trip currency
  exchangeRate: number,
  travelers: number
): FeasibilityReport {
  const { requiredCityIds, totalNights } = inputs;
  const items: FeasibilityItem[] = [];

  if (requiredCityIds.length === 0) {
    return {
      items: [],
      totalTrafficDays: 0,
      minimumNightsNeeded: 0,
      minimumBudgetNeeded: 0,
      overallOk: true,
    };
  }

  const seasonMult = 1.0; // simplified; caller can pass actual season mult
  const budgetJpy = budget / exchangeRate;

  // Estimate total travel days between required cities
  const travelDays = estimateTravelDays(requiredCityIds);
  const totalTrafficDays = travelDays;

  // Minimum nights needed: each city needs minNights, plus travel days
  let minimumNightsNeeded = requiredCityIds.reduce((sum, id) => {
    const city = CITY_MAP[id];
    return sum + (city?.minNights ?? 2);
  }, 0) + travelDays;

  // Minimum budget (JPY) for all required cities at lean/hostel/cheap
  let minimumBudgetNeeded = 0;
  minimumBudgetNeeded += settings.airportTransferPerPerson * travelers * 2; // in/out
  for (const id of requiredCityIds) {
    const city = CITY_MAP[id];
    const minN = city?.minNights ?? 2;
    minimumBudgetNeeded += minCityBudgetJpy(id, minN, travelers, settings, seasonMult);
    // Add cheap intercity legs
    if (requiredCityIds.indexOf(id) > 0) {
      minimumBudgetNeeded += settings.intercityLegCheap * travelers;
    }
  }
  // Apply buffer
  minimumBudgetNeeded = minimumBudgetNeeded * (1 + settings.contingencyBuffer);

  // Per-city checks
  for (const cityId of requiredCityIds) {
    const city = CITY_MAP[cityId];
    if (!city) {
      items.push({
        cityId,
        cityName: cityId,
        verdict: 'impossible',
        reason: `City "${cityId}" not found in the database`,
      });
      continue;
    }

    // Check: seasonal closure
    const avoidEntry = city.avoidMonths.find(a => a.months.includes(travelMonth));
    if (avoidEntry) {
      // If it's a hard closure (Kamikochi) vs a soft warning
      const isHardClosure = avoidEntry.reason.toLowerCase().includes('closed');
      if (isHardClosure) {
        items.push({
          cityId,
          cityName: city.name,
          verdict: 'impossible',
          reason: `${city.name}: ${avoidEntry.reason}`,
          fix: { label: 'Change travel month', action: 'remove' },
        });
        continue;
      } else {
        // Soft warning — still included but flagged
        items.push({
          cityId,
          cityName: city.name,
          verdict: 'included',
          reason: `⚠️ ${city.name}: ${avoidEntry.reason} — still possible but expect challenges`,
        });
        continue;
      }
    }

    // Check: needs domestic flight (remote islands / Hokkaido / Okinawa)
    const needsFlight =
      city.region === 'Hokkaido' || city.region === 'Okinawa' ||
      (city.accessNote?.toLowerCase().includes('domestic flight'));

    if (needsFlight && totalNights <= 7) {
      items.push({
        cityId,
        cityName: city.name,
        verdict: 'not-recommended',
        reason: `${city.name} requires a domestic flight (~¥10,000–20,000 pp) and ${totalNights} nights is tight. Consider adding more nights or skipping.`,
        fix: { label: 'Remove from required', action: 'remove' },
      });
      continue;
    }

    // Check: not enough total nights
    if (minimumNightsNeeded > totalNights) {
      // This city contributes to the problem
      const myMinNights = city.minNights;
      items.push({
        cityId,
        cityName: city.name,
        verdict: 'fewer-nights',
        reason: `${city.name} needs at least ${myMinNights} nights but the total plan needs ${minimumNightsNeeded} nights minimum (you have ${totalNights})`,
        fix: { label: `Add ${minimumNightsNeeded - totalNights} more nights`, action: 'add-nights' },
      });
      continue;
    }

    // Check: too many required cities for the duration
    if (requiredCityIds.length > Math.floor(totalNights / 2)) {
      items.push({
        cityId,
        cityName: city.name,
        verdict: 'fewer-nights',
        reason: `Too many required cities (${requiredCityIds.length}) for ${totalNights} nights — some will get very few nights`,
        fix: { label: 'Reduce required cities', action: 'remove' },
      });
      continue;
    }

    // Check: can it be a day trip instead?
    if (city.minNights <= 1 && city.dayTripFrom.length > 0) {
      const sharedBase = city.dayTripFrom.find(b => requiredCityIds.includes(b));
      if (sharedBase) {
        const baseName = CITY_MAP[sharedBase]?.name ?? sharedBase;
        items.push({
          cityId,
          cityName: city.name,
          verdict: 'day-trip',
          reason: `${city.name} can be done as a day trip from ${baseName} — no extra overnight needed`,
          fix: { label: 'Convert to day trip', action: 'make-day-trip' },
        });
        continue;
      }
    }

    // Check: budget too low
    if (minimumBudgetNeeded > budgetJpy) {
      const minInCurrency = minimumBudgetNeeded * exchangeRate;
      items.push({
        cityId,
        cityName: city.name,
        verdict: 'included',
        reason: `⚠️ Budget may be tight. Minimum estimated for all required cities: ¥${Math.round(minimumBudgetNeeded).toLocaleString()} (${Math.round(minInCurrency).toLocaleString()} in your currency)`,
        fix: { label: 'Raise budget', action: 'raise-budget' },
      });
      continue;
    }

    // Check: peak crowd warning
    const crowd = crowdScore(travelMonth, [cityId]);
    if (city.popularity > 0.8 && crowd > 0.6) {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      items.push({
        cityId,
        cityName: city.name,
        verdict: 'included',
        reason: `⚠️ ${city.name} in ${monthNames[travelMonth-1]}: expect large crowds. Book accommodation early.`,
      });
      continue;
    }

    // All checks passed
    items.push({
      cityId,
      cityName: city.name,
      verdict: 'included',
      reason: `${city.name}: looks good for ${totalNights} nights in this month`,
    });
  }

  const overallOk = items.every(i =>
    i.verdict === 'included' || i.verdict === 'day-trip'
  );

  return {
    items,
    totalTrafficDays,
    minimumNightsNeeded,
    minimumBudgetNeeded,
    overallOk,
  };
}
