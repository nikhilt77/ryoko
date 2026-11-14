import { create } from 'zustand';
import { generateId } from './lib/id';
import type { Trip, Stop, ExtraItem, AppSettings, FitStep, PlannerInputs, PlanResult } from './types';
import { loadStore, saveStore, newTrip, defaultSettings } from './lib/storage';
import type { AppStore } from './lib/storage';
import { fitToBudget } from './lib/calculator';
import { DESTINATIONS, DEFAULT_CITY_PLACES } from './data/destinations';
import { buildPlan } from './lib/planner';

export interface TBPState extends AppStore {
  // Trip management
  createTrip: (name?: string) => void;
  switchTrip: (id: string) => void;
  renameTrip: (id: string, name: string) => void;
  duplicateTrip: (id: string) => void;
  deleteTrip: (id: string) => void;

  // Active trip mutations
  updateTrip: (patch: Partial<Trip>) => void;
  setStops: (stops: Stop[]) => void;
  addStop: (city: string, nights?: number, places?: string[]) => void;
  removeStop: (id: string) => void;
  reorderStops: (fromIndex: number, toIndex: number) => void;
  addPlaceToStop: (stopId: string, place: string) => void;
  removePlaceFromStop: (stopId: string, placeIndex: number) => void;
  setTripDuration: (days: number, nights: number) => void;

  // Extras
  addExtra: (name: string, amount: number) => void;
  removeExtra: (id: string) => void;
  updateExtra: (id: string, patch: Partial<ExtraItem>) => void;

  // Fit
  fitResult: { steps: FitStep[]; success: boolean; underBudget: boolean } | null;
  preeFitSnapshot: Trip | null;
  runFit: () => void;
  undoFit: () => void;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;

  // Export / import
  exportJSON: () => void;
  importJSON: (json: string) => void;

  // Tour planner
  setPlannerInputs: (inputs: PlannerInputs) => void;
  runBuildPlan: () => void;
  clearPlanResult: () => void;
}

function persist(state: TBPState) {
  saveStore({
    trips: state.trips,
    activeTripId: state.activeTripId,
    settings: state.settings,
  });
}

export const useStore = create<TBPState>()((set, get) => {
  const initial = loadStore();

  return {
    ...initial,
    fitResult: null,
    preeFitSnapshot: null,

    createTrip: (name) => {
      const trip = newTrip(name);
      set(s => {
        const next: TBPState = { ...s, trips: [...s.trips, trip], activeTripId: trip.id };
        persist(next);
        return next;
      });
    },

    switchTrip: (id) => {
      set(s => {
        const next: TBPState = { ...s, activeTripId: id, fitResult: null, preeFitSnapshot: null };
        persist(next);
        return next;
      });
    },

    renameTrip: (id, name) => {
      set(s => {
        const trips = s.trips.map(t => t.id === id ? { ...t, name } : t);
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    duplicateTrip: (id) => {
      const trip = get().trips.find(t => t.id === id);
      if (!trip) return;
      const dup: Trip = { ...trip, id: generateId(), name: `${trip.name} (copy)` };
      set(s => {
        const next: TBPState = { ...s, trips: [...s.trips, dup], activeTripId: dup.id };
        persist(next);
        return next;
      });
    },

    deleteTrip: (id) => {
      set(s => {
        const trips = s.trips.filter(t => t.id !== id);
        const activeTripId =
          s.activeTripId === id
            ? (trips[0]?.id ?? null)
            : s.activeTripId;
        if (trips.length === 0) {
          const fresh = newTrip();
          const next: TBPState = { ...s, trips: [fresh], activeTripId: fresh.id, fitResult: null, preeFitSnapshot: null };
          persist(next);
          return next;
        }
        const next: TBPState = { ...s, trips, activeTripId, fitResult: null, preeFitSnapshot: null };
        persist(next);
        return next;
      });
    },

    updateTrip: (patch) => {
      set(s => {
        const trips = s.trips.map(t =>
          t.id === s.activeTripId ? { ...t, ...patch } : t
        );
        const next: TBPState = { ...s, trips, fitResult: null, preeFitSnapshot: null };
        persist(next);
        return next;
      });
    },

    setStops: (stops) => {
      set(s => {
        const trips = s.trips.map(t => {
          if (t.id !== s.activeTripId) return t;
          const totalNights = stops.reduce((sum, st) => sum + st.nights, 0);
          return { ...t, stops, totalNights, totalDays: totalNights + 1 };
        });
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    addStop: (city, nights = 2, places) => {
      const trimmedCity = city.trim() || 'Custom Stop';
      const stop: Stop = {
        id: generateId(),
        city: trimmedCity,
        nights: Math.max(1, nights),
        days: Math.max(1, nights) + 1,
        places: places ?? (DEFAULT_CITY_PLACES[trimmedCity] ? [...DEFAULT_CITY_PLACES[trimmedCity]] : []),
        stayType: 1,
        priority: 2,
      };
      set(s => {
        const trips = s.trips.map(t => {
          if (t.id !== s.activeTripId) return t;
          const stops = [...t.stops, stop];
          const totalNights = stops.reduce((sum, st) => sum + st.nights, 0);
          return { ...t, stops, totalNights, totalDays: totalNights + 1 };
        });
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    removeStop: (id) => {
      set(s => {
        const trips = s.trips.map(t => {
          if (t.id !== s.activeTripId) return t;
          const stops = t.stops.filter(st => st.id !== id);
          const totalNights = stops.reduce((sum, st) => sum + st.nights, 0);
          return { ...t, stops, totalNights, totalDays: totalNights > 0 ? totalNights + 1 : (t.totalDays || 1) };
        });
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    reorderStops: (fromIndex, toIndex) => {
      set(s => {
        const trip = s.trips.find(t => t.id === s.activeTripId);
        if (!trip) return s;
        const stops = [...trip.stops];
        const [removed] = stops.splice(fromIndex, 1);
        stops.splice(toIndex, 0, removed);
        const trips = s.trips.map(t =>
          t.id === s.activeTripId ? { ...t, stops } : t
        );
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    addPlaceToStop: (stopId, place) => {
      if (!place.trim()) return;
      set(s => {
        const trips = s.trips.map(t => {
          if (t.id !== s.activeTripId) return t;
          const stops = t.stops.map(st => {
            if (st.id !== stopId) return st;
            return { ...st, places: [...(st.places || []), place.trim()] };
          });
          return { ...t, stops };
        });
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    removePlaceFromStop: (stopId, placeIndex) => {
      set(s => {
        const trips = s.trips.map(t => {
          if (t.id !== s.activeTripId) return t;
          const stops = t.stops.map(st => {
            if (st.id !== stopId) return st;
            const places = [...(st.places || [])];
            places.splice(placeIndex, 1);
            return { ...st, places };
          });
          return { ...t, stops };
        });
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    setTripDuration: (days, nights) => {
      set(s => {
        const trips = s.trips.map(t => {
          if (t.id !== s.activeTripId) return t;
          return { ...t, totalDays: Math.max(1, days), totalNights: Math.max(1, nights) };
        });
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    addExtra: (name, amount) => {
      const item: ExtraItem = { id: generateId(), name, amount };
      set(s => {
        const trips = s.trips.map(t =>
          t.id === s.activeTripId
            ? { ...t, extras: [...t.extras, item] }
            : t
        );
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    removeExtra: (id) => {
      set(s => {
        const trips = s.trips.map(t =>
          t.id === s.activeTripId
            ? { ...t, extras: t.extras.filter(e => e.id !== id) }
            : t
        );
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    updateExtra: (id, patch) => {
      set(s => {
        const trips = s.trips.map(t =>
          t.id === s.activeTripId
            ? { ...t, extras: t.extras.map(e => e.id === id ? { ...e, ...patch } : e) }
            : t
        );
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    runFit: () => {
      const s = get();
      const trip = s.trips.find(t => t.id === s.activeTripId);
      if (!trip) return;

      const dest = DESTINATIONS[trip.destination];
      if (!dest) return;
      const result = fitToBudget(trip, dest, s.settings);
      set(ss => {
        const trips = ss.trips.map(t =>
          t.id === ss.activeTripId
            ? { ...t, stops: result.stops, foodStyle: result.foodStyle, transportMode: result.transportMode }
            : t
        );
        const next: TBPState = {
          ...ss,
          trips,
          preeFitSnapshot: trip,
          fitResult: {
            steps: result.steps,
            success: result.success,
            underBudget: result.underBudgetByMore25pct,
          },
        };
        persist(next);
        return next;
      });
    },

    undoFit: () => {
      const s = get();
      const snap = s.preeFitSnapshot;
      if (!snap) return;
      set(ss => {
        const trips = ss.trips.map(t =>
          t.id === ss.activeTripId ? snap : t
        );
        const next: TBPState = { ...ss, trips, fitResult: null, preeFitSnapshot: null };
        persist(next);
        return next;
      });
    },

    updateSettings: (patch) => {
      set(s => {
        const settings = { ...s.settings, ...patch };
        const next: TBPState = { ...s, settings };
        persist(next);
        return next;
      });
    },

    resetSettings: () => {
      set(s => {
        const next: TBPState = { ...s, settings: defaultSettings() };
        persist(next);
        return next;
      });
    },

    exportJSON: () => {
      const s = get();
      const data = JSON.stringify({ trips: s.trips, settings: s.settings }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trip-budget-planner.json';
      a.click();
      URL.revokeObjectURL(url);
    },

    importJSON: (json) => {
      try {
        const data = JSON.parse(json) as { trips: Trip[]; settings: AppSettings };
        if (!Array.isArray(data.trips)) throw new Error('Invalid format');
        set(s => {
          const next: TBPState = {
            ...s,
            trips: data.trips,
            activeTripId: data.trips[0]?.id ?? null,
            settings: { ...defaultSettings(), ...data.settings },
            fitResult: null,
            preeFitSnapshot: null,
          };
          persist(next);
          return next;
        });
      } catch {
        alert('Import failed: invalid JSON file.');
      }
    },

    setPlannerInputs: (inputs: PlannerInputs) => {
      set(s => {
        const trips = s.trips.map(t =>
          t.id === s.activeTripId ? { ...t, plannerInputs: inputs } : t
        );
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },

    runBuildPlan: () => {
      const s = get();
      const trip = s.trips.find(t => t.id === s.activeTripId);
      if (!trip || !trip.plannerInputs) return;
      try {
        const result: PlanResult = buildPlan(trip.plannerInputs, trip, s.settings);
        set(ss => {
          const trips = ss.trips.map(t =>
            t.id === ss.activeTripId ? { ...t, planResult: result } : t
          );
          const next: TBPState = { ...ss, trips };
          persist(next);
          return next;
        });
      } catch (err) {
        console.error('buildPlan error:', err);
      }
    },

    clearPlanResult: () => {
      set(s => {
        const trips = s.trips.map(t =>
          t.id === s.activeTripId ? { ...t, planResult: null } : t
        );
        const next: TBPState = { ...s, trips };
        persist(next);
        return next;
      });
    },
  };
});

export function useActiveTrip(): Trip | undefined {
  return useStore(s => s.trips.find(t => t.id === s.activeTripId));
}
