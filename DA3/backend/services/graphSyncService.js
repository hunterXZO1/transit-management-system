import { createHash, randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/http.js';
import { db, ensureGraph, vertices, edges, query, graphError } from '../config/arango.js';

async function readRelationalSnapshot(conn) {
  const [passengers] = await conn.query(
    `SELECT p.passenger_id, p.first_name, p.last_name, p.email, p.gender, p.dob,
            p.door_no, p.street, p.city, p.state, p.pin,
            GROUP_CONCAT(pc.phone_number) AS phones
       FROM passengers p
       LEFT JOIN passenger_contacts pc ON pc.passenger_id = p.passenger_id
      GROUP BY p.passenger_id`
  );
  const [drivers] = await conn.query(
    `SELECT d.driver_id, d.name, d.license_no, d.dob, GROUP_CONCAT(dc.phone_number) AS phones
       FROM drivers d
       LEFT JOIN driver_contacts dc ON dc.driver_id = d.driver_id
      GROUP BY d.driver_id`
  );
  const [vehicles] = await conn.query(
    `SELECT v.vehicle_id, v.registration_no, v.manufacture_date, v.color, v.assigned_driver_id,
            vt.name AS type_name, vt.capacity, vt.fuel_type
       FROM vehicles v
       JOIN vehicle_types vt ON vt.type_id = v.vehicle_type_id`
  );
  const [routes] = await conn.query('SELECT route_id, name, type, total_distance_km FROM routes');
  const [stations] = await conn.query('SELECT station_id, name, city, area, landmark FROM stations');
  const [routeStations] = await conn.query(
    `SELECT route_id, station_id, stop_order, distance_from_start_km
       FROM route_stations ORDER BY route_id, stop_order`
  );
  const [trips] = await conn.query('SELECT trip_id, date, start_time, end_time, route_id FROM trips');
  const [tripStops] = await conn.query(
    `SELECT trip_id, station_id, stop_order, arrival_time, departure_time, status
       FROM trip_stops ORDER BY trip_id, stop_order`
  );
  const [bookings] = await conn.query(
    'SELECT booking_id, passenger_id, trip_id, seat_number, date, status FROM bookings'
  );
  // Payment columns are deliberately not read into the graph projection: the transit
  // queries need booking and ticket facts, never amounts or transaction references.
  const [tickets] = await conn.query(
    `SELECT tk.ticket_id, tk.booking_id, tk.issue_date, tk.ticket_type, tk.travel_class
       FROM tickets tk
       JOIN bookings b ON b.booking_id = tk.booking_id`
  );
  const [payments] = await conn.query('SELECT payment_id FROM payments');

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
      if (!Number.isFinite(weight) || weight < 0) throw new Error('Route distances must be nondecreasing.');
      const distanceKm = Number(weight.toFixed(2));
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


export const stableKey = (...parts) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');
export const vertexId = (type, id) => `${vertices[type]}/${stableKey(id)}`;

export function project(snapshot, batch) {
  const docs = Object.fromEntries([...Object.values(vertices), ...Object.values(edges)].map(c => [c, []]));
  const addEdge = (type, identity, fromType, from, toType, to, properties = {}) => {
    docs[edges[type]].push({ ...properties, _key: stableKey(...identity),
      _from: vertexId(fromType, from), _to: vertexId(toType, to), sync_batch: batch });
  };
  for (const [type, rows, key] of [
    ['Station', snapshot.stations, 'station_id'], ['Route', snapshot.routes, 'route_id'],
    ['Passenger', snapshot.passengers, 'passenger_id'], ['Driver', snapshot.drivers, 'driver_id'],
    ['Vehicle', snapshot.vehicles, 'vehicle_id'], ['Trip', snapshot.trips, 'trip_id'],
  ]) {
    docs[vertices[type]] = rows.map(row => {
      const { phones, ...data } = row;
      return { ...data, ...(phones !== undefined ? { phone_numbers: phones ? phones.split(',') : [] } : {}),
        _key: stableKey(row[key]), sync_batch: batch };
    });
  }
  for (const r of snapshot.routeStations) addEdge('STOPS_AT', [r.route_id, r.stop_order], 'Route', r.route_id, 'Station', r.station_id,
    { order: Number(r.stop_order), distance_from_start_km: Number(r.distance_from_start_km) });
  for (const r of snapshot.tripStops) addEdge('SERVES', [r.trip_id, r.stop_order], 'Trip', r.trip_id, 'Station', r.station_id, r);
  for (const r of snapshot.vehicles) if (r.assigned_driver_id) addEdge('ASSIGNED_TO', [r.vehicle_id], 'Vehicle', r.vehicle_id, 'Driver', r.assigned_driver_id);
  for (const r of snapshot.trips) addEdge('OPERATES', [r.trip_id], 'Trip', r.trip_id, 'Route', r.route_id);
  for (const r of snapshot.bookings) addEdge('BOOKS', [r.booking_id], 'Passenger', r.passenger_id, 'Trip', r.trip_id, r);
  const bookings = new Map(snapshot.bookings.map(b => [b.booking_id, b]));
  for (const r of snapshot.tickets) {
    const b = bookings.get(r.booking_id);
    if (!b) throw new Error(`Missing booking for ticket ${r.ticket_id}`);
    addEdge('HAS_TICKET', [r.ticket_id], 'Passenger', b.passenger_id, 'Trip', b.trip_id, r);
  }
  for (const r of buildAdjacency(snapshot.routeStations, new Map(snapshot.routes.map(r => [r.route_id, r.type]))))
    addEdge('CONNECTS_TO', [r.from, r.to, r.route_id], 'Station', r.from, 'Station', r.to, r);
  const ids = new Set(Object.values(vertices).flatMap(c => docs[c].map(d => `${c}/${d._key}`)));
  for (const c of Object.values(edges)) for (const e of docs[c]) {
    if (!ids.has(e._from) || !ids.has(e._to)) throw new Error(`Dangling projection edge in ${c}`);
  }
  return docs;
}

// GET_LOCK is held on the same dedicated connection across snapshot and graph commit.
// CLI, HTTP sync and booking projection all use this lock, including across processes.
export async function syncMysqlToArango() {
  const conn = await pool.getConnection();
  const lockName = `transit-sync:${stableKey(conn.config.database).slice(0, 48)}`;
  let locked = false;
  let trx;
  let commitAttempted = false;
  try {
    const [[lock]] = await conn.query('SELECT GET_LOCK(?, 5) AS acquired', [lockName]);
    if (Number(lock.acquired) !== 1) throw new ApiError(409, 'Another graph sync is running; retry later.');
    locked = true;
    await conn.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await conn.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
    const snapshot = await readRelationalSnapshot(conn);
    await conn.commit();
    const batch = randomUUID();
    const docs = project(snapshot, batch);
    await ensureGraph();
    trx = await db.beginTransaction({ exclusive: Object.keys(docs) }, { allowImplicit: false });
    const removed = { nodes: 0, relationships: 0 };
    // All upserts must finish before any pruning. Every query runs in the same transaction.
    for (const [collection, rows] of Object.entries(docs)) {
      for (let i = 0; i < rows.length; i += 500) {
        await trx.step(async () => {
          const cursor = await db.query({ query: `FOR row IN @rows INSERT row INTO @@collection OPTIONS { overwriteMode: "replace" }`,
            bindVars: { rows: rows.slice(i, i + 500), '@collection': collection } });
          await cursor.all();
        });
      }
    }
    for (const collection of [...Object.values(edges), ...Object.values(vertices)]) {
      const n = await trx.step(async () => {
        const cursor = await db.query({ query: `FOR d IN @@collection FILTER d.sync_batch != @batch REMOVE d IN @@collection COLLECT WITH COUNT INTO n RETURN n`,
          bindVars: { '@collection': collection, batch } });
        return (await cursor.all())[0] || 0;
      });
      removed[Object.values(edges).includes(collection) ? 'relationships' : 'nodes'] += n;
    }
    commitAttempted = true;
    await trx.commit();
    trx = null;
    const counts = Object.fromEntries(Object.entries(vertices).map(([type, c]) => [type, docs[c].length]));
    counts.relationships = Object.fromEntries(Object.entries(edges).map(([type, c]) => [type, docs[c].length]));
    return { relational: Object.fromEntries(Object.entries(snapshot).map(([key, rows]) => [key, rows.length])),
      graph: { ...counts, prunedInThisRun: removed }, warnings: [] };
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (trx) await trx.abort().catch(() => {});
    if (err.status === 409) throw err;
    throw graphError(err, commitAttempted
      ? 'Graph commit acknowledgement failed; outcome is unknown. Retry the idempotent sync.'
      : 'Graph sync failed before commit; the previous projection is retained.');
  } finally {
    try {
      if (locked) await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);
      conn.release();
    } catch { conn.destroy(); } // Never return a connection with an uncertain named lock to the pool.
  }
}

export async function graphCounts() {
  const result = {};
  for (const [type, c] of Object.entries(vertices)) result[type] = (await query('RETURN LENGTH(@@c)', { '@c': c }))[0];
  result.relationships = {};
  for (const [type, c] of Object.entries(edges)) result.relationships[type] = (await query('RETURN LENGTH(@@c)', { '@c': c }))[0];
  return result;
}
