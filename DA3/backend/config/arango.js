import { Database } from 'arangojs';
import dotenv from 'dotenv';
import { ApiError } from '../utils/http.js';
dotenv.config();

export const graphName = 'transit_graph';
export const vertices = Object.fromEntries(['Station', 'Route', 'Trip', 'Vehicle', 'Driver', 'Passenger'].map(t => [t, `transit_${t.toLowerCase()}`]));
export const edges = Object.fromEntries(['STOPS_AT', 'CONNECTS_TO', 'SERVES', 'ASSIGNED_TO', 'OPERATES', 'BOOKS', 'HAS_TICKET'].map(t => [t, `transit_${t.toLowerCase()}`]));
export const db = new Database({ url: process.env.ARANGO_URL || 'http://127.0.0.1:8529',
  databaseName: process.env.ARANGO_DATABASE || 'transit_graph',
  auth: { username: process.env.ARANGO_USER || 'root', password: process.env.ARANGO_PASSWORD || '' },
  timeout: 5000 });

export function graphError(err, context = '') {
  if (err instanceof ApiError) return err;
  const unavailable = !err.isArangoError || [401, 403, 404, 502, 503, 504].includes(err.code);
  return new ApiError(unavailable ? 503 : 500,
    `${context ? context + ' ' : ''}ArangoDB ${unavailable ? 'unavailable or not configured' : 'operation failed'}. MySQL CRUD is unaffected.`,
    err.message);
}
export async function query(text, bindVars = {}) {
  try { return await (await db.query({ query: text, bindVars }, { maxRuntime: 10 })).all(); }
  catch (err) { throw graphError(err); }
}

// Reserved collections must either be new, or bear our ownership marker.
// Never adopt, truncate or remove an existing unrelated collection/graph.
export async function ensureGraph() {
  const meta = db.collection('transit_metadata');
  if (!await meta.exists()) {
    const collections = await db.listCollections();
    const reserved = new Set([...Object.values(vertices), ...Object.values(edges)]);
    if (collections.some(c => reserved.has(c.name)) || await db.graph(graphName).exists())
      throw new Error('Refusing to adopt existing unowned transit collections/graph. Use a dedicated database.');
    await meta.create();
    await meta.save({ _key: 'owner', application: 'transitflow-arango-v1' });
  }
  const owner = await meta.document('owner');
  if (owner.application !== 'transitflow-arango-v1') throw new Error('Transit collection ownership mismatch.');
  const definitions = [
    ['STOPS_AT', 'Route', 'Station'], ['CONNECTS_TO', 'Station', 'Station'], ['SERVES', 'Trip', 'Station'],
    ['ASSIGNED_TO', 'Vehicle', 'Driver'], ['OPERATES', 'Trip', 'Route'], ['BOOKS', 'Passenger', 'Trip'], ['HAS_TICKET', 'Passenger', 'Trip'],
  ].map(([edge, from, to]) => ({ collection: edges[edge], from: [vertices[from]], to: [vertices[to]] }));
  const graph = db.graph(graphName);
  if (!await graph.exists()) await graph.create(definitions);
  const actual = await graph.get();
  if (JSON.stringify(actual.edgeDefinitions.map(({collection, from, to}) => ({collection, from, to})).sort((a,b) => a.collection.localeCompare(b.collection))) !==
      JSON.stringify([...definitions].sort((a,b) => a.collection.localeCompare(b.collection))))
    throw new Error('Transit graph definition differs from the application schema.');
}
export async function closeArango() { db.close(); }
