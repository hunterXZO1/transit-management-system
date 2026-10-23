import express from 'express';
import { RESOURCES } from '../models/resourceRegistry.js';
import { resourceHandlers } from '../controllers/resourceController.js';
import { compositeHandlers } from '../controllers/compositeController.js';

const kebab = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function crudRouter(key, { create, list = true, get = true, replace = true, remove = true } = {}) {
  const router = express.Router();
  if (list) router.get('/', resourceHandlers.list(key));
  if (create) router.post('/', create);
  if (get) router.get('/:id', resourceHandlers.get(key));
  if (replace) router.put('/:id', resourceHandlers.replace(key));
  if (remove) router.delete('/:id', resourceHandlers.remove(key));
  return router;
}

export function buildResourceRoutes() {
  const router = express.Router();

  router.get('/dashboard', compositeHandlers.dashboard);

  router.use('/passengers', crudRouter('passengers', { create: resourceHandlers.create('passengers') }));
  router.use('/stations', crudRouter('stations', { create: resourceHandlers.create('stations') }));
  router.use('/vehicle-types', crudRouter('vehicleTypes', { create: resourceHandlers.create('vehicleTypes') }));
  router.use('/drivers', crudRouter('drivers', { create: resourceHandlers.create('drivers') }));
  router.use('/vehicles', crudRouter('vehicles', { create: resourceHandlers.create('vehicles') }));
  router.use('/trip-stops', crudRouter('tripStops', { create: resourceHandlers.create('tripStops') }));
  router.use('/route-stations', crudRouter('routeStations', { create: resourceHandlers.create('routeStations') }));
  router.use('/payments', crudRouter('payments', { create: resourceHandlers.create('payments') }));
  router.use('/tickets', crudRouter('tickets', { create: resourceHandlers.create('tickets') }));

  // Routes also expose their ordered station list and a transactional re-sequence endpoint.
  router.use(
    '/routes',
    crudRouter('routes', { create: resourceHandlers.create('routes') })
  );
  router.get('/routes/:routeId/stops', compositeHandlers.routeStops);
  router.put('/routes/:routeId/station-order', compositeHandlers.reorderRouteStops);

  // Trip creation accepts an optional stops array so a schedule is atomic.
  router.post('/trips', compositeHandlers.createTrip);
  router.get('/trips/:tripId/stops', compositeHandlers.tripStops);
  router.use('/trips', crudRouter('trips', { list: true, get: true, create: false }));

  // Booking checkout writes booking + payment + ticket in one transaction.
  router.post('/bookings/checkout', compositeHandlers.checkout);
  router.use('/bookings', crudRouter('bookings', { create: resourceHandlers.create('bookings') }));

  return router;
}
