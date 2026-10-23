import { pool, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';
import { RESOURCES } from '../models/resourceRegistry.js';
import { insertResource } from './resourceService.js';

const one = async (conn, sql, params) => (await conn.query(sql, params))[0][0];

// Trip plus its generated stop timeline commit or roll back together.
export async function createTripWithStops(payload) {
  const stops = payload?.stops;
  const trip = payload?.trip ? { ...payload.trip } : { ...payload };
  delete trip.stops;

  return withTransaction(async (conn) => {
    const createdTrip = await insertResource(conn, RESOURCES.trips, trip);

    if (!Array.isArray(stops) || stops.length === 0) return { trip: createdTrip, stops: [] };

    const created = [];
    for (const stop of stops) {
      created.push(
        await insertResource(conn, RESOURCES.tripStops, {
          ...stop,
          tripId: createdTrip.tripId,
        })
      );
    }
    return { trip: createdTrip, stops: created };
  });
}

// Booking + payment + ticket as one unit, with the trip row locked so two
// concurrent requests cannot take the same seat.
export async function checkoutBooking(body) {
  const { booking, payment, ticket } = body || {};
  if (!booking) throw new ApiError(400, 'A booking payload is required.');

  return withTransaction(async (conn) => {
    const [locked] = await conn.query(
      'SELECT trip_id FROM trips WHERE trip_id = ? FOR UPDATE',
      [String(booking.tripId ?? '').trim()]
    );
    if (locked.length === 0) {
      throw new ApiError(400, `Trip ${booking.tripId} does not exist.`);
    }

    const createdBooking = await insertResource(conn, RESOURCES.bookings, booking);

    let createdPayment = null;
    let createdTicket = null;
    if (payment && ticket) {
      createdPayment = await insertResource(conn, RESOURCES.payments, payment);
      createdTicket = await insertResource(conn, RESOURCES.tickets, {
        ...ticket,
        bookingId: createdBooking.bookingId,
        passengerId: createdBooking.passengerId,
        tripId: createdBooking.tripId,
        paymentId: createdPayment.paymentId,
      });
    }

    return { booking: createdBooking, payment: createdPayment, ticket: createdTicket };
  });
}

// Re-sequences route_stations.stop_order without tripping the
// UNIQUE(route_id, stop_order) constraint: negative pass first, then flip.
export async function reorderRouteStations(routeId, orderedStationIds) {
  if (!Array.isArray(orderedStationIds) || orderedStationIds.length === 0) {
    throw new ApiError(400, 'stationIds must be a non-empty list.');
  }

  return withTransaction(async (conn) => {
    const [route] = await conn.query('SELECT route_id, name, type FROM routes WHERE route_id = ? FOR UPDATE', [routeId]);
    if (route.length === 0) throw new ApiError(404, `Route ${routeId} was not found.`);

    const [existing] = await conn.query(
      `SELECT id, station_id, stop_order, distance_from_start_km
         FROM route_stations WHERE route_id = ? FOR UPDATE`,
      [routeId]
    );
    const byStation = new Map(existing.map((row) => [row.station_id, row]));

    for (const row of existing) {
      if (!orderedStationIds.includes(row.station_id)) {
        await conn.query('DELETE FROM route_stations WHERE id = ?', [row.id]);
      }
    }

    for (const [index, stationId] of orderedStationIds.entries()) {
      const row = byStation.get(stationId);
      if (row) {
        await conn.query('UPDATE route_stations SET stop_order = ? WHERE id = ?', [-(index + 1), row.id]);
      } else {
        const [station] = await conn.query(
          'SELECT station_id FROM stations WHERE station_id = ? LIMIT 1',
          [stationId]
        );
        if (station.length === 0) throw new ApiError(400, `Station ${stationId} does not exist.`);
        await conn.query(
          `INSERT INTO route_stations (id, route_id, station_id, stop_order, distance_from_start_km)
           VALUES (?, ?, ?, ?, ?)`,
          [`${routeId}-${stationId}`, routeId, stationId, -(index + 1), index * 5]
        );
      }
    }

    await conn.query(
      'UPDATE route_stations SET stop_order = -stop_order WHERE route_id = ? AND stop_order < 0',
      [routeId]
    );

    const [rows] = await conn.query(
      `SELECT id, route_id, station_id, stop_order, distance_from_start_km
         FROM route_stations WHERE route_id = ? ORDER BY stop_order`,
      [routeId]
    );

    return {
      routeId,
      stops: rows.map((row) => ({
        id: row.id,
        routeId: row.route_id,
        stationId: row.station_id,
        stopOrder: row.stop_order,
        distanceFromStartKm: Number(row.distance_from_start_km),
      })),
    };
  });
}

// Dashboard aggregates straight from MySQL.
export async function getDashboardStats() {
  const counts = {};
  for (const spec of Object.values(RESOURCES)) {
    const row = await one(pool, `SELECT COUNT(*) AS n FROM ${spec.table}`, []);
    counts[spec.key] = Number(row.n);
  }

  const [occupancy] = await pool.query(
    `SELECT t.trip_id AS tripId,
            t.date AS date,
            r.name AS routeName,
            COALESCE(SUM(CASE WHEN b.status = 'Confirmed' THEN 1 ELSE 0 END), 0) AS confirmedBookings
       FROM trips t
       JOIN routes r ON r.route_id = t.route_id
       LEFT JOIN bookings b ON b.trip_id = t.trip_id
      GROUP BY t.trip_id, t.date, r.name
      ORDER BY confirmedBookings DESC, t.date DESC
        LIMIT 5`
  );

  const [revenue] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS transactions FROM payments"
  );

  return { ...counts, topBookedTrips: occupancy, revenue: revenue[0] };
}
