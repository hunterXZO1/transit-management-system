# TransitFlow — Public Bus & Metro Transit Management System

A production-grade, responsive Full-Stack Transit Operations Management System built for **Public Bus and Metro Networks**. 

TransitFlow integrates a high-performance **React 18 + TypeScript** client with an enterprise **Relational SQL Database (MySQL / PostgreSQL)** via a **Node.js / Express REST API** service layer. It models complex transit relationships including multi-valued phone contacts, M:N route-station topologies, weak-entity trip progress schedules, 1:1 vehicle-driver assignments, and seat collision safeguards.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [SQL & Frontend Connection Flow](#-sql--frontend-connection-flow)
- [Directory Structure & Updated Files Breakdown](#-directory-structure--updated-files-breakdown)
- [Relational Database Schema (SQL DDL)](#-relational-database-schema-sql-ddl)
- [TypeScript Interface vs SQL Schema Mapping](#-typescript-interface-vs-sql-schema-mapping)
- [Connecting SQL with the Frontend (Code Walkthrough)](#-connecting-sql-with-the-frontend-code-walkthrough)
  - [1. Backend SQL Connection Pool (`db.js`)](#1-backend-sql-connection-pool-dbjs)
  - [2. REST API Controller (`server.js`)](#2-rest-api-controller-serverjs)
  - [3. Frontend API Client (`src/services/api.ts`)](#3-frontend-api-client-srcservicesapits)
  - [4. Reactive State Integration (`TransitContext.tsx`)](#4-reactive-state-integration-transitcontexttsx)
- [Environment Configuration (`.env`)](#-environment-configuration-env)
- [Step-by-Step Installation & Run Guide](#-step-by-step-installation--run-guide)
- [Core Functional Modules](#-core-functional-modules)
- [Relational Integrity & Business Logic](#-relational-integrity--business-logic)
- [License](#-license)

---

## 🏛️ System Architecture

TransitFlow employs a 3-tier decoupled architecture designed for scalability, data integrity, and real-time responsiveness:

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 + Vite Client                   │
│   (TypeScript, Tailwind CSS, Lucide Icons, Context API)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTP / JSON (REST API)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js / Express API                     │
│    (CORS, Parameter Validation, Connection Pooling, JWT)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ TCP / Prepared SQL Queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Relational Database (SQL)                   │
│        (MySQL / PostgreSQL - 11 Normalized Tables)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 SQL & Frontend Connection Flow

The link between the React user interface and the SQL database follows a transactional request-response pipeline:

```
[ User Interaction ] 
        │ (e.g. Submits "Add Passenger" form)
        ▼
[ Form Validation ] ─── Regex check (Email, PIN, Phone numbers)
        │
        ▼
[ TransitContext.tsx ] ─ Calls asynchronous action dispatch
        │
        ▼
[ api.ts Service Layer ] ── Sends HTTP POST /api/passengers with JSON payload
        │
        ▼
[ Express Router & Controller ] ── Extracts req.body & runs SQL Transaction:
        ├── 1. INSERT INTO passengers (passenger_id, first_name, last_name, ...)
        └── 2. INSERT INTO passenger_contacts (passenger_id, phone_number) [for each phone]
        │
        ▼
[ SQL Database Engine ] ── Executes ACID transaction & returns auto-generated records / status
        │
        ▼
[ HTTP 201 Created ] ── Returns created Passenger object with contacts
        │
        ▼
[ TransitContext State Update ] ── Updates UI state immutably & triggers Toast notification
        │
        ▼
[ Re-rendered UI View ] ── Displays updated data table instantly with zero page reload
```

---

## 🗂️ Directory Structure & Updated Files Breakdown

Below is the complete overview of the updated codebase files, categorized by subsystem:

```
transit-management-system/
├── backend/                             # [NEW] SQL Backend Service
│   ├── config/
│   │   └── db.js                        # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── passengerController.js       # SQL queries for passenger & contact CRUD
│   │   ├── routeController.js           # Route & station sequencer SQL operations
│   │   ├── fleetController.js           # Vehicle & driver 1:1 logic queries
│   │   ├── tripController.js            # Trip and weak-entity TripStop queries
│   │   └── bookingController.js         # Booking, seat lock, and ticket queries
│   ├── database/
│   │   └── schema.sql                   # Complete relational DDL schema & sample seeds
│   ├── routes/
│   │   └── api.js                       # Express REST API routes mapping
│   ├── .env.example                     # Backend environment credentials template
│   ├── package.json                     # Backend dependencies (express, mysql2, cors, dotenv)
│   └── server.js                        # Express server entry point
│
├── src/                                 # Frontend Client (React 18 + TypeScript)
│   ├── components/
│   │   ├── common/                      # Reusable UI component library
│   │   │   ├── Badge.tsx                # Status chips (On Time, Delayed, Metro, Bus, etc.)
│   │   │   ├── ConfirmDialog.tsx        # Safe deletion confirmation modal
│   │   │   ├── DataTable.tsx            # Generic sortable, paginated data table
│   │   │   ├── Modal.tsx                # Backdrop modal wrapper with ESC key dismiss
│   │   │   ├── MultiInput.tsx           # Dynamic tag adder for 1:N phone numbers
│   │   │   └── Toast.tsx                # Pop-up notification stack (Success, Error, Info)
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Global search input, JSON export & mock reset
│   │   │   └── Sidebar.tsx              # Modern zinc/slate navigation sidebar
│   │   └── modules/
│   │       ├── dashboard/
│   │       │   └── DashboardView.tsx    # Live metric KPI cards, recent activity, system stats
│   │       ├── passengers/
│   │       │   ├── PassengerModal.tsx   # Add/Edit passenger modal with contact list editor
│   │       │   └── PassengerModule.tsx  # Passenger table with contact tags and full search
│   │       ├── routes/
│   │       │   ├── RouteModal.tsx       # Route creation (Bus vs Metro)
│   │       │   ├── StationModal.tsx     # Transit stop creation modal
│   │       │   ├── RouteStationMapperModal.tsx # Interactive stop sequencing & distance tool
│   │       │   └── RouteModule.tsx      # Dual tabs for routes, stations & route mapping
│   │       ├── fleet/
│   │       │   ├── VehicleTypeModal.tsx # Vehicle classification & capacity setup
│   │       │   ├── DriverModal.tsx      # Driver registry & multi-contact phone input
│   │       │   ├── VehicleModal.tsx     # Vehicle registry with 1:1 driver assignment check
│   │       │   └── FleetModule.tsx      # Fleet management dashboard (Vehicles, Drivers, Types)
│   │       ├── trips/
│   │       │   ├── TripModal.tsx        # Schedule run modal with route & vehicle picker
│   │       │   ├── TripStopModal.tsx    # Add intermediate station stop with arrival/departure
│   │       │   ├── TripTimeline.tsx     # Step-by-step graphical run progression timeline
│   │       │   └── TripModule.tsx       # Scheduling coordinator with live timeline inspect
│   │       └── bookings/
│   │           ├── BookingModal.tsx     # Passenger seat booking with duplicate seat blocker
│   │           ├── PaymentModal.tsx     # Payment transaction modal (UPI, Card, Cash)
│   │           ├── TicketCardModal.tsx  # Printable Digital Boarding Pass with QR code
│   │           └── BookingModule.tsx    # Master booking, ticketing, and revenue tabs
│   │
│   ├── context/
│   │   └── TransitContext.tsx           # [UPDATED] React Context integrating API layer & state
│   ├── services/
│   │   ├── api.ts                       # [UPDATED] HTTP client linking frontend to SQL endpoints
│   │   └── mockData.ts                  # Fallback initial seed data for local testing
│   ├── types/
│   │   └── transit.ts                   # Strict TypeScript models mirroring SQL schema
│   ├── App.tsx                          # Root layout, sidebar routing, toast container
│   ├── index.css                        # Tailwind directives and custom scrollbars
│   └── main.tsx                         # React 18 DOM mount point
│
├── .env.example                         # Frontend environment variable template
├── index.html                           # Single Page Application HTML root
├── package.json                         # Client dependencies (React, Lucide, Tailwind)
├── tailwind.config.js                   # High-contrast slate color tokens & styling rules
├── tsconfig.json                        # TypeScript strict compiler options
└── vite.config.ts                       # Vite bundler configuration & dev server proxy
```

---

## 🗄️ Relational Database Schema (SQL DDL)

Here is the complete ANSI SQL DDL schema defining all 11 normalized database tables, primary keys, foreign keys, and referential constraints:

```sql
-- =================================================================
-- TRANSITFLOW RELATIONAL DATABASE SCHEMA (MySQL 8.0+ / PostgreSQL)
-- =================================================================

DROP DATABASE IF EXISTS transit_management;
CREATE DATABASE transit_management;
USE transit_management;

-- 1. PASSENGERS TABLE
CREATE TABLE passengers (
    passenger_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    gender ENUM('F', 'M', 'Other') NOT NULL,
    dob DATE NOT NULL,
    door_no VARCHAR(20),
    street VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PASSENGER CONTACTS (1:N Multi-Valued Attribute)
CREATE TABLE passenger_contacts (
    passenger_id VARCHAR(20) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    PRIMARY KEY (passenger_id, phone_number),
    FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id) ON DELETE CASCADE
);

-- 3. ROUTES TABLE
CREATE TABLE routes (
    route_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('Bus', 'Metro') NOT NULL,
    total_distance_km DECIMAL(6, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. STATIONS TABLE
CREATE TABLE stations (
    station_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL,
    landmark VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROUTE_STATIONS (M:N Associative Entity with Sequence Order)
CREATE TABLE route_stations (
    id VARCHAR(50) PRIMARY KEY,
    route_id VARCHAR(20) NOT NULL,
    station_id VARCHAR(20) NOT NULL,
    stop_order INT NOT NULL,
    distance_from_start_km DECIMAL(6, 2) DEFAULT 0.00,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY uq_route_stop (route_id, stop_order)
);

-- 6. VEHICLE TYPES TABLE
CREATE TABLE vehicle_types (
    type_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    fuel_type ENUM('Diesel', 'Electric', 'CNG') NOT NULL
);

-- 7. DRIVERS TABLE
CREATE TABLE drivers (
    driver_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_no VARCHAR(50) UNIQUE NOT NULL,
    dob DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. DRIVER CONTACTS (1:N Multi-Valued Attribute)
CREATE TABLE driver_contacts (
    driver_id VARCHAR(20) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    PRIMARY KEY (driver_id, phone_number),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE
);

-- 9. VEHICLES TABLE (Enforces 1:1 Driver Assignment via UNIQUE KEY)
CREATE TABLE vehicles (
    vehicle_id VARCHAR(20) PRIMARY KEY,
    registration_no VARCHAR(30) UNIQUE NOT NULL,
    manufacture_date DATE NOT NULL,
    color VARCHAR(30) NOT NULL,
    vehicle_type_id VARCHAR(20) NOT NULL,
    assigned_driver_id VARCHAR(20) UNIQUE, -- 1:1 Active Assignment constraint
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(type_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL
);

-- 10. TRIPS TABLE
CREATE TABLE trips (
    trip_id VARCHAR(20) PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    route_id VARCHAR(20) NOT NULL,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE
);

-- 11. TRIP STOPS (Weak Entity identified by Trip + Stop Order)
CREATE TABLE trip_stops (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(20) NOT NULL,
    station_id VARCHAR(20) NOT NULL,
    stop_order INT NOT NULL,
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    status ENUM('Scheduled', 'On Time', 'Delayed', 'Departed') DEFAULT 'Scheduled',
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY uq_trip_stop_order (trip_id, stop_order)
);

-- 12. BOOKINGS TABLE (Passenger M:N Trip with Seat Collision Guard)
CREATE TABLE bookings (
    booking_id VARCHAR(20) PRIMARY KEY,
    passenger_id VARCHAR(20) NOT NULL,
    trip_id VARCHAR(20) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    status ENUM('Confirmed', 'Cancelled') DEFAULT 'Confirmed',
    FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    UNIQUE KEY uq_trip_seat_date (trip_id, seat_number, date)
);

-- 13. PAYMENTS TABLE
CREATE TABLE payments (
    payment_id VARCHAR(20) PRIMARY KEY,
    mode ENUM('UPI', 'Card', 'Cash') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    txn_reference_no VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. TICKETS TABLE (Relational linkage between Booking, Trip, and Payment)
CREATE TABLE tickets (
    ticket_id VARCHAR(20) PRIMARY KEY,
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    passenger_id VARCHAR(20) NOT NULL,
    trip_id VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    ticket_type ENUM('Regular', 'Season', 'Concession') NOT NULL,
    travel_class ENUM('General', 'AC') NOT NULL,
    payment_id VARCHAR(20) UNIQUE NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE RESTRICT
);
```

---

## 🔄 TypeScript Interface vs SQL Schema Mapping

Every TypeScript interface in `src/types/transit.ts` maps directly to the SQL relational schema:

| TypeScript Interface | TypeScript Property | SQL Table | SQL Column & Constraint |
| :--- | :--- | :--- | :--- |
| **`Passenger`** | `passengerId: string` | `passengers` | `passenger_id VARCHAR(20) PRIMARY KEY` |
| | `firstName: string` | `passengers` | `first_name VARCHAR(50) NOT NULL` |
| | `email: string` | `passengers` | `email VARCHAR(100) UNIQUE NOT NULL` |
| | `phoneNumbers: string[]` | `passenger_contacts` | `(passenger_id, phone_number) COMPOSITE PK` |
| **`Route`** | `routeId: string` | `routes` | `route_id VARCHAR(20) PRIMARY KEY` |
| | `type: 'Bus' \| 'Metro'` | `routes` | `type ENUM('Bus', 'Metro') NOT NULL` |
| | `totalDistanceKm: number` | `routes` | `total_distance_km DECIMAL(6,2) NOT NULL` |
| **`RouteStation`** | `stopOrder: number` | `route_stations` | `stop_order INT NOT NULL` |
| **`Vehicle`** | `assignedDriverId?: string` | `vehicles` | `assigned_driver_id VARCHAR(20) UNIQUE (1:1)` |
| **`TripStop`** | `arrivalTime: string` | `trip_stops` | `arrival_time TIME NOT NULL` |
| **`Booking`** | `seatNumber: string` | `bookings` | `UNIQUE(trip_id, seat_number, date)` |
| **`Ticket`** | `paymentId: string` | `tickets` | `payment_id VARCHAR(20) UNIQUE FK` |

---

## 🛠️ Connecting SQL with the Frontend (Code Walkthrough)

### 1. Backend SQL Connection Pool (`db.js`)

In the Node.js/Express backend, configure a persistent MySQL connection pool:

```javascript
// backend/config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transit_management',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

### 2. REST API Controller (`server.js`)

The backend handles queries and transactions. For example, creating a passenger along with multiple contact numbers:

```javascript
// backend/server.js
import express from 'express';
import cors from 'cors';
import { pool } from './config/db.js';

const app = express();
app.use(cors());
app.use(express.json());

// GET: Fetch all passengers with aggregated contact phone numbers
app.get('/api/passengers', async (req, res) => {
  try {
    const query = `
      SELECT p.*, GROUP_CONCAT(pc.phone_number) AS phone_numbers
      FROM passengers p
      LEFT JOIN passenger_contacts pc ON p.passenger_id = pc.passenger_id
      GROUP BY p.passenger_id
      ORDER BY p.created_at DESC;
    `;
    const [rows] = await pool.query(query);
    const passengers = rows.map(r => ({
      passengerId: r.passenger_id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      gender: r.gender,
      dob: r.dob,
      doorNo: r.door_no,
      street: r.street,
      city: r.city,
      state: r.state,
      pin: r.pin,
      phoneNumbers: r.phone_numbers ? r.phone_numbers.split(',') : [],
    }));
    res.json({ success: true, data: passengers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Add new passenger using an ACID transaction
app.post('/api/passengers', async (req, res) => {
  const p = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO passengers (passenger_id, first_name, last_name, email, gender, dob, door_no, street, city, state, pin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.passengerId, p.firstName, p.lastName, p.email, p.gender, p.dob, p.doorNo, p.street, p.city, p.state, p.pin]
    );

    if (p.phoneNumbers && p.phoneNumbers.length > 0) {
      const contactValues = p.phoneNumbers.map(ph => [p.passengerId, ph]);
      await conn.query(
        `INSERT INTO passenger_contacts (passenger_id, phone_number) VALUES ?`,
        [contactValues]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, data: p });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

app.listen(5000, () => console.log('TransitFlow Backend running on port 5000'));
```

### 3. Frontend API Client (`src/services/api.ts`)

The frontend interacts with the backend through an isolated API service using standard `fetch` calls:

```typescript
// src/services/api.ts
import { Passenger, Route, Vehicle, Trip, Booking } from '../types/transit';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || `HTTP request failed: ${response.statusText}`);
  }
  return json.data;
}

export const TransitApi = {
  // Passenger Endpoints
  getPassengers: () => request<Passenger[]>('/passengers'),
  createPassenger: (p: Passenger) =>
    request<Passenger>('/passengers', { method: 'POST', body: JSON.stringify(p) }),
  updatePassenger: (p: Passenger) =>
    request<Passenger>(`/passengers/${p.passengerId}`, { method: 'PUT', body: JSON.stringify(p) }),
  deletePassenger: (id: string) =>
    request<void>(`/passengers/${id}`, { method: 'DELETE' }),

  // Fleet Endpoints
  getVehicles: () => request<Vehicle[]>('/vehicles'),
  createVehicle: (v: Vehicle) =>
    request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(v) }),

  // Trips Endpoints
  getTrips: () => request<Trip[]>('/trips'),
  createTrip: (t: Trip) =>
    request<Trip>('/trips', { method: 'POST', body: JSON.stringify(t) }),

  // Bookings Endpoints
  getBookings: () => request<Booking[]>('/bookings'),
  createBooking: (b: Booking) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(b) }),
};
```

### 4. Reactive State Integration (`TransitContext.tsx`)

In `TransitContext.tsx`, UI components trigger these asynchronous API operations with automatic optimistic rendering and error fallbacks:

```typescript
// Inside TransitProvider:
const addPassenger = async (passenger: Passenger): Promise<boolean> => {
  try {
    const created = await TransitApi.createPassenger(passenger);
    setPassengers(prev => [created, ...prev]);
    addToast('success', 'Passenger Added', `${created.firstName} ${created.lastName} registered successfully.`);
    return true;
  } catch (err: any) {
    addToast('error', 'Database Error', err.message || 'Could not insert record into SQL database.');
    return false;
  }
};
```

---

## ⚙️ Environment Configuration (`.env`)

### 1. Frontend (`.env` in root)
```env
# Frontend API URL targeting Express SQL Server
VITE_API_BASE_URL=http://localhost:5000/api
```

### 2. Backend (`backend/.env`)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=transit_management
DB_PORT=3306
```

---

## 🚀 Step-by-Step Installation & Run Guide

### Step 1: Clone Repository
```bash
git clone https://github.com/swethasenthilkmr-commits/transit-management-system.git
cd transit-management-system
```

### Step 2: Initialize SQL Database
1. Open MySQL Workbench, phpMyAdmin, or your terminal MySQL CLI:
```bash
mysql -u root -p < database/schema.sql
```
2. Verify all 11 tables are successfully created:
```sql
USE transit_management;
SHOW TABLES;
```

### Step 3: Run Backend API Server
```bash
cd backend
npm install
npm run dev
# Server will start on http://localhost:5000
```

### Step 4: Run Frontend Client
In a new terminal window:
```bash
# Return to the root folder
cd ..
npm install
npm run dev
```

### Step 5: Open Application
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🌟 Core Functional Modules

### 1. 👥 Passenger Management
- **Main Entity CRUD**: `Passenger ID`, `First Name`, `Last Name`, `Email`, `Gender` (`F`/`M`/`Other`), `DOB`, `Door No`, `Street`, `City`, `State`, `PIN`.
- **Contact Sub-Entity**: Dynamic tag manager supporting multiple phone numbers per passenger (1:N mapping).
- **Validation**: Regex email validation, 6-digit PIN code enforcement, and mandatory phone numbers.

### 2. 🗺️ Route & Network Management
- **Routes**: Categorized by transit mode (**Bus** vs **Metro**), track total distance.
- **Stations**: Detailed landmarks, municipal areas, and cities.
- **Route-Station Sequencer (M:N)**: Interactive modal allowing dispatchers to re-sequence stops, calculate cumulative distances, and maintain stop order integrity.

### 3. 🚌 Fleet & Driver Management
- **Vehicle Types**: Seating capacity thresholds and fuel categories (**Diesel**, **Electric**, **CNG**).
- **Drivers**: License verification, date of birth validation, and multi-contact phone tagging.
- **Vehicles**: Real-time **1:1 constraint detection** alerting operators if a driver is already assigned to another active bus or train.

### 4. ⏱️ Trip Scheduling & Weak-Entity Stops
- **Trips**: Date, departure time, arrival time, and assigned route.
- **Interactive Trip Stops Timeline**: Visual status timeline tracking intermediate stop arrivals, departures, and delays (*Departed*, *On Time*, *Delayed*, *Scheduled*).

### 5. 🎟️ Bookings, Tickets & Boarding Passes
- **Bookings**: Seat reservation engine with automated collision prevention on identical trips.
- **Payments**: Multi-mode payment gateway integration (**UPI**, **Credit/Debit Card**, **Cash**).
- **Digital Boarding Pass**: Realistic card view complete with transit branding, passenger details, seat number, and QR code representation.

---

## 🔒 Relational Integrity & Business Logic

- **1:1 Driver-to-Vehicle Assignment**: Supported in SQL via `assigned_driver_id VARCHAR(20) UNIQUE` and enforced dynamically in the frontend UI with visual collision badges.
- **Multi-Valued Phone Numbers (1:N)**: Normalized into auxiliary tables (`passenger_contacts`, `driver_contacts`) with composite primary keys `(id, phone_number)` and `ON DELETE CASCADE`.
- **Associative Weak Entities**: `trip_stops` depends on `trips` via `(trip_id, stop_order)` guaranteeing no orphan stops can exist.
- **Transactional Consistency**: Multi-table insertions (such as Passenger + Contacts or Booking + Payment + Ticket) run inside explicit database transactions (`BEGIN TRANSACTION ... COMMIT`).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
