import { randomUUID } from 'node:crypto';
import { query, vertices, edges } from '../config/arango.js';
import { graphCounts, syncMysqlToArango, vertexId } from '../services/graphSyncService.js';
import { insertResource } from '../services/resourceService.js';
import { RESOURCES } from '../models/resourceRegistry.js';
import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';

const isKnownId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/.test(value);

export async function getRouteStations(req, res, next) {
  const { routeId } = req.params;
  if (!isKnownId(routeId)) return res.status(400).json({ success: false, error: 'routeId is not a valid identifier.' });
  try {
    const [data] = await query(`FOR r IN @@routes FILTER r._id == @id
      LET stops = (FOR st, edge IN 1..1 OUTBOUND r @@stops SORT edge.order
        RETURN { stationId: st.station_id, stationName: st.name, city: st.city, area: st.area,
          landmark: st.landmark, stopOrder: edge.order, distanceFromStartKm: edge.distance_from_start_km })
      RETURN { routeId: r.route_id, routeName: r.name, transitType: r.type,
        totalDistanceKm: TO_NUMBER(r.total_distance_km), stops }`,
      { '@routes': vertices.Route, '@stops': edges.STOPS_AT, id: vertexId('Route', routeId) });
    if (!data) throw new ApiError(404, `Route ${routeId} is not in ArangoDB. Run graph sync.`);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function findShortestPath(req, res, next) {
  const { originId, destinationId } = req.query;
  const raw = Number(req.query.maxHops ?? 8);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 10) : 8;
  if (!isKnownId(originId) || !isKnownId(destinationId) || originId === destinationId)
    return res.status(400).json({ success: false, error: 'Provide two different valid station identifiers.' });
  const bind = { origin: vertexId('Station', originId), destination: vertexId('Station', destinationId), '@connections': edges.CONNECTS_TO };
  try {
    const found = await query('FOR s IN @@stations FILTER s._id IN @ids RETURN s._id',
      { '@stations': vertices.Station, ids: [bind.origin, bind.destination] });
    if (found.length !== 2) throw new ApiError(404, 'Unknown station(s). Run graph sync after MySQL changes.');
    // Native Dijkstra shortest path is optimal without a depth bound.
    const native = await query(`FOR v, e IN OUTBOUND SHORTEST_PATH @origin TO @destination @@connections
      OPTIONS { weightAttribute: "distance_km", defaultWeight: 1 }
      RETURN { v, e }`, bind);
    const boundedQuery = (sort) => `FOR v, e, p IN 1..@limit OUTBOUND @origin @@connections
      OPTIONS { order: "weighted", weightAttribute: "distance_km", defaultWeight: 1,
        uniqueVertices: "path", uniqueEdges: "path" }
      FILTER v._id == @destination
      SORT ${sort}
      LIMIT 1 RETURN { vertices: p.vertices, edges: p.edges, distance: SUM(p.edges[*].distance_km) }`;
    let best;
    let strategy = 'ArangoDB native weighted SHORTEST_PATH';
    if (native.length && native.length - 1 <= limit) {
      best = { vertices: native.map(r => r.v), edges: native.filter(r => r.e).map(r => r.e) };
      best.distance = best.edges.reduce((n,e) => n + e.distance_km, 0);
    } else {
      [best] = await query(boundedQuery('SUM(p.edges[*].distance_km), LENGTH(p.edges)'), { ...bind, limit });
      strategy = 'ArangoDB bounded weighted traversal (maxHops constraint)';
    }
    if (!best) throw new ApiError(404, `No connected transit path within ${limit} hops.`);
    const [hop] = await query(boundedQuery('LENGTH(p.edges), SUM(p.edges[*].distance_km)'), { ...bind, limit });
    res.json({ success: true, data: { originId, destinationId, strategy, maxHopsExplored: limit,
      totalHops: best.edges.length, totalDistanceKm: Number(best.distance.toFixed(2)),
      pathStations: best.vertices.map(v => ({ stationId: v.station_id, name: v.name, area: v.area, city: v.city })),
      transitHops: best.edges.map(e => ({ routeId: e.route_id, transitType: e.transit_type, distanceKm: e.distance_km })),
      hopCountOptimalComparison: hop ? { hopCount: hop.edges.length, totalDistanceKm: Number(hop.distance.toFixed(2)),
        routes: hop.edges.map(e => e.route_id) } : null } });
  } catch (err) { next(err); }
}

export async function getPassengerJourneys(req, res, next) {
  const { passengerId } = req.params;
  if (!isKnownId(passengerId)) return res.status(400).json({ success: false, error: 'Invalid passenger identifier.' });
  try {
    const [data] = await query(`FOR person IN @@passengers FILTER person._id == @id
      LET journeys = (FOR trip, booking IN 1..1 OUTBOUND person @@books
        FOR route IN 1..1 OUTBOUND trip @@operates
          LET stops = (FOR station, serves IN 1..1 OUTBOUND trip @@serves SORT serves.stop_order RETURN station)
          SORT booking.date, booking.booking_id
          RETURN { bookingId: booking.booking_id, tripId: trip.trip_id, seatNumber: booking.seat_number,
            date: booking.date, status: booking.status, routeId: route.route_id, routeName: route.name,
            boardedAt: FIRST(stops).name, alightAt: LAST(stops).name,
            connectedStations: LENGTH(UNIQUE(stops[*]._id)) })
      RETURN { passengerId: person.passenger_id, name: CONCAT(person.first_name, " ", person.last_name), journeys }`,
      { '@passengers': vertices.Passenger, '@books': edges.BOOKS, '@operates': edges.OPERATES,
        '@serves': edges.SERVES, id: vertexId('Passenger', passengerId) });
    if (!data) throw new ApiError(404, `Passenger ${passengerId} is not in ArangoDB. Run graph sync.`);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getNetworkGraph(req, res, next) {
  try {
    const data = await query(`FOR c IN @@connections LET a = DOCUMENT(c._from) LET b = DOCUMENT(c._to)
      SORT c.route_id, a.station_id
      RETURN { fromStation: a.station_id, fromName: a.name, toStation: b.station_id, toName: b.name,
        distanceKm: c.distance_km, transitType: c.transit_type, routeId: c.route_id }`,
      { '@connections': edges.CONNECTS_TO });
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
}
export async function healthCheck(req, res, next) {
  try { const { relationships, ...nodes } = await graphCounts();
    res.json({ success: true, data: { status: 'healthy', engine: 'ArangoDB', nodes, relationships } });
  } catch (err) { next(err); }
}
export async function triggerSync(req, res, next) {
  try { res.json({ success: true, data: await syncMysqlToArango() }); }
  catch (err) { next(err); }
}

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

      return insertResource(conn, RESOURCES.bookings, {
        bookingId: `G${randomUUID().replaceAll('-', '').slice(0, 19)}`,
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

  try {
    // Read all projected facts from MySQL, never from caller-supplied passenger details.
    await syncMysqlToArango();
    return res.status(201).json({ success: true, message: 'Booking stored in MySQL and projected to ArangoDB.',
      data: { relational, graph: { passengerId: passenger.passengerId, tripId, bookingId: relational.bookingId,
        seatNumber, bookingDate: date, status: 'Confirmed' }, graphSyncPending: false, partialSuccess: false } });
  } catch (err) {
    return res.status(201).json({ success: true,
      message: `Booking ${relational.bookingId} is committed in MySQL. Do not book again. Retry graph sync only.`,
      data: { relational, graph: null, partialSuccess: true, graphSyncPending: true,
        warning: 'ArangoDB projection could not be confirmed. Run POST /api/graph/sync.' } });
  }
}
