import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import neo4jRoutes from './routes/neo4jRoutes.js';
import { buildResourceRoutes } from './routes/resourceRoutes.js';
import { checkMysqlHealth, pool } from './config/db.js';
import { closeNeo4jDriver } from './config/neo4j.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    res.json({ success: true, data: { status: 'healthy', relational: await checkMysqlHealth() } });
  } catch (err) {
    res.status(503).json({ success: false, error: err.message });
  }
});

// MySQL CRUD API for the website
app.use('/api', buildResourceRoutes());

// Neo4j graph API for the network-analytics features
app.use('/api/graph', neo4jRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`TransitFlow backend listening on http://localhost:${PORT}`);
  console.log(`MySQL CRUD API:      http://localhost:${PORT}/api`);
  console.log(`Neo4j graph API:     http://localhost:${PORT}/api/graph`);
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close();
  await closeNeo4jDriver().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
