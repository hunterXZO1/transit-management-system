import { asyncHandler } from '../utils/http.js';
import { createTripWithStops, checkoutBooking, reorderRouteStations, getDashboardStats } from '../services/compositeService.js';
import { findResource } from '../services/resourceService.js';
import { RESOURCES } from '../models/resourceRegistry.js';

export const compositeHandlers = {
  createTrip: asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await createTripWithStops(req.body) });
  }),

  tripStops: asyncHandler(async (req, res) => {
    res.json({ success: true, data: await findResource(RESOURCES.tripStops, null, { tripId: req.params.tripId }) });
  }),

  routeStops: asyncHandler(async (req, res) => {
    res.json({ success: true, data: await findResource(RESOURCES.routeStations, null, { routeId: req.params.routeId }) });
  }),

  reorderRouteStops: asyncHandler(async (req, res) => {
    res.json({ success: true, data: await reorderRouteStations(req.params.routeId, req.body?.stationIds) });
  }),

  checkout: asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await checkoutBooking(req.body) });
  }),

  dashboard: asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getDashboardStats() });
  }),
};
