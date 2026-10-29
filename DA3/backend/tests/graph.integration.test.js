import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';
import { Database } from 'arangojs';

// Explicit opt-in; always creates unique disposable databases. Never loads a user's .env.
const enabled = process.env.TRANSIT_INTEGRATION === '1';
test('ArangoDB projection and HTTP integration (isolated databases)', { skip: !enabled, timeout: 120000 }, async t => {
  assert.ok(process.env.DB_PASSWORD && process.env.ARANGO_PASSWORD, 'Supply test-service credentials through environment variables.');
  const name = `transit_test_${randomUUID().replaceAll('-', '')}`;
  const sql = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD, multipleStatements: true });
  const system = new Database({ url: process.env.ARANGO_URL || 'http://127.0.0.1:8529', databaseName: '_system',
    auth: { username: process.env.ARANGO_USER || 'root', password: process.env.ARANGO_PASSWORD } });
  let sqlCreated = false, graphCreated = false, server;
  process.env.DB_NAME = name;
  process.env.ARANGO_DATABASE = name;
  const port = Number(process.env.TEST_API_PORT || 15001);
  process.env.PORT = String(port);
  const base = `http://127.0.0.1:${port}/api`;
  let pool, graphDb;
  const request = async (path, method = 'GET', body) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, ...(await res.json()) };
  };
  const startServer = async (overrides = {}) => {
    server = spawn(process.execPath, ['server.js'], { cwd: new URL('..', import.meta.url), env: { ...process.env, ...overrides }, stdio: 'pipe' });
    let output = '';
    server.stderr.on('data', b => { output += b; });
    server.stdout.on('data', b => { output += b; });
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error(output);
      try { if ((await request('/health')).status === 200) return; } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Backend did not become ready: ${output}`);
  };
  const stopServer = async () => {
    if (!server || server.exitCode !== null) return;
    const exited = new Promise(r => server.once('exit', r)); server.kill('SIGTERM'); await exited;
  };
  try {
    await sql.query(`CREATE DATABASE \`${name}\``); sqlCreated = true;
    await sql.query(`USE \`${name}\``);
    const schema = (await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8'))
      .replace(/^DROP DATABASE IF EXISTS transit_management;\s*CREATE DATABASE transit_management;\s*USE transit_management;/m, '');
    assert.ok(!/DROP DATABASE|CREATE DATABASE|USE transit_management/.test(schema));
    await sql.query(schema);
    await system.createDatabase(name); graphCreated = true;
    ({ pool } = await import('../config/db.js'));
    const { db, query, vertices, edges } = await import('../config/arango.js'); graphDb = db;
    const { syncMysqlToArango, graphCounts, vertexId, stableKey } = await import('../services/graphSyncService.js');
    await t.test('initialization refuses unowned reserved collections', async () => {
      await db.collection(vertices.Station).create();
      await assert.rejects(syncMysqlToArango(), /previous projection is retained/);
      assert.equal(await db.collection('transit_metadata').exists(), false);
      await db.collection(vertices.Station).drop(); // This test just created it in its own fresh database.
      await promisify(execFile)(process.execPath, ['database/init-arango.js'], { env: process.env });
      await promisify(execFile)(process.execPath, ['database/init-arango.js'], { env: process.env });
    });
    await t.test('idempotency, named graph and payment privacy', async () => {
      const first = await syncMysqlToArango();
      const second = await syncMysqlToArango();
      assert.deepEqual(await graphCounts(), { ...Object.fromEntries(Object.entries(first.graph).filter(([k]) => k !== 'prunedInThisRun')) });
      assert.deepEqual(second.graph.prunedInThisRun, { nodes: 0, relationships: 0 });
      assert.equal(first.graph.Station, 4);
      assert.equal((await db.graph('transit_graph').get()).edgeDefinitions.length, 7);
      for (const c of [...Object.values(vertices), ...Object.values(edges)]) {
        const rows = await query('FOR d IN @@c RETURN d', { '@c': c });
        assert.ok(rows.every(d => !('amount' in d) && !('txn_reference_no' in d)));
      }
    });
    await t.test('stable keys, edit propagation, pruning and unrelated collection safety', async () => {
      await db.collection('unrelated').create(); await db.collection('unrelated').save({ _key: 'keep' });
      await sql.query("INSERT INTO stations (station_id,name,city,area) VALUES ('TEST','Before','Test','Test')");
      await syncMysqlToArango(); const id = vertexId('Station', 'TEST');
      await sql.query("UPDATE stations SET name='After' WHERE station_id='TEST'");
      await syncMysqlToArango(); assert.equal((await db.collection(vertices.Station).document(id)).name, 'After');
      await sql.query("DELETE FROM stations WHERE station_id='TEST'");
      const result = await syncMysqlToArango(); assert.equal(result.graph.prunedInThisRun.nodes, 1);
      assert.equal(await db.collection(vertices.Station).documentExists(id), false);
      assert.ok(await db.collection('unrelated').documentExists('keep'));
      await sql.query("INSERT INTO bookings (booking_id,passenger_id,trip_id,seat_number,date,status) VALUES ('TEST','P001','T001','Z99','2026-05-10','Confirmed')");
      await syncMysqlToArango();
      await sql.query("DELETE FROM bookings WHERE booking_id='TEST'");
      assert.equal((await syncMysqlToArango()).graph.prunedInThisRun.relationships, 1);
    });
    await t.test('failed write rolls back the whole projection', async () => {
      const before = await graphCounts();
      const stationId = vertexId('Station', 'S001');
      const stationBefore = await db.collection(vertices.Station).document(stationId);
      await sql.query("UPDATE stations SET name='Transaction rollback probe' WHERE station_id='S001'");
      const original = db.query.bind(db); let writes = 0;
      db.query = (...args) => {
        if (args[0]?.query?.includes('INSERT row') && ++writes === 2) throw new Error('Injected transaction failure');
        return original(...args);
      };
      try { await assert.rejects(syncMysqlToArango(), /previous projection is retained/); }
      finally { db.query = original; }
      assert.deepEqual(await graphCounts(), before);
      assert.deepEqual(await db.collection(vertices.Station).document(stationId), stationBefore);
      await syncMysqlToArango();
      assert.equal((await db.collection(vertices.Station).document(stationId)).name, 'Transaction rollback probe');
      await sql.query("UPDATE stations SET name=? WHERE station_id='S001'", [stationBefore.name]);
      await syncMysqlToArango();
    });
    await t.test('cross-process sync lock', async () => {
      const lock = `transit-sync:${stableKey(name).slice(0, 48)}`;
      await sql.query('SELECT GET_LOCK(?, 1)', [lock]);
      try { await assert.rejects(syncMysqlToArango(), /Another graph sync/); }
      finally { await sql.query('SELECT RELEASE_LOCK(?)', [lock]); }
    });
    await startServer();
    await t.test('health, route ordering, native weighted path and bounded fallback', async () => {
      assert.equal((await request('/graph/health')).data.engine, 'ArangoDB');
      const route = await request('/graph/routes/R001/stations');
      assert.equal(route.status, 200);
      assert.deepEqual(route.data.stops.map(s => s.stopOrder), [1,2,3]);
      const weighted = await request('/graph/path/shortest?originId=S004&destinationId=S003');
      assert.equal(weighted.status, 200); assert.equal(weighted.data.totalDistanceKm, 14.5);
      assert.equal(weighted.data.totalHops, 2); assert.match(weighted.data.strategy, /SHORTEST_PATH/);
      assert.equal((await request('/graph/path/shortest?originId=S004&destinationId=S003&maxHops=1')).status, 404);
      const bounded = await request('/graph/path/shortest?originId=S001&destinationId=S003&maxHops=1');
      assert.equal(bounded.status, 200); assert.equal(bounded.data.totalHops, 1);
      assert.equal(bounded.data.totalDistanceKm, 32); assert.match(bounded.data.strategy, /bounded/);
      assert.equal((await request('/graph/path/shortest?originId=S004&destinationId=S004')).status, 400);
      assert.equal((await request('/graph/path/shortest?originId=MISSING&destinationId=S004')).status, 404);
      assert.equal((await request('/graph/network')).data.length, 10);
    });
    await t.test('passenger journeys and empty passenger', async () => {
      const result = await request('/graph/passengers/P001/journeys');
      assert.equal(result.status, 200); assert.equal(result.data.journeys.length, 1);
      assert.equal(result.data.journeys[0].connectedStations, 3);
      assert.equal((await request('/graph/passengers/P002/journeys')).data.journeys.length, 0);
    });
    await t.test('passenger create/edit API remains authoritative and syncs to one vertex', async () => {
      const passenger = { passengerId: 'P010', firstName: 'Meena', lastName: 'Ravi', email: 'meena@example.com',
        gender: 'F', dob: '2001-04-18', city: 'Chennai', state: 'TN', pin: '600017', contacts: ['9876500010'] };
      assert.equal((await request('/passengers', 'POST', passenger)).status, 201);
      assert.equal((await request('/passengers/P010', 'PUT', { ...passenger, firstName: 'Meena Updated' })).status, 200);
      const [[row]] = await sql.query("SELECT first_name FROM passengers WHERE passenger_id='P010'");
      assert.equal(row.first_name, 'Meena Updated');
      await syncMysqlToArango(); await syncMysqlToArango();
      const projected = await query('FOR p IN @@c FILTER p.passenger_id == @id RETURN p', { '@c': vertices.Passenger, id: 'P010' });
      assert.equal(projected.length, 1); assert.equal(projected[0].first_name, 'Meena Updated');
    });
    await t.test('MySQL booking uniqueness and graph projection', async () => {
      const payload = { passenger: { passengerId: 'P001', firstName: 'Untrusted' }, tripId: 'T001', seatNumber: 'Z98', date: '2026-05-10' };
      const result = await request('/graph/bookings', 'POST', payload);
      assert.equal(result.status, 201); assert.equal(result.data.graphSyncPending, false);
      assert.notEqual((await db.collection(vertices.Passenger).document(vertexId('Passenger','P001'))).first_name, 'Untrusted');
      assert.equal((await request('/graph/bookings', 'POST', payload)).status, 409);
    });
    await stopServer(); await startServer({ ARANGO_URL: 'http://127.0.0.1:1' });
    await t.test('graph offline: CRUD works; committed booking returns explicit partial success', async () => {
      for (const path of ['/graph/health','/graph/network','/graph/routes/R001/stations','/graph/passengers/P001/journeys',
        '/graph/path/shortest?originId=S004&destinationId=S003']) {
        const result = await request(path); assert.equal(result.status, 503); assert.match(result.error, /ArangoDB/);
      }
      assert.equal((await request('/passengers')).status, 200);
      assert.equal((await request('/dashboard')).status, 200);
      const result = await request('/graph/bookings', 'POST', { passenger: { passengerId: 'P001' }, tripId: 'T001', seatNumber: 'Z97', date: '2026-05-10' });
      assert.equal(result.status, 201); assert.equal(result.success, true); assert.equal(result.data.graph, null);
      assert.equal(result.data.partialSuccess, true); assert.equal(result.data.graphSyncPending, true);
      const [[row]] = await sql.query('SELECT booking_id FROM bookings WHERE booking_id=?', [result.data.relational.bookingId]);
      assert.ok(row);
      await syncMysqlToArango(); // healthy direct client repairs the pending booking
    });
  } finally {
    await stopServer();
    if (pool) await pool.end();
    if (graphDb) graphDb.close();
    if (graphCreated) await system.dropDatabase(name);
    system.close();
    if (sqlCreated) await sql.query(`DROP DATABASE \`${name}\``);
    await sql.end();
  }
});
