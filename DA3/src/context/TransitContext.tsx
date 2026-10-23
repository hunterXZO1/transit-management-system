import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ActiveTab,
  Booking,
  Driver,
  Passenger,
  Payment,
  Route,
  RouteStation,
  Station,
  Ticket,
  ToastNotification,
  Trip,
  TripStop,
  Vehicle,
  VehicleType,
} from '../types/transit';
import { ApiError, crud } from '../services/api';

interface TransitContextType {
  // Navigation & Global UI
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
  toasts: ToastNotification[];
  addToast: (type: ToastNotification['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Live API state
  loading: boolean;
  busy: boolean;
  apiError: string | null;
  reload: () => Promise<void>;

  // Entities (read from MySQL through the Express API)
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
  addPassenger: (passenger: Passenger) => Promise<boolean>;
  updatePassenger: (passenger: Passenger) => Promise<boolean>;
  deletePassenger: (passengerId: string) => Promise<boolean>;

  // Route CRUD
  addRoute: (route: Route) => Promise<boolean>;
  updateRoute: (route: Route) => Promise<boolean>;
  deleteRoute: (routeId: string) => Promise<boolean>;

  // Station CRUD
  addStation: (station: Station) => Promise<boolean>;
  updateStation: (station: Station) => Promise<boolean>;
  deleteStation: (stationId: string) => Promise<boolean>;

  // RouteStation M:N
  addRouteStation: (routeStation: RouteStation) => Promise<boolean>;
  updateRouteStation: (routeStation: RouteStation) => Promise<boolean>;
  deleteRouteStation: (id: string) => Promise<boolean>;
  reorderRouteStations: (routeId: string, orderedStationIds: string[]) => Promise<boolean>;

  // Fleet CRUD
  addVehicleType: (type: VehicleType) => Promise<boolean>;
  updateVehicleType: (type: VehicleType) => Promise<boolean>;
  deleteVehicleType: (typeId: string) => Promise<boolean>;

  addDriver: (driver: Driver) => Promise<boolean>;
  updateDriver: (driver: Driver) => Promise<boolean>;
  deleteDriver: (driverId: string) => Promise<boolean>;

  addVehicle: (vehicle: Vehicle) => Promise<boolean>;
  updateVehicle: (vehicle: Vehicle) => Promise<boolean>;
  deleteVehicle: (vehicleId: string) => Promise<boolean>;

  // Trip & Stops CRUD
  addTrip: (trip: Trip, stops?: Omit<TripStop, 'tripId' | 'id'>[]) => Promise<boolean>;
  updateTrip: (trip: Trip) => Promise<boolean>;
  deleteTrip: (tripId: string) => Promise<boolean>;

  addTripStop: (stop: TripStop) => Promise<boolean>;
  updateTripStop: (stop: TripStop) => Promise<boolean>;
  deleteTripStop: (stopId: string) => Promise<boolean>;

  // Booking, Payment & Ticket CRUD
  addBooking: (booking: Booking) => Promise<boolean>;
  updateBooking: (booking: Booking) => Promise<boolean>;
  deleteBooking: (bookingId: string) => Promise<boolean>;
  checkoutBooking: (
    booking: Booking,
    ticketDetails: { ticketType: Ticket['ticketType']; travelClass: Ticket['travelClass']; amount: number; paymentMode: Payment['mode'] }
  ) => Promise<boolean>;

  addPayment: (payment: Payment) => Promise<boolean>;
  updatePayment: (payment: Payment) => Promise<boolean>;
  deletePayment: (paymentId: string) => Promise<boolean>;

  addTicket: (ticket: Ticket) => Promise<boolean>;
  updateTicket: (ticket: Ticket) => Promise<boolean>;
  deleteTicket: (ticketId: string) => Promise<boolean>;

  // System Utility
  exportStateToJson: () => void;
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

const errorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Unexpected error while contacting the server.';

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [routeStations, setRouteStations] = useState<RouteStation[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const addToast = useCallback((type: ToastNotification['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    const tables: { name: string; load: () => Promise<unknown>; apply: (rows: never[]) => void }[] = [
      { name: 'Passengers', load: crud.passengers.list, apply: setPassengers },
      { name: 'Routes', load: crud.routes.list, apply: setRoutes },
      { name: 'Stations', load: crud.stations.list, apply: setStations },
      { name: 'Route stops', load: crud.routeStations.list, apply: setRouteStations },
      { name: 'Vehicle types', load: crud.vehicleTypes.list, apply: setVehicleTypes },
      { name: 'Drivers', load: crud.drivers.list, apply: setDrivers },
      { name: 'Vehicles', load: crud.vehicles.list, apply: setVehicles },
      { name: 'Trips', load: crud.trips.list, apply: setTrips },
      { name: 'Trip stops', load: crud.tripStops.list, apply: setTripStops },
      { name: 'Bookings', load: crud.bookings.list, apply: setBookings },
      { name: 'Payments', load: crud.payments.list, apply: setPayments },
      { name: 'Tickets', load: crud.tickets.list, apply: setTickets },
    ];

    const results = await Promise.allSettled(tables.map((t) => t.load()));
    const failures: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        tables[index].apply(result.value as never[]);
      } else {
        failures.push(`${tables[index].name}: ${errorMessage(result.reason)}`);
      }
    });

    if (failures.length) {
      setApiError(failures[0]);
      addToast('error', 'Could not load from MySQL', failures[0]);
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Wraps a write so every call gets a spinner, a toast, and a boolean result.
  const mutate = useCallback(
    async (
      op: () => Promise<unknown>,
      success: () => void,
      toast: { type: ToastNotification['type']; title: string; message: string }
    ): Promise<boolean> => {
      setBusy(true);
      try {
        await op();
        success();
        addToast(toast.type, toast.title, toast.message);
        return true;
      } catch (err) {
        addToast('error', 'Operation failed', errorMessage(err));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [addToast]
  );

  // ---- Passenger ----
  const addPassenger = (item: Passenger) =>
    mutate(
      () => crud.passengers.create(item),
      () => setPassengers((prev) => [item, ...prev]),
      { type: 'success', title: 'Passenger Created', message: `${item.firstName} ${item.lastName} saved to MySQL` }
    );

  const updatePassenger = (item: Passenger) =>
    mutate(
      () => crud.passengers.update(item.passengerId, item),
      () => setPassengers((prev) => prev.map((p) => (p.passengerId === item.passengerId ? item : p))),
      { type: 'info', title: 'Passenger Updated', message: `Record for ${item.firstName} ${item.lastName} saved` }
    );

  const deletePassenger = (id: string) =>
    mutate(
      () => crud.passengers.remove(id),
      () => {
        setPassengers((prev) => prev.filter((p) => p.passengerId !== id));
        setBookings((prev) => prev.filter((b) => b.passengerId !== id));
      },
      { type: 'warning', title: 'Passenger Deleted', message: `Passenger ${id} removed` }
    );

  // ---- Route ----
  const addRoute = (item: Route) =>
    mutate(
      () => crud.routes.create(item),
      () => setRoutes((prev) => [item, ...prev]),
      { type: 'success', title: 'Route Added', message: `Route ${item.name} (${item.routeId}) created` }
    );

  const updateRoute = (item: Route) =>
    mutate(
      () => crud.routes.update(item.routeId, item),
      () => setRoutes((prev) => prev.map((r) => (r.routeId === item.routeId ? item : r))),
      { type: 'info', title: 'Route Updated', message: `Route ${item.name} saved` }
    );

  const deleteRoute = (id: string) =>
    mutate(
      () => crud.routes.remove(id),
      () => {
        setRoutes((prev) => prev.filter((r) => r.routeId !== id));
        setRouteStations((prev) => prev.filter((rs) => rs.routeId !== id));
        setTrips((prev) => prev.filter((t) => t.routeId !== id));
      },
      { type: 'warning', title: 'Route Deleted', message: `Route ${id} removed` }
    );

  // ---- Station ----
  const addStation = (item: Station) =>
    mutate(
      () => crud.stations.create(item),
      () => setStations((prev) => [item, ...prev]),
      { type: 'success', title: 'Station Added', message: `${item.name} saved to MySQL` }
    );

  const updateStation = (item: Station) =>
    mutate(
      () => crud.stations.update(item.stationId, item),
      () => setStations((prev) => prev.map((s) => (s.stationId === item.stationId ? item : s))),
      { type: 'info', title: 'Station Updated', message: `Station ${item.name} saved` }
    );

  const deleteStation = (id: string) =>
    mutate(
      () => crud.stations.remove(id),
      () => {
        setStations((prev) => prev.filter((s) => s.stationId !== id));
        setRouteStations((prev) => prev.filter((rs) => rs.stationId !== id));
        setTripStops((prev) => prev.filter((ts) => ts.stationId !== id));
      },
      { type: 'warning', title: 'Station Deleted', message: `Station ${id} removed` }
    );

  // ---- Route <-> Station mapping ----
  const addRouteStation = (item: RouteStation) =>
    mutate(
      () => crud.routeStations.create(item),
      () => setRouteStations((prev) => [...prev, item]),
      { type: 'success', title: 'Stop Added', message: `Station added to route order` }
    );

  const updateRouteStation = (item: RouteStation) =>
    mutate(
      () => crud.routeStations.update(item.id, item),
      () => setRouteStations((prev) => prev.map((rs) => (rs.id === item.id ? item : rs))),
      { type: 'info', title: 'Stop Updated', message: `Stop sequence saved` }
    );

  const deleteRouteStation = (id: string) =>
    mutate(
      () => crud.routeStations.remove(id),
      () => setRouteStations((prev) => prev.filter((rs) => rs.id !== id)),
      { type: 'info', title: 'Stop Removed', message: `Station decoupled from route` }
    );

  const reorderRouteStations = async (routeId: string, orderedStationIds: string[]) => {
    setBusy(true);
    try {
      const result = await crud.routes.reorder(routeId, orderedStationIds);
      setRouteStations((prev) => [...prev.filter((rs) => rs.routeId !== routeId), ...result.stops]);
      addToast('success', 'Sequence Updated', `Stop order saved for ${routeId}`);
      return true;
    } catch (err) {
      addToast('error', 'Operation failed', errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ---- Fleet ----
  const addVehicleType = (item: VehicleType) =>
    mutate(
      () => crud.vehicleTypes.create(item),
      () => setVehicleTypes((prev) => [item, ...prev]),
      { type: 'success', title: 'Vehicle Type Added', message: `${item.name} registered` }
    );

  const updateVehicleType = (item: VehicleType) =>
    mutate(
      () => crud.vehicleTypes.update(item.typeId, item),
      () => setVehicleTypes((prev) => prev.map((vt) => (vt.typeId === item.typeId ? item : vt))),
      { type: 'info', title: 'Vehicle Type Updated', message: `${item.name} saved` }
    );

  const deleteVehicleType = (id: string) =>
    mutate(
      () => crud.vehicleTypes.remove(id),
      () => setVehicleTypes((prev) => prev.filter((vt) => vt.typeId !== id)),
      { type: 'warning', title: 'Type Removed', message: `Vehicle Type ${id} deleted` }
    );

  const addDriver = (item: Driver) =>
    mutate(
      () => crud.drivers.create(item),
      () => setDrivers((prev) => [item, ...prev]),
      { type: 'success', title: 'Driver Added', message: `${item.name} enrolled` }
    );

  const updateDriver = (item: Driver) =>
    mutate(
      () => crud.drivers.update(item.driverId, item),
      () => setDrivers((prev) => prev.map((d) => (d.driverId === item.driverId ? item : d))),
      { type: 'info', title: 'Driver Updated', message: `Driver ${item.name} saved` }
    );

  const deleteDriver = (id: string) =>
    mutate(
      () => crud.drivers.remove(id),
      () => {
        setDrivers((prev) => prev.filter((d) => d.driverId !== id));
        setVehicles((prev) => prev.map((v) => (v.assignedDriverId === id ? { ...v, assignedDriverId: null } : v)));
      },
      { type: 'warning', title: 'Driver Removed', message: `Driver ${id} deleted` }
    );

  const addVehicle = (item: Vehicle) =>
    mutate(
      () => crud.vehicles.create(item),
      () => setVehicles((prev) => [item, ...prev]),
      { type: 'success', title: 'Vehicle Added', message: `Vehicle ${item.registrationNo} registered` }
    );

  const updateVehicle = (item: Vehicle) =>
    mutate(
      () => crud.vehicles.update(item.vehicleId, item),
      () => {
        setVehicles((prev) =>
          prev.map((v) => {
            if (v.vehicleId === item.vehicleId) return item;
            if (item.assignedDriverId && v.assignedDriverId === item.assignedDriverId) {
              return { ...v, assignedDriverId: null };
            }
            return v;
          })
        );
      },
      { type: 'info', title: 'Vehicle Updated', message: `Vehicle ${item.registrationNo} saved` }
    );

  const deleteVehicle = (id: string) =>
    mutate(
      () => crud.vehicles.remove(id),
      () => setVehicles((prev) => prev.filter((v) => v.vehicleId !== id)),
      { type: 'warning', title: 'Vehicle Removed', message: `Vehicle ${id} deleted` }
    );

  // ---- Trips ----
  const addTrip = (trip: Trip, stops: Omit<TripStop, 'tripId' | 'id'>[] = []) =>
    mutate(
      () => crud.trips.create(trip, stops),
      () => {
        setTrips((prev) => [trip, ...prev]);
        if (stops.length) {
          setTripStops((prev) => [
            ...prev,
            ...stops.map((s) => ({ ...s, id: `${trip.tripId}-${s.stationId}-${s.stopOrder}`, tripId: trip.tripId })),
          ]);
        }
      },
      {
        type: 'success',
        title: 'Trip Scheduled',
        message: stops.length ? `Trip ${trip.tripId} created with ${stops.length} stops` : `Trip ${trip.tripId} created`,
      }
    );

  const updateTrip = (item: Trip) =>
    mutate(
      () => crud.trips.update(item.tripId, item),
      () => setTrips((prev) => prev.map((t) => (t.tripId === item.tripId ? item : t))),
      { type: 'info', title: 'Trip Updated', message: `Trip ${item.tripId} saved` }
    );

  const deleteTrip = (id: string) =>
    mutate(
      () => crud.trips.remove(id),
      () => {
        setTrips((prev) => prev.filter((t) => t.tripId !== id));
        setTripStops((prev) => prev.filter((ts) => ts.tripId !== id));
        setBookings((prev) => prev.filter((b) => b.tripId !== id));
      },
      { type: 'warning', title: 'Trip Deleted', message: `Trip ${id} removed` }
    );

  const addTripStop = (item: TripStop) =>
    mutate(
      () => crud.tripStops.create(item),
      () => setTripStops((prev) => [...prev, item]),
      { type: 'success', title: 'Stop Added', message: `Station stop attached to trip` }
    );

  const updateTripStop = (item: TripStop) =>
    mutate(
      () => crud.tripStops.update(item.id, item),
      () => setTripStops((prev) => prev.map((ts) => (ts.id === item.id ? item : ts))),
      { type: 'info', title: 'Stop Updated', message: `Arrival/departure times saved` }
    );

  const deleteTripStop = (id: string) =>
    mutate(
      () => crud.tripStops.remove(id),
      () => setTripStops((prev) => prev.filter((ts) => ts.id !== id)),
      { type: 'info', title: 'Stop Removed', message: `Stop removed from trip schedule` }
    );

  // ---- Bookings, payments, tickets ----
  const addBooking = (item: Booking) =>
    mutate(
      () => crud.bookings.create(item),
      () => setBookings((prev) => [item, ...prev]),
      { type: 'success', title: 'Booking Confirmed', message: `Seat ${item.seatNumber} booked` }
    );

  const updateBooking = (item: Booking) =>
    mutate(
      () => crud.bookings.update(item.bookingId, item),
      () => setBookings((prev) => prev.map((b) => (b.bookingId === item.bookingId ? item : b))),
      { type: 'info', title: 'Booking Updated', message: `Booking ${item.bookingId} saved` }
    );

  const deleteBooking = (id: string) =>
    mutate(
      () => crud.bookings.remove(id),
      () => {
        setBookings((prev) => prev.filter((b) => b.bookingId !== id));
        setTickets((prev) => prev.filter((t) => t.bookingId !== id));
      },
      { type: 'warning', title: 'Booking Cancelled', message: `Booking ${id} deleted` }
    );

  const checkoutBooking: TransitContextType['checkoutBooking'] = async (booking, details) => {
    const stamp = Date.now().toString().slice(-6);
    const payment: Payment = {
      paymentId: `PAY${stamp}`.slice(0, 20),
      mode: details.paymentMode,
      amount: details.amount,
      date: new Date().toISOString().slice(0, 10),
      txnReferenceNo: `TXN-${stamp.toUpperCase()}`,
    };
    const ticket = {
      ticketId: `TK${stamp}`.slice(0, 20),
      issueDate: payment.date,
      ticketType: details.ticketType,
      travelClass: details.travelClass,
    };

    setBusy(true);
    try {
      const result = await crud.bookings.checkout({ booking, payment, ticket });
      setBookings((prev) => [result.booking, ...prev]);
      if (result.payment) setPayments((prev) => [result.payment as Payment, ...prev]);
      if (result.ticket) setTickets((prev) => [result.ticket as Ticket, ...prev]);
      addToast('success', 'Ticket Issued', `Seat ${booking.seatNumber} booked and ticket generated in one transaction`);
      return true;
    } catch (err) {
      addToast('error', 'Booking failed', errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addPayment = (item: Payment) =>
    mutate(
      () => crud.payments.create(item),
      () => setPayments((prev) => [item, ...prev]),
      { type: 'success', title: 'Payment Recorded', message: `Amount ₹${item.amount.toFixed(2)} via ${item.mode}` }
    );

  const updatePayment = (item: Payment) =>
    mutate(
      () => crud.payments.update(item.paymentId, item),
      () => setPayments((prev) => prev.map((p) => (p.paymentId === item.paymentId ? item : p))),
      { type: 'info', title: 'Payment Updated', message: `Payment ${item.paymentId} saved` }
    );

  const deletePayment = (id: string) =>
    mutate(
      () => crud.payments.remove(id),
      () => setPayments((prev) => prev.filter((p) => p.paymentId !== id)),
      { type: 'warning', title: 'Payment Deleted', message: `Payment record ${id} removed` }
    );

  const addTicket = (item: Ticket) =>
    mutate(
      () => crud.tickets.create(item),
      () => setTickets((prev) => [item, ...prev]),
      { type: 'success', title: 'Ticket Issued', message: `Ticket ${item.ticketId} generated` }
    );

  const updateTicket = (item: Ticket) =>
    mutate(
      () => crud.tickets.update(item.ticketId, item),
      () => setTickets((prev) => prev.map((t) => (t.ticketId === item.ticketId ? item : t))),
      { type: 'info', title: 'Ticket Updated', message: `Ticket ${item.ticketId} saved` }
    );

  const deleteTicket = (id: string) =>
    mutate(
      () => crud.tickets.remove(id),
      () => setTickets((prev) => prev.filter((t) => t.ticketId !== id)),
      { type: 'warning', title: 'Ticket Voided', message: `Ticket ${id} removed` }
    );

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
    link.download = `transitflow_mysql_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export Complete', 'MySQL tables exported to JSON');
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
        loading,
        busy,
        apiError,
        reload: loadAll,
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
        checkoutBooking,
        addPayment,
        updatePayment,
        deletePayment,
        addTicket,
        updateTicket,
        deleteTicket,
        exportStateToJson,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const context = useContext(TransitContext);
  if (!context) throw new Error('useTransit must be used within a TransitProvider');
  return context;
};
