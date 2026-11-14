import React, { useState, useRef, useEffect } from 'react';
import { useStore, useActiveTrip } from './store';
import type { PlannerInputs, InterestTag, Pace, FeasibilityItem, DateWindow } from './types';
import { CITIES } from './data/japan';

type View = 'planner' | 'tourplan' | 'compare' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('planner');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'auto' ? 'dark' : t === 'dark' ? 'light' : 'auto');
  };

  return (
    <div className="app-wrapper">
      <AppHeader view={view} setView={setView} theme={theme} onToggleTheme={toggleTheme} />
      <div className="app-body">
        {view === 'settings' ? (
          <div className="app-main">
            <SettingsView />
          </div>
        ) : view === 'compare' ? (
          <div className="app-main" style={{ maxWidth: '100%' }}>
            <CompareView />
          </div>
        ) : view === 'tourplan' ? (
          <>
            <main className="app-main">
              <TourPlannerView />
            </main>
            <aside className="app-sidebar">
              <PlanCheckPanel />
            </aside>
          </>
        ) : (
          <>
            <main className="app-main">
              <PlannerView />
            </main>
            <aside className="app-sidebar">
              <BudgetSidebar />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Header ─────────────────────────────────────────────────────── */
function AppHeader({ view, setView, theme, onToggleTheme }: {
  view: string;
  setView: (v: View) => void;
  theme: string;
  onToggleTheme: () => void;
}) {
  const { exportJSON, importJSON } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importJSON(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="app-header">
      <div className="app-header-logo">
        <span>✈️</span> Trip Budget Planner
      </div>

      <TripSelector />

      <div className="header-spacer" />

      <nav className="row-gap" style={{ gap: '.25rem' }}>
        {(['planner', 'tourplan', 'compare', 'settings'] as View[]).map(v => (
          <button
            key={v}
            className={`btn btn-ghost btn-sm ${view === v ? 'btn-secondary' : ''}`}
            onClick={() => setView(v)}
          >
            {v === 'planner' ? '🗺 Plan' : v === 'tourplan' ? '🧭 Tour Planner' : v === 'compare' ? '⚖️ Compare' : '⚙️ Settings'}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={exportJSON} title="Export trips as JSON">
          ⬇️ Export
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} title="Import trips from JSON">
          ⬆️ Import
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : theme === 'light' ? '🌓' : '🌙'}
        </button>
      </nav>
    </header>
  );
}

/* ── Trip selector dropdown ─────────────────────────────────────── */
function TripSelector() {
  const { trips, activeTripId, createTrip, switchTrip, renameTrip, duplicateTrip, deleteTrip } = useStore();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const activeTrip = trips.find(t => t.id === activeTripId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="trip-selector" ref={ref}>
      <button className="trip-selector-btn" onClick={() => setOpen(o => !o)}>
        <span className="trip-selector-name">{activeTrip?.name ?? 'Select trip'}</span>
        <span>▾</span>
      </button>
      {open && (
        <div className="trip-dropdown">
          {trips.map(trip => (
            <div
              key={trip.id}
              className={`trip-dropdown-item ${trip.id === activeTripId ? 'active' : ''}`}
            >
              {renamingId === trip.id ? (
                <input
                  className="trip-rename-input"
                  value={renameVal}
                  autoFocus
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={() => {
                    if (renameVal.trim()) renameTrip(trip.id, renameVal.trim());
                    setRenamingId(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (renameVal.trim()) renameTrip(trip.id, renameVal.trim());
                      setRenamingId(null);
                    }
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                />
              ) : (
                <span
                  className="flex-1"
                  onClick={() => { switchTrip(trip.id); setOpen(false); }}
                >
                  {trip.name}
                </span>
              )}
              <button
                className="btn btn-icon btn-ghost btn-sm"
                title="Rename"
                onClick={() => { setRenamingId(trip.id); setRenameVal(trip.name); }}
              >✏️</button>
              <button
                className="btn btn-icon btn-ghost btn-sm"
                title="Duplicate"
                onClick={() => { duplicateTrip(trip.id); setOpen(false); }}
              >⧉</button>
              <button
                className="btn btn-icon btn-ghost btn-sm"
                title="Delete"
                onClick={() => {
                  if (confirm(`Delete "${trip.name}"?`)) deleteTrip(trip.id);
                  setOpen(false);
                }}
              >🗑</button>
            </div>
          ))}
          <div className="trip-dropdown-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { createTrip('New trip'); setOpen(false); }}
            >
              + New trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Planner view ───────────────────────────────────────────────── */
function PlannerView() {
  const trip = useActiveTrip();
  if (!trip) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🌏</div>
        <h3>No trip selected</h3>
        <p>Create a new trip to get started.</p>
      </div>
    );
  }
  return (
    <>
      <TripBasicsPanel />
      <FlightsPanel />
      <ItineraryPanel />
      <ExtrasPanel />
      <FitPanel />
    </>
  );
}

/* ── Trip basics ────────────────────────────────────────────────── */
const CURRENCIES = ['INR', 'USD', 'EUR', 'JPY'] as const;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEFAULT_RATES: Record<string, number> = { USD: 0.0065, INR: 0.55, EUR: 0.0062, JPY: 1.0 };

function TripBasicsPanel() {
  const { updateTrip, setStops } = useStore();
  const trip = useActiveTrip();
  if (!trip) return null;

  return (
    <div className="card">
      <div className="card-title"><span className="card-title-icon">🏕</span> Trip basics</div>
      <div className="form-row-3">
        <div className="form-group">
          <label htmlFor="trip-name">Trip name</label>
          <input
            id="trip-name"
            type="text"
            value={trip.name}
            onChange={e => updateTrip({ name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="trip-currency">Currency</label>
          <select
            id="trip-currency"
            value={trip.currency}
            onChange={e => updateTrip({
              currency: e.target.value as typeof trip.currency,
              exchangeRate: DEFAULT_RATES[e.target.value] ?? 0.0065,
            })}
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="trip-rate">1 JPY = ? {trip.currency}</label>
          <input
            id="trip-rate"
            type="number"
            step="0.0001"
            min="0"
            value={trip.exchangeRate}
            onChange={e => updateTrip({ exchangeRate: Math.max(0, parseFloat(e.target.value) || 0) })}
          />
          <span className="text-xs text-muted" style={{ marginTop: '.2rem', display: 'block' }}>
            Fares &amp; extras are in {trip.currency}. Update this rate when switching currencies.
          </span>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="trip-budget">Total budget ({trip.currency})</label>
          <input
            id="trip-budget"
            type="number"
            min="0"
            value={trip.budget}
            onChange={e => updateTrip({ budget: Math.max(0, parseFloat(e.target.value) || 0) })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="trip-travelers">Travelers</label>
          <input
            id="trip-travelers"
            type="number"
            min="1"
            max="20"
            value={trip.travelers}
            onChange={e => updateTrip({ travelers: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="trip-month">Travel month</label>
          <select id="trip-month" value={trip.travelMonth} onChange={e => updateTrip({ travelMonth: parseInt(e.target.value) })}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="trip-food">Food style</label>
          <select id="trip-food" value={trip.foodStyle} onChange={e => updateTrip({ foodStyle: e.target.value as typeof trip.foodStyle })}>
            <option value="lean">Lean (¥3,000/person/day)</option>
            <option value="balanced">Balanced (¥5,000/person/day)</option>
            <option value="foodie">Foodie (¥8,000/person/day)</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="trip-days">Trip duration (Days)</label>
          <input
            id="trip-days"
            type="number"
            min="1"
            value={trip.totalDays ?? (trip.stops.reduce((s, st) => s + st.nights, 0) > 0 ? trip.stops.reduce((s, st) => s + st.nights, 0) + 1 : 8)}
            onChange={e => {
              const d = Math.max(1, parseInt(e.target.value) || 1);
              const n = Math.max(1, d - 1);
              updateTrip({ totalDays: d, totalNights: n });
            }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="trip-nights">Trip duration (Nights)</label>
          <input
            id="trip-nights"
            type="number"
            min="1"
            value={trip.totalNights ?? (trip.stops.reduce((s, st) => s + st.nights, 0) > 0 ? trip.stops.reduce((s, st) => s + st.nights, 0) : 7)}
            onChange={e => {
              const n = Math.max(1, parseInt(e.target.value) || 1);
              const d = n + 1;
              updateTrip({ totalDays: d, totalNights: n });
            }}
          />
        </div>
      </div>
      {trip.stops.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
          <p className="text-sm text-muted" style={{ margin: 0 }}>
            Itinerary stops sum: <strong>{trip.stops.reduce((s, st) => s + st.nights, 0)} nights ({trip.stops.reduce((s, st) => s + st.nights, 0) + 1} days)</strong> across {trip.stops.length} city/place{trip.stops.length === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const n = trip.stops.length;
              if (n === 0) return;
              const targetNights = trip.totalNights ?? trip.stops.reduce((s, st) => s + st.nights, 0);
              const safeN = Math.max(n, targetNights);
              const base = Math.floor(safeN / n);
              const leftover = safeN - base * n;
              setStops(trip.stops.map((st, i) => {
                const nights = base + (i < leftover ? 1 : 0);
                return { ...st, nights, days: nights + 1 };
              }));
            }}
            title="Distribute nights evenly across current stops"
          >
            ⚡ Match stops to {trip.totalNights ?? 7} nights
          </button>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="trip-transport">Intercity transport</label>
        <select id="trip-transport" value={trip.transportMode} onChange={e => updateTrip({ transportMode: e.target.value as typeof trip.transportMode })}>
          <option value="cheap">Buses / budget flights (¥4,500/person/leg)</option>
          <option value="rail">Rail (Shinkansen etc.) (¥9,000/person/leg)</option>
        </select>
      </div>
    </div>
  );
}

/* ── Flights panel ──────────────────────────────────────────────── */
function FlightsPanel() {
  const { updateTrip } = useStore();
  const trip = useActiveTrip();
  if (!trip) return null;

  const stopNights = trip.stops.reduce((s, st) => s + st.nights, 0);
  const totalNights = trip.stops.length > 0 ? stopNights : (trip.totalNights ?? 7);
  const totalDays = trip.totalDays ?? (totalNights + 1);
  const depDate = trip.flight.departureDate;
  let returnDate = '';
  if (depDate) {
    const d = new Date(depDate);
    d.setDate(d.getDate() + totalNights);
    returnDate = d.toISOString().slice(0, 10);
  }

  const openSkyscanner = () => {
    if (!depDate) { alert('Please enter a departure date first.'); return; }
    const toYYMMDD = (s: string) => s.replace(/-/g, '').slice(2);
    const origin = (trip.flight.origin || 'JFK').toLowerCase();
    const url = `https://www.skyscanner.com/transport/flights/${origin}/tyo/${toYYMMDD(depDate)}/${toYYMMDD(returnDate || depDate)}/?adultsv2=${trip.travelers}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openGoogleFlights = () => {
    if (!depDate) { alert('Please enter a departure date first.'); return; }
    const origin = trip.flight.origin || 'Your city';
    const q = encodeURIComponent(`Flights from ${origin} to TYO on ${depDate} through ${returnDate || depDate}`);
    window.open(`https://www.google.com/travel/flights?q=${q}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card">
      <div className="card-title"><span className="card-title-icon">🛫</span> Flights</div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="flight-origin">Origin airport code</label>
          <input
            id="flight-origin"
            type="text"
            placeholder="e.g. JFK"
            maxLength={4}
            style={{ textTransform: 'uppercase' }}
            value={trip.flight.origin}
            onChange={e => updateTrip({ flight: { ...trip.flight, origin: e.target.value.toUpperCase() } })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="flight-dep">Departure date</label>
          <input
            id="flight-dep"
            type="date"
            value={trip.flight.departureDate}
            onChange={e => updateTrip({ flight: { ...trip.flight, departureDate: e.target.value } })}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="flight-fare">Round-trip fare per person ({trip.currency})</label>
          <input
            id="flight-fare"
            type="number"
            min="0"
            value={trip.flight.farePerPerson}
            onChange={e => updateTrip({ flight: { ...trip.flight, farePerPerson: Math.max(0, parseFloat(e.target.value) || 0) } })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="flight-bag">Checked-bag fee per person ({trip.currency})</label>
          <input
            id="flight-bag"
            type="number"
            min="0"
            value={trip.flight.bagFeePerPerson}
            onChange={e => updateTrip({ flight: { ...trip.flight, bagFeePerPerson: Math.max(0, parseFloat(e.target.value) || 0) } })}
          />
        </div>
      </div>
      {returnDate && (
        <p className="text-sm text-muted" style={{ marginBottom: '.75rem' }}>
          Computed return date: <strong>{returnDate}</strong> ({totalNights} nights / {totalDays} days)
        </p>
      )}
      <div className="row-gap">
        <button className="btn btn-secondary btn-sm" onClick={openSkyscanner}>
          🔍 Search Skyscanner
        </button>
        <button className="btn btn-secondary btn-sm" onClick={openGoogleFlights}>
          🔍 Search Google Flights
        </button>
        <span className="text-xs text-muted">Fares are entered manually — no API required</span>
      </div>
    </div>
  );
}

/* ── Itinerary builder ──────────────────────────────────────────── */
import { suggestPlan, DEFAULT_CITY_PLACES, POPULAR_PLACES_SUGGESTIONS } from './data/destinations';
import { generateId } from './lib/id';

const STAY_LABELS: Record<number, string> = { 0: 'Hostel dorm', 1: 'Budget hotel', 2: 'Mid-range hotel' };
const PRIORITY_LABELS: Record<number, string> = { 1: 'Nice to have', 2: 'Want to do', 3: 'Must-see' };

function AddPlaceInput({ onAdd }: { onAdd: (place: string) => void }) {
  const [val, setVal] = useState('');
  const handleAdd = () => {
    if (!val.trim()) return;
    onAdd(val.trim());
    setVal('');
  };
  return (
    <div className="add-place-input-wrap">
      <input
        type="text"
        placeholder="+ Add place / sight..."
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      {val.trim() && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ padding: '0 .4rem', height: 28, fontSize: '.75rem' }}
          onClick={handleAdd}
        >
          Add
        </button>
      )}
    </div>
  );
}

function ItineraryPanel() {
  const { addStop, removeStop, reorderStops, setStops, addPlaceToStop, removePlaceFromStop, updateTrip } = useStore();
  const trip = useActiveTrip();
  const [customCity, setCustomCity] = useState('');
  const [addNights, setAddNights] = useState(2);
  const [addDays, setAddDays] = useState(3);
  const [planNights, setPlanNights] = useState(7);
  const [planDays, setPlanDays] = useState(8);
  const [showPlanAdjuster, setShowPlanAdjuster] = useState(false);

  if (!trip) return null;

  const currentTotalNights = trip.stops.reduce((s, st) => s + st.nights, 0);
  const currentTotalDays = currentTotalNights > 0 ? currentTotalNights + 1 : (trip.totalDays ?? 8);

  const handleSuggest = (nightsToUse: number) => {
    const nights = Math.max(2, nightsToUse);
    const suggested = suggestPlan(nights);
    const stops = suggested.map(s => ({
      id: generateId(),
      city: s.city,
      nights: s.nights,
      days: s.nights + 1,
      places: DEFAULT_CITY_PLACES[s.city] ? [...DEFAULT_CITY_PLACES[s.city]] : [],
      stayType: 1 as const,
      priority: s.priority,
    }));
    setStops(stops);
    updateTrip({ totalNights: nights, totalDays: nights + 1 });
  };

  const handleAddCustomStop = (cityName?: string) => {
    const name = (cityName || customCity).trim();
    if (!name) return;
    addStop(name, addNights);
    setCustomCity('');
  };

  const updateStop = (id: string, patch: Partial<typeof trip.stops[0]>) => {
    setStops(trip.stops.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  return (
    <div className="card">
      <div className="card-title"><span className="card-title-icon">🗺</span> Itinerary &amp; Places to Visit</div>

      {trip.stops.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <div className="empty-state-icon">📍</div>
          <h3>No stops yet</h3>
          <p>Set your desired days &amp; nights to generate an itinerary, or add custom cities below.</p>
          <div className="row-gap" style={{ justifyContent: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <label htmlFor="suggest-days" style={{ color: 'var(--color-text-muted)', fontSize: '.875rem' }}>
                Days:
              </label>
              <input
                id="suggest-days"
                type="number"
                min="2"
                max="60"
                value={planDays}
                style={{ width: 72, textAlign: 'center' }}
                onChange={e => {
                  const d = Math.max(2, parseInt(e.target.value) || 2);
                  setPlanDays(d);
                  setPlanNights(Math.max(1, d - 1));
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <label htmlFor="suggest-nights" style={{ color: 'var(--color-text-muted)', fontSize: '.875rem' }}>
                Nights:
              </label>
              <input
                id="suggest-nights"
                type="number"
                min="1"
                max="59"
                value={planNights}
                style={{ width: 72, textAlign: 'center' }}
                onChange={e => {
                  const n = Math.max(1, parseInt(e.target.value) || 1);
                  setPlanNights(n);
                  setPlanDays(n + 1);
                }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => handleSuggest(planNights)}>
            ✨ Generate suggested plan ({planDays} Days / {planNights} Nights)
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span className="text-sm font-semibold">
                {currentTotalNights} nights · {currentTotalDays} days · {trip.stops.length} stop{trip.stops.length === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPlanAdjuster(v => !v)}
              >
                {showPlanAdjuster ? '▲ Hide plan generator' : '✨ Regenerate / Adjust by days'}
              </button>
            </div>
          </div>

          {showPlanAdjuster && (
            <div style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '.75rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '.875rem', fontWeight: 600, marginBottom: '.5rem' }}>Plan generator by days &amp; nights</div>
              <div className="row-gap" style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                  <label htmlFor="adj-days" style={{ fontSize: '.8125rem' }}>Days:</label>
                  <input
                    id="adj-days"
                    type="number"
                    min="2"
                    value={planDays}
                    style={{ width: 64, textAlign: 'center' }}
                    onChange={e => {
                      const d = Math.max(2, parseInt(e.target.value) || 2);
                      setPlanDays(d);
                      setPlanNights(Math.max(1, d - 1));
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                  <label htmlFor="adj-nights" style={{ fontSize: '.8125rem' }}>Nights:</label>
                  <input
                    id="adj-nights"
                    type="number"
                    min="1"
                    value={planNights}
                    style={{ width: 64, textAlign: 'center' }}
                    onChange={e => {
                      const n = Math.max(1, parseInt(e.target.value) || 1);
                      setPlanNights(n);
                      setPlanDays(n + 1);
                    }}
                  />
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => handleSuggest(planNights)}>
                  ✨ Regenerate itinerary ({planDays}D / {planNights}N)
                </button>
              </div>
            </div>
          )}

          {trip.stops.map((stop, idx) => (
            <div key={stop.id} className="stop-card">
              <div className="stop-card-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    disabled={idx === 0}
                    onClick={() => reorderStops(idx, idx - 1)}
                    title="Move up"
                    aria-label="Move stop up"
                  >▲</button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    disabled={idx === trip.stops.length - 1}
                    onClick={() => reorderStops(idx, idx + 1)}
                    title="Move down"
                    aria-label="Move stop down"
                  >▼</button>
                </div>

                <input
                  className="stop-city-input"
                  value={stop.city}
                  onChange={e => updateStop(stop.id, { city: e.target.value })}
                  title="Click to rename city or place"
                  placeholder="City or Place name..."
                />

                <span className={`priority-badge priority-${stop.priority}`}>
                  {'★'.repeat(stop.priority)} {PRIORITY_LABELS[stop.priority]}
                </span>
                <button
                  className="btn btn-icon btn-danger btn-sm"
                  onClick={() => removeStop(stop.id)}
                  title="Remove stop"
                  aria-label={`Remove ${stop.city}`}
                >✕</button>
              </div>

              <div className="stop-controls">
                <div>
                  <label htmlFor={`nights-${stop.id}`} style={{ display: 'block', marginBottom: '.25rem', fontSize: '.8125rem' }}>
                    Nights
                  </label>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => {
                        const n = Math.max(1, stop.nights - 1);
                        updateStop(stop.id, { nights: n, days: n + 1 });
                      }}
                      aria-label="Decrease nights"
                    >−</button>
                    <input
                      id={`nights-${stop.id}`}
                      className="stepper-input"
                      type="number"
                      min="1"
                      value={stop.nights}
                      onChange={e => {
                        const n = Math.max(1, parseInt(e.target.value) || 1);
                        updateStop(stop.id, { nights: n, days: n + 1 });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const n = stop.nights + 1;
                        updateStop(stop.id, { nights: n, days: n + 1 });
                      }}
                      aria-label="Increase nights"
                    >+</button>
                  </div>
                </div>

                <div>
                  <label htmlFor={`days-${stop.id}`} style={{ display: 'block', marginBottom: '.25rem', fontSize: '.8125rem' }}>
                    Days
                  </label>
                  <input
                    id={`days-${stop.id}`}
                    type="number"
                    min="1"
                    value={stop.days ?? (stop.nights + 1)}
                    onChange={e => {
                      const d = Math.max(1, parseInt(e.target.value) || 1);
                      updateStop(stop.id, { days: d, nights: Math.max(1, d - 1) });
                    }}
                    style={{ width: 56, textAlign: 'center', height: 36, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    title="Number of days in this stop"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 140 }}>
                  <label htmlFor={`stay-${stop.id}`} style={{ fontSize: '.8125rem' }}>Stay type</label>
                  <select
                    id={`stay-${stop.id}`}
                    value={stop.stayType}
                    onChange={e => updateStop(stop.id, { stayType: parseInt(e.target.value) as typeof stop.stayType })}
                  >
                    {[0, 1, 2].map(t => <option key={t} value={t}>{STAY_LABELS[t]}</option>)}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: 140 }}>
                  <label htmlFor={`priority-${stop.id}`} style={{ fontSize: '.8125rem' }}>Priority</label>
                  <select
                    id={`priority-${stop.id}`}
                    value={stop.priority}
                    onChange={e => updateStop(stop.id, { priority: parseInt(e.target.value) as typeof stop.priority })}
                  >
                    {[1, 2, 3].map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>

              {/* Places to visit section inside stop */}
              <div className="stop-places-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                  <span style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    📍 Places to visit &amp; sights:
                  </span>
                  <span className="text-xs text-muted">
                    {(stop.places || []).length} place{(stop.places || []).length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="stop-places-list">
                  {(stop.places || []).map((p, pIdx) => (
                    <span key={pIdx} className="place-tag">
                      {p}
                      <button
                        type="button"
                        onClick={() => removePlaceFromStop(stop.id, pIdx)}
                        aria-label={`Remove ${p}`}
                      >✕</button>
                    </span>
                  ))}
                  <AddPlaceInput onAdd={p => addPlaceToStop(stop.id, p)} />
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <hr className="divider" />

      {/* Add Custom City or Place to Visit Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
        <div style={{ fontSize: '.9375rem', fontWeight: 600 }}>
          ➕ Add a custom city or place to visit
        </div>

        <div className="row-gap" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: 220, position: 'relative' }}>
            <input
              type="text"
              list="popular-places-list"
              placeholder="Enter custom city or place (e.g. Mount Fuji, Takayama, Shibuya)..."
              value={customCity}
              onChange={e => setCustomCity(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomStop();
                }
              }}
              style={{ width: '100%', minHeight: 40 }}
            />
            <datalist id="popular-places-list">
              {POPULAR_PLACES_SUGGESTIONS.map(place => (
                <option key={place} value={place} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
            <label style={{ fontSize: '.8125rem', color: 'var(--color-text-muted)' }}>Nights:</label>
            <input
              type="number"
              min="1"
              value={addNights}
              onChange={e => {
                const n = Math.max(1, parseInt(e.target.value) || 1);
                setAddNights(n);
                setAddDays(n + 1);
              }}
              style={{ width: 56, textAlign: 'center', minHeight: 40 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
            <label style={{ fontSize: '.8125rem', color: 'var(--color-text-muted)' }}>Days:</label>
            <input
              type="number"
              min="1"
              value={addDays}
              onChange={e => {
                const d = Math.max(1, parseInt(e.target.value) || 1);
                setAddDays(d);
                setAddNights(Math.max(1, d - 1));
              }}
              style={{ width: 56, textAlign: 'center', minHeight: 40 }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => handleAddCustomStop()}
            style={{ minHeight: 40 }}
          >
            + Add stop
          </button>
        </div>

        {/* Quick-add popular destination chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexWrap: 'wrap', marginTop: '.25rem' }}>
          <span className="text-xs text-muted" style={{ marginRight: '.25rem' }}>Quick add:</span>
          {['Tokyo', 'Kyoto', 'Osaka', 'Mount Fuji (Kawaguchiko)', 'Hakone', 'Nara', 'Hiroshima', 'Takayama & Shirakawa-go'].map(name => (
            <button
              key={name}
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '.75rem', padding: '.15rem .45rem', height: 26, borderRadius: 999 }}
              onClick={() => handleAddCustomStop(name)}
            >
              + {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Extras panel ───────────────────────────────────────────────── */
function ExtrasPanel() {
  const { addExtra, removeExtra, updateExtra } = useStore();
  const trip = useActiveTrip();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  if (!trip) return null;

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    addExtra(name.trim(), parseFloat(amount));
    setName('');
    setAmount('');
  };

  return (
    <div className="card">
      <div className="card-title"><span className="card-title-icon">🧾</span> Extras</div>
      {trip.extras.length === 0 && (
        <p className="text-sm text-muted" style={{ marginBottom: '.75rem' }}>
          No extras yet. Add visa, insurance, SIM, souvenirs, etc.
        </p>
      )}
      {trip.extras.map(item => (
        <div key={item.id} className="row-gap" style={{ marginBottom: '.5rem' }}>
          <input
            type="text"
            value={item.name}
            style={{ flex: 2 }}
            onChange={e => updateExtra(item.id, { name: e.target.value })}
          />
          <input
            type="number"
            value={item.amount}
            style={{ flex: 1 }}
            min="0"
            onChange={e => updateExtra(item.id, { amount: parseFloat(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted">{trip.currency}</span>
          <button className="btn btn-icon btn-danger btn-sm" onClick={() => removeExtra(item.id)} aria-label="Remove extra">✕</button>
        </div>
      ))}
      <div className="row-gap" style={{ marginTop: '.75rem' }}>
        <input
          type="text"
          placeholder="Name (e.g. Visa fee)"
          value={name}
          style={{ flex: 2 }}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          style={{ flex: 1 }}
          min="0"
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <span className="text-xs text-muted">{trip.currency}</span>
        <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ Add</button>
      </div>
    </div>
  );
}

/* ── Fit to budget panel ────────────────────────────────────────── */
function FitPanel() {
  const { runFit, undoFit, fitResult } = useStore();
  const trip = useActiveTrip();
  if (!trip) return null;

  return (
    <div className="card">
      <div className="card-title"><span className="card-title-icon">⚡</span> Budget optimiser</div>
      <div className="row-gap">
        <button className="btn btn-primary" onClick={runFit}>
          🎯 Fit plan to budget
        </button>
        {fitResult && (
          <button className="btn btn-ghost" onClick={undoFit}>
            ↩ Undo
          </button>
        )}
      </div>

      {fitResult && (
        <div className="fit-panel">
          <div className={`fit-panel-header ${fitResult.success ? 'success' : 'failure'}`}>
            {fitResult.success
              ? '✅ Plan fits your budget!'
              : '❌ Could not fit within budget'}
          </div>
          {!fitResult.success && (
            <p className="text-sm" style={{ padding: '.5rem 1rem', color: 'var(--color-text-muted)' }}>
              Try raising your budget, finding a cheaper fare, or choosing a different month.
            </p>
          )}
          {fitResult.underBudget && fitResult.success && (
            <p className="text-sm" style={{ padding: '.5rem 1rem', color: 'var(--color-green)' }}>
              💡 You&apos;re well under budget — consider upgrading stays or adding more stops!
            </p>
          )}
          {fitResult.steps.length > 0 && (
            <ul className="fit-step-list">
              {fitResult.steps.map((step, i) => (
                <li key={i}>{step.description}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Budget sidebar ─────────────────────────────────────────────── */
import { calcBreakdown, monthCosts } from './lib/calculator';
import { DESTINATIONS } from './data/destinations';
import type { BudgetBreakdown, AppSettings } from './types';

function BudgetSidebar() {
  const trip = useActiveTrip();
  const { settings } = useStore();

  if (!trip) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💰</div>
        <h3>No trip</h3>
        <p>Create a trip to see the budget summary.</p>
      </div>
    );
  }

  const dest = DESTINATIONS[trip.destination];
  if (!dest) return null;

  const bd: BudgetBreakdown = calcBreakdown(trip, dest, settings);
  const ratio = bd.total / trip.budget;
  const statusClass = ratio < 0.9 ? 'green' : ratio <= 1 ? 'amber' : 'red';
  const diff = trip.budget - bd.total;

  const cats = [
    { key: 'flights',        label: 'Flights',         color: 'var(--color-chart-flights)',    value: bd.flights },
    { key: 'stay',           label: 'Stay',             color: 'var(--color-chart-stay)',       value: bd.stay },
    { key: 'food',           label: 'Food',             color: 'var(--color-chart-food)',       value: bd.food },
    { key: 'localTransport', label: 'Local transport',  color: 'var(--color-chart-transport)',  value: bd.localTransport },
    { key: 'intercity',      label: 'Intercity',        color: 'var(--color-chart-activities)', value: bd.intercity },
    { key: 'activities',     label: 'Activities',       color: '#ec4899',                       value: bd.activities },
    { key: 'extras',         label: 'Extras',           color: 'var(--color-chart-extras)',     value: bd.extras },
    { key: 'buffer',         label: 'Buffer (10%)',     color: 'var(--color-chart-buffer)',     value: bd.buffer },
  ].filter(c => c.value > 0);

  const fmt = (v: number) => {
    if (trip.currency === 'JPY') return `¥${Math.round(v).toLocaleString('en-IN')}`;
    if (trip.currency === 'INR') return `₹${Math.round(v).toLocaleString('en-IN')}`;
    return `${trip.currency} ${v.toFixed(2)}`;
  };

  const allMonths = monthCosts(trip, dest, settings);
  const sortedMonths = [...allMonths].sort((a, b) => a.total - b.total);
  const cheapest = sortedMonths.slice(0, 2).map(m => m.month);
  const priciest = sortedMonths.slice(-2).map(m => m.month);
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <>
      <div className="section-title">Budget summary</div>
      <div className="budget-total">{fmt(bd.total)}</div>
      <div style={{ marginBottom: '.5rem' }}>
        <span className={`budget-status ${statusClass}`}>
          {diff >= 0 ? `${fmt(diff)} under budget` : `${fmt(-diff)} over budget`}
        </span>
      </div>

      {ratio < 0.75 && (
        <div style={{ marginTop: '.5rem', padding: '.5rem .75rem', background: 'var(--color-green-muted, rgba(34,197,94,.12))', borderRadius: 6, fontSize: '.8rem', color: 'var(--color-green)' }}>
          💡 Well under budget — consider upgrading stays or adding cities!
        </div>
      )}

      <div className="budget-bar-wrap">
        {cats.map(cat => (
          <div
            key={cat.key}
            className="budget-bar-segment"
            style={{
              width: `${Math.min((cat.value / bd.total) * 100, 100)}%`,
              background: cat.color,
            }}
            title={`${cat.label}: ${fmt(cat.value)}`}
          />
        ))}
      </div>

      <div className="budget-meta">
        <div className="budget-meta-item">
          <div className="budget-meta-label">Budget</div>
          <div className="budget-meta-value">{fmt(trip.budget)}</div>
        </div>
        <div className="budget-meta-item">
          <div className="budget-meta-label">Per person</div>
          <div className="budget-meta-value">{fmt(bd.perPerson)}</div>
        </div>
        <div className="budget-meta-item">
          <div className="budget-meta-label">Per day</div>
          <div className="budget-meta-value">{fmt(bd.perDay)}</div>
        </div>
        <div className="budget-meta-item">
          <div className="budget-meta-label">Duration</div>
          <div className="budget-meta-value">{bd.totalNights}N · {bd.totalNights + 1}D</div>
        </div>
      </div>

      <hr className="divider" />
      <div className="section-title">Cost breakdown</div>
      <div className="budget-line-items">
        {cats.map(cat => (
          <div key={cat.key} className="budget-line">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="budget-line-dot" style={{ background: cat.color }} />
              {cat.label}
            </div>
            <strong>{fmt(cat.value)}</strong>
          </div>
        ))}
      </div>

      <hr className="divider" />
      <div className="section-title">Travel month tips</div>
      <div className="month-pills">
        {cheapest.map(m => (
          <span key={m} className="month-pill cheapest">🌿 {MONTH_ABBR[m - 1]}</span>
        ))}
        {priciest.map(m => (
          <span key={m} className="month-pill priciest">🔥 {MONTH_ABBR[m - 1]}</span>
        ))}
      </div>
      <p className="text-xs text-muted" style={{ marginTop: '.4rem' }}>
        Green = cheapest months · Red = priciest
      </p>
    </>
  );
}

/* ── Settings view ──────────────────────────────────────────────── */
function SettingsView() {
  const { settings, updateSettings, resetSettings } = useStore();

  type NumericSettingKey = Exclude<keyof AppSettings, 'seasonMultipliers'>;

  const field = (label: string, key: NumericSettingKey, step = 100) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="number"
        min="0"
        step={step}
        value={settings[key] as number}
        onChange={e => updateSettings({ [key]: parseFloat(e.target.value) || 0 })}
      />
    </div>
  );

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h2 style={{ marginBottom: '1rem' }}>⚙️ Cost settings</h2>
      <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>
        All prices in JPY. These override the defaults from destinations.ts.
      </p>

      <div className="section-title">Accommodation (JPY)</div>
      <div className="form-row">
        {field('Hostel per person/night', 'hostelPerPersonPerNight')}
        {field('Budget hotel per room/night', 'budgetHotelPerRoomPerNight')}
      </div>
      {field('Mid-range hotel per room/night', 'midRangeHotelPerRoomPerNight')}

      <div className="section-title" style={{ marginTop: '.75rem' }}>Transport (JPY/person)</div>
      <div className="form-row">
        {field('Intercity cheap (bus/budget flight)', 'intercityLegCheap')}
        {field('Intercity rail (Shinkansen etc.)', 'intercityLegRail')}
      </div>
      <div className="form-row">
        {field('Local transport per person/day', 'localTransportPerPersonPerDay', 50)}
        {field('Airport transfer per person', 'airportTransferPerPerson')}
      </div>

      <div className="section-title" style={{ marginTop: '.75rem' }}>Food (JPY/person/day)</div>
      <div className="form-row-3">
        {field('Lean', 'foodLean', 100)}
        {field('Balanced', 'foodBalanced', 100)}
        {field('Foodie', 'foodFoodie', 100)}
      </div>

      <div className="section-title" style={{ marginTop: '.75rem' }}>Misc</div>
      <div className="form-group">
        <label>Contingency buffer (fraction, e.g. 0.10 = 10%)</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={settings.contingencyBuffer}
          onChange={e => updateSettings({ contingencyBuffer: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="section-title" style={{ marginTop: '.75rem' }}>Season multipliers (Jan–Dec)</div>
      <p className="text-xs text-muted" style={{ marginBottom: '.5rem' }}>
        Applied to accommodation costs. Higher = pricier (e.g. 1.35 = cherry blossom season).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '.5rem' }}>
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
          <div key={m} className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '.75rem' }}>{m}</label>
            <input
              type="number"
              min="0.1"
              max="3"
              step="0.05"
              value={(settings.seasonMultipliers ?? [0.9,0.9,1.35,1.35,1.1,0.9,1.05,1.1,1.0,1.15,1.25,1.1])[i]}
              onChange={e => {
                const mults = [...(settings.seasonMultipliers ?? [0.9,0.9,1.35,1.35,1.1,0.9,1.05,1.1,1.0,1.15,1.25,1.1])];
                mults[i] = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                updateSettings({ seasonMultipliers: mults });
              }}
            />
          </div>
        ))}
      </div>

      <div className="row-gap" style={{ marginTop: '1rem' }}>
        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Reset to defaults?')) resetSettings(); }}>
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

/* ── Compare view ───────────────────────────────────────────────── */
function CompareView() {
  const { trips, settings } = useStore();
  const [leftId, setLeftId] = useState(trips[0]?.id ?? '');
  const [rightId, setRightId] = useState(trips[1]?.id ?? trips[0]?.id ?? '');

  if (trips.length < 2) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚖️</div>
        <h3>Compare trips</h3>
        <p>Duplicate a trip and come back here to compare two trips side by side.</p>
      </div>
    );
  }

  const leftTrip = trips.find(t => t.id === leftId) ?? trips[0];
  const rightTrip = trips.find(t => t.id === rightId) ?? trips[1];

  const destL = DESTINATIONS[leftTrip.destination];
  const destR = DESTINATIONS[rightTrip.destination];

  const bdL: BudgetBreakdown | null = destL ? calcBreakdown(leftTrip, destL, settings) : null;
  const bdR: BudgetBreakdown | null = destR ? calcBreakdown(rightTrip, destR, settings) : null;

  const fmt = (v: number, currency: string) => {
    if (currency === 'JPY') return `¥${Math.round(v).toLocaleString('en-IN')}`;
    if (currency === 'INR') return `₹${Math.round(v).toLocaleString('en-IN')}`;
    return `${currency} ${v.toFixed(2)}`;
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>⚖️ Scenario compare</h2>
      <div className="compare-grid">
        {[
          { trip: leftTrip, bd: bdL, pick: setLeftId },
          { trip: rightTrip, bd: bdR, pick: setRightId },
        ].map(({ trip, bd, pick }, col) => (
          <div key={col} className="card">
            <div className="form-group">
              <label>Trip</label>
              <select value={trip.id} onChange={e => pick(e.target.value)}>
                {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="budget-total">{bd ? fmt(bd.total, trip.currency) : '—'}</div>
            {bd && (
              <div className="budget-meta" style={{ marginTop: '.5rem' }}>
                <div className="budget-meta-item">
                  <div className="budget-meta-label">Budget</div>
                  <div className="budget-meta-value">{fmt(trip.budget, trip.currency)}</div>
                </div>
                <div className="budget-meta-item">
                  <div className="budget-meta-label">Per person</div>
                  <div className="budget-meta-value">{fmt(bd.perPerson, trip.currency)}</div>
                </div>
                <div className="budget-meta-item">
                  <div className="budget-meta-label">Nights</div>
                  <div className="budget-meta-value">{bd.totalNights}</div>
                </div>
                <div className="budget-meta-item">
                  <div className="budget-meta-label">Stops</div>
                  <div className="budget-meta-value">{trip.stops.length}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {bdL && bdR && leftTrip.currency === rightTrip.currency && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <strong>Difference:</strong>{' '}
          <span style={{ color: bdL.total < bdR.total ? 'var(--color-green)' : 'var(--color-red)' }}>
            {fmt(Math.abs(bdL.total - bdR.total), leftTrip.currency)}
            {' '}{bdL.total < bdR.total ? `(${leftTrip.name} is cheaper)` : `(${rightTrip.name} is cheaper)`}
          </span>
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   TOUR PLANNER VIEW
   ══════════════════════════════════════════════════════════════════ */

const ALL_INTEREST_TAGS: InterestTag[] = [
  'culture', 'food', 'nature', 'hiking', 'onsen',
  'history', 'nightlife', 'anime', 'beaches', 'snow', 'art',
];
const TAG_EMOJI: Record<string, string> = {
  culture: '🏯', food: '🍜', nature: '🌿', hiking: '⛰️', onsen: '♨️',
  history: '📜', nightlife: '🌃', anime: '🎌', beaches: '🏖️', snow: '❄️', art: '🎨',
};
const PACE_OPTIONS: Pace[] = ['relaxed', 'balanced', 'fast'];
const PACE_EMOJI: Record<string, string> = { relaxed: '😌', balanced: '😊', fast: '⚡' };

function TourPlannerView() {
  const trip = useActiveTrip();
  const { setPlannerInputs, runBuildPlan, clearPlanResult } = useStore();

  const [requiredInput, setRequiredInput] = useState('');
  const [wishlistInput, setWishlistInput] = useState('');

  if (!trip) return <div className="empty-state"><div className="empty-state-icon">🧭</div><h3>No trip selected</h3></div>;

  const pi = trip.plannerInputs ?? {
    requiredCityIds: [],
    wishlistCityIds: [],
    totalNights: trip.totalNights ?? 7,
    pace: 'balanced' as Pace,
    interestTags: [] as InterestTag[],
    arrivalAirport: trip.flight.origin || 'TYO',
    departureAirport: trip.flight.origin || 'TYO',
    includeUnderratedScore: 0,
    flexibleDates: false,
  };

  const update = (patch: Partial<PlannerInputs>) => setPlannerInputs({ ...pi, ...patch });

  const addRequired = (id: string) => {
    if (!id || pi.requiredCityIds.includes(id)) return;
    update({ requiredCityIds: [...pi.requiredCityIds, id] });
    setRequiredInput('');
  };

  const addWishlist = (id: string) => {
    if (!id || pi.wishlistCityIds.includes(id) || pi.requiredCityIds.includes(id)) return;
    update({ wishlistCityIds: [...pi.wishlistCityIds, id] });
    setWishlistInput('');
  };

  const toggleTag = (tag: InterestTag) => {
    const tags = pi.interestTags.includes(tag)
      ? pi.interestTags.filter(t => t !== tag)
      : [...pi.interestTags, tag];
    update({ interestTags: tags });
  };

  return (
    <>
      {/* Disclaimer */}
      <div className="planner-disclaimer">
        ⚠️ All travel times, costs, and seasons are <strong>planning estimates</strong>. Verify before booking.
      </div>

      <div className="card">
        <div className="card-title"><span className="card-title-icon">🧭</span> Tour Planner — Build My Plan</div>

        {/* Required cities */}
        <div className="form-group">
          <label>Must-visit cities 🔒 <span className="text-muted text-xs">(required — never dropped)</span></label>
          <div className="city-input-row">
            <input
              type="text"
              list="city-list-req"
              value={requiredInput}
              placeholder="Type a city name…"
              onChange={e => setRequiredInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const matched = CITIES.find(c =>
                    c.name.toLowerCase() === requiredInput.toLowerCase() || c.id === requiredInput
                  );
                  if (matched) addRequired(matched.id);
                }
              }}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const matched = CITIES.find(c =>
                c.name.toLowerCase() === requiredInput.toLowerCase() || c.id === requiredInput
              );
              if (matched) addRequired(matched.id);
            }}>Add</button>
          </div>
          <datalist id="city-list-req">
            {CITIES.map(c => <option key={c.id} value={c.name} />)}
          </datalist>
          <div className="city-tags-row">
            {pi.requiredCityIds.map(id => {
              const c = CITIES.find(x => x.id === id);
              return (
                <span key={id} className="city-badge city-badge-required">
                  🔒 {c?.name ?? id}
                  <button onClick={() => update({ requiredCityIds: pi.requiredCityIds.filter(r => r !== id) })}>×</button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Wishlist */}
        <div className="form-group">
          <label>Wishlist <span className="text-muted text-xs">(optional — added if nights & budget allow)</span></label>
          <div className="city-input-row">
            <input
              type="text"
              list="city-list-wish"
              value={wishlistInput}
              placeholder="Type a city name…"
              onChange={e => setWishlistInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const matched = CITIES.find(c =>
                    c.name.toLowerCase() === wishlistInput.toLowerCase() || c.id === wishlistInput
                  );
                  if (matched) addWishlist(matched.id);
                }
              }}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => {
              const matched = CITIES.find(c =>
                c.name.toLowerCase() === wishlistInput.toLowerCase() || c.id === wishlistInput
              );
              if (matched) addWishlist(matched.id);
            }}>Add</button>
          </div>
          <datalist id="city-list-wish">
            {CITIES.filter(c => !pi.requiredCityIds.includes(c.id)).map(c => <option key={c.id} value={c.name} />)}
          </datalist>
          <div className="city-tags-row">
            {pi.wishlistCityIds.map(id => {
              const c = CITIES.find(x => x.id === id);
              return (
                <span key={id} className="city-badge city-badge-wish">
                  💫 {c?.name ?? id}
                  <button onClick={() => update({ wishlistCityIds: pi.wishlistCityIds.filter(r => r !== id) })}>×</button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Quick-add popular destinations */}
        <div className="form-group">
          <label className="text-xs text-muted">Quick add required:</label>
          <div className="city-tags-row" style={{ flexWrap: 'wrap' }}>
            {['tokyo', 'kyoto', 'osaka', 'hiroshima', 'kanazawa', 'hakone', 'fukuoka', 'sapporo', 'naha'].map(id => {
              const c = CITIES.find(x => x.id === id);
              const isReq = pi.requiredCityIds.includes(id);
              return (
                <button
                  key={id}
                  className={`btn btn-sm ${isReq ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => isReq
                    ? update({ requiredCityIds: pi.requiredCityIds.filter(r => r !== id) })
                    : addRequired(id)
                  }
                >
                  {isReq ? '🔒 ' : ''}{c?.name ?? id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration / airports */}
        <div className="form-row-3">
          <div className="form-group">
            <label>Total nights</label>
            <input
              type="number" min="1" max="60"
              value={pi.totalNights}
              onChange={e => update({ totalNights: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
          <div className="form-group">
            <label>Arrival airport / city</label>
            <input
              type="text"
              value={pi.arrivalAirport}
              onChange={e => update({ arrivalAirport: e.target.value.toUpperCase() })}
              placeholder="TYO, DEL, BOM…"
            />
          </div>
          <div className="form-group">
            <label>Departure airport / city</label>
            <input
              type="text"
              value={pi.departureAirport}
              onChange={e => update({ departureAirport: e.target.value.toUpperCase() })}
              placeholder="TYO, KIX, FUK…"
            />
            <span className="text-xs text-muted">Different for open-jaw (fly in TYO, out KIX)</span>
          </div>
        </div>

        {/* Pace */}
        <div className="form-group">
          <label>Pace</label>
          <div className="row-gap">
            {PACE_OPTIONS.map(p => (
              <button
                key={p}
                className={`btn btn-sm ${pi.pace === p ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => update({ pace: p })}
              >
                {PACE_EMOJI[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Interest tags */}
        <div className="form-group">
          <label>Interests <span className="text-muted text-xs">(influences underrated suggestions)</span></label>
          <div className="city-tags-row" style={{ flexWrap: 'wrap' }}>
            {ALL_INTEREST_TAGS.map(tag => (
              <button
                key={tag}
                className={`btn btn-sm ${pi.interestTags.includes(tag) ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => toggleTag(tag)}
              >
                {TAG_EMOJI[tag]} {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Underrated slider */}
        <div className="form-group">
          <label>
            Include underrated destinations
            <span className="text-muted text-xs" style={{ marginLeft: '.5rem' }}>
              {pi.includeUnderratedScore === 0 ? '(off)' :
               pi.includeUnderratedScore < 0.4 ? '(low)' :
               pi.includeUnderratedScore < 0.7 ? '(medium)' : '(high — adventurous!)'}
            </span>
          </label>
          <input
            type="range" min="0" max="1" step="0.1"
            value={pi.includeUnderratedScore}
            onChange={e => update({ includeUnderratedScore: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div className="row-gap text-xs text-muted" style={{ justifyContent: 'space-between' }}>
            <span>Off</span><span>Hidden gems only</span>
          </div>
        </div>

        {/* Build button */}
        <div className="row-gap" style={{ marginTop: '1rem', gap: '.75rem' }}>
          <button
            className="btn btn-primary"
            disabled={pi.requiredCityIds.length === 0}
            onClick={() => runBuildPlan()}
          >
            🧭 Build my plan
          </button>
          {trip.planResult && (
            <button className="btn btn-ghost btn-sm" onClick={() => clearPlanResult()}>
              ✕ Clear plan
            </button>
          )}
        </div>
        {pi.requiredCityIds.length === 0 && (
          <p className="text-sm text-muted" style={{ marginTop: '.5rem' }}>
            Add at least one must-visit city to build a plan.
          </p>
        )}
      </div>

      {/* Timeline view */}
      {trip.planResult && <TimelineView result={trip.planResult} trip={trip} />}
    </>
  );
}

/* ── Timeline view ───────────────────────────────────────────────── */
function TimelineView({ result, trip }: { result: NonNullable<import('./types').Trip['planResult']>; trip: import('./types').Trip }) {
  const currency = trip.currency;
  const rate = trip.exchangeRate;

  const fmtJpy = (jpy: number) => {
    const val = jpy * rate;
    if (currency === 'INR') return `₹${Math.round(val).toLocaleString('en-IN')}`;
    if (currency === 'JPY') return `¥${Math.round(jpy).toLocaleString()}`;
    return `${currency} ${val.toFixed(0)}`;
  };

  const modeEmoji: Record<string, string> = {
    bus: '🚌', train: '🚃', shinkansen: '🚄', flight: '✈️', ferry: '⛴️',
  };

  return (
    <div className="card">
      <div className="card-title"><span className="card-title-icon">📅</span> Your Itinerary Timeline</div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="planner-warnings">
          {result.warnings.map((w, i) => <div key={i} className="planner-warning-item">⚠️ {w}</div>)}
        </div>
      )}

      {/* Stops */}
      <div className="timeline-list">
        {result.stops.map((stop, idx) => (
          <div key={idx}>
            {/* Travel leg card */}
            {stop.travelLegFromPrev && !stop.isDayTrip && (
              <div className="timeline-leg">
                {modeEmoji[stop.travelLegFromPrev.mode] ?? '🚆'}
                {' '}
                <strong>{stop.travelLegFromPrev.isEstimate ? 'Est. ' : ''}{
                  stop.travelLegFromPrev.timeMinsRail < 60
                    ? `${stop.travelLegFromPrev.timeMinsRail} min`
                    : `${Math.round(stop.travelLegFromPrev.timeMinsRail / 60 * 10) / 10} hrs`
                }</strong>
                {' '}by {stop.travelLegFromPrev.mode}{' · '}
                Est. {fmtJpy(stop.travelLegFromPrev.costCheapJpy)}/pp (cheap)
                {' / '}{fmtJpy(stop.travelLegFromPrev.costRailJpy)}/pp (rail)
                {stop.travelLegFromPrev.isEstimate && <span className="estimate-badge">estimate</span>}
              </div>
            )}

            {/* Stop card */}
            <div className={`timeline-stop ${stop.required ? 'stop-required' : stop.source === 'suggested' ? 'stop-suggested' : ''} ${stop.isDayTrip ? 'stop-daytript' : ''}`}>
              <div className="timeline-stop-header">
                <div className="timeline-stop-name">
                  {stop.required && <span title="Must-visit">🔒 </span>}
                  {stop.isDayTrip && <span title="Day trip">🚶 Day trip: </span>}
                  <strong>{stop.cityName}</strong>
                  {' '}
                  <span className={`source-badge source-${stop.source}`}>
                    {stop.source === 'required' ? 'Required' : stop.source === 'suggested' ? '✨ Suggested' : 'You added'}
                  </span>
                </div>
                {!stop.isDayTrip && (
                  <div className="timeline-day-range">
                    Day {stop.dayRangeStart}–{stop.dayRangeEnd}
                    <span className="text-muted text-xs"> ({stop.nights} night{stop.nights !== 1 ? 's' : ''})</span>
                  </div>
                )}
                {stop.isDayTrip && (
                  <div className="timeline-day-range text-muted text-xs">Day trip from {result.stops.find(s => s.cityId === stop.dayTripFromId)?.cityName}</div>
                )}
              </div>
              {stop.suggestionReason && (
                <div className="suggestion-reason">💡 {stop.suggestionReason}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="timeline-summary">
        <div className="timeline-summary-item">
          <span>Total nights</span><strong>{result.totalNights}</strong>
        </div>
        <div className="timeline-summary-item">
          <span>Estimated cost</span>
          <strong>
            {currency === 'INR' ? '₹' : currency === 'JPY' ? '¥' : currency + ' '}
            {currency === 'JPY'
              ? Math.round(result.totalCost).toLocaleString()
              : Math.round(result.totalCost).toLocaleString('en-IN')}
          </strong>
        </div>
        <div className="timeline-summary-item">
          <span>Stops</span><strong>{result.stops.filter(s => !s.isDayTrip).length}</strong>
        </div>
      </div>

      <p className="text-xs text-muted" style={{ marginTop: '.75rem' }}>
        ⚠️ All costs, times, and seasons are estimates. Verify before booking.
      </p>
    </div>
  );
}

/* ── Plan check panel (sidebar) ──────────────────────────────────── */
function PlanCheckPanel() {
  const trip = useActiveTrip();
  const { setPlannerInputs, runBuildPlan } = useStore();

  if (!trip) return null;
  const result = trip.planResult;
  const pi = trip.plannerInputs;

  const [tab, setTab] = useState<'feasibility' | 'suggestions' | 'dates'>('feasibility');

  const feasItems = result?.feasibility.items ?? [];
  const dateWins = result?.dateSuggestions?.slice(0, 3) ?? [];
  const underrated = result?.underratedInserted ?? [];

  const issueCount = feasItems.filter(i => i.verdict !== 'included').length;

  const verdictColor: Record<string, string> = {
    included: 'var(--color-green)',
    'day-trip': 'var(--color-accent-mid)',
    'fewer-nights': 'var(--color-amber)',
    'not-recommended': 'var(--color-amber)',
    impossible: 'var(--color-red)',
  };
  const verdictLabel: Record<string, string> = {
    included: '✅ Included',
    'day-trip': '🚶 Day trip',
    'fewer-nights': '⚠️ Tight',
    'not-recommended': '⚠️ Not recommended',
    impossible: '❌ Impossible',
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="plan-check-panel">
      <div className="plan-check-title">🔍 Plan Check</div>

      {!result && (
        <div className="text-sm text-muted" style={{ padding: '.75rem 0' }}>
          Build a plan to see the feasibility report and date suggestions.
        </div>
      )}

      {result && (
        <>
          {/* Tab bar */}
          <div className="plan-check-tabs">
            {(['feasibility', 'suggestions', 'dates'] as const).map(t => (
              <button
                key={t}
                className={`plan-check-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'feasibility' ? `Feasibility ${issueCount > 0 ? `(${issueCount}⚠️)` : '✅'}` :
                 t === 'suggestions' ? `Suggestions ${underrated.length > 0 ? `(${underrated.length})` : ''}` :
                 `Dates (top 3)`}
              </button>
            ))}
          </div>

          {/* Feasibility tab */}
          {tab === 'feasibility' && (
            <div className="plan-check-content">
              {feasItems.length === 0 && (
                <p className="text-sm text-muted">No required cities to check.</p>
              )}
              {feasItems.map((item: FeasibilityItem) => (
                <div key={item.cityId} className="feasibility-item">
                  <div className="feasibility-verdict" style={{ color: verdictColor[item.verdict] }}>
                    {verdictLabel[item.verdict] ?? item.verdict} — <strong>{item.cityName}</strong>
                  </div>
                  <div className="feasibility-reason text-sm">{item.reason}</div>
                  {item.fix && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: '.25rem' }}
                      onClick={() => {
                        if (!pi) return;
                        if (item.fix?.action === 'add-nights' && pi) {
                          setPlannerInputs({ ...pi, totalNights: result.feasibility.minimumNightsNeeded });
                          runBuildPlan();
                        } else if (item.fix?.action === 'remove' && pi) {
                          setPlannerInputs({
                            ...pi,
                            requiredCityIds: pi.requiredCityIds.filter(id => id !== item.cityId),
                          });
                          runBuildPlan();
                        }
                      }}
                    >
                      🔧 {item.fix.label}
                    </button>
                  )}
                </div>
              ))}
              {result.feasibility.minimumNightsNeeded > 0 && (
                <div className="text-xs text-muted" style={{ marginTop: '.75rem', borderTop: '1px solid var(--border)', paddingTop: '.5rem' }}>
                  Min. nights needed: <strong>{result.feasibility.minimumNightsNeeded}</strong>
                </div>
              )}
            </div>
          )}

          {/* Suggestions tab */}
          {tab === 'suggestions' && (
            <div className="plan-check-content">
              {underrated.length === 0 && (
                <p className="text-sm text-muted">
                  No underrated suggestions. Turn up the slider on the Tour Planner panel.
                </p>
              )}
              {underrated.map(u => (
                <div key={u.cityId} className="suggestion-item">
                  <div className="suggestion-item-title">✨ {u.cityName}</div>
                  <div className="suggestion-item-desc">{u.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* Dates tab */}
          {tab === 'dates' && (
            <div className="plan-check-content">
              {dateWins.length === 0 && <p className="text-sm text-muted">No date data available.</p>}
              {dateWins.map((w: DateWindow, i) => (
                <div key={w.month} className="date-window-item">
                  <div className="date-window-header">
                    <strong>#{i + 1} {w.label}</strong>
                    <span style={{ color: w.costDiff < 0 ? 'var(--color-green)' : w.costDiff > 0 ? 'var(--color-red)' : undefined }} className="text-sm">
                      {w.costDiff === 0 ? 'Your selected month' :
                       w.costDiff < 0 ? `${Math.abs(Math.round(w.costDiffPct))}% cheaper` :
                       `${Math.round(w.costDiffPct)}% pricier`}
                    </span>
                  </div>
                  <div className="date-window-scores text-xs text-muted">
                    👥 Crowds: {Math.round(w.crowdScore * 100)}% · 🌤 Weather: {Math.round(w.weatherScore * 100)}%
                  </div>
                  {w.pros.length > 0 && (
                    <div className="text-xs" style={{ color: 'var(--color-green)', marginTop: '.25rem' }}>
                      ✅ {w.pros.slice(0, 2).join(' · ')}
                    </div>
                  )}
                  {w.cons.length > 0 && (
                    <div className="text-xs" style={{ color: 'var(--color-red)', marginTop: '.1rem' }}>
                      ⚠️ {w.cons.slice(0, 2).join(' · ')}
                    </div>
                  )}
                  {w.month !== trip.travelMonth && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: '.35rem' }}
                      onClick={() => {
                        const { updateTrip, runBuildPlan: rbp } = useStore.getState();
                        updateTrip({ travelMonth: w.month });
                        if (pi) rbp();
                      }}
                    >
                      📅 Use {MONTH_NAMES[w.month - 1]}
                    </button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted" style={{ marginTop: '.75rem' }}>
                ⚠️ All estimates. Actual prices and crowds vary.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
