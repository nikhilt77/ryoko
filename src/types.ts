// Core TypeScript types for Trip Budget Planner

export type Currency = 'USD' | 'INR' | 'EUR' | 'JPY';
export type StayType = 0 | 1 | 2; // 0=hostel, 1=budget hotel, 2=mid-range
export type Priority = 1 | 2 | 3; // 1=nice to have, 2=want, 3=must-see
export type FoodStyle = 'lean' | 'balanced' | 'foodie';
export type TransportMode = 'cheap' | 'rail';

// ── New tour-planner types ───────────────────────────────────────────
export type StopSource = 'user' | 'suggested' | 'required';
export type FeasibilityVerdict = 'included' | 'fewer-nights' | 'day-trip' | 'not-recommended' | 'impossible';
export type Pace = 'relaxed' | 'balanced' | 'fast';
export type InterestTag =
  | 'culture' | 'food' | 'nature' | 'hiking' | 'onsen'
  | 'history' | 'nightlife' | 'anime' | 'beaches' | 'snow' | 'art';

export interface FeasibilityItem {
  cityId: string;
  cityName: string;
  verdict: FeasibilityVerdict;
  reason: string;
  fix?: { label: string; action: 'add-nights' | 'make-day-trip' | 'remove' | 'raise-budget' };
}

export interface FeasibilityReport {
  items: FeasibilityItem[];
  totalTrafficDays: number;       // sum of travel days between stops
  minimumNightsNeeded: number;    // minimum viable nights for required cities
  minimumBudgetNeeded: number;    // minimum budget (JPY) for all required at lean/hostel/cheap
  overallOk: boolean;
}

export interface DateWindow {
  month: number;
  label: string;              // e.g. "February"
  totalCost: number;          // in trip currency
  crowdScore: number;         // 0-1
  weatherScore: number;       // 0-1
  valueScore: number;         // higher = better (inverse cost × weather × (1-crowd))
  costDiff: number;           // vs current selection, in trip currency (negative = cheaper)
  costDiffPct: number;
  pros: string[];
  cons: string[];
  events: string[];
}

export interface PlannerInputs {
  requiredCityIds: string[];
  wishlistCityIds: string[];
  totalNights: number;
  pace: Pace;
  interestTags: InterestTag[];
  arrivalAirport: string;   // e.g. "TYO" or city id
  departureAirport: string; // e.g. "KIX" or city id
  includeUnderratedScore: number; // 0-1 slider (how aggressively to add underrated cities)
  flexibleDates: boolean;
}

export interface PlanStop {
  cityId: string;
  cityName: string;
  nights: number;
  dayRangeStart: number;  // e.g. 1
  dayRangeEnd: number;    // e.g. 3  (Day 1 to Day 3)
  source: StopSource;
  required: boolean;
  stayType: StayType;
  priority: Priority;
  places: string[];
  travelLegFromPrev?: {
    timeMinsCheap: number;
    timeMinsRail: number;
    costCheapJpy: number;
    costRailJpy: number;
    mode: string;
    isEstimate: boolean;
  };
  suggestionReason?: string;
  isDayTrip: boolean;
  dayTripFromId?: string;
}

export interface PlanResult {
  stops: PlanStop[];
  totalNights: number;
  totalCost: number;         // in trip currency
  feasibility: FeasibilityReport;
  dateSuggestions: DateWindow[];
  warnings: string[];
  underratedInserted: { cityId: string; cityName: string; reason: string }[];
}

// ── Existing types (unchanged) ─────────────────────────────────────

export interface Stop {
  id: string;
  city: string;
  nights: number;
  days?: number;           // custom days for this stop (defaults to nights + 1)
  places?: string[];       // custom places / sights to visit in this stop
  stayType: StayType;
  priority: Priority;
  // New optional planner fields:
  source?: StopSource;
  required?: boolean;
  locked?: boolean;
  cityId?: string;         // link to japan.ts City id
  suggestionReason?: string;
}

export interface FlightInfo {
  origin: string;         // airport code e.g. "JFK"
  departureDate: string;  // ISO date string "YYYY-MM-DD"
  farePerPerson: number;  // in trip currency
  bagFeePerPerson: number; // in trip currency
}

export interface ExtraItem {
  id: string;
  name: string;
  amount: number; // in trip currency
}

export interface Trip {
  id: string;
  name: string;
  currency: Currency;
  exchangeRate: number;   // 1 JPY = X trip-currency
  budget: number;         // in trip currency
  travelers: number;
  travelMonth: number;    // 1-12
  destination: string;    // destination id e.g. "japan"
  totalDays?: number;     // user-specified total duration (days)
  totalNights?: number;   // user-specified total duration (nights)
  stops: Stop[];
  flight: FlightInfo;
  foodStyle: FoodStyle;
  transportMode: TransportMode;
  extras: ExtraItem[];
  // New planner fields:
  plannerInputs?: PlannerInputs;
  planResult?: PlanResult | null;
  requiredCityIds?: string[];
}

export interface AppSettings {
  // override-able cost numbers (all in JPY)
  hostelPerPersonPerNight: number;
  budgetHotelPerRoomPerNight: number;
  midRangeHotelPerRoomPerNight: number;
  intercityLegCheap: number;
  intercityLegRail: number;
  foodLean: number;
  foodBalanced: number;
  foodFoodie: number;
  localTransportPerPersonPerDay: number;
  airportTransferPerPerson: number;
  contingencyBuffer: number;
  // Optional season multiplier overrides (length 12, Jan=0). When set, overrides destination defaults.
  seasonMultipliers?: number[];
}

export interface BudgetBreakdown {
  flights: number;
  stay: number;
  food: number;
  localTransport: number;
  intercity: number;
  activities: number;
  extras: number;
  buffer: number;
  total: number;
  perPerson: number;
  perDay: number;
  totalNights: number;
}

export interface FitStep {
  description: string;
}
