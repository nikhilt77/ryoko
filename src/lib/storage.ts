import { generateId } from './id';
import type { Trip, AppSettings } from '../types';
import { JAPAN } from '../data/destinations';

export const STORAGE_KEY = 'tbp.v1';

export interface AppStore {
  trips: Trip[];
  activeTripId: string | null;
  settings: AppSettings;
}

export function defaultSettings(): AppSettings {
  return {
    hostelPerPersonPerNight: JAPAN.hostelPerPersonPerNight,
    budgetHotelPerRoomPerNight: JAPAN.budgetHotelPerRoomPerNight,
    midRangeHotelPerRoomPerNight: JAPAN.midRangeHotelPerRoomPerNight,
    intercityLegCheap: JAPAN.intercityLegCheap,
    intercityLegRail: JAPAN.intercityLegRail,
    foodLean: JAPAN.foodCostPerPersonPerDay.lean,
    foodBalanced: JAPAN.foodCostPerPersonPerDay.balanced,
    foodFoodie: JAPAN.foodCostPerPersonPerDay.foodie,
    localTransportPerPersonPerDay: JAPAN.localTransportPerPersonPerDay,
    airportTransferPerPerson: JAPAN.airportTransferPerPerson,
    contingencyBuffer: JAPAN.contingencyBuffer,
  };
}

export function newTrip(name = 'My Japan Trip'): Trip {
  return {
    id: generateId(),
    name,
    currency: 'INR',
    exchangeRate: 0.55,   // 1 JPY ≈ ₹0.55
    budget: 150000,       // ₹1,50,000 ≈ USD 1,800 — sensible India starting budget
    travelers: 2,
    travelMonth: 4, // April
    destination: 'japan',
    totalDays: 8,
    totalNights: 7,
    stops: [],
    flight: {
      origin: '',
      departureDate: '',
      farePerPerson: 0,
      bagFeePerPerson: 0,
    },
    foodStyle: 'balanced',
    transportMode: 'rail',
    extras: [],
  };
}

export function loadStore(): AppStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultStore();
    const parsed = JSON.parse(raw) as AppStore;
    // Ensure we have all settings keys
    parsed.settings = { ...defaultSettings(), ...parsed.settings };
    return parsed;
  } catch {
    return makeDefaultStore();
  }
}

function makeDefaultStore(): AppStore {
  const trip = newTrip();
  return {
    trips: [trip],
    activeTripId: trip.id,
    settings: defaultSettings(),
  };
}

export function saveStore(store: AppStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}
