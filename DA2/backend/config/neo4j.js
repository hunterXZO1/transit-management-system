import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

/**
 * Singleton Neo4j Driver instance with connection pooling.
 */
export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 5000,
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    logging: {
      level: 'info',
      logger: (level, message) => {
        if (process.env.NODE_ENV !== 'production' && level === 'error') {
          console.error(`[Neo4j ${level.toUpperCase()}] ${message}`);
        }
      },
    },
  }
);

/**
 * Health check helper to verify database connectivity.
 */
export async function verifyNeo4jConnection() {
  try {
    const serverInfo = await driver.getServerInfo();
    console.log(`Connected to Neo4j Graph DB: ${serverInfo.address} (${serverInfo.agent})`);
    return { status: 'healthy', address: serverInfo.address, agent: serverInfo.agent };
  } catch (err) {
    console.error('Failed to connect to Neo4j instance:', err.message);
    throw err;
  }
}

/**
 * Helper to run a Cypher query with automatic session lifecycle management.
 * @param {string} cypher - The Cypher query string
 * @param {object} params - Query parameters object
 * @param {'READ' | 'WRITE'} mode - Transaction access mode
 * @returns {Promise<Array<object>>} - Array of record objects
 */
export async function runCypher(cypher, params = {}, mode = 'READ') {
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: mode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ,
  });

  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
}

/**
 * Helper to run operations within a managed transaction.
 * Automatically handles COMMIT on success and ROLLBACK on error.
 * @param {function(tx: Transaction): Promise<any>} transactionWork
 * @param {'READ' | 'WRITE'} mode
 */
export async function runCypherTransaction(transactionWork, mode = 'WRITE') {
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: mode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ,
  });

  try {
    if (mode === 'WRITE') {
      return await session.executeWrite(transactionWork);
    } else {
      return await session.executeRead(transactionWork);
    }
  } finally {
    await session.close();
  }
}

/**
 * Graceful shutdown handler.
 */
export async function closeNeo4jDriver() {
  await driver.close();
  console.log('Neo4j Driver connection pool closed.');
}

export default {
  driver,
  runCypher,
  runCypherTransaction,
  verifyNeo4jConnection,
  closeNeo4jDriver,
};
