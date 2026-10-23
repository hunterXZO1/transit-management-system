-- =================================================================
-- TRANSITFLOW: RELATIONAL DATABASE SCHEMA & SEED DATA
-- Target DBMS: MySQL 8.0+ / MariaDB / PostgreSQL compatible
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

-- 5. ROUTE_STATIONS (M:N Associative Entity with Stop Order)
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

-- 9. VEHICLES TABLE (1:1 Driver Assignment constraint)
CREATE TABLE vehicles (
    vehicle_id VARCHAR(20) PRIMARY KEY,
    registration_no VARCHAR(30) UNIQUE NOT NULL,
    manufacture_date DATE NOT NULL,
    color VARCHAR(30) NOT NULL,
    vehicle_type_id VARCHAR(20) NOT NULL,
    assigned_driver_id VARCHAR(20) UNIQUE, -- 1:1 Active Driver Assignment
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

-- 11. TRIP STOPS (Weak Entity identified by trip_id + stop_order)
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

-- 14. TICKETS TABLE
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

-- =================================================================
-- SEED DATA INSERTIONS
-- =================================================================

INSERT INTO passengers (passenger_id, first_name, last_name, email, gender, dob, door_no, street, city, state, pin) VALUES
('P001', 'Anu', 'Kumar', 'anu@gmail.com', 'F', '2007-06-09', '12', 'Anna St', 'Chennai', 'TN', '600001'),
('P002', 'Arun', 'Raj', 'arun@gmail.com', 'M', '2006-03-15', '24', 'MG Road', 'Chennai', 'TN', '600002');

INSERT INTO passenger_contacts (passenger_id, phone_number) VALUES
('P001', '9876543210'),
('P002', '9876543211'),
('P002', '9876543299');

INSERT INTO routes (route_id, name, type, total_distance_km) VALUES
('R001', 'Chennai Central - Airport Corridor', 'Bus', 15.00),
('R003', 'Airport Express Blue Line', 'Metro', 20.00);

INSERT INTO stations (station_id, name, city, area, landmark) VALUES
('S001', 'Chennai Central', 'Chennai', 'Park Town', 'Central Railway Station'),
('S002', 'Guindy Junction', 'Chennai', 'Guindy', 'Kathipara Cloverleaf'),
('S003', 'Airport Terminal', 'Chennai', 'Meenambakkam', 'Terminal 2 Departure');

INSERT INTO route_stations (id, route_id, station_id, stop_order, distance_from_start_km) VALUES
('R001-S001', 'R001', 'S001', 1, 0.00),
('R001-S002', 'R001', 'S002', 2, 8.50),
('R001-S003', 'R001', 'S003', 3, 15.00);

INSERT INTO vehicle_types (type_id, name, capacity, fuel_type) VALUES
('VT01', 'Low Floor City Bus', 42, 'Diesel'),
('VT02', 'Metro Express Train 4-Car', 240, 'Electric');

INSERT INTO drivers (driver_id, name, license_no, dob) VALUES
('D001', 'Ravi Kumar', 'DL-TN01-2015001', '1985-02-10'),
('D002', 'Priya Sundaram', 'DL-TN02-2018002', '1990-11-22');

INSERT INTO driver_contacts (driver_id, phone_number) VALUES
('D001', '9840123456'),
('D002', '9840998877');

INSERT INTO vehicles (vehicle_id, registration_no, manufacture_date, color, vehicle_type_id, assigned_driver_id) VALUES
('V001', 'TN-01-AB-1234', '2021-04-12', 'Ocean Blue', 'VT01', 'D001'),
('V002', 'METRO-EXP-01', '2023-08-01', 'Silver Indigo', 'VT02', 'D002');
