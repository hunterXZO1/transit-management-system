import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MySQL Connection Pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transit_management',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ status: 'healthy', database: 'connected', solution: rows[0].solution });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 1. PASSENGERS ENDPOINTS
app.get('/api/passengers', async (req, res) => {
  try {
    const [passengers] = await pool.query(`
      SELECT p.*, GROUP_CONCAT(pc.phone_number) as contacts
      FROM passengers p
      LEFT JOIN passenger_contacts pc ON p.passenger_id = pc.passenger_id
      GROUP BY p.passenger_id
      ORDER BY p.created_at DESC
    `);
    const formatted = passengers.map((p) => ({
      passengerId: p.passenger_id,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
      gender: p.gender,
      dob: p.dob ? p.dob.toISOString().split('T')[0] : '',
      doorNo: p.door_no,
      street: p.street,
      city: p.city,
      state: p.state,
      pin: p.pin,
      phoneNumbers: p.contacts ? p.contacts.split(',') : [],
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/passengers', async (req, res) => {
  const p = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO passengers (passenger_id, first_name, last_name, email, gender, dob, door_no, street, city, state, pin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.passengerId, p.firstName, p.lastName, p.email, p.gender, p.dob, p.doorNo, p.street, p.city, p.state, p.pin]
    );

    if (p.phoneNumbers && p.phoneNumbers.length > 0) {
      const contactValues = p.phoneNumbers.map((ph) => [p.passengerId, ph]);
      await conn.query(
        `INSERT INTO passenger_contacts (passenger_id, phone_number) VALUES ?`,
        [contactValues]
      );
    }
    await conn.commit();
    res.status(201).json({ success: true, data: p });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/passengers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM passengers WHERE passenger_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Passenger deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. ROUTES & STATIONS ENDPOINTS
app.get('/api/routes', async (req, res) => {
  try {
    const [routes] = await pool.query('SELECT * FROM routes ORDER BY route_id');
    const formatted = routes.map((r) => ({
      routeId: r.route_id,
      name: r.name,
      type: r.type,
      totalDistanceKm: Number(r.total_distance_km),
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stations', async (req, res) => {
  try {
    const [stations] = await pool.query('SELECT * FROM stations ORDER BY station_id');
    const formatted = stations.map((s) => ({
      stationId: s.station_id,
      name: s.name,
      city: s.city,
      area: s.area,
      landmark: s.landmark,
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`TransitFlow Backend API listening on http://localhost:${PORT}`);
});
