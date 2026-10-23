// HTTP client for the TransitFlow Express + MySQL + Neo4j backend.
import type {
  Booking,
  Driver,
  Passenger,
  Payment,
  Route,
  RouteStation,
  Station,
  Ticket,
  Trip,
  TripStop,
  Vehicle,
  VehicleType,
} from '../types/transit';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export interface TransitApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 20000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...options,
    });
  } catch (err) {
    const reason = (err as Error)?.name === 'TimeoutError' ? 'timed out' : 'is unreachable';
    throw new ApiError(0, `The TransitFlow API at ${API_BASE_URL} ${reason}. Is the backend running?`);
  }

  const body: TransitApiResponse<T> = await response.json().catch(() => ({ success: false }));
  if (!response.ok || !body.success) {
    throw new ApiError(response.status, body.error || `Request failed (${response.status}).`);
  }
  return body.data as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data) });
const put = <T>(path: string, data: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export const crud = {
  passengers: {
    list: () => get<Passenger[]>('/passengers'),
    create: (item: Passenger) => post<Passenger>('/passengers', item),
    update: (id: string, item: Passenger) => put<Passenger>(`/passengers/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/passengers/${encodeURIComponent(id)}`),
  },
  routes: {
    list: () => get<Route[]>('/routes'),
    create: (item: Route) => post<Route>('/routes', item),
    update: (id: string, item: Route) => put<Route>(`/routes/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/routes/${encodeURIComponent(id)}`),
    stops: (routeId: string) => get<RouteStation[]>(`/routes/${encodeURIComponent(routeId)}/stops`),
    reorder: (routeId: string, stationIds: string[]) =>
      put<{ routeId: string; stops: RouteStation[] }>(
        `/routes/${encodeURIComponent(routeId)}/station-order`,
        { stationIds }
      ),
  },
  stations: {
    list: () => get<Station[]>('/stations'),
    create: (item: Station) => post<Station>('/stations', item),
    update: (id: string, item: Station) => put<Station>(`/stations/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/stations/${encodeURIComponent(id)}`),
  },
  routeStations: {
    list: () => get<RouteStation[]>('/route-stations'),
    create: (item: RouteStation) => post<RouteStation>('/route-stations', item),
    update: (id: string, item: RouteStation) => put<RouteStation>(`/route-stations/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/route-stations/${encodeURIComponent(id)}`),
  },
  vehicleTypes: {
    list: () => get<VehicleType[]>('/vehicle-types'),
    create: (item: VehicleType) => post<VehicleType>('/vehicle-types', item),
    update: (id: string, item: VehicleType) => put<VehicleType>(`/vehicle-types/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/vehicle-types/${encodeURIComponent(id)}`),
  },
  drivers: {
    list: () => get<Driver[]>('/drivers'),
    create: (item: Driver) => post<Driver>('/drivers', item),
    update: (id: string, item: Driver) => put<Driver>(`/drivers/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/drivers/${encodeURIComponent(id)}`),
  },
  vehicles: {
    list: () => get<Vehicle[]>('/vehicles'),
    create: (item: Vehicle) => post<Vehicle>('/vehicles', item),
    update: (id: string, item: Vehicle) => put<Vehicle>(`/vehicles/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/vehicles/${encodeURIComponent(id)}`),
  },
  trips: {
    list: () => get<Trip[]>('/trips'),
    create: (trip: Trip, stops: Omit<TripStop, 'tripId' | 'id'>[] = []) =>
      post<{ trip: Trip; stops: TripStop[] }>('/trips', { ...trip, stops }),
    update: (id: string, item: Trip) => put<Trip>(`/trips/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/trips/${encodeURIComponent(id)}`),
    stops: (tripId: string) => get<TripStop[]>(`/trips/${encodeURIComponent(tripId)}/stops`),
  },
  tripStops: {
    list: () => get<TripStop[]>('/trip-stops'),
    create: (item: TripStop) => post<TripStop>('/trip-stops', item),
    update: (id: string, item: TripStop) => put<TripStop>(`/trip-stops/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/trip-stops/${encodeURIComponent(id)}`),
  },
  bookings: {
    list: () => get<Booking[]>('/bookings'),
    create: (item: Booking) => post<Booking>('/bookings', item),
    update: (id: string, item: Booking) => put<Booking>(`/bookings/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/bookings/${encodeURIComponent(id)}`),
    checkout: (payload: { booking: Booking; payment?: Payment; ticket?: Omit<Ticket, 'bookingId' | 'passengerId' | 'tripId' | 'paymentId'> }) =>
      post<{ booking: Booking; payment: Payment | null; ticket: Ticket | null }>('/bookings/checkout', payload),
  },
  payments: {
    list: () => get<Payment[]>('/payments'),
    create: (item: Payment) => post<Payment>('/payments', item),
    update: (id: string, item: Payment) => put<Payment>(`/payments/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/payments/${encodeURIComponent(id)}`),
  },
  tickets: {
    list: () => get<Ticket[]>('/tickets'),
    create: (item: Ticket) => post<Ticket>('/tickets', item),
    update: (id: string, item: Ticket) => put<Ticket>(`/tickets/${encodeURIComponent(id)}`, item),
    remove: (id: string) => del<{ deletedId: string }>(`/tickets/${encodeURIComponent(id)}`),
  },
};

// ---- Neo4j graph API ----

export interface GraphRouteStop {
  stationId: string;
  stationName: string;
  city: string;
  area: string;
  landmark: string | null;
  stopOrder: number;
  distanceFromStartKm: number;
}

export interface GraphRouteDetail {
  routeId: string;
  routeName: string;
  transitType: string;
  totalDistanceKm: number;
  stops: GraphRouteStop[];
}

export interface GraphPathHop {
  routeId: string;
  transitType: string;
  distanceKm: number;
}

export interface GraphEdge {
  fromStation: string;
  fromName: string;
  toStation: string;
  toName: string;
  distanceKm: number;
  transitType: string;
  routeId: string;
}

export interface GraphPathResult {
  originId: string;
  destinationId: string;
  totalHops: number;
  totalDistanceKm: number;
  strategy: string;
  maxHopsExplored: number;
  pathStations: { stationId: string; name: string; area: string; city: string }[];
  transitHops: GraphPathHop[];
  hopCountOptimalComparison: { hopCount: number; totalDistanceKm: number; routes: string[] } | null;
}

export interface GraphHealth {
  status: string;
  engine: string;
  nodes: Record<string, number>;
  relationships: Record<string, number>;
}

export interface GraphSyncResult {
  relational: Record<string, number>;
  graph: Record<string, unknown> & {
    relationships?: Record<string, number>;
    prunedInThisRun?: { nodes: number; relationships: number };
  };
  warnings: string[];
}

export interface GraphPassengerJourneys {
  passengerId: string;
  name: string;
  journeys: {
    bookingId: string;
    tripId: string;
    seatNumber: string;
    date: string;
    status: string;
    routeId: string;
    routeName: string;
    boardedAt: string;
    alightAt: string;
    connectedStations: number;
  }[];
}

export const graphApi = {
  health: () => get<GraphHealth>('/graph/health'),
  routeStations: (routeId: string) => get<GraphRouteDetail>(`/graph/routes/${encodeURIComponent(routeId)}/stations`),
  shortestPath: (originId: string, destinationId: string, maxHops = 8) =>
    get<GraphPathResult>(
      `/graph/path/shortest?originId=${encodeURIComponent(originId)}&destinationId=${encodeURIComponent(
        destinationId
      )}&maxHops=${maxHops}`
    ),
  network: () => get<GraphEdge[]>('/graph/network'),
  passengerJourneys: (passengerId: string) =>
    get<GraphPassengerJourneys>(`/graph/passengers/${encodeURIComponent(passengerId)}/journeys`),
  bookTrip: (payload: { passenger: { passengerId: string; firstName?: string; lastName?: string; city?: string }; tripId: string; seatNumber: string; date: string }) =>
    post<{ relational: Booking; graph: Record<string, unknown> | null }>('/graph/bookings', payload),
  sync: () => post<GraphSyncResult>('/graph/sync', {}),
};
