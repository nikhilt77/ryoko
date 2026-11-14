import type { Trip, Stop, BudgetBreakdown, AppSettings, FitStep, StayType, FoodStyle, TransportMode } from '../types';
import type { DestinationConfig } from '../data/destinations';

function rooms(travelers: number): number {
  return Math.ceil(travelers / 2);
}

function stayNightPrice(
  stayType: 0 | 1 | 2,
  travelers: number,
  cfg: AppSettings
): number {
  if (stayType === 0) return cfg.hostelPerPersonPerNight * travelers;
  if (stayType === 1) return cfg.budgetHotelPerRoomPerNight * rooms(travelers);
  return cfg.midRangeHotelPerRoomPerNight * rooms(travelers);
}

export function calcBreakdown(
  trip: Trip,
  dest: DestinationConfig,
  settings: AppSettings
): BudgetBreakdown {
  const { travelers, travelMonth, transportMode, foodStyle, flight, stops, extras, exchangeRate } = trip;
  const seasonMult =
    (settings.seasonMultipliers?.[travelMonth - 1]) ??
    dest.seasonMultipliers[travelMonth - 1] ??
    1;

  // Flights (already in trip currency)
  const flights = (flight.farePerPerson + flight.bagFeePerPerson) * travelers;

  // Per-stop costs in JPY
  let stayJpy = 0;
  let activitiesJpy = 0;
  let intercityJpy = 0;

  stops.forEach((stop, idx) => {
    const city = dest.cities[stop.city];
    const cityMult = city?.multiplier ?? 1.0;
    const actPerPerson = city?.activitiesPerPerson ?? 2000;

    const nightPrice = stayNightPrice(stop.stayType, travelers, settings);
    stayJpy += nightPrice * stop.nights * cityMult * seasonMult;
    activitiesJpy += actPerPerson * travelers;

    if (idx > 0) {
      const legCost =
        transportMode === 'rail' ? settings.intercityLegRail : settings.intercityLegCheap;
      intercityJpy += legCost * travelers;
    }
  });

  const stopNights = stops.reduce((s, st) => s + st.nights, 0);
  const totalNights = stops.length > 0
    ? stopNights
    : (trip.totalNights && trip.totalNights > 0 ? trip.totalNights : 0);
  const totalDays = trip.totalDays && trip.totalDays > 0 && stops.length === 0
    ? trip.totalDays
    : (totalNights + 1);

  // Food
  const foodPerPersonPerDay =
    foodStyle === 'lean'
      ? settings.foodLean
      : foodStyle === 'balanced'
      ? settings.foodBalanced
      : settings.foodFoodie;
  const foodJpy = foodPerPersonPerDay * travelers * totalDays;

  // Local transport
  const localTransportJpy =
    settings.localTransportPerPersonPerDay * travelers * totalDays +
    settings.airportTransferPerPerson * travelers +
    intercityJpy;

  // Land subtotal + buffer
  const landJpy = stayJpy + foodJpy + localTransportJpy + activitiesJpy;
  const bufferJpy = landJpy * settings.contingencyBuffer;
  const landTotalJpy = landJpy + bufferJpy;

  // Convert JPY to trip currency
  // FIX: Use raw JPY values (no extra buffer multiplier) so category items sum to landTotal.
  // The 10% buffer appears as its own separate line (bufferConverted).
  const landTotal = landTotalJpy * exchangeRate;
  const stayConverted = stayJpy * exchangeRate;
  const foodConverted = foodJpy * exchangeRate;
  const localTransportConverted = localTransportJpy * exchangeRate;
  const activitiesConverted = activitiesJpy * exchangeRate;
  const bufferConverted = bufferJpy * exchangeRate;
  const intercityConverted = intercityJpy * exchangeRate;

  // Extras already in trip currency
  const extrasTotal = extras.reduce((s, e) => s + e.amount, 0);

  const total = flights + landTotal + extrasTotal;
  const perPerson = travelers > 0 ? total / travelers : total;
  const perDay = totalDays > 0 ? total / totalDays : total;

  return {
    flights,
    stay: stayConverted,
    food: foodConverted,
    localTransport: localTransportConverted - intercityConverted,
    intercity: intercityConverted,
    activities: activitiesConverted,
    extras: extrasTotal,
    buffer: bufferConverted,
    total,
    perPerson,
    perDay,
    totalNights,
  };
}

export interface FitResult {
  stops: Stop[];
  foodStyle: FoodStyle;
  transportMode: TransportMode;
  steps: FitStep[];
  success: boolean;
  underBudgetByMore25pct: boolean;
}

export function fitToBudget(
  trip: Trip,
  dest: DestinationConfig,
  settings: AppSettings
): FitResult {
  // Work on mutable copies
  let stops: Stop[] = trip.stops.map(s => ({ ...s }));
  let foodStyle: FoodStyle = trip.foodStyle;
  let transportMode: TransportMode = trip.transportMode;
  const steps: FitStep[] = [];
  const budget = trip.budget;

  function currentTotal(): number {
    return calcBreakdown(
      { ...trip, stops, foodStyle, transportMode },
      dest,
      settings
    ).total;
  }

  let total = currentTotal();
  let iterations = 0;
  const MAX_ITER = 100;

  while (total > budget && iterations < MAX_ITER) {
    iterations++;

    // Step 1: Switch from rail to cheap (fires once, then never again)
    if (transportMode === 'rail') {
      transportMode = 'cheap';
      steps.push({ description: 'Switched intercity travel from rail to buses/budget flights' });
      total = currentTotal();
      if (total <= budget) break;
      continue; // only one step per iteration
    }

    // Step 2a: Lower food from foodie → balanced
    if (foodStyle === 'foodie') {
      foodStyle = 'balanced';
      steps.push({ description: 'Lowered food style from foodie to balanced' });
      total = currentTotal();
      if (total <= budget) break;
      continue;
    }

    // Step 2b: Lower food from balanced → lean
    if (foodStyle === 'balanced') {
      foodStyle = 'lean';
      steps.push({ description: 'Lowered food style from balanced to lean' });
      total = currentTotal();
      if (total <= budget) break;
      continue;
    }

    // Step 3: Downgrade the most expensive non-hostel stop
    const downgradeable = stops
      .filter(s => s.stayType > 0)
      .sort((a, b) => {
        const aMult = dest.cities[a.city]?.multiplier ?? 1;
        const bMult = dest.cities[b.city]?.multiplier ?? 1;
        return (b.stayType * bMult * b.nights) - (a.stayType * aMult * a.nights);
      });

    if (downgradeable.length > 0) {
      const target = downgradeable[0];
      const idx = stops.findIndex(s => s.id === target.id);
      const prevType = stops[idx].stayType;
      stops[idx] = { ...stops[idx], stayType: (stops[idx].stayType - 1) as 0 | 1 | 2 };
      steps.push({
        description: `Downgraded ${target.city} stay from ${stayLabel(prevType)} to ${stayLabel(stops[idx].stayType)}`,
      });
      total = currentTotal();
      if (total <= budget) break;
      continue;
    }

    // Step 4: Remove a night from lowest-priority stop (priority < 3) with > 1 night
    const nightReducible = stops
      .filter(s => s.priority < 3 && s.nights > 1)
      .sort((a, b) => a.priority - b.priority || b.nights - a.nights);

    if (nightReducible.length > 0) {
      const target = nightReducible[0];
      const idx = stops.findIndex(s => s.id === target.id);
      stops[idx] = { ...stops[idx], nights: stops[idx].nights - 1 };
      steps.push({
        description: `Removed 1 night from ${target.city} (now ${stops[idx].nights} nights)`,
      });
      total = currentTotal();
      if (total <= budget) break;
      continue;
    }

    // Step 5: Drop lowest-priority stop (priority < 3) if more than 1 stop remains
    if (stops.length > 1) {
      const droppable = stops
        .filter(s => s.priority < 3)
        .sort((a, b) => a.priority - b.priority || b.nights - a.nights);

      if (droppable.length > 0) {
        const target = droppable[0];
        stops = stops.filter(s => s.id !== target.id);
        steps.push({ description: `Removed stop: ${target.city}` });
        total = currentTotal();
        if (total <= budget) break;
        continue;
      }
    }

    // Step 6: Last resort — remove a night from any stop with > 1 night
    const anyReducible = stops
      .filter(s => s.nights > 1)
      .sort((a, b) => b.nights - a.nights); // most nights first

    if (anyReducible.length > 0) {
      const target = anyReducible[0];
      const idx = stops.findIndex(s => s.id === target.id);
      stops[idx] = { ...stops[idx], nights: stops[idx].nights - 1 };
      steps.push({
        description: `(Last resort) Removed 1 night from ${target.city} (now ${stops[idx].nights} nights)`,
      });
      total = currentTotal();
      if (total <= budget) break;
      continue;
    }

    // Nothing left to do — break to avoid infinite loop
    break;
  }

  const success = total <= budget;
  const underBudgetByMore25pct = total < budget * 0.75;

  return { stops, foodStyle, transportMode, steps, success, underBudgetByMore25pct };
}

function stayLabel(t: StayType): string {
  if (t === 0) return 'hostel';
  if (t === 1) return 'budget hotel';
  return 'mid-range hotel';
}

// cheapest / priciest month calculation
export function monthCosts(
  trip: Trip,
  dest: DestinationConfig,
  settings: AppSettings
): { month: number; total: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const t = { ...trip, travelMonth: i + 1 };
    return { month: i + 1, total: calcBreakdown(t, dest, settings).total };
  });
}
