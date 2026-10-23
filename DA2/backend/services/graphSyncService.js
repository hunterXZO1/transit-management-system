import { pool } from '../config/db.js';
import { runCypher } from '../config/neo4j.js';

// Graph schema guards: run before any MERGE so lookups stay indexed and duplicate
// entity nodes cannot be created.
const CONSTRAINTS = [
  'CREATE CONSTRAINT station_id_unique IF NOT EXISTS FOR (s:Station) REQUIRE s.station_id IS UNIQUE',
  'CREATE CONSTRAINT route_id_unique IF NOT EXISTS FOR (r:Route) REQUIRE r.route_id IS UNIQUE',
  'CREATE CONSTRAINT trip_id_unique IF NOT EXISTS FOR (t:Trip) REQUIRE t.trip_id IS UNIQUE',
  'CREATE CONSTRAINT vehicle_id_unique IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.vehicle_id IS UNIQUE',
  'CREATE CONSTRAINT driver_id_unique IF NOT EXISTS FOR (d:Driver) REQUIRE d.driver_id IS UNIQUE',
  'CREATE CONSTRAINT passenger_id_unique IF NOT EXISTS FOR (p:Passenger) REQUIRE p.passenger_id IS UNIQUE',
  'CREATE INDEX station_city_idx IF NOT EXISTS FOR (s:Station) ON (s.city)',
  'CREATE INDEX trip_date_idx IF NOT EXISTS FOR (t:Trip) ON (t.date)',
];

async function readRelationalSnapshot() {
  const [passengers] = await pool.query(
    `SELECT p.passenger_id, p.first_name, p.last_name, p.email, p.gender, p.dob,
            p.door_no, p.street, p.city, p.state, p.pin,
            GROUP_CONCAT(pc.phone_number) AS phones
       FROM passengers p
       LEFT JOIN passenger_contacts pc ON pc.passenger_id = p.passenger_id
      GROUP BY p.passenger_id`
  );
  const [drivers] = await pool.query(
    `SELECT d.driver_id, d.name, d.license_no, d.dob, GROUP_CONCAT(dc.phone_number) AS phones
       FROM drivers d
       LEFT JOIN driver_contacts dc ON dc.driver_id = d.driver_id
      GROUP BY d.driver_id`
  );
  const [vehicles] = await pool.query(
    `SELECT v.vehicle_id, v.registration_no, v.manufacture_date, v.color, v.assigned_driver_id,
            vt.name AS type_name, vt.capacity, vt.fuel_type
       FROM vehicles v
       JOIN vehicle_types vt ON vt.type_id = v.vehicle_type_id`
  );
  const [routes] = await pool.query('SELECT route_id, name, type, total_distance_km FROM routes');
  const [stations] = await pool.query('SELECT station_id, name, city, area, landmark FROM stations');
  const [routeStations] = await pool.query(
    `SELECT route_id, station_id, stop_order, distance_from_start_km
       FROM route_stations ORDER BY route_id, stop_order`
  );
  const [trips] = await pool.query('SELECT trip_id, date, start_time, end_time, route_id FROM trips');
  const [tripStops] = await pool.query(
    `SELECT trip_id, station_id, stop_order, arrival_time, departure_time, status
       FROM trip_stops ORDER BY trip_id, stop_order`
  );
  const [bookings] = await pool.query(
    'SELECT booking_id, passenger_id, trip_id, seat_number, date, status FROM bookings'
  );
  // Payment columns are deliberately not read into the graph projection: the transit
  // queries need booking and ticket facts, never amounts or transaction references.
  const [tickets] = await pool.query(
    `SELECT tk.ticket_id, tk.booking_id, tk.issue_date, tk.ticket_type, tk.travel_class
       FROM tickets tk
       JOIN bookings b ON b.booking_id = tk.booking_id`
  );
  const [payments] = await pool.query('SELECT payment_id FROM payments');

  return {
    passengers,
    drivers,
    vehicles,
    routes,
    stations,
    routeStations,
    trips,
    tripStops,
    bookings,
    tickets,
    payments,
  };
}

// Adjacency for pathfinding: one CONNECTS_TO edge per consecutive stop pair,
// weighted by the difference in distance_from_start_km, stored in both directions.
function buildAdjacency(routeStations, routeTypeById) {
  const byRoute = new Map();
  for (const row of routeStations) {
    const list = byRoute.get(row.route_id) || [];
    list.push(row);
    byRoute.set(row.route_id, list);
  }

  const edges = new Map();
  for (const [routeId, stops] of byRoute.entries()) {
    const ordered = [...stops].sort((a, b) => a.stop_order - b.stop_order);
    for (let i = 0; i < ordered.length - 1; i += 1) {
      const from = ordered[i];
      const to = ordered[i + 1];
      const weight = Number(to.distance_from_start_km) - Number(from.distance_from_start_km);
      const distanceKm = weight > 0 ? Number(weight.toFixed(2)) : 0;
      for (const [a, b] of [
        [from.station_id, to.station_id],
        [to.station_id, from.station_id],
      ]) {
        const key = `${a}|${b}|${routeId}`;
        if (!edges.has(key)) {
          edges.set(key, {
            from: a,
            to: b,
            distance_km: distanceKm,
            route_id: routeId,
            transit_type: routeTypeById.get(routeId) || 'Bus',
          });
        }
      }
    }
  }
  return [...edges.values()];
}

const phones = (value) => (value ? String(value).split(',').filter(Boolean) : []);

export async function ensureGraphConstraints() {
  for (const statement of CONSTRAINTS) {
    await runCypher(statement, {}, 'WRITE');
  }
}

export async function clearGraph() {
  await runCypher('MATCH (n) DETACH DELETE n', {}, 'WRITE');
}

// MySQL is the source of truth: every statement below is an idempotent MERGE,
// so re-running this produces the same graph instead of duplicating nodes.
export async function syncMysqlToNeo4j({ clean = false } = {}) {
  const snapshot = await readRelationalSnapshot();
  await ensureGraphConstraints();
  if (clean) await clearGraph();

  // Every node and relationship written by this run is stamped with the batch id,
  // so anything whose MySQL row has since been deleted can be pruned afterwards.
  const batch = `sync-${Date.now()}`;
  const created = {};

  await runCypher(
    `UNWIND $rows AS row
     MERGE (s:Station {station_id: row.station_id})
     SET s.name = row.name, s.city = row.city, s.area = row.area, s.landmark = row.landmark,
         s.sync_batch = $batch`,
    { batch,
      rows: snapshot.stations.map((s) => ({
        station_id: s.station_id,
        name: s.name,
        city: s.city,
        area: s.area,
        landmark: s.landmark ?? null,
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MERGE (r:Route {route_id: row.route_id})
     SET r.name = row.name, r.type = row.type, r.total_distance_km = row.total_distance_km,
         r.sync_batch = $batch`,
    { batch,
      rows: snapshot.routes.map((r) => ({
        route_id: r.route_id,
        name: r.name,
        type: r.type,
        total_distance_km: Number(r.total_distance_km),
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MERGE (p:Passenger {passenger_id: row.passenger_id})
     SET p.first_name = row.first_name, p.last_name = row.last_name, p.email = row.email,
         p.gender = row.gender, p.dob = date(row.dob), p.door_no = row.door_no,
         p.street = row.street, p.city = row.city, p.state = row.state, p.pin = row.pin,
         p.phone_numbers = row.phone_numbers,
         p.sync_batch = $batch`,
    { batch,
      rows: snapshot.passengers.map((p) => ({
        passenger_id: p.passenger_id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        gender: p.gender,
        dob: p.dob,
        door_no: p.door_no,
        street: p.street,
        city: p.city,
        state: p.state,
        pin: p.pin,
        phone_numbers: phones(p.phones),
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MERGE (d:Driver {driver_id: row.driver_id})
     SET d.name = row.name, d.license_no = row.license_no, d.dob = date(row.dob),
         d.phone_numbers = row.phone_numbers,
         d.sync_batch = $batch`,
    { batch,
      rows: snapshot.drivers.map((d) => ({
        driver_id: d.driver_id,
        name: d.name,
        license_no: d.license_no,
        dob: d.dob,
        phone_numbers: phones(d.phones),
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MERGE (v:Vehicle {vehicle_id: row.vehicle_id})
     SET v.registration_no = row.registration_no, v.manufacture_date = date(row.manufacture_date),
         v.color = row.color, v.type_name = row.type_name, v.capacity = row.capacity,
         v.fuel_type = row.fuel_type, v.sync_batch = $batch
     WITH v, row
     WHERE row.assigned_driver_id IS NOT NULL AND row.assigned_driver_id <> ''
     MATCH (d:Driver {driver_id: row.assigned_driver_id})
     MERGE (v)-[a:ASSIGNED_TO]->(d)
     SET a.sync_batch = $batch`,
    { batch,
      rows: snapshot.vehicles.map((v) => ({
        vehicle_id: v.vehicle_id,
        registration_no: v.registration_no,
        manufacture_date: v.manufacture_date,
        color: v.color,
        type_name: v.type_name,
        capacity: Number(v.capacity),
        fuel_type: v.fuel_type,
        assigned_driver_id: v.assigned_driver_id ?? '',
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MERGE (t:Trip {trip_id: row.trip_id})
     SET t.date = date(row.date), t.start_time = row.start_time, t.end_time = row.end_time, t.sync_batch = $batch
     WITH t, row
     MATCH (r:Route {route_id: row.route_id})
     MERGE (t)-[op:OPERATES]->(r)
     SET op.sync_batch = $batch`,
    { batch,
      rows: snapshot.trips.map((t) => ({
        trip_id: t.trip_id,
        date: t.date,
        start_time: t.start_time,
        end_time: t.end_time,
        route_id: t.route_id,
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MATCH (r:Route {route_id: row.route_id})
     MATCH (s:Station {station_id: row.station_id})
     MERGE (r)-[stop:STOPS_AT {order: row.stop_order}]->(s)
     SET stop.distance_from_start_km = row.distance_from_start_km, stop.sync_batch = $batch`,
    { batch,
      rows: snapshot.routeStations.map((rs) => ({
        route_id: rs.route_id,
        station_id: rs.station_id,
        stop_order: Number(rs.stop_order),
        distance_from_start_km: Number(rs.distance_from_start_km),
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MATCH (t:Trip {trip_id: row.trip_id})
     MATCH (s:Station {station_id: row.station_id})
     MERGE (t)-[serves:SERVES {stop_order: row.stop_order}]->(s)
     SET serves.arrival_time = row.arrival_time, serves.departure_time = row.departure_time,
         serves.status = row.status, serves.sync_batch = $batch`,
    { batch,
      rows: snapshot.tripStops.map((ts) => ({
        trip_id: ts.trip_id,
        station_id: ts.station_id,
        stop_order: Number(ts.stop_order),
        arrival_time: ts.arrival_time,
        departure_time: ts.departure_time,
        status: ts.status,
      })),
    },
    'WRITE'
  );

  const routeTypeById = new Map(snapshot.routes.map((r) => [r.route_id, r.type]));
  await runCypher(
    `UNWIND $rows AS row
     MATCH (a:Station {station_id: row.from})
     MATCH (b:Station {station_id: row.to})
     MERGE (a)-[c:CONNECTS_TO {route_id: row.route_id}]->(b)
     SET c.distance_km = row.distance_km, c.transit_type = row.transit_type, c.sync_batch = $batch`,
    { rows: buildAdjacency(snapshot.routeStations, routeTypeById), batch },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MATCH (p:Passenger {passenger_id: row.passenger_id})
     MATCH (t:Trip {trip_id: row.trip_id})
     MERGE (p)-[b:BOOKS {booking_id: row.booking_id}]->(t)
     SET b.seat_number = row.seat_number, b.date = date(row.date), b.status = row.status,
         b.sync_batch = $batch`,
    { batch,
      rows: snapshot.bookings.map((b) => ({
        booking_id: b.booking_id,
        passenger_id: b.passenger_id,
        trip_id: b.trip_id,
        seat_number: b.seat_number,
        date: b.date,
        status: b.status,
      })),
    },
    'WRITE'
  );

  await runCypher(
    `UNWIND $rows AS row
     MATCH (p:Passenger {passenger_id: row.passenger_id})
     MATCH (t:Trip {trip_id: row.trip_id})
     MERGE (p)-[tk:HAS_TICKET {ticket_id: row.ticket_id}]->(t)
     SET tk.issue_date = date(row.issue_date), tk.ticket_type = row.ticket_type,
         tk.travel_class = row.travel_class, tk.sync_batch = $batch`,
    { batch,
      rows: snapshot.tickets
        .map((tk) => {
          const booking = snapshot.bookings.find((b) => b.booking_id === tk.booking_id);
          return {
            ticket_id: tk.ticket_id,
            passenger_id: booking?.passenger_id,
            trip_id: booking?.trip_id,
            issue_date: tk.issue_date,
            ticket_type: tk.ticket_type,
            travel_class: tk.travel_class,
          };
        })
        .filter((row) => row.passenger_id && row.trip_id),
    },
    'WRITE'
  );

  const removed = await pruneStaleElements(batch);

  await runCypher(
    'MATCH (n) WHERE n.sync_batch = $batch REMOVE n.sync_batch',
    { batch },
    'WRITE'
  );
  await runCypher(
    'MATCH ()-[r]->() WHERE r.sync_batch = $batch REMOVE r.sync_batch',
    { batch },
    'WRITE'
  );

  const counts = await graphCounts();
  Object.assign(created, counts);
  created.prunedInThisRun = removed;

  return {
    relational: {
      passengers: snapshot.passengers.length,
      drivers: snapshot.drivers.length,
      vehicles: snapshot.vehicles.length,
      routes: snapshot.routes.length,
      stations: snapshot.stations.length,
      routeStations: snapshot.routeStations.length,
      trips: snapshot.trips.length,
      tripStops: snapshot.tripStops.length,
      bookings: snapshot.bookings.length,
      tickets: snapshot.tickets.length,
      payments: snapshot.payments.length,
    },
    graph: created,
    warnings: [
      'Vehicle-to-trip allocation is not modelled in the MySQL schema, so no :ALLOCATED_TO relationships are created by the sync.',
    ],
  };
}

// Drops graph elements whose backing MySQL row no longer exists. MySQL stays the
// source of truth, so a deleted booking must not keep a stale :BOOKS edge.
async function pruneStaleElements(batch) {
  const toNumber = (value) => (typeof value === 'number' ? value : value?.toNumber() ?? 0);
  const countStale = async (statement) => {
    const rows = await runCypher(statement, { batch }, 'READ');
    return toNumber(rows[0]?.n);
  };

  const relationships = await countStale(
    'MATCH ()-[r]->() WHERE r.sync_batch IS NULL OR r.sync_batch <> $batch RETURN count(r) AS n'
  );
  await runCypher(
    'MATCH ()-[r]->() WHERE r.sync_batch IS NULL OR r.sync_batch <> $batch DELETE r',
    { batch },
    'WRITE'
  );
  const nodes = await countStale(
    'MATCH (n) WHERE n.sync_batch IS NULL OR n.sync_batch <> $batch RETURN count(n) AS n'
  );
  await runCypher(
    'MATCH (n) WHERE n.sync_batch IS NULL OR n.sync_batch <> $batch DETACH DELETE n',
    { batch },
    'WRITE'
  );
  return { relationships, nodes };
}

export async function graphCounts() {
  const nodes = await runCypher(
    'MATCH (n) RETURN labels(n)[0] AS k, count(n) AS v ORDER BY k',
    {},
    'READ'
  );
  const relationships = await runCypher(
    'MATCH ()-[r]->() RETURN type(r) AS k, count(r) AS v ORDER BY k',
    {},
    'READ'
  );
  const toNumber = (value) => (typeof value === 'number' ? value : value.toNumber());
  return {
    ...Object.fromEntries(nodes.map((row) => [row.k, toNumber(row.v)])),
    relationships: Object.fromEntries(relationships.map((row) => [row.k, toNumber(row.v)])),
  };
}
