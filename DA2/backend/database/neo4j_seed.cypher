// ==============================================================================
// TRANSITFLOW: NEO4J GRAPH DATABASE SCHEMA, CONSTRAINTS & SEED CYPHERS
// Replaces 11 MySQL Relational Tables with Native Graph Topology
//
// SUPERSEDED — kept for reference, not executed by the application.
// MySQL is the source of truth and is NOT replaced; the graph is a derived
// projection. Run `npm run sync:graph` (backend/database/sync-mysql-to-neo4j.js)
// instead of this script: it reads live rows from transit_management, merges
// idempotently, prunes elements whose rows were deleted, and copies no payment
// amounts or transaction references into the graph. This file's hand-written
// rows (including payment properties) would also diverge from the relational
// data as soon as anything is edited through the website.
// ==============================================================================

// 1. UNIQUE CONSTRAINTS (Ensures entity identity & builds lookup indexes)
CREATE CONSTRAINT station_id_unique IF NOT EXISTS FOR (s:Station) REQUIRE s.station_id IS UNIQUE;
CREATE CONSTRAINT route_id_unique IF NOT EXISTS FOR (r:Route) REQUIRE r.route_id IS UNIQUE;
CREATE CONSTRAINT trip_id_unique IF NOT EXISTS FOR (t:Trip) REQUIRE t.trip_id IS UNIQUE;
CREATE CONSTRAINT vehicle_id_unique IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.vehicle_id IS UNIQUE;
CREATE CONSTRAINT driver_id_unique IF NOT EXISTS FOR (d:Driver) REQUIRE d.driver_id IS UNIQUE;
CREATE CONSTRAINT passenger_id_unique IF NOT EXISTS FOR (p:Passenger) REQUIRE p.passenger_id IS UNIQUE;
CREATE CONSTRAINT passenger_email_unique IF NOT EXISTS FOR (p:Passenger) REQUIRE p.email IS UNIQUE;

// 2. CREATE STATIONS
MERGE (s1:Station {station_id: 'S001'})
SET s1.name = 'Central', s1.city = 'Chennai', s1.area = 'Central', s1.landmark = 'Railway Station';

MERGE (s2:Station {station_id: 'S002'})
SET s2.name = 'Guindy Junction', s2.city = 'Chennai', s2.area = 'Guindy', s2.landmark = 'Race Course';

MERGE (s3:Station {station_id: 'S003'})
SET s3.name = 'Airport', s3.city = 'Chennai', s3.area = 'Meenambakkam', s3.landmark = 'International Terminal';

MERGE (s4:Station {station_id: 'S004'})
SET s4.name = 'T. Nagar Hub', s4.city = 'Chennai', s4.area = 'T. Nagar', s4.landmark = 'Panagal Park';

MERGE (s5:Station {station_id: 'S005'})
SET s5.name = 'Koyambedu Gateway', s5.city = 'Chennai', s5.area = 'Koyambedu', s5.landmark = 'CMBT Bus Terminus';

// 3. CREATE ROUTES
MERGE (r1:Route {route_id: 'R001'})
SET r1.name = 'Chennai Central', r1.type = 'Bus', r1.total_distance_km = 15.00;

MERGE (r3:Route {route_id: 'R003'})
SET r3.name = 'Airport Express', r3.type = 'Metro', r3.total_distance_km = 20.00;

MERGE (r2:Route {route_id: 'R002'})
SET r2.name = 'OMR IT Corridor Direct', r2.type = 'Bus', r2.total_distance_km = 28.50;

// 4. MAP ROUTE STOPS SEQUENCE (:Route)-[:STOPS_AT {order, distance_from_start_km}]->(:Station)
// Route R001: Central (1) -> T. Nagar (2) -> Guindy (3)
MERGE (r1)-[:STOPS_AT {order: 1, distance_from_start_km: 0.0}]->(s1);
MERGE (r1)-[:STOPS_AT {order: 2, distance_from_start_km: 7.5}]->(s4);
MERGE (r1)-[:STOPS_AT {order: 3, distance_from_start_km: 15.0}]->(s2);

// Route R003 (Metro): Central (1) -> Guindy (2) -> Airport (3)
MERGE (r3)-[:STOPS_AT {order: 1, distance_from_start_km: 0.0}]->(s1);
MERGE (r3)-[:STOPS_AT {order: 2, distance_from_start_km: 11.2}]->(s2);
MERGE (r3)-[:STOPS_AT {order: 3, distance_from_start_km: 20.0}]->(s3);

// Route R002: Koyambedu (1) -> T. Nagar (2) -> Guindy (3)
MERGE (r2)-[:STOPS_AT {order: 1, distance_from_start_km: 0.0}]->(s5);
MERGE (r2)-[:STOPS_AT {order: 2, distance_from_start_km: 12.0}]->(s4);
MERGE (r2)-[:STOPS_AT {order: 3, distance_from_start_km: 28.5}]->(s2);

// 5. TOPOLOGICAL ADJACENCY EDGES (:Station)-[:CONNECTS_TO {distance_km, transit_type, route_id}]->(:Station)
// Bidirectional network track connections for pathfinding algorithms
MERGE (s1)-[:CONNECTS_TO {distance_km: 7.5, transit_type: 'Bus', route_id: 'R001'}]->(s4);
MERGE (s4)-[:CONNECTS_TO {distance_km: 7.5, transit_type: 'Bus', route_id: 'R001'}]->(s1);

MERGE (s4)-[:CONNECTS_TO {distance_km: 7.5, transit_type: 'Bus', route_id: 'R001'}]->(s2);
MERGE (s2)-[:CONNECTS_TO {distance_km: 7.5, transit_type: 'Bus', route_id: 'R001'}]->(s4);

MERGE (s1)-[:CONNECTS_TO {distance_km: 11.2, transit_type: 'Metro', route_id: 'R003'}]->(s2);
MERGE (s2)-[:CONNECTS_TO {distance_km: 11.2, transit_type: 'Metro', route_id: 'R003'}]->(s1);

MERGE (s2)-[:CONNECTS_TO {distance_km: 8.8, transit_type: 'Metro', route_id: 'R003'}]->(s3);
MERGE (s3)-[:CONNECTS_TO {distance_km: 8.8, transit_type: 'Metro', route_id: 'R003'}]->(s2);

MERGE (s5)-[:CONNECTS_TO {distance_km: 12.0, transit_type: 'Bus', route_id: 'R002'}]->(s4);
MERGE (s4)-[:CONNECTS_TO {distance_km: 12.0, transit_type: 'Bus', route_id: 'R002'}]->(s5);

// 6. CREATE DRIVERS & VEHICLES (1:1 Active Assignment)
MERGE (d1:Driver {driver_id: 'D001'})
SET d1.name = 'Ravi Kumar', d1.license_no = 'DL1001', d1.dob = date('1985-02-10'),
    d1.phone_numbers = ['9840123456', '9840123457'];

MERGE (d2:Driver {driver_id: 'D002'})
SET d2.name = 'Sundar Pitchai', d2.license_no = 'DL1002', d2.dob = date('1990-11-24'),
    d2.phone_numbers = ['9840998877'];

MERGE (v1:Vehicle {vehicle_id: 'V001'})
SET v1.registration_no = 'TN01AB1234', v1.manufacture_date = date('2022-05-14'),
    v1.color = '#2563eb', v1.capacity = 40, v1.fuel_type = 'Diesel', v1.type_name = 'City Bus';

MERGE (v2:Vehicle {vehicle_id: 'V002'})
SET v2.registration_no = 'TN01MT5678', v2.manufacture_date = date('2023-09-01'),
    v2.color = '#16a34a', v2.capacity = 320, v2.fuel_type = 'Electric', v2.type_name = 'Metro Rapid 4-Car';

// 1:1 Operator Link
MERGE (v1)-[:ASSIGNED_TO {assigned_since: datetime()}]->(d1);
MERGE (v2)-[:ASSIGNED_TO {assigned_since: datetime()}]->(d2);

// 7. CREATE TRIPS & DISPATCH
MERGE (t1:Trip {trip_id: 'T001'})
SET t1.date = date('2026-08-20'), t1.start_time = '08:00', t1.end_time = '08:45', t1.status = 'Completed';

MERGE (t2:Trip {trip_id: 'T002'})
SET t2.date = date('2026-09-15'), t2.start_time = '09:15', t2.end_time = '10:00', t2.status = 'Scheduled';

// Connect Trip to Route and Vehicle
MERGE (t1)-[:OPERATES]->(r1);
MERGE (v1)-[:ALLOCATED_TO]->(t1);

MERGE (t2)-[:OPERATES]->(r3);
MERGE (v2)-[:ALLOCATED_TO]->(t2);

// Trip Station Timetable (:Trip)-[:SERVES {stop_order, arrival_time, departure_time, platform}]->(:Station)
MERGE (t1)-[:SERVES {stop_order: 1, arrival_time: '08:00', departure_time: '08:05', platform: 'Bay 1'}]->(s1);
MERGE (t1)-[:SERVES {stop_order: 2, arrival_time: '08:22', departure_time: '08:25', platform: 'Bay 3'}]->(s4);
MERGE (t1)-[:SERVES {stop_order: 3, arrival_time: '08:45', departure_time: '08:45', platform: 'Bay 2'}]->(s2);

MERGE (t2)-[:SERVES {stop_order: 1, arrival_time: '09:15', departure_time: '09:18', platform: 'Platform M1'}]->(s1);
MERGE (t2)-[:SERVES {stop_order: 2, arrival_time: '09:35', departure_time: '09:37', platform: 'Platform M1'}]->(s2);
MERGE (t2)-[:SERVES {stop_order: 3, arrival_time: '10:00', departure_time: '10:00', platform: 'Platform M2'}]->(s3);

// 8. CREATE PASSENGERS & BOOKINGS
MERGE (p1:Passenger {passenger_id: 'P001'})
SET p1.first_name = 'Anu', p1.last_name = 'Kumar', p1.email = 'anu@gmail.com', p1.gender = 'F',
    p1.dob = date('2007-06-09'), p1.door_no = '12', p1.street = 'Anna St', p1.city = 'Chennai',
    p1.state = 'TN', p1.pin = '600001', p1.phone_numbers = ['9876543210'];

MERGE (p2:Passenger {passenger_id: 'P002'})
SET p2.first_name = 'Arun', p2.last_name = 'Raj', p2.email = 'arun@gmail.com', p2.gender = 'M',
    p2.dob = date('2006-03-15'), p2.door_no = '24', p2.street = 'MG Road', p2.city = 'Chennai',
    p2.state = 'TN', p2.pin = '600002', p2.phone_numbers = ['9876543211'];

// Passenger Booking & Electronic Ticket Edges
MERGE (p1)-[:BOOKS {
    booking_id: 'BK001', seat_number: 'A01', date: date('2026-08-18'), status: 'Confirmed',
    payment_id: 'PAY001', amount: 40.00, payment_mode: 'UPI', txn_ref: 'TXN-UPI-98761234'
}]->(t1);

MERGE (p1)-[:HAS_TICKET {
    ticket_id: 'TK001', issue_date: date('2026-08-18'), ticket_type: 'Regular', travel_class: 'General'
}]->(t1);

MERGE (p2)-[:BOOKS {
    booking_id: 'BK002', seat_number: 'M14', date: date('2026-09-10'), status: 'Confirmed',
    payment_id: 'PAY002', amount: 65.00, payment_mode: 'Card', txn_ref: 'TXN-CRD-44332211'
}]->(t2);

MERGE (p2)-[:HAS_TICKET {
    ticket_id: 'TK002', issue_date: date('2026-09-10'), ticket_type: 'Regular', travel_class: 'AC'
}]->(t2);
