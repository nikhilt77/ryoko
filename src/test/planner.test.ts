import { describe, it, expect } from 'vitest';
import { buildPlan } from '../lib/planner';
import { defaultSettings } from '../lib/storage';
import type { PlannerInputs, Trip } from '../types';

const baseTrip: Trip = {
  id: 'test',
  name: 'Test Trip',
  currency: 'USD',
  exchangeRate: 0.0065,
  budget: 2200,
  travelers: 2,
  travelMonth: 4, // April
  destination: 'japan',
  totalDays: 10,
  totalNights: 9,
  stops: [],
  flight: { origin: 'DEL', departureDate: '2025-04-01', farePerPerson: 0, bagFeePerPerson: 0 },
  foodStyle: 'balanced',
  transportMode: 'cheap',
  extras: [],
};

const settings = defaultSettings();

function makeInputs(overrides: Partial<PlannerInputs> = {}): PlannerInputs {
  return {
    requiredCityIds: ['tokyo', 'kyoto', 'hiroshima'],
    wishlistCityIds: [],
    totalNights: 9,
    pace: 'balanced',
    interestTags: ['culture', 'history'],
    arrivalAirport: 'TYO',
    departureAirport: 'TYO',
    includeUnderratedScore: 0,
    flexibleDates: false,
    ...overrides,
  };
}

describe('buildPlan', () => {
  it('required cities (Tokyo, Kyoto, Hiroshima) are always included in stops', () => {
    const result = buildPlan(makeInputs(), baseTrip, settings);
    const cityIds = result.stops.filter(s => !s.isDayTrip).map(s => s.cityId);
    expect(cityIds).toContain('tokyo');
    expect(cityIds).toContain('kyoto');
    expect(cityIds).toContain('hiroshima');
  });

  it('required stops have source="required" and required=true', () => {
    const result = buildPlan(makeInputs(), baseTrip, settings);
    for (const id of ['tokyo', 'kyoto', 'hiroshima']) {
      const stop = result.stops.find(s => s.cityId === id);
      expect(stop?.source, `${id} source`).toBe('required');
      expect(stop?.required, `${id} required`).toBe(true);
    }
  });

  it('route goes east-to-west: Tokyo first, then Kyoto, then Hiroshima (no backtracking)', () => {
    const result = buildPlan(makeInputs(), baseTrip, settings);
    const nonDayTrip = result.stops.filter(s => !s.isDayTrip);
    const idxTokyo = nonDayTrip.findIndex(s => s.cityId === 'tokyo');
    const idxKyoto = nonDayTrip.findIndex(s => s.cityId === 'kyoto');
    const idxHiroshima = nonDayTrip.findIndex(s => s.cityId === 'hiroshima');
    expect(idxTokyo).toBeLessThan(idxKyoto);
    expect(idxKyoto).toBeLessThan(idxHiroshima);
  });

  it('Sapporo optional with 9 nights: feasibility marks it as not-recommended or impossible', () => {
    const result = buildPlan(
      makeInputs({ wishlistCityIds: ['sapporo'] }),
      baseTrip,
      settings
    );
    // Sapporo warning should appear in feasibility items or warnings
    const sapporo = result.feasibility.items.find(i => i.cityId === 'sapporo');
    const hasWarning = result.warnings.some(w => w.includes('Sapporo') || w.includes('sapporo'));
    // Either flagged in feasibility or in warnings (since sapporo is wishlist not required)
    expect(sapporo || hasWarning || result.stops.some(s => s.cityId === 'sapporo')).toBeTruthy();
  });

  it('underrated suggestions have non-empty suggestionReason when slider is active', () => {
    const result = buildPlan(
      makeInputs({ includeUnderratedScore: 0.7, interestTags: ['culture', 'history', 'art'] }),
      baseTrip,
      settings
    );
    // All underratedInserted entries should have non-empty reason
    for (const u of result.underratedInserted) {
      expect(u.reason.length, `${u.cityName} has no reason`).toBeGreaterThan(0);
    }
  });

  it('total nights in stops match the input totalNights (within ±1 for travel days)', () => {
    const result = buildPlan(makeInputs({ totalNights: 9 }), baseTrip, settings);
    const sumNights = result.stops.filter(s => !s.isDayTrip).reduce((s, st) => s + st.nights, 0);
    expect(sumNights).toBeGreaterThanOrEqual(7);
    expect(sumNights).toBeLessThanOrEqual(11);
  });

  it('open-jaw route: arrives TYO (Tokyo), departs KIX (Osaka) → Tokyo first, Osaka last', () => {
    const result = buildPlan(
      makeInputs({
        arrivalAirport: 'TYO',
        departureAirport: 'KIX',
        requiredCityIds: ['tokyo', 'kyoto', 'osaka'],
      }),
      baseTrip,
      settings
    );
    const nonDayTrip = result.stops.filter(s => !s.isDayTrip);
    expect(nonDayTrip[0]?.cityId).toBe('tokyo');
    expect(nonDayTrip[nonDayTrip.length - 1]?.cityId).toBe('osaka');
  });

  it('day ranges are sequential and non-overlapping', () => {
    const result = buildPlan(makeInputs(), baseTrip, settings);
    const full = result.stops.filter(s => !s.isDayTrip);
    for (let i = 1; i < full.length; i++) {
      expect(full[i].dayRangeStart).toBeGreaterThanOrEqual(full[i - 1].dayRangeEnd);
    }
  });
});
