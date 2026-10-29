import express from 'express';
import {
  healthCheck,
  getRouteStations,
  findShortestPath,
  getPassengerJourneys,
  bookTripSeat,
  getNetworkGraph,
  triggerSync,
} from '../controllers/arangoTransitController.js';

const router = express.Router();

// ArangoDB availability + node/relationship counts. Never blocks MySQL CRUD.
router.get('/health', healthCheck);

// Rebuild the graph from MySQL (source of truth). Idempotent.
router.post('/sync', triggerSync);

// A. Stations along a route, in stop order
router.get('/routes/:routeId/stations', getRouteStations);

// B. Distance-optimal path between two stations
router.get('/path/shortest', findShortestPath);

// C. Passenger -> booking -> trip -> route relationships
router.get('/passengers/:passengerId/journeys', getPassengerJourneys);

// C. Concurrency-safe booking demonstration (MySQL authoritative)
router.post('/bookings', bookTripSeat);

// Network topology for the Graph Explorer view
router.get('/network', getNetworkGraph);

export default router;
