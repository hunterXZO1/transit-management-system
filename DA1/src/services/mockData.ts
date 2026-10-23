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
} from '../types/transit';

export const INITIAL_PASSENGERS: Passenger[] = [
  {
    passengerId: 'P001',
    firstName: 'Anu',
    lastName: 'Kumar',
    email: 'anu@gmail.com',
    gender: 'F',
    dob: '2007-06-09',
    doorNo: '12',
    street: 'Anna St',
    city: 'Chennai',
    state: 'TN',
    pin: '600001',
    phoneNumbers: ['9876543210'],
  },
  {
    passengerId: 'P002',
    firstName: 'Arun',
    lastName: 'Raj',
    email: 'arun@gmail.com',
    gender: 'M',
    dob: '2006-03-15',
    doorNo: '24',
    street: 'MG Road',
    city: 'Chennai',
    state: 'TN',
    pin: '600002',
    phoneNumbers: ['9876543211', '9876543299'],
  },
  {
    passengerId: 'P003',
    firstName: 'Deepa',
    lastName: 'Sundar',
    email: 'deepa.s@outlook.com',
    gender: 'F',
    dob: '1995-11-20',
    doorNo: '88',
    street: 'Gandhi Salai',
    city: 'Chennai',
    state: 'TN',
    pin: '600028',
    phoneNumbers: ['9840551122'],
  },
  {
    passengerId: 'P004',
    firstName: 'Karthik',
    lastName: 'Narayanan',
    email: 'karthik.n@transit.in',
    gender: 'M',
    dob: '1992-04-03',
    doorNo: '5A',
    street: 'Velachery Bypass',
    city: 'Chennai',
    state: 'TN',
    pin: '600042',
    phoneNumbers: ['9791002233'],
  },
];

export const INITIAL_ROUTES: Route[] = [
  {
    routeId: 'R001',
    name: 'Chennai Central - Airport Corridor',
    type: 'Bus',
    totalDistanceKm: 15.0,
  },
  {
    routeId: 'R003',
    name: 'Airport Express Blue Line',
    type: 'Metro',
    totalDistanceKm: 20.0,
  },
  {
    routeId: 'R002',
    name: 'Koyambedu Inter-Hub Connector',
    type: 'Bus',
    totalDistanceKm: 12.5,
  },
];

export const INITIAL_STATIONS: Station[] = [
  {
    stationId: 'S001',
    name: 'Chennai Central',
    city: 'Chennai',
    area: 'Park Town',
    landmark: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Railway Station',
  },
  {
    stationId: 'S002',
    name: 'Guindy Junction',
    city: 'Chennai',
    area: 'Guindy',
    landmark: 'Guindy Race Course / Metro Interchange',
  },
  {
    stationId: 'S003',
    name: 'Chennai International Airport',
    city: 'Chennai',
    area: 'Meenambakkam',
    landmark: 'Terminal 1 & 2 Departure Bay',
  },
  {
    stationId: 'S004',
    name: 'Koyambedu CMBT',
    city: 'Chennai',
    area: 'Koyambedu',
    landmark: 'Mofussil Bus Terminus & Wholesale Market',
  },
];

export const INITIAL_ROUTE_STATIONS: RouteStation[] = [
  {
    id: 'R001-S001-1',
    routeId: 'R001',
    stationId: 'S001',
    stopOrder: 1,
    distanceFromStartKm: 0.0,
  },
  {
    id: 'R001-S002-2',
    routeId: 'R001',
    stationId: 'S002',
    stopOrder: 2,
    distanceFromStartKm: 8.5,
  },
  {
    id: 'R001-S003-3',
    routeId: 'R001',
    stationId: 'S003',
    stopOrder: 3,
    distanceFromStartKm: 15.0,
  },
  {
    id: 'R003-S001-1',
    routeId: 'R003',
    stationId: 'S001',
    stopOrder: 1,
    distanceFromStartKm: 0.0,
  },
  {
    id: 'R003-S003-2',
    routeId: 'R003',
    stationId: 'S003',
    stopOrder: 2,
    distanceFromStartKm: 20.0,
  },
  {
    id: 'R002-S004-1',
    routeId: 'R002',
    stationId: 'S004',
    stopOrder: 1,
    distanceFromStartKm: 0.0,
  },
  {
    id: 'R002-S002-2',
    routeId: 'R002',
    stationId: 'S002',
    stopOrder: 2,
    distanceFromStartKm: 12.5,
  },
];

export const INITIAL_VEHICLE_TYPES: VehicleType[] = [
  {
    typeId: 'VT01',
    name: 'City Bus Standard',
    capacity: 40,
    fuelType: 'Diesel',
  },
  {
    typeId: 'VT02',
    name: 'Metro Rail Rapid 6-Car',
    capacity: 300,
    fuelType: 'Electric',
  },
  {
    typeId: 'VT03',
    name: 'Urban Feeder Shuttle',
    capacity: 24,
    fuelType: 'CNG',
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    driverId: 'D001',
    name: 'Ravi Kumar',
    licenseNo: 'DL1001',
    dob: '1985-02-10',
    contactNumbers: ['9840112233', '9840112234'],
  },
  {
    driverId: 'D002',
    name: 'Meena Kumari',
    licenseNo: 'DL1002',
    dob: '1990-07-22',
    contactNumbers: ['9840223344'],
  },
  {
    driverId: 'D003',
    name: 'Suresh Babu',
    licenseNo: 'DL1003',
    dob: '1982-11-05',
    contactNumbers: ['9840334455'],
  },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    vehicleId: 'V001',
    registrationNo: 'TN01AB1234',
    manufactureDate: '2022-04-15',
    color: 'Ocean Blue',
    vehicleTypeId: 'VT01',
    assignedDriverId: 'D001',
  },
  {
    vehicleId: 'V002',
    registrationNo: 'TN01CD5678',
    manufactureDate: '2023-01-10',
    color: 'Silver Emerald',
    vehicleTypeId: 'VT02',
    assignedDriverId: 'D002',
  },
  {
    vehicleId: 'V003',
    registrationNo: 'TN02EF9012',
    manufactureDate: '2023-09-01',
    color: 'Pure White',
    vehicleTypeId: 'VT03',
    assignedDriverId: null, // Unassigned driver
  },
];

export const INITIAL_TRIPS: Trip[] = [
  {
    tripId: 'T001',
    date: '2026-08-20',
    startTime: '08:00',
    endTime: '08:45',
    routeId: 'R001',
  },
  {
    tripId: 'T002',
    date: '2026-08-20',
    startTime: '09:15',
    endTime: '09:40',
    routeId: 'R003',
  },
  {
    tripId: 'T003',
    date: '2026-08-21',
    startTime: '07:30',
    endTime: '08:15',
    routeId: 'R001',
  },
];

export const INITIAL_TRIP_STOPS: TripStop[] = [
  {
    id: 'T001-S001-1',
    tripId: 'T001',
    stationId: 'S001',
    stopOrder: 1,
    arrivalTime: '08:00',
    departureTime: '08:05',
    status: 'Departed',
  },
  {
    id: 'T001-S002-2',
    tripId: 'T001',
    stationId: 'S002',
    stopOrder: 2,
    arrivalTime: '08:20',
    departureTime: '08:25',
    status: 'On Time',
  },
  {
    id: 'T001-S003-3',
    tripId: 'T001',
    stationId: 'S003',
    stopOrder: 3,
    arrivalTime: '08:45',
    departureTime: '08:45',
    status: 'Scheduled',
  },
  {
    id: 'T002-S001-1',
    tripId: 'T002',
    stationId: 'S001',
    stopOrder: 1,
    arrivalTime: '09:15',
    departureTime: '09:18',
    status: 'Scheduled',
  },
  {
    id: 'T002-S003-2',
    tripId: 'T002',
    stationId: 'S003',
    stopOrder: 2,
    arrivalTime: '09:40',
    departureTime: '09:40',
    status: 'Scheduled',
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    bookingId: 'B001',
    passengerId: 'P001',
    tripId: 'T001',
    seatNumber: 'A01',
    date: '2026-08-18',
    status: 'Confirmed',
  },
  {
    bookingId: 'B002',
    passengerId: 'P002',
    tripId: 'T001',
    seatNumber: 'A02',
    date: '2026-08-18',
    status: 'Confirmed',
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    paymentId: 'PAY001',
    mode: 'UPI',
    amount: 40.0,
    date: '2026-08-18',
    txnReferenceNo: 'UPI-REF-992817462',
  },
  {
    paymentId: 'PAY002',
    mode: 'Card',
    amount: 60.0,
    date: '2026-08-18',
    txnReferenceNo: 'CRD-REF-449102834',
  },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    ticketId: 'TK001',
    bookingId: 'B001',
    passengerId: 'P001',
    tripId: 'T001',
    issueDate: '2026-08-18',
    ticketType: 'Regular',
    travelClass: 'General',
    paymentId: 'PAY001',
  },
  {
    ticketId: 'TK002',
    bookingId: 'B002',
    passengerId: 'P002',
    tripId: 'T001',
    issueDate: '2026-08-18',
    ticketType: 'Regular',
    travelClass: 'AC',
    paymentId: 'PAY002',
  },
];
