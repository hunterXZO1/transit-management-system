// Creates only the configured dedicated database and application graph.
// Does not drop databases, reset passwords, or touch unowned collections.
import dotenv from 'dotenv';
import { Database } from 'arangojs';
import { db, ensureGraph, closeArango } from '../config/arango.js';
dotenv.config();
const name = process.env.ARANGO_DATABASE || 'transit_graph';
const system = new Database({ url: process.env.ARANGO_URL || 'http://127.0.0.1:8529', databaseName: '_system',
  auth: { username: process.env.ARANGO_USER || 'root', password: process.env.ARANGO_PASSWORD || '' }, timeout: 5000 });
try {
  if (name === '_system') throw new Error('Use a dedicated ARANGO_DATABASE, not _system.');
  if (!await db.exists()) await system.createDatabase(name);
  await ensureGraph();
  console.log(`ArangoDB database ${name} and transit_graph are ready.`);
} catch (err) { console.error('ArangoDB initialization failed:', err.message); process.exitCode = 1; }
finally { system.close(); await closeArango(); }
