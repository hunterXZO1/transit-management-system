#!/usr/bin/env node
// Repeatable MySQL -> Neo4j synchronisation.
// MySQL stays the source of truth; every statement in the service is an
// idempotent MERGE, so re-running this script refreshes rather than duplicates.
//
//   node database/sync-mysql-to-neo4j.js           # upsert current tables
//   node database/sync-mysql-to-neo4j.js --clean   # wipe the graph, then rebuild
import { pool } from '../config/db.js';
import { closeNeo4jDriver } from '../config/neo4j.js';
import { syncMysqlToNeo4j } from '../services/graphSyncService.js';

const clean = process.argv.includes('--clean');

try {
  const result = await syncMysqlToNeo4j({ clean });
  console.log(`TransitFlow graph sync ${clean ? '(clean rebuild)' : '(idempotent upsert)'} finished.\n`);
  console.log('Rows read from MySQL:');
  console.table(result.relational);
  console.log('\nGraph contents after sync:');
  const { relationships, prunedInThisRun, ...nodeCounts } = result.graph;
  console.table(nodeCounts);
  console.table(relationships);
  if (prunedInThisRun) {
    console.log(
      `\nStale graph elements removed (rows deleted in MySQL): ${prunedInThisRun.nodes} node(s), ${prunedInThisRun.relationships} relationship(s).`
    );
  }
  for (const warning of result.warnings) console.log(`\nNote: ${warning}`);
} catch (err) {
  console.error('Graph sync failed:', err.message);
  process.exitCode = 1;
} finally {
  await closeNeo4jDriver().catch(() => {});
  await pool.end().catch(() => {});
}
