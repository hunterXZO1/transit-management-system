import { runCypher, runCypherTransaction } from '../config/neo4j.js';
import { graphCounts, syncMysqlToNeo4j } from '../services/graphSyncService.js';
import { insertResource } from '../services/resourceService.js';
import { RESOURCES } from '../models/resourceRegistry.js';
import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/;
const isKnownId = (value) => typeof value === 'string' && ID_PATTERN.test(value);

const num = (value) => (typeof value === 'number' ? value : Number(value?.toNumber ? value.toNumber() : value));

/**
 * A. Stations along a route, in stop order, straight from the graph.
 */
export async function getRouteStations(req, res, next) {
  const { routeId } = req.params;
  if (!isKnownId(routeId)) {
    return res.status(400).json({ success: false, error: 'routeId is not a valid identifier.' });
  }

  const cypher = `
    MATCH (r:Route {route_id: $routeId})-[s:STOPS_AT]->(st:Station)
    RETURN r.route_id AS routeId, r.name AS routeName, r.type AS transitType,
           r.total_distance_km AS totalDistanceKm,
           st.station_id AS stationId, st.name AS stationName, st.city AS city,
           st.area AS area, st.landmark AS landmark,
           s.order AS stopOrder, s.distance_from_start_km AS distanceFromStartKm
    ORDER BY s.order ASC
  `;

  try {
    const records = await runCypher(cypher, { routeId });
    if (records.length === 0) {
      return res.status(404).json({ success: false, error: `Route ${routeId} is not in the graph yet. Run the MySQL-to-Neo4j sync.` });
    }
    return res.json({
      success: true,
      data: {
        routeId: records[0].routeId,
        routeName: records[0].routeName,
        transitType: records[0].transitType,
        totalDistanceKm: Number(records[0].totalDistanceKm),
        stops: records.map((r) => ({
          stationId: r.stationId,
          stationName: r.stationName,
          city: r.city,
          area: r.area,
          landmark: r.landmark ?? null,
          stopOrder: num(r.stopOrder),
          distanceFromStartKm: Number(r.distanceFromStartKm),
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function stationExists(stationId) {
  const rows = await runCypher('MATCH (s:Station {station_id: $id}) RETURN 1 AS ok LIMIT 1', { id: stationId });
  return rows.length > 0;
}

/**
 * B. Weighted shortest path. Cypher's shortestPath() only minimises the number of
 * relationships, so the distance-optimal path is found by enumerating bounded
 * trails and ordering them by the summed CONNECTS_TO.distance_km weight.
 */
export async function findShortestPath(req, res, next) {
  const { originId, destinationId } = req.query;
  const rawHops = Number(req.query.maxHops ?? 8);
  const hopLimit = Number.isFinite(rawHops) ? Math.min(Math.max(Math.trunc(rawHops), 1), 10) : 8;

  if (!isKnownId(originId) || !isKnownId(destinationId)) {
    return res.status(400).json({ success: false, error: 'originId and destinationId must be valid station identifiers.' });
  }
  if (originId === destinationId) {
    return res.status(400).json({ success: false, error: 'originId and destinationId must be different stations.' });
  }

  try {
    const missing = [];
    for (const id of [originId, destinationId]) {
      if (!(await stationExists(id))) missing.push(id);
    }
    if (missing.length) {
      return res.status(404).json({ success: false, error: `Unknown station(s): ${missing.join(', ')}.` });
    }

    const weightedCypher = `
      MATCH path = (o:Station {station_id: $originId})-[:CONNECTS_TO*1..${hopLimit}]->(d:Station {station_id: $destinationId})
      WITH path, reduce(acc = 0.0, r IN relationships(path) | acc + r.distance_km) AS totalKm
      RETURN [n IN nodes(path) | {stationId: n.station_id, name: n.name, area: n.area, city: n.city}] AS stations,
             [r IN relationships(path) | {routeId: r.route_id, transitType: r.transit_type, distanceKm: r.distance_km}] AS hops,
             length(path) AS hopCount,
             totalKm AS totalDistanceKm
      ORDER BY totalKm ASC, hopCount ASC
      LIMIT 1
    `;

    const hopOptimalCypher = `
      MATCH path = shortestPath((o:Station {station_id: $originId})-[:CONNECTS_TO*1..${hopLimit}]->(d:Station {station_id: $destinationId}))
      WITH path, length(path) AS hopCount,
           reduce(acc = 0.0, r IN relationships(path) | acc + r.distance_km) AS totalKm
      RETURN hopCount, totalKm, [r IN relationships(path) | r.route_id] AS routes
      LIMIT 1
    `;

    const best = await runCypher(weightedCypher, { originId, destinationId });
    if (best.length === 0) {
      return res.status(404).json({ success: false, error: `No connected transit path between ${originId} and ${destinationId} within ${hopLimit} hops.` });
    }
    const hopOptimal = await runCypher(hopOptimalCypher, { originId, destinationId });

    const record = best[0];
    return res.json({
      success: true,
      data: {
        originId,
        destinationId,
        strategy: 'weighted-distance (bounded trail enumeration ordered by summed distance_km)',
        maxHopsExplored: hopLimit,
        totalHops: num(record.hopCount),
        totalDistanceKm: Number(num(record.totalDistanceKm).toFixed(2)),
        pathStations: record.stations,
        transitHops: record.hops.map((h) => ({ ...h, distanceKm: Number(h.distanceKm) })),
        // Included so the academic report can show that fewer hops is not always shorter.
        hopCountOptimalComparison: hopOptimal.length
          ? {
              hopCount: num(hopOptimal[0].hopCount),
              totalDistanceKm: Number(num(hopOptimal[0].totalKm).toFixed(2)),
              routes: hopOptimal[0].routes,
            }
          : null,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * C. Passenger and booking relationships already stored in the graph.
 */
export async function getPassengerJourneys(req, res, next) {
  const { passengerId } = req.params;
  if (!isKnownId(passengerId)) {
    return res.status(400).json({ success: false, error: 'passengerId is not a valid identifier.' });
  }

  const cypher = `
    MATCH (p:Passenger {passenger_id: $passengerId})
    OPTIONAL MATCH (p)-[b:BOOKS]->(t:Trip)-[:OPERATES]->(r:Route)
    WITH p, t, r, b
    ORDER BY b.date
    WITH p, collect({
           bookingId: b.booking_id, tripId: t.trip_id, seatNumber: b.seat_number,
           date: b.date, status: b.status, routeId: r.route_id, routeName: r.name,
           stops: size([(t)-[:SERVES]->(s) | s])
         }) AS rows
    RETURN p.passenger_id AS passengerId,
           p.first_name + ' ' + p.last_name AS name,
           [x IN rows WHERE x.bookingId IS NOT NULL] AS journeys
  `;

  const detailCypher = `
    MATCH (p:Passenger {passenger_id: $passengerId})-[b:BOOKS]->(t:Trip)-[:OPERATES]->(r:Route)
    OPTIONAL MATCH (t)-[sv:SERVES]->(st:Station)
    WITH p, b, t, r, st, sv
    ORDER BY sv.stop_order
    WITH p, b, t, r,
         collect(st.name) AS stationNames,
         collect(sv.stop_order) AS stopOrders,
         count(DISTINCT st) AS connectedStations
    RETURN b.booking_id AS bookingId, t.trip_id AS tripId, b.seat_number AS seatNumber,
           b.date AS date, b.status AS status, r.route_id AS routeId, r.name AS routeName,
           connectedStations,
           head([n IN stationNames WHERE n IS NOT NULL]) AS boardedAt,
           last([n IN stationNames WHERE n IS NOT NULL]) AS alightAt
    ORDER BY b.date
  `;

  try {
    const head = await runCypher(cypher, { passengerId });
    if (head.length === 0) {
      return res.status(404).json({ success: false, error: `Passenger ${passengerId} is not in the graph yet. Run the MySQL-to-Neo4j sync.` });
    }
    const journeys = await runCypher(detailCypher, { passengerId });

    return res.json({
      success: true,
      data: {
        passengerId: head[0].passengerId,
        name: head[0].name,
        journeys: journeys.map((j) => ({
          bookingId: j.bookingId,
          tripId: j.tripId,
          seatNumber: j.seatNumber,
          date: j.date ? String(j.date) : null,
          status: j.status,
          routeId: j.routeId,
          routeName: j.routeName,
          boardedAt: j.boardedAt,
          alightAt: j.alightAt,
          connectedStations: num(j.connectedStations),
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Booking demonstration. MySQL stays authoritative: the relational row is
 * written first in its own transaction (with a seat-conflict guard), then the
 * graph edge is upserted in a separate Neo4j write transaction. The two stores
 * are not one atomic unit, so a graph failure is reported as needing a re-sync
 * instead of being hidden.
 */
export async function bookTripSeat(req, res, next) {
  const { passenger, tripId, seatNumber, date } = req.body || {};

  if (!passenger?.passengerId || !tripId || !seatNumber || !date) {
    return res.status(400).json({ success: false, error: 'passenger.passengerId, tripId, seatNumber and date are required.' });
  }

  let relational;
  try {
    relational = await withTransaction(async (conn) => {
      // Lock the trip row so two concurrent bookings cannot pick the same
      // seat number or the same generated booking id.
      const [locked] = await conn.query('SELECT trip_id FROM trips WHERE trip_id = ? FOR UPDATE', [tripId]);
      if (locked.length === 0) throw new ApiError(400, `Trip ${tripId} does not exist.`);

      const [maxRows] = await conn.query(
        `SELECT MAX(CAST(SUBSTRING(booking_id, 2) AS UNSIGNED)) AS highest
           FROM bookings WHERE booking_id REGEXP '^B[0-9]+$'`
      );
      const nextNumber = Number(maxRows[0].highest ?? 0) + 1;
      return insertResource(conn, RESOURCES.bookings, {
        bookingId: `B${String(nextNumber).padStart(3, '0')}`,
        passengerId: passenger.passengerId,
        tripId,
        seatNumber,
        date,
        status: 'Confirmed',
      });
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    return next(err);
  }

  const cypher = `
    MATCH (t:Trip {trip_id: $tripId})
    MERGE (p:Passenger {passenger_id: $passengerId})
    ON CREATE SET p.first_name = $firstName, p.last_name = $lastName, p.email = $email,
                  p.city = $city, p.created_from_graph_demo = true
    ON MATCH SET p.first_name = $firstName, p.last_name = $lastName
    WITH p, t
    WHERE NOT EXISTS {
      MATCH (other:Passenger)-[edge:BOOKS {seat_number: $seatNumber, date: date($date), status: 'Confirmed'}]->(t)
    }
    MERGE (p)-[b:BOOKS {booking_id: $bookingId}]->(t)
    SET b.seat_number = $seatNumber, b.date = date($date), b.status = 'Confirmed',
        b.source = 'mysql-synced-demo'
    RETURN p.passenger_id AS passengerId, t.trip_id AS tripId, b.booking_id AS bookingId,
           b.seat_number AS seatNumber, toString(b.date) AS bookingDate, b.status AS status
  `;

  try {
    const graphResult = await runCypherTransaction(
      async (tx) => {
        const result = await tx.run(cypher, {
          tripId,
          passengerId: passenger.passengerId,
          firstName: passenger.firstName ?? '',
          lastName: passenger.lastName ?? '',
          email: passenger.email ?? null,
          city: passenger.city ?? null,
          seatNumber,
          date,
          bookingId: relational.bookingId,
        });
        if (result.records.length === 0) {
          throw Object.assign(new Error(`Trip ${tripId} is missing from the graph, or seat ${seatNumber} is already taken on ${date}.`), { graphRejected: true });
        }
        return result.records[0].toObject();
      },
      'WRITE'
    );

    return res.status(201).json({
      success: true,
      message: 'Booking written to MySQL and reflected in the graph.',
      data: { relational, graph: graphResult },
    });
  } catch (err) {
    if (err.graphRejected) {
      return res.status(201).json({
        success: true,
        message: `Booking ${relational.bookingId} is stored in MySQL, but the graph edge was not created: ${err.message} Run POST /api/graph/sync to refresh.`,
        data: { relational, graph: null },
      });
    }
    return next(err);
  }
}

/**
 * Network topology used by the Graph Explorer map.
 */
export async function getNetworkGraph(req, res, next) {
  const cypher = `
    MATCH (s1:Station)-[c:CONNECTS_TO]->(s2:Station)
    RETURN s1.station_id AS fromStation, s1.name AS fromName,
           s2.station_id AS toStation, s2.name AS toName,
           c.distance_km AS distanceKm, c.transit_type AS transitType, c.route_id AS routeId
    ORDER BY c.route_id, s1.station_id
  `;
  try {
    const records = await runCypher(cypher);
    return res.json({
      success: true,
      count: records.length,
      data: records.map((r) => ({ ...r, distanceKm: Number(r.distanceKm) })),
    });
  } catch (err) {
    return next(err);
  }
}

export async function healthCheck(req, res) {
  try {
    const counts = await graphCounts();
    const { relationships, ...nodes } = counts;
    res.json({
      success: true,
      data: {
        status: 'healthy',
        engine: 'Neo4j',
        nodes,
        relationships,
      },
    });
  } catch (err) {
    res.status(503).json({ success: false, error: `Neo4j unavailable: ${err.message}`, hint: 'MySQL CRUD keeps working without Neo4j.' });
  }
}

// Manual refresh: MySQL is the source of truth, so the graph is rebuilt from it.
export async function triggerSync(req, res, next) {
  try {
    const result = await syncMysqlToNeo4j({ clean: req.body?.clean === true });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
