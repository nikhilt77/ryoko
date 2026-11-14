// Date scanner — evaluates all 12 months and returns ranked DateWindow options
// All calculations are ESTIMATES based on season multipliers and event data

import type { DateWindow, AppSettings, Trip } from '../types';
import { calcBreakdown } from './calculator';
import { DESTINATIONS } from '../data/destinations';
import { crowdScore, weatherScore, getEventsForMonth } from './events';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

/**
 * Scan all 12 months and return DateWindow[] sorted by value score (best first).
 * Uses the existing calcBreakdown for cost calculation per month.
 */
export function scanDates(
  trip: Trip,
  settings: AppSettings,
  cityIds: string[] = [],
  currentMonth: number = trip.travelMonth
): DateWindow[] {
  const dest = DESTINATIONS[trip.destination];
  if (!dest) return [];

  // Compute cost for the current selected month (baseline)
  const baselineCost = calcBreakdown({ ...trip, travelMonth: currentMonth }, dest, settings).total;

  const windows: DateWindow[] = [];

  for (let month = 1; month <= 12; month++) {
    const totalCost = calcBreakdown({ ...trip, travelMonth: month }, dest, settings).total;
    const crowd = crowdScore(month, cityIds);
    const weather = weatherScore(month, cityIds);

    // Value score: lower cost + better weather + lower crowd = higher value
    // Normalise so it's comparable across trips
    const valueScore = (1 / Math.max(totalCost, 1)) * weather * (1 - crowd * 0.5);

    const costDiff = totalCost - baselineCost;
    const costDiffPct = baselineCost > 0 ? (costDiff / baselineCost) * 100 : 0;

    // Build pros and cons
    const pros: string[] = [];
    const cons: string[] = [];
    const events = getEventsForMonth(month, cityIds);

    // Positive events
    for (const ev of events.filter(e => e.isPositive)) {
      pros.push(ev.description.split('—')[0].trim());
    }
    // Negative events
    for (const ev of events.filter(e => !e.isPositive)) {
      cons.push(ev.description.split('—')[0].trim());
    }

    if (crowd <= 0.3) pros.push('Low crowds — relaxed sightseeing');
    if (crowd >= 0.7) cons.push('High crowds — book everything early');
    if (weather >= 0.8) pros.push('Excellent weather');
    if (weather <= 0.4) cons.push('Difficult weather conditions');
    if (costDiff < -baselineCost * 0.1) pros.push(`~${Math.abs(Math.round(costDiffPct))}% cheaper than your selected month`);
    if (costDiff > baselineCost * 0.1) cons.push(`~${Math.round(costDiffPct)}% more expensive than your selected month`);

    windows.push({
      month,
      label: MONTH_NAMES[month - 1],
      totalCost,
      crowdScore: crowd,
      weatherScore: weather,
      valueScore,
      costDiff,
      costDiffPct,
      pros,
      cons,
      events: events.map(e => e.name),
    });
  }

  // Sort by value score descending (best first)
  return windows.sort((a, b) => b.valueScore - a.valueScore);
}
