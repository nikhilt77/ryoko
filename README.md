# Trip Budget Planner

A local-first web app for planning budget trips around a fixed budget. Built first for Japan, fully reusable for other destinations.

## ✈️ Features

- **Multiple trips** — create, rename, duplicate, delete trips from the header dropdown
- **Live budget summary** — sticky sidebar shows total vs. budget (green/amber/red), cost breakdown, per-person/per-day costs, and cheapest/priciest travel months
- **Itinerary builder** — add, remove, and reorder city stops with stay type and priority
- **Suggest plan** — auto-generates a Japan itinerary from your total nights
- **Fit to budget** — smart optimiser that cuts costs step by step and logs every change; Undo reverts it
- **Flights panel** — manual fare entry + one-click links to Skyscanner and Google Flights
- **Extras** — visa, insurance, SIM, souvenirs
- **JSON export / import** — backup and restore your trips
- **Settings screen** — override all base prices in the UI
- **Scenario compare** — view two trips side by side
- **Dark mode** — auto (follows system) or manual toggle
- **LocalStorage persistence** — data survives page reloads under key `tbp.v1`
- **INR support** — Indian Rupee is the default currency (rate: ₹0.55 per JPY)

### 🧭 Tour Planner (new!)

Access via the **🧭 Tour Planner** nav tab:

- **25 Japan destinations** with rich data: region, tags (culture, food, hiking, onsen…), popularity, underrated score, best/avoid months, day-trip bases
- **Required vs Suggested stops** — lock cities as must-visit (🔒); they are never dropped by Fit to Budget or the planner
- **Build My Plan** — input required cities, wishlist, nights, pace (relaxed/balanced/fast), interest tags, arrival/departure airports (open-jaw), underrated slider
- **Geographic routing** — greedy nearest-neighbor with region grouping; no unnecessary backtracking
- **Day-trip detection** — cities like Nara, Kamakura, Nikko flagged automatically
- **Underrated insertions** — scored by popularity, tag match, season, detour cost; each with a reason
- **Timeline view** — Day 1–3 ranges, travel legs between stops (time, cost, mode), source badges
- **Plan Check panel** (sidebar):
  - **Feasibility** — per-city verdict (✅ Included, 🚶 Day trip, ⚠️ Tight, ❌ Impossible) with one-click fixes
  - **Suggestions** — underrated cities with reason text
  - **Dates** — top 3 alternative months ranked by value (cost × weather × crowds), "Use this month" button
- **Persistent estimate disclaimer** — all travel times, costs, and seasons are planning estimates

## 🚀 Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## 🏗 Build

```bash
npm run build
```

Output is in `dist/`.

## 🧪 Tests

```bash
npm test
```

Runs Vitest unit tests in `src/test/`. Tests cover:
- Cost calculation totals for a known trip
- Fit algorithm ends at or under budget when possible
- Priority ordering of cost cuts

## 📁 Project structure

```
src/
  data/
    destinations.ts   ← All city prices, multipliers, seasons (edit to add countries)
  lib/
    calculator.ts     ← Pure functions: calcBreakdown, fitToBudget, monthCosts
    flightProvider.ts ← FlightProvider interface + Skyscanner/Google implementations
    storage.ts        ← localStorage helpers, default trip factory
  test/
    calculator.test.ts
    setup.ts
  types.ts            ← Trip, Stop, AppSettings, BudgetBreakdown types
  store.ts            ← Zustand store (all state mutations)
  App.tsx             ← All UI components
  index.css           ← CSS variables, design tokens, all styles
  main.tsx
```

## 🔌 Adding a flight API

1. Copy `.env.example` to `.env.local` and fill in your API key.
2. In `src/lib/flightProvider.ts`, implement the `FlightProvider` interface with real API calls.
3. Swap it in the `FlightsPanel` component.

## 🌍 Adding a new destination

1. Add a new `DestinationConfig` object in `src/data/destinations.ts`.
2. Register it in the `DESTINATIONS` map.
3. Add a city selector UI in the Trip basics panel if needed.

## Cost model

All land costs are computed in JPY and converted using the trip's exchange rate.

| Category | Basis |
|---|---|
| Hostel | ¥3,500 per person per night |
| Budget hotel | ¥9,000 per room per night (ceil(travelers/2) rooms) |
| Mid-range hotel | ¥16,000 per room per night |
| Food (lean/balanced/foodie) | ¥3,000 / ¥5,000 / ¥8,000 per person per day |
| Intercity (cheap/rail) | ¥4,500 / ¥9,000 per person per leg |
| Local transport | ¥700/person/day + ¥3,000 airport transfer |
| Activities | City-specific per stop |
| Buffer | 10% on all land costs |
| Flights | Fare × travelers (entered in trip currency) |
