// FlightProvider interface — swap implementations here when an API key is available
// See .env.example for VITE_SKYSCRAPPER_API_KEY

export interface FlightSearchParams {
  origin: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string;    // YYYY-MM-DD
  travelers: number;
  destination?: string;  // IATA code, defaults to TYO
}

export interface FlightProvider {
  /**
   * Open a flight search in a new tab.
   * Manual implementation just builds a URL; a real API would fetch prices.
   */
  openSearch(params: FlightSearchParams): void;
}

function toYYMMDD(dateStr: string): string {
  // dateStr = "YYYY-MM-DD"
  return dateStr.replace(/-/g, '').slice(2); // "YYMMDD"
}

/** Manual entry — opens Skyscanner in a new tab */
export const skyscannerProvider: FlightProvider = {
  openSearch({ origin, departureDate, returnDate, travelers, destination = 'TYO' }) {
    const dep = toYYMMDD(departureDate);
    const ret = toYYMMDD(returnDate);
    const url = `https://www.skyscanner.com/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${dep}/${ret}/?adultsv2=${travelers}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};

/** Google Flights URL */
export const googleFlightsProvider: FlightProvider = {
  openSearch({ origin, departureDate, returnDate, destination = 'TYO' }) {
    const q = encodeURIComponent(
      `Flights from ${origin} to ${destination} on ${departureDate} through ${returnDate}`
    );
    const url = `https://www.google.com/travel/flights?q=${q}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};

// Future: replace with API-backed provider
// export const apiProvider: FlightProvider = { openSearch: async (...) => { ... } }
