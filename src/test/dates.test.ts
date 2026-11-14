import { describe, it, expect } from 'vitest';
import { scanDates } from '../lib/dates';
import { defaultSettings } from '../lib/storage';
import type { Trip } from '../types';

const settings = defaultSettings();

const baseTrip: Trip = {
  id: 'test',
  name: 'Test',
  currency: 'USD',
  exchangeRate: 0.0065,
  budget: 2200,
  travelers: 2,
  travelMonth: 4, // April (baseline)
  destination: 'japan',
  totalDays: 10,
  totalNights: 9,
  stops: [
    { id: 's1', city: 'Tokyo', nights: 4, stayType: 1, priority: 3 },
    { id: 's2', city: 'Kyoto', nights: 3, stayType: 1, priority: 3 },
    { id: 's3', city: 'Hiroshima', nights: 2, stayType: 1, priority: 2 },
  ],
  flight: { origin: 'DEL', departureDate: '2025-04-01', farePerPerson: 0, bagFeePerPerson: 0 },
  foodStyle: 'balanced',
  transportMode: 'cheap',
  extras: [],
};

describe('scanDates', () => {
  it('returns exactly 12 entries (one per month)', () => {
    const windows = scanDates(baseTrip, settings, ['tokyo', 'kyoto', 'hiroshima'], 4);
    expect(windows).toHaveLength(12);
  });

  it('results are sorted by value score descending (best first)', () => {
    const windows = scanDates(baseTrip, settings, ['tokyo', 'kyoto'], 4);
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].valueScore).toBeLessThanOrEqual(windows[i - 1].valueScore);
    }
  });

  it('February total cost < April total cost (season multiplier 0.9 < 1.35)', () => {
    const windows = scanDates(baseTrip, settings, ['tokyo', 'kyoto'], 4);
    const feb = windows.find(w => w.month === 2);
    const apr = windows.find(w => w.month === 4);
    expect(feb).toBeDefined();
    expect(apr).toBeDefined();
    expect(feb!.totalCost).toBeLessThan(apr!.totalCost);
  });

  it('April has higher crowd score than February', () => {
    const windows = scanDates(baseTrip, settings, ['tokyo', 'kyoto'], 4);
    const feb = windows.find(w => w.month === 2);
    const apr = windows.find(w => w.month === 4);
    expect(apr!.crowdScore).toBeGreaterThan(feb!.crowdScore);
  });

  it('every window has a label matching its month number', () => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const windows = scanDates(baseTrip, settings, [], 1);
    for (const w of windows) {
      expect(w.label).toBe(months[w.month - 1]);
    }
  });

  it('costDiff for the current month is 0 (baseline)', () => {
    const windows = scanDates(baseTrip, settings, [], 4);
    const apr = windows.find(w => w.month === 4);
    expect(apr!.costDiff).toBe(0);
  });

  it('each window has pros and cons arrays (may be empty)', () => {
    const windows = scanDates(baseTrip, settings, ['kyoto', 'sapporo'], 6);
    for (const w of windows) {
      expect(Array.isArray(w.pros)).toBe(true);
      expect(Array.isArray(w.cons)).toBe(true);
    }
  });
});
