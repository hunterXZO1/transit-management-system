import { pool } from '../config/db.js';
import { closeArango } from '../config/arango.js';
import { syncMysqlToArango } from '../services/graphSyncService.js';
try {
  console.log(JSON.stringify(await syncMysqlToArango(), null, 2));
} catch (err) { console.error(err.message, err.details || ''); process.exitCode = 1; }
finally { await closeArango(); await pool.end(); }
