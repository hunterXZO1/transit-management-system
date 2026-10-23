import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Passenger,
  Route,
  Station,
  RouteStation,
  VehicleType,
  Driver,
  Vehicle,
  Trip,
  TripStop,
  Booking,
  Payment,
  Ticket,
  ActiveTab,
  ToastNotification,
} from '../types/transit';
import {
  INITIAL_PASSENGERS,
  INITIAL_ROUTES,
  INITIAL_STATIONS,
  INITIAL_ROUTE_STATIONS,
  INITIAL_VEHICLE_TYPES,
  INITIAL_DRIVERS,
  INITIAL_VEHICLES,
  INITIAL_TRIPS,
  INITIAL_TRIP_STOPS,
  INITIAL_BOOKINGS,
  INITIAL_PAYMENTS,
  INITIAL_TICKETS,
} from '../services/mockData';
import { STORAGE_KEYS, StorageService } from '../services/api';

interface TransitContextType {
  // Navigation & Global UI
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
  toasts: ToastNotification[];
  addToast: (type: ToastNotification['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Entities
  passengers: Passenger[];
  routes: Route[];
  stations: Station[];
  routeStations: RouteStation[];
  vehicleTypes: VehicleType[];
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: Trip[];
  tripStops: TripStop[];
  bookings: Booking[];
  payments: Payment[];
  tickets: Ticket[];

  // Passenger CRUD
  addPassenger: (passenger: Passenger) => boolean;
  updatePassenger: (passenger: Passenger) => boolean;
  deletePassenger: (passengerId: string) => void;

  // Route CRUD
  addRoute: (route: Route) => boolean;
  updateRoute: (route: Route) => boolean;
  deleteRoute: (routeId: string) => void;

  // Station CRUD
  addStation: (station: Station) => boolean;
  updateStation: (station: Station) => boolean;
  deleteStation: (stationId: string) => void;

  // RouteStation M:N
  addRouteStation: (routeStation: RouteStation) => void;
  updateRouteStation: (routeStation: RouteStation) => void;
  deleteRouteStation: (id: string) => void;
  reorderRouteStations: (routeId: string, orderedStationIds: string[]) => void;

  // Fleet CRUD
  addVehicleType: (type: VehicleType) => boolean;
  updateVehicleType: (type: VehicleType) => boolean;
  deleteVehicleType: (typeId: string) => void;

  addDriver: (driver: Driver) => boolean;
  updateDriver: (driver: Driver) => boolean;
  deleteDriver: (driverId: string) => void;

  addVehicle: (vehicle: Vehicle) => boolean;
  updateVehicle: (vehicle: Vehicle) => boolean;
  deleteVehicle: (vehicleId: string) => void;

  // Trip & Stops CRUD
  addTrip: (trip: Trip) => boolean;
  updateTrip: (trip: Trip) => boolean;
  deleteTrip: (tripId: string) => void;

  addTripStop: (stop: TripStop) => boolean;
  updateTripStop: (stop: TripStop) => boolean;
  deleteTripStop: (stopId: string) => void;

  // Booking, Payment & Ticket CRUD
  addBooking: (booking: Booking) => boolean;
  updateBooking: (booking: Booking) => boolean;
  deleteBooking: (bookingId: string) => void;

  addPayment: (payment: Payment) => boolean;
  updatePayment: (payment: Payment) => boolean;
  deletePayment: (paymentId: string) => void;

  addTicket: (ticket: Ticket) => boolean;
  updateTicket: (ticket: Ticket) => boolean;
  deleteTicket: (ticketId: string) => void;

  // System Utility
  resetToMockData: () => void;
  exportStateToJson: () => void;
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Global UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Entities initialized from localStorage or seed mockData
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    StorageService.get(STORAGE_KEYS.PASSENGERS, INITIAL_PASSENGERS)
  );
  const [routes, setRoutes] = useState<Route[]>(() =>
    StorageService.get(STORAGE_KEYS.ROUTES, INITIAL_ROUTES)
  );
  const [stations, setStations] = useState<Station[]>(() =>
    StorageService.get(STORAGE_KEYS.STATIONS, INITIAL_STATIONS)
  );
  const [routeStations, setRouteStations] = useState<RouteStation[]>(() =>
    StorageService.get(STORAGE_KEYS.ROUTE_STATIONS, INITIAL_ROUTE_STATIONS)
  );
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(() =>
    StorageService.get(STORAGE_KEYS.VEHICLE_TYPES, INITIAL_VEHICLE_TYPES)
  );
  const [drivers, setDrivers] = useState<Driver[]>(() =>
    StorageService.get(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS)
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    StorageService.get(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES)
  );
  const [trips, setTrips] = useState<Trip[]>(() =>
    StorageService.get(STORAGE_KEYS.TRIPS, INITIAL_TRIPS)
  );
  const [tripStops, setTripStops] = useState<TripStop[]>(() =>
    StorageService.get(STORAGE_KEYS.TRIP_STOPS, INITIAL_TRIP_STOPS)
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    StorageService.get(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS)
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    StorageService.get(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)
  );
  const [tickets, setTickets] = useState<Ticket[]>(() =>
    StorageService.get(STORAGE_KEYS.TICKETS, INITIAL_TICKETS)
  );

  // Sync to localStorage
  useEffect(() => StorageService.set(STORAGE_KEYS.PASSENGERS, passengers), [passengers]);
  useEffect(() => StorageService.set(STORAGE_KEYS.ROUTES, routes), [routes]);
  useEffect(() => StorageService.set(STORAGE_KEYS.STATIONS, stations), [stations]);
  useEffect(() => StorageService.set(STORAGE_KEYS.ROUTE_STATIONS, routeStations), [routeStations]);
  useEffect(() => StorageService.set(STORAGE_KEYS.VEHICLE_TYPES, vehicleTypes), [vehicleTypes]);
  useEffect(() => StorageService.set(STORAGE_KEYS.DRIVERS, drivers), [drivers]);
  useEffect(() => StorageService.set(STORAGE_KEYS.VEHICLES, vehicles), [vehicles]);
  useEffect(() => StorageService.set(STORAGE_KEYS.TRIPS, trips), [trips]);
  useEffect(() => StorageService.set(STORAGE_KEYS.TRIP_STOPS, tripStops), [tripStops]);
  useEffect(() => StorageService.set(STORAGE_KEYS.BOOKINGS, bookings), [bookings]);
  useEffect(() => StorageService.set(STORAGE_KEYS.PAYMENTS, payments), [payments]);
  useEffect(() => StorageService.set(STORAGE_KEYS.TICKETS, tickets), [tickets]);

  // Toast helper
  const addToast = (type: ToastNotification['type'], title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Passenger Handlers
  const addPassenger = (item: Passenger) => {
    if (passengers.some((p) => p.passengerId.toLowerCase() === item.passengerId.toLowerCase())) {
      addToast('error', 'Duplicate ID', `Passenger ID ${item.passengerId} already exists`);
      return false;
    }
    setPassengers((prev) => [item, ...prev]);
    addToast('success', 'Passenger Created', `${item.firstName} ${item.lastName} has been enrolled`);
    return true;
  };

  const updatePassenger = (item: Passenger) => {
    setPassengers((prev) => prev.map((p) => (p.passengerId === item.passengerId ? item : p)));
    addToast('info', 'Passenger Updated', `Record for ${item.firstName} ${item.lastName} updated`);
    return true;
  };

  const deletePassenger = (id: string) => {
    setPassengers((prev) => prev.filter((p) => p.passengerId !== id));
    addToast('warning', 'Passenger Deleted', `Passenger ${id} removed`);
  };

  // Route Handlers
  const addRoute = (item: Route) => {
    if (routes.some((r) => r.routeId.toLowerCase() === item.routeId.toLowerCase())) {
      addToast('error', 'Duplicate Route ID', `Route ID ${item.routeId} already exists`);
      return false;
    }
    setRoutes((prev) => [item, ...prev]);
    addToast('success', 'Route Added', `Route ${item.name} (${item.routeId}) created`);
    return true;
  };

  const updateRoute = (item: Route) => {
    setRoutes((prev) => prev.map((r) => (r.routeId === item.routeId ? item : r)));
    addToast('info', 'Route Updated', `Route ${item.name} updated`);
    return true;
  };

  const deleteRoute = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.routeId !== id));
    setRouteStations((prev) => prev.filter((rs) => rs.routeId !== id));
    addToast('warning', 'Route Deleted', `Route ${id} and associated station links removed`);
  };

  // Station Handlers
  const addStation = (item: Station) => {
    if (stations.some((s) => s.stationId.toLowerCase() === item.stationId.toLowerCase())) {
      addToast('error', 'Duplicate Station ID', `Station ID ${item.stationId} already exists`);
      return false;
    }
    setStations((prev) => [item, ...prev]);
    addToast('success', 'Station Added', `${item.name} added`);
    return true;
  };

  const updateStation = (item: Station) => {
    setStations((prev) => prev.map((s) => (s.stationId === item.stationId ? item : s)));
    addToast('info', 'Station Updated', `Station ${item.name} updated`);
    return true;
  };

  const deleteStation = (id: string) => {
    setStations((prev) => prev.filter((s) => s.stationId !== id));
    setRouteStations((prev) => prev.filter((rs) => rs.stationId !== id));
    addToast('warning', 'Station Deleted', `Station ${id} removed`);
  };

  // RouteStation M:N Handlers
  const addRouteStation = (item: RouteStation) => {
    setRouteStations((prev) => [...prev, item]);
    addToast('success', 'Stop Added', `Station added to route order`);
  };

  const updateRouteStation = (item: RouteStation) => {
    setRouteStations((prev) => prev.map((rs) => (rs.id === item.id ? item : rs)));
    addToast('info', 'Stop Updated', `Stop sequence updated`);
  };

  const deleteRouteStation = (id: string) => {
    setRouteStations((prev) => prev.filter((rs) => rs.id !== id));
    addToast('info', 'Stop Removed', `Station decoupled from route`);
  };

  const reorderRouteStations = (routeId: string, orderedStationIds: string[]) => {
    setRouteStations((prev) => {
      const otherRouteStations = prev.filter((rs) => rs.routeId !== routeId);
      const newEntries: RouteStation[] = orderedStationIds.map((stId, index) => {
        const existing = prev.find((rs) => rs.routeId === routeId && rs.stationId === stId);
        return {
          id: existing ? existing.id : `${routeId}-${stId}-${index + 1}`,
          routeId,
          stationId: stId,
          stopOrder: index + 1,
          distanceFromStartKm: existing?.distanceFromStartKm ?? index * 5,
        };
      });
      return [...otherRouteStations, ...newEntries];
    });
    addToast('success', 'Sequence Updated', `Station stop order updated for ${routeId}`);
  };

  // Fleet Handlers
  const addVehicleType = (item: VehicleType) => {
    if (vehicleTypes.some((vt) => vt.typeId.toLowerCase() === item.typeId.toLowerCase())) {
      addToast('error', 'Duplicate ID', `Type ID ${item.typeId} already exists`);
      return false;
    }
    setVehicleTypes((prev) => [item, ...prev]);
    addToast('success', 'Vehicle Type Added', `${item.name} registered`);
    return true;
  };

  const updateVehicleType = (item: VehicleType) => {
    setVehicleTypes((prev) => prev.map((vt) => (vt.typeId === item.typeId ? item : vt)));
    addToast('info', 'Vehicle Type Updated', `${item.name} updated`);
    return true;
  };

  const deleteVehicleType = (id: string) => {
    setVehicleTypes((prev) => prev.filter((vt) => vt.typeId !== id));
    addToast('warning', 'Type Removed', `Vehicle Type ${id} deleted`);
  };

  const addDriver = (item: Driver) => {
    if (drivers.some((d) => d.driverId.toLowerCase() === item.driverId.toLowerCase())) {
      addToast('error', 'Duplicate ID', `Driver ID ${item.driverId} already exists`);
      return false;
    }
    setDrivers((prev) => [item, ...prev]);
    addToast('success', 'Driver Added', `${item.name} enrolled`);
    return true;
  };

  const updateDriver = (item: Driver) => {
    setDrivers((prev) => prev.map((d) => (d.driverId === item.driverId ? item : d)));
    addToast('info', 'Driver Updated', `Driver ${item.name} updated`);
    return true;
  };

  const deleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.driverId !== id));
    // Clear vehicle assignment if assigned
    setVehicles((prev) =>
      prev.map((v) => (v.assignedDriverId === id ? { ...v, assignedDriverId: null } : v))
    );
    addToast('warning', 'Driver Removed', `Driver ${id} deleted and vehicle unassigned`);
  };

  const addVehicle = (item: Vehicle) => {
    if (vehicles.some((v) => v.vehicleId.toLowerCase() === item.vehicleId.toLowerCase())) {
      addToast('error', 'Duplicate ID', `Vehicle ID ${item.vehicleId} already exists`);
      return false;
    }
    // Check 1:1 driver assignment constraint
    if (item.assignedDriverId) {
      const alreadyAssigned = vehicles.find(
        (v) => v.assignedDriverId === item.assignedDriverId && v.vehicleId !== item.vehicleId
      );
      if (alreadyAssigned) {
        addToast(
          'warning',
          'Driver Reassigned',
          `Driver ${item.assignedDriverId} was previously assigned to ${alreadyAssigned.vehicleId}`
        );
      }
    }
    setVehicles((prev) => [item, ...prev]);
    addToast('success', 'Vehicle Added', `Vehicle ${item.registrationNo} registered`);
    return true;
  };

  const updateVehicle = (item: Vehicle) => {
    if (item.assignedDriverId) {
      const conflict = vehicles.find(
        (v) => v.assignedDriverId === item.assignedDriverId && v.vehicleId !== item.vehicleId
      );
      if (conflict) {
        // Unassign from the other vehicle to enforce 1:1 constraint
        setVehicles((prev) =>
          prev.map((v) =>
            v.vehicleId === conflict.vehicleId ? { ...v, assignedDriverId: null } : v
          )
        );
      }
    }
    setVehicles((prev) => prev.map((v) => (v.vehicleId === item.vehicleId ? item : v)));
    addToast('info', 'Vehicle Updated', `Vehicle ${item.registrationNo} updated`);
    return true;
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.vehicleId !== id));
    addToast('warning', 'Vehicle Removed', `Vehicle ${id} deleted`);
  };

  // Trip Handlers
  const addTrip = (item: Trip) => {
    if (trips.some((t) => t.tripId.toLowerCase() === item.tripId.toLowerCase())) {
      addToast('error', 'Duplicate Trip ID', `Trip ID ${item.tripId} already exists`);
      return false;
    }
    setTrips((prev) => [item, ...prev]);
    addToast('success', 'Trip Scheduled', `Trip ${item.tripId} created`);
    return true;
  };

  const updateTrip = (item: Trip) => {
    setTrips((prev) => prev.map((t) => (t.tripId === item.tripId ? item : t)));
    addToast('info', 'Trip Updated', `Trip ${item.tripId} modified`);
    return true;
  };

  const deleteTrip = (id: string) => {
    setTrips((prev) => prev.filter((t) => t.tripId !== id));
    setTripStops((prev) => prev.filter((ts) => ts.tripId !== id));
    addToast('warning', 'Trip Deleted', `Trip ${id} and stop timeline removed`);
  };

  const addTripStop = (item: TripStop) => {
    setTripStops((prev) => [...prev, item]);
    addToast('success', 'Stop Added', `Station stop attached to trip`);
    return true;
  };

  const updateTripStop = (item: TripStop) => {
    setTripStops((prev) => prev.map((ts) => (ts.id === item.id ? item : ts)));
    addToast('info', 'Stop Updated', `Arrival/Departure time updated`);
    return true;
  };

  const deleteTripStop = (id: string) => {
    setTripStops((prev) => prev.filter((ts) => ts.id !== id));
    addToast('info', 'Stop Removed', `Stop removed from trip schedule`);
  };

  // Booking, Payment & Ticket Handlers
  const addBooking = (item: Booking) => {
    // Collision check: same seat on same trip
    const conflict = bookings.find(
      (b) =>
        b.tripId === item.tripId &&
        b.seatNumber.toLowerCase() === item.seatNumber.toLowerCase() &&
        b.status === 'Confirmed'
    );
    if (conflict) {
      addToast(
        'error',
        'Seat Collision',
        `Seat ${item.seatNumber} is already occupied on Trip ${item.tripId}`
      );
      return false;
    }
    setBookings((prev) => [item, ...prev]);
    addToast('success', 'Booking Confirmed', `Seat ${item.seatNumber} booked for passenger`);
    return true;
  };

  const updateBooking = (item: Booking) => {
    setBookings((prev) => prev.map((b) => (b.bookingId === item.bookingId ? item : b)));
    addToast('info', 'Booking Updated', `Booking ${item.bookingId} updated`);
    return true;
  };

  const deleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.bookingId !== id));
    addToast('warning', 'Booking Cancelled', `Booking ${id} deleted`);
  };

  const addPayment = (item: Payment) => {
    if (payments.some((p) => p.paymentId.toLowerCase() === item.paymentId.toLowerCase())) {
      addToast('error', 'Duplicate ID', `Payment ID ${item.paymentId} already exists`);
      return false;
    }
    setPayments((prev) => [item, ...prev]);
    addToast('success', 'Payment Recorded', `Amount $${item.amount.toFixed(2)} via ${item.mode}`);
    return true;
  };

  const updatePayment = (item: Payment) => {
    setPayments((prev) => prev.map((p) => (p.paymentId === item.paymentId ? item : p)));
    addToast('info', 'Payment Updated', `Payment ${item.paymentId} updated`);
    return true;
  };

  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.paymentId !== id));
    addToast('warning', 'Payment Deleted', `Payment record ${id} removed`);
  };

  const addTicket = (item: Ticket) => {
    if (tickets.some((tk) => tk.ticketId.toLowerCase() === item.ticketId.toLowerCase())) {
      addToast('error', 'Duplicate ID', `Ticket ID ${item.ticketId} already exists`);
      return false;
    }
    setTickets((prev) => [item, ...prev]);
    addToast('success', 'Ticket Issued', `Ticket ${item.ticketId} generated`);
    return true;
  };

  const updateTicket = (item: Ticket) => {
    setTickets((prev) => prev.map((tk) => (tk.ticketId === item.ticketId ? item : tk)));
    addToast('info', 'Ticket Updated', `Ticket ${item.ticketId} updated`);
    return true;
  };

  const deleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((tk) => tk.ticketId !== id));
    addToast('warning', 'Ticket Voided', `Ticket ${id} removed`);
  };

  // Utility actions
  const resetToMockData = () => {
    StorageService.clearAll();
    setPassengers(INITIAL_PASSENGERS);
    setRoutes(INITIAL_ROUTES);
    setStations(INITIAL_STATIONS);
    setRouteStations(INITIAL_ROUTE_STATIONS);
    setVehicleTypes(INITIAL_VEHICLE_TYPES);
    setDrivers(INITIAL_DRIVERS);
    setVehicles(INITIAL_VEHICLES);
    setTrips(INITIAL_TRIPS);
    setTripStops(INITIAL_TRIP_STOPS);
    setBookings(INITIAL_BOOKINGS);
    setPayments(INITIAL_PAYMENTS);
    setTickets(INITIAL_TICKETS);
    addToast('info', 'State Reset', 'System reverted to initial seed mock data');
  };

  const exportStateToJson = () => {
    const backup = {
      passengers,
      routes,
      stations,
      routeStations,
      vehicleTypes,
      drivers,
      vehicles,
      trips,
      tripStops,
      bookings,
      payments,
      tickets,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transitflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export Complete', 'All relational tables exported to JSON');
  };

  return (
    <TransitContext.Provider
      value={{
        activeTab,
        setActiveTab,
        globalSearch,
        setGlobalSearch,
        toasts,
        addToast,
        removeToast,
        passengers,
        routes,
        stations,
        routeStations,
        vehicleTypes,
        drivers,
        vehicles,
        trips,
        tripStops,
        bookings,
        payments,
        tickets,
        addPassenger,
        updatePassenger,
        deletePassenger,
        addRoute,
        updateRoute,
        deleteRoute,
        addStation,
        updateStation,
        deleteStation,
        addRouteStation,
        updateRouteStation,
        deleteRouteStation,
        reorderRouteStations,
        addVehicleType,
        updateVehicleType,
        deleteVehicleType,
        addDriver,
        updateDriver,
        deleteDriver,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addTrip,
        updateTrip,
        deleteTrip,
        addTripStop,
        updateTripStop,
        deleteTripStop,
        addBooking,
        updateBooking,
        deleteBooking,
        addPayment,
        updatePayment,
        deletePayment,
        addTicket,
        updateTicket,
        deleteTicket,
        resetToMockData,
        exportStateToJson,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
};
