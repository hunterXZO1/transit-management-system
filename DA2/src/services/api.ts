// Clean service abstraction layer for TransitFlow.
// Backend engineers can directly swap these implementations to real HTTP endpoints (REST/GraphQL).



export interface TransitApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Storage Keys
export const STORAGE_KEYS = {
  PASSENGERS: 'transit_passengers',
  ROUTES: 'transit_routes',
  STATIONS: 'transit_stations',
  ROUTE_STATIONS: 'transit_route_stations',
  VEHICLE_TYPES: 'transit_vehicle_types',
  DRIVERS: 'transit_drivers',
  VEHICLES: 'transit_vehicles',
  TRIPS: 'transit_trips',
  TRIP_STOPS: 'transit_trip_stops',
  BOOKINGS: 'transit_bookings',
  PAYMENTS: 'transit_payments',
  TICKETS: 'transit_tickets',
};

// Generic LocalStorage helper with schema validation support
export class StorageService {
  static get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to persist to localStorage [${key}]`, e);
    }
  }

  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}
