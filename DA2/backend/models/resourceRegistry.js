// Declarative description of every relational resource the website manages.
// Table/column names here are developer-controlled constants; all runtime values are
// bound through parameterized queries.

const GENDERS = ['F', 'M', 'Other'];
const ROUTE_TYPES = ['Bus', 'Metro'];
const FUEL_TYPES = ['Diesel', 'Electric', 'CNG'];
const PAYMENT_MODES = ['UPI', 'Card', 'Cash'];
const TICKET_TYPES = ['Regular', 'Season', 'Concession'];
const TRAVEL_CLASSES = ['General', 'AC'];
const TRIP_STOP_STATUSES = ['Scheduled', 'On Time', 'Delayed', 'Departed'];
const BOOKING_STATUSES = ['Confirmed', 'Cancelled'];

const id = (field, label) => ({ field, type: 'id', required: true, label });

export const RESOURCES = {
  passengers: {
    key: 'passengers',
    label: 'Passenger',
    table: 'passengers',
    pk: { field: 'passengerId', column: 'passenger_id' },
    orderBy: 'created_at DESC, passenger_id ASC',
    fields: [
      { field: 'firstName', column: 'first_name', type: 'text', required: true, maxLength: 50, label: 'First name' },
      { field: 'lastName', column: 'last_name', type: 'text', required: true, maxLength: 50, label: 'Last name' },
      { field: 'email', column: 'email', type: 'email', required: true, maxLength: 100, label: 'Email' },
      { field: 'gender', column: 'gender', type: 'enum', values: GENDERS, required: true, label: 'Gender' },
      { field: 'dob', column: 'dob', type: 'date', required: true, label: 'Date of birth' },
      { field: 'doorNo', column: 'door_no', type: 'text', maxLength: 20, label: 'Door number' },
      { field: 'street', column: 'street', type: 'text', maxLength: 100, label: 'Street' },
      { field: 'city', column: 'city', type: 'text', required: true, maxLength: 50, label: 'City' },
      { field: 'state', column: 'state', type: 'text', required: true, maxLength: 50, label: 'State' },
      { field: 'pin', column: 'pin', type: 'text', required: true, maxLength: 10, label: 'PIN code' },
    ],
    children: [
      {
        field: 'phoneNumbers',
        table: 'passenger_contacts',
        fkColumn: 'passenger_id',
        valueColumn: 'phone_number',
        item: { type: 'phone', label: 'Phone number' },
      },
    ],
    referencedBy: [
      { table: 'bookings', column: 'passenger_id', label: 'booking' },
      { table: 'tickets', column: 'passenger_id', label: 'ticket' },
    ],
  },

  routes: {
    key: 'routes',
    label: 'Route',
    table: 'routes',
    pk: { field: 'routeId', column: 'route_id' },
    orderBy: 'route_id ASC',
    fields: [
      { field: 'name', column: 'name', type: 'text', required: true, maxLength: 100, label: 'Route name' },
      { field: 'type', column: 'type', type: 'enum', values: ROUTE_TYPES, required: true, label: 'Route type' },
      { field: 'totalDistanceKm', column: 'total_distance_km', type: 'decimal', required: true, min: 0, label: 'Total distance (km)' },
    ],
    referencedBy: [
      { table: 'route_stations', column: 'route_id', label: 'route stop' },
      { table: 'trips', column: 'route_id', label: 'trip' },
    ],
  },

  stations: {
    key: 'stations',
    label: 'Station',
    table: 'stations',
    pk: { field: 'stationId', column: 'station_id' },
    orderBy: 'station_id ASC',
    fields: [
      { field: 'name', column: 'name', type: 'text', required: true, maxLength: 100, label: 'Station name' },
      { field: 'city', column: 'city', type: 'text', required: true, maxLength: 50, label: 'City' },
      { field: 'area', column: 'area', type: 'text', required: true, maxLength: 50, label: 'Area' },
      { field: 'landmark', column: 'landmark', type: 'text', maxLength: 100, label: 'Landmark' },
    ],
    referencedBy: [
      { table: 'route_stations', column: 'station_id', label: 'route stop' },
      { table: 'trip_stops', column: 'station_id', label: 'trip stop' },
    ],
  },

  routeStations: {
    key: 'routeStations',
    label: 'Route stop',
    table: 'route_stations',
    pk: { field: 'id', column: 'id' },
    orderBy: 'route_id ASC, stop_order ASC',
    filterColumns: { routeId: 'route_id' },
    idFrom: (entity) => `${entity.routeId}-${entity.stationId}`,
    fields: [
      id('routeId', 'Route'),
      id('stationId', 'Station'),
      { field: 'stopOrder', column: 'stop_order', type: 'int', required: true, min: 1, label: 'Stop order' },
      { field: 'distanceFromStartKm', column: 'distance_from_start_km', type: 'decimal', min: 0, label: 'Distance from start (km)' },
    ],
    refs: [
      { field: 'routeId', table: 'routes', column: 'route_id', label: 'Route' },
      { field: 'stationId', table: 'stations', column: 'station_id', label: 'Station' },
    ],
  },

  vehicleTypes: {
    key: 'vehicleTypes',
    label: 'Vehicle type',
    table: 'vehicle_types',
    pk: { field: 'typeId', column: 'type_id' },
    orderBy: 'type_id ASC',
    fields: [
      { field: 'name', column: 'name', type: 'text', required: true, maxLength: 50, label: 'Type name' },
      { field: 'capacity', column: 'capacity', type: 'int', required: true, min: 1, max: 2000, label: 'Capacity' },
      { field: 'fuelType', column: 'fuel_type', type: 'enum', values: FUEL_TYPES, required: true, label: 'Fuel type' },
    ],
    referencedBy: [{ table: 'vehicles', column: 'vehicle_type_id', label: 'vehicle' }],
  },

  drivers: {
    key: 'drivers',
    label: 'Driver',
    table: 'drivers',
    pk: { field: 'driverId', column: 'driver_id' },
    orderBy: 'driver_id ASC',
    fields: [
      { field: 'name', column: 'name', type: 'text', required: true, maxLength: 100, label: 'Driver name' },
      { field: 'licenseNo', column: 'license_no', type: 'text', required: true, maxLength: 50, label: 'Licence number' },
      { field: 'dob', column: 'dob', type: 'date', required: true, label: 'Date of birth' },
    ],
    children: [
      {
        field: 'contactNumbers',
        table: 'driver_contacts',
        fkColumn: 'driver_id',
        valueColumn: 'phone_number',
        item: { type: 'phone', label: 'Contact number' },
      },
    ],
    referencedBy: [{ table: 'vehicles', column: 'assigned_driver_id', label: 'vehicle assignment' }],
  },

  vehicles: {
    key: 'vehicles',
    label: 'Vehicle',
    table: 'vehicles',
    pk: { field: 'vehicleId', column: 'vehicle_id' },
    orderBy: 'vehicle_id ASC',
    fields: [
      { field: 'registrationNo', column: 'registration_no', type: 'text', required: true, maxLength: 30, label: 'Registration number' },
      { field: 'manufactureDate', column: 'manufacture_date', type: 'date', required: true, label: 'Manufacture date' },
      { field: 'color', column: 'color', type: 'text', required: true, maxLength: 30, label: 'Colour' },
      id('vehicleTypeId', 'Vehicle type'),
      { field: 'assignedDriverId', column: 'assigned_driver_id', type: 'id', nullable: true, label: 'Assigned driver' },
    ],
    refs: [
      { field: 'vehicleTypeId', table: 'vehicle_types', column: 'type_id', label: 'Vehicle type' },
      { field: 'assignedDriverId', table: 'drivers', column: 'driver_id', label: 'Driver', nullable: true },
    ],
    oneToOne: { column: 'assigned_driver_id', label: 'driver' },
  },

  trips: {
    key: 'trips',
    label: 'Trip',
    table: 'trips',
    pk: { field: 'tripId', column: 'trip_id' },
    orderBy: 'date DESC, start_time ASC',
    fields: [
      { field: 'date', column: 'date', type: 'date', required: true, label: 'Trip date' },
      { field: 'startTime', column: 'start_time', type: 'time', required: true, label: 'Start time' },
      { field: 'endTime', column: 'end_time', type: 'time', required: true, label: 'End time' },
      id('routeId', 'Route'),
    ],
    refs: [{ field: 'routeId', table: 'routes', column: 'route_id', label: 'Route' }],
    referencedBy: [
      { table: 'trip_stops', column: 'trip_id', label: 'trip stop' },
      { table: 'bookings', column: 'trip_id', label: 'booking' },
      { table: 'tickets', column: 'trip_id', label: 'ticket' },
    ],
  },

  tripStops: {
    key: 'tripStops',
    label: 'Trip stop',
    table: 'trip_stops',
    pk: { field: 'id', column: 'id' },
    orderBy: 'trip_id ASC, stop_order ASC',
    filterColumns: { tripId: 'trip_id' },
    idFrom: (entity) => `${entity.tripId}-${entity.stationId}-${entity.stopOrder}`,
    fields: [
      id('tripId', 'Trip'),
      id('stationId', 'Station'),
      { field: 'stopOrder', column: 'stop_order', type: 'int', required: true, min: 1, label: 'Stop order' },
      { field: 'arrivalTime', column: 'arrival_time', type: 'time', required: true, label: 'Arrival time' },
      { field: 'departureTime', column: 'departure_time', type: 'time', required: true, label: 'Departure time' },
      { field: 'status', column: 'status', type: 'enum', values: TRIP_STOP_STATUSES, default: 'Scheduled', label: 'Status' },
    ],
    refs: [
      { field: 'tripId', table: 'trips', column: 'trip_id', label: 'Trip' },
      { field: 'stationId', table: 'stations', column: 'station_id', label: 'Station' },
    ],
  },

  bookings: {
    key: 'bookings',
    label: 'Booking',
    table: 'bookings',
    pk: { field: 'bookingId', column: 'booking_id' },
    orderBy: 'date DESC, booking_id ASC',
    fields: [
      id('passengerId', 'Passenger'),
      id('tripId', 'Trip'),
      { field: 'seatNumber', column: 'seat_number', type: 'text', required: true, maxLength: 10, label: 'Seat number' },
      { field: 'date', column: 'date', type: 'date', required: true, label: 'Travel date' },
      { field: 'status', column: 'status', type: 'enum', values: BOOKING_STATUSES, default: 'Confirmed', label: 'Status' },
    ],
    refs: [
      { field: 'passengerId', table: 'passengers', column: 'passenger_id', label: 'Passenger' },
      { field: 'tripId', table: 'trips', column: 'trip_id', label: 'Trip' },
    ],
    seatConflict: true,
    referencedBy: [{ table: 'tickets', column: 'booking_id', label: 'ticket' }],
  },

  payments: {
    key: 'payments',
    label: 'Payment',
    table: 'payments',
    pk: { field: 'paymentId', column: 'payment_id' },
    orderBy: 'date DESC, payment_id ASC',
    fields: [
      { field: 'mode', column: 'mode', type: 'enum', values: PAYMENT_MODES, required: true, label: 'Payment mode' },
      { field: 'amount', column: 'amount', type: 'decimal', required: true, min: 0, label: 'Amount' },
      { field: 'date', column: 'date', type: 'date', required: true, label: 'Payment date' },
      { field: 'txnReferenceNo', column: 'txn_reference_no', type: 'text', required: true, maxLength: 50, label: 'Transaction reference' },
    ],
    referencedBy: [{ table: 'tickets', column: 'payment_id', label: 'ticket' }],
  },

  tickets: {
    key: 'tickets',
    label: 'Ticket',
    table: 'tickets',
    pk: { field: 'ticketId', column: 'ticket_id' },
    orderBy: 'issue_date DESC, ticket_id ASC',
    fields: [
      id('bookingId', 'Booking'),
      id('passengerId', 'Passenger'),
      id('tripId', 'Trip'),
      { field: 'issueDate', column: 'issue_date', type: 'date', required: true, label: 'Issue date' },
      { field: 'ticketType', column: 'ticket_type', type: 'enum', values: TICKET_TYPES, required: true, label: 'Ticket type' },
      { field: 'travelClass', column: 'travel_class', type: 'enum', values: TRAVEL_CLASSES, required: true, label: 'Travel class' },
      id('paymentId', 'Payment'),
    ],
    refs: [
      { field: 'bookingId', table: 'bookings', column: 'booking_id', label: 'Booking' },
      { field: 'passengerId', table: 'passengers', column: 'passenger_id', label: 'Passenger' },
      { field: 'tripId', table: 'trips', column: 'trip_id', label: 'Trip' },
      { field: 'paymentId', table: 'payments', column: 'payment_id', label: 'Payment' },
    ],
  },
};

export const RESOURCE_LIST = Object.values(RESOURCES);

const toSnake = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

for (const spec of RESOURCE_LIST) {
  for (const field of spec.fields) {
    if (!field.column) field.column = toSnake(field.field);
  }
}
