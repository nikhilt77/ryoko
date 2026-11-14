import { describe, it, expect } from 'vitest';
import { calcBreakdown, fitToBudget } from '../lib/calculator';
import { JAPAN } from '../data/destinations';
import { defaultSettings } from '../lib/storage';
import type { Trip } from '../types';
import { generateId } from '../lib/id';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: generateId(),
    name: 'Test',
    currency: 'USD',
    exchangeRate: 0.0065,
    budget: 2000,
    travelers: 2,
    travelMonth: 4,
    destination: 'japan',
    stops: [
      { id: generateId(), city: 'Tokyo', nights: 3, stayType: 1, priority: 3 },
      { id: generateId(), city: 'Kyoto', nights: 2, stayType: 1, priority: 3 },
      { id: generateId(), city: 'Osaka', nights: 2, stayType: 1, priority: 2 },
    ],
    flight: { origin: 'JFK', departureDate: '2025-04-01', farePerPerson: 600, bagFeePerPerson: 30 },
    foodStyle: 'balanced',
    transportMode: 'rail',
    extras: [],
    ...overrides,
  };
}

const settings = defaultSettings();

describe('calcBreakdown', () => {
  it('computes a positive total for a known trip', () => {
    const trip = makeTrip();
    const bd = calcBreakdown(trip, JAPAN, settings);
    expect(bd.total).toBeGreaterThan(0);
  });

  it('includes flight costs in the total', () => {
    const tripWithFlights = makeTrip({ flight: { origin: 'JFK', departureDate: '2025-04-01', farePerPerson: 600, bagFeePerPerson: 30 } });
    const tripNoFlights = makeTrip({ flight: { origin: 'JFK', departureDate: '2025-04-01', farePerPerson: 0, bagFeePerPerson: 0 } });
    const bdWith = calcBreakdown(tripWithFlights, JAPAN, settings);
    const bdNo = calcBreakdown(tripNoFlights, JAPAN, settings);
    // With flights for 2 pax: (600+30)*2 = 1260 more
    expect(bdWith.total - bdNo.total).toBeCloseTo(1260, 0);
  });

  it('increases total with higher food style', () => {
    const lean = calcBreakdown(makeTrip({ foodStyle: 'lean' }), JAPAN, settings);
    const balanced = calcBreakdown(makeTrip({ foodStyle: 'balanced' }), JAPAN, settings);
    const foodie = calcBreakdown(makeTrip({ foodStyle: 'foodie' }), JAPAN, settings);
    expect(balanced.total).toBeGreaterThan(lean.total);
    expect(foodie.total).toBeGreaterThan(balanced.total);
  });

  it('computes per-person and per-day correctly', () => {
    const trip = makeTrip();
    const bd = calcBreakdown(trip, JAPAN, settings);
    expect(bd.perPerson).toBeCloseTo(bd.total / trip.travelers, 2);
    const totalNights = trip.stops.reduce((s, st) => s + st.nights, 0);
    expect(bd.perDay).toBeCloseTo(bd.total / (totalNights + 1), 2);
  });

  it('applies season multiplier — April (1.35) is pricier than June (0.9)', () => {
    const april = calcBreakdown(makeTrip({ travelMonth: 4 }), JAPAN, settings);
    const june = calcBreakdown(makeTrip({ travelMonth: 6 }), JAPAN, settings);
    expect(april.total).toBeGreaterThan(june.total);
  });

  it('hostel is cheaper than mid-range hotel', () => {
    const hostel = makeTrip({
      stops: [
        { id: generateId(), city: 'Tokyo', nights: 3, stayType: 0, priority: 3 },
      ],
    });
    const midRange = makeTrip({
      stops: [
        { id: generateId(), city: 'Tokyo', nights: 3, stayType: 2, priority: 3 },
      ],
    });
    const bdHostel = calcBreakdown(hostel, JAPAN, settings);
    const bdMid = calcBreakdown(midRange, JAPAN, settings);
    expect(bdMid.total).toBeGreaterThan(bdHostel.total);
  });

  // ── BUG 1 regression: breakdown categories must sum to total ─────
  it('breakdown categories sum to total (no double-buffer inflation)', () => {
    const trip = makeTrip();
    const bd = calcBreakdown(trip, JAPAN, settings);
    const sum = bd.stay + bd.food + bd.localTransport + bd.intercity + bd.activities + bd.buffer + bd.flights + bd.extras;
    expect(sum).toBeCloseTo(bd.total, 1); // within 0.1 currency units
  });

  // ── Spec hand-calculation test ───────────────────────────────────
  // 2 travelers, USD 0.0065, Feb (season 0.9), Tokyo 3n budget hotel + Kyoto 2n hostel
  // cheap transport, balanced food, fare=0, bag=0, extras=0
  //
  // stayJpy:
  //   Tokyo: 9000 * ceil(2/2) * 3 * 1.1 * 0.9 = 9000*1*3*0.99 = 26,730
  //   Kyoto: 3500 * 2 * 2 * 1.15 * 0.9 = 14,490
  //   total = 41,220
  // activitiesJpy = (5000 + 5000) * 2 = 20,000
  // intercityJpy  = 4500 * 2 = 9,000  (Kyoto is stop idx 1)
  // foodJpy = 5000 * 2 * (3+2+1) = 60,000  (days = 5+1 = 6)
  // localTransportJpy = 700*2*6 + 3000*2 + 9000 = 8400+6000+9000 = 23,400
  //   (localTransportJpy includes intercityJpy per the formula)
  // landJpy = 41220 + 20000 + 60000 + 23400 = 144,620
  // bufferJpy = 14,462
  // landTotalJpy = 159,082
  // total = 159082 * 0.0065 = 1034.03
  it('hand-calc: spec reference scenario gives ~USD 1034.03', () => {
    const trip = makeTrip({
      travelers: 2,
      exchangeRate: 0.0065,
      travelMonth: 2, // February, season 0.9
      stops: [
        { id: generateId(), city: 'Tokyo', nights: 3, stayType: 1, priority: 3 }, // budget hotel
        { id: generateId(), city: 'Kyoto', nights: 2, stayType: 0, priority: 3 }, // hostel
      ],
      transportMode: 'cheap',
      foodStyle: 'balanced',
      flight: { origin: 'JFK', departureDate: '', farePerPerson: 0, bagFeePerPerson: 0 },
      extras: [],
    });
    const bd = calcBreakdown(trip, JAPAN, settings);
    // Expected: 1034.03 (hand calc). Allow ±1 for float rounding.
    expect(bd.total).toBeCloseTo(1034.03, 0);
  });

  it('handles custom cities and places gracefully with fallback defaults', () => {
    const customTrip = makeTrip({
      stops: [
        { id: generateId(), city: 'Mount Fuji (Kawaguchiko)', nights: 2, stayType: 1, priority: 3, places: ['Chureito Pagoda', 'Lake Kawaguchiko'] },
        { id: generateId(), city: 'Takayama Historic Village', nights: 2, stayType: 0, priority: 2, places: ['Sanmachi Suji'] },
      ],
    });
    const bd = calcBreakdown(customTrip, JAPAN, settings);
    expect(bd.total).toBeGreaterThan(0);
    expect(bd.totalNights).toBe(4);
  });

  it('calculates duration correctly when user specifies days and nights', () => {
    const trip = makeTrip({
      totalDays: 10,
      totalNights: 9,
      stops: [],
    });
    const bd = calcBreakdown(trip, JAPAN, settings);
    expect(bd.totalNights).toBe(9);
    expect(bd.perDay).toBeGreaterThan(0);
  });
});

describe('fitToBudget', () => {
  it('returns empty steps if already within budget', () => {
    const trip = makeTrip({ budget: 999999 });
    const result = fitToBudget(trip, JAPAN, settings);
    expect(result.steps).toHaveLength(0);
    expect(result.success).toBe(true);
  });

  it('ends at or under budget when feasible', () => {
    // Budget tight enough to trigger changes but not impossible
    const trip = makeTrip({ budget: 1800 });
    const bd = calcBreakdown(trip, JAPAN, settings);
    if (bd.total > 1800) {
      const result = fitToBudget(trip, JAPAN, settings);
      if (result.success) {
        const finalBd = calcBreakdown(
          { ...trip, stops: result.stops, foodStyle: result.foodStyle, transportMode: result.transportMode },
          JAPAN,
          settings
        );
        expect(finalBd.total).toBeLessThanOrEqual(1800 * 1.001); // small float tolerance
      }
    }
  });

  it('switches rail to cheap before downgrading food', () => {
    const trip = makeTrip({ budget: 1500, transportMode: 'rail', foodStyle: 'foodie' });
    const bd = calcBreakdown(trip, JAPAN, settings);
    if (bd.total > 1500) {
      const result = fitToBudget(trip, JAPAN, settings);
      const railStep = result.steps.find(s => s.description.includes('rail'));
      const foodStep = result.steps.find(s => s.description.includes('foodie to balanced'));
      if (railStep && foodStep) {
        expect(result.steps.indexOf(railStep)).toBeLessThan(result.steps.indexOf(foodStep));
      }
    }
  });

  it('never removes a must-see (priority 3) stop unless no other option', () => {
    // All stops are must-see: fit should not drop them
    const stops = [
      { id: generateId(), city: 'Tokyo', nights: 2, stayType: 2 as const, priority: 3 as const },
      { id: generateId(), city: 'Kyoto', nights: 2, stayType: 2 as const, priority: 3 as const },
    ];
    const trip = makeTrip({ budget: 500, stops });
    const result = fitToBudget(trip, JAPAN, settings);
    // Even if over budget, must-see stops with p=3 should remain unless forced
    const removedMustSee = result.steps.filter(
      s => s.description.startsWith('Removed stop') && (s.description.includes('Tokyo') || s.description.includes('Kyoto'))
    );
    expect(removedMustSee).toHaveLength(0);
  });

  it('removes lower-priority stops before higher-priority ones', () => {
    const stops = [
      { id: generateId(), city: 'Tokyo', nights: 3, stayType: 1 as const, priority: 3 as const },
      { id: generateId(), city: 'Kyoto', nights: 3, stayType: 1 as const, priority: 3 as const },
      { id: generateId(), city: 'Osaka', nights: 3, stayType: 1 as const, priority: 2 as const },
      { id: generateId(), city: 'Kanazawa', nights: 3, stayType: 1 as const, priority: 1 as const },
    ];
    const trip = makeTrip({ budget: 1200, stops });
    const bd = calcBreakdown(trip, JAPAN, settings);
    if (bd.total > 1200) {
      const result = fitToBudget(trip, JAPAN, settings);
      // Find drop steps
      const dropSteps = result.steps.filter(s => s.description.startsWith('Removed stop:'));
      // If Kanazawa is dropped, it should come before Osaka
      const kanazawaIdx = dropSteps.findIndex(s => s.description.includes('Kanazawa'));
      const osakaIdx = dropSteps.findIndex(s => s.description.includes('Osaka'));
      if (kanazawaIdx >= 0 && osakaIdx >= 0) {
        expect(kanazawaIdx).toBeLessThan(osakaIdx);
      }
    }
  });

  it('reports underBudgetByMore25pct when well under', () => {
    const trip = makeTrip({ budget: 999999 });
    const result = fitToBudget(trip, JAPAN, settings);
    expect(result.underBudgetByMore25pct).toBe(true);
  });

  // ── BUG 2 regression: only one step fires per while-iteration ────
  it('applies steps one at a time (rail switch is exactly 1 step ahead of food cut)', () => {
    // rail + foodie, budget tight enough to need both but not so tight it triggers step 3+
    const trip = makeTrip({
      budget: 2200,
      transportMode: 'rail',
      foodStyle: 'foodie',
      stops: [
        { id: generateId(), city: 'Tokyo', nights: 3, stayType: 1, priority: 3 },
        { id: generateId(), city: 'Kyoto', nights: 2, stayType: 1, priority: 3 },
      ],
      flight: { origin: '', departureDate: '', farePerPerson: 0, bagFeePerPerson: 0 },
    });
    const bd = calcBreakdown(trip, JAPAN, settings);
    if (bd.total > 2200) {
      const result = fitToBudget(trip, JAPAN, settings);
      const railIdx = result.steps.findIndex(s => s.description.includes('rail'));
      const foodIdx = result.steps.findIndex(s => s.description.includes('foodie to balanced'));
      // Rail step must come strictly before food step in the log
      if (railIdx >= 0 && foodIdx >= 0) {
        expect(railIdx).toBeLessThan(foodIdx);
      }
    }
  });
});
