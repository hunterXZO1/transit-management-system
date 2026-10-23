import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transit_management',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // DATE -> 'YYYY-MM-DD', TIME -> 'HH:MM:SS', DECIMAL -> number
  dateStrings: true,
  decimalNumbers: true,
};

export const pool = mysql.createPool(dbConfig);

export async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function checkMysqlHealth() {
  const [rows] = await pool.query('SELECT 1 + 1 AS solution, DATABASE() AS schemaName, VERSION() AS version');
  return rows[0];
}
