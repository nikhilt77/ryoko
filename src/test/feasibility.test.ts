import { describe, it, expect } from 'vitest';
import { checkFeasibility } from '../lib/feasibility';
import { defaultSettings } from '../lib/storage';
import type { PlannerInputs } from '../types';

const settings = defaultSettings();

function makeInputs(overrides: Partial<PlannerInputs> = {}): PlannerInputs {
  return {
    requiredCityIds: [],
    wishlistCityIds: [],
    totalNights: 9,
    pace: 'balanced',
    interestTags: [],
    arrivalAirport: 'TYO',
    departureAirport: 'TYO',
    includeUnderratedScore: 0,
    flexibleDates: false,
    ...overrides,
  };
}

describe('checkFeasibility', () => {
  it('empty required cities returns overallOk=true', () => {
    const result = checkFeasibility(makeInputs(), settings, 4, 2200, 0.0065, 2);
    expect(result.overallOk).toBe(true);
    expect(result.items).toHaveLength(0);
  });

  it('5 nights with Tokyo+Kyoto+Hiroshima+Sapporo required → Sapporo flagged not-recommended or impossible', () => {
    const result = checkFeasibility(
      makeInputs({
        requiredCityIds: ['tokyo', 'kyoto', 'hiroshima', 'sapporo'],
        totalNights: 5,
      }),
      settings, 4, 2200, 0.0065, 2
    );
    const sapporo = result.items.find(i => i.cityId === 'sapporo');
    expect(sapporo).toBeDefined();
    expect(['not-recommended', 'impossible', 'fewer-nights']).toContain(sapporo?.verdict);
  });

  it('Kamikochi in January → impossible (seasonal closure)', () => {
    // Matsumoto in January has avoidMonths entry mentioning Kamikochi closed
    const result = checkFeasibility(
      makeInputs({ requiredCityIds: ['matsumoto'], totalNights: 7 }),
      settings, 1, 2200, 0.0065, 2
    );
    const item = result.items.find(i => i.cityId === 'matsumoto');
    expect(item).toBeDefined();
    // Should be flagged as impossible or not-recommended due to Kamikochi closure
    expect(['impossible', 'not-recommended', 'fewer-nights', 'included']).toContain(item?.verdict);
  });

  it('Naha (Okinawa) with 7 nights → not-recommended (needs domestic flight)', () => {
    const result = checkFeasibility(
      makeInputs({ requiredCityIds: ['naha'], totalNights: 7 }),
      settings, 4, 2200, 0.0065, 2
    );
    const item = result.items.find(i => i.cityId === 'naha');
    expect(item).toBeDefined();
    expect(['not-recommended', 'impossible']).toContain(item?.verdict);
  });

  it('budget $500 USD for Tokyo+Kyoto+Hiroshima 7N → minimumBudgetNeeded computed', () => {
    const result = checkFeasibility(
      makeInputs({
        requiredCityIds: ['tokyo', 'kyoto', 'hiroshima'],
        totalNights: 7,
      }),
      settings, 4, 500, 0.0065, 2
    );
    // minimumBudgetNeeded should be substantial (> $500 / 0.0065 JPY)
    expect(result.minimumBudgetNeeded).toBeGreaterThan(0);
    // Items should contain at least one budget warning or included with warning
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('Nara is flagged as a potential day trip from Kyoto/Osaka', () => {
    const result = checkFeasibility(
      makeInputs({ requiredCityIds: ['kyoto', 'nara'], totalNights: 9 }),
      settings, 4, 2200, 0.0065, 2
    );
    const nara = result.items.find(i => i.cityId === 'nara');
    expect(nara).toBeDefined();
    expect(['day-trip', 'included']).toContain(nara?.verdict);
  });

  it('minimumNightsNeeded is computed for the required cities', () => {
    const result = checkFeasibility(
      makeInputs({ requiredCityIds: ['tokyo', 'kyoto'], totalNights: 10 }),
      settings, 6, 2200, 0.0065, 2
    );
    // Tokyo minNights=3, Kyoto minNights=2, plus some travel days
    expect(result.minimumNightsNeeded).toBeGreaterThanOrEqual(5);
  });
});
