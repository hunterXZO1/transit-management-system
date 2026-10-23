// Relational Entity Type Definitions for TransitFlow System

export type Gender = 'F' | 'M' | 'Other';
export type RouteType = 'Bus' | 'Metro';
export type FuelType = 'Diesel' | 'Electric' | 'CNG';
export type PaymentMode = 'UPI' | 'Card' | 'Cash';
export type TicketType = 'Regular' | 'Season' | 'Concession';
export type TravelClass = 'General' | 'AC';

// 1. Passenger Management
export interface Passenger {
  passengerId: string; // e.g. P001
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  doorNo: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  phoneNumbers: string[]; // Multivalued PASSENGER_CONTACT
}

// 2. Route & Network Management
export interface Route {
  routeId: string; // e.g. R001
  name: string;
  type: RouteType;
  totalDistanceKm: number;
}

export interface Station {
  stationId: string; // e.g. S001
  name: string;
  city: string;
  area: string;
  landmark: string;
}

// Route-Station M:N Mapping with Stop Order
export interface RouteStation {
  id: string; // composite key helper e.g. "R001-S001"
  routeId: string;
  stationId: string;
  stopOrder: number;
  distanceFromStartKm?: number;
}

// 3. Fleet & Driver Management
export interface VehicleType {
  typeId: string; // e.g. VT01
  name: string;
  capacity: number;
  fuelType: FuelType;
}

export interface Driver {
  driverId: string; // e.g. D001
  name: string;
  licenseNo: string;
  dob: string;
  contactNumbers: string[]; // Multivalued contact numbers
}

export interface Vehicle {
  vehicleId: string; // e.g. V001
  registrationNo: string;
  manufactureDate: string;
  color: string;
  vehicleTypeId: string;
  assignedDriverId?: string | null; // 1:1 constraint visual
}

// 4. Trip Scheduling & Stops
export interface Trip {
  tripId: string; // e.g. T001
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  routeId: string;
}

// Weak Entity: Trip Stops (mapping Trip to Stations with Arrival & Departure times)
export interface TripStop {
  id: string; // composite key e.g. "T001-S001-1"
  tripId: string;
  stationId: string;
  stopOrder: number;
  arrivalTime: string;
  departureTime: string;
  status?: 'Scheduled' | 'On Time' | 'Delayed' | 'Departed';
}

// 5. Bookings, Tickets & Payments
export interface Booking {
  bookingId: string; // e.g. B001
  passengerId: string;
  tripId: string;
  seatNumber: string; // e.g. A01
  date: string; // YYYY-MM-DD
  status: 'Confirmed' | 'Cancelled';
}

export interface Payment {
  paymentId: string; // e.g. PAY001
  mode: PaymentMode;
  amount: number;
  date: string;
  txnReferenceNo: string;
}

export interface Ticket {
  ticketId: string; // e.g. TK001
  bookingId: string;
  passengerId: string;
  tripId: string;
  issueDate: string;
  ticketType: TicketType;
  travelClass: TravelClass;
  paymentId: string;
}

// Active navigation tab
export type ActiveTab =
  | 'dashboard'
  | 'passengers'
  | 'routes'
  | 'fleet'
  | 'trips'
  | 'bookings';

// Notification toast
export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}
