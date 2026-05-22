require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurasi Database PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ==========================================
// 1. SETUP DATABASE SCHEMA & INDEXES (RAW SQL)
// ==========================================
const setupDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS incident_logs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      severity VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'OPEN',
      is_anomaly BOOLEAN DEFAULT FALSE,
      created_by VARCHAR(100) DEFAULT 'System',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    );
  `;
  
  // Indexing untuk mempercepat query filtering di Dashboard (Syarat Optimized SQL)
  const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_incident_severity ON incident_logs(severity);
    CREATE INDEX IF NOT EXISTS idx_incident_status ON incident_logs(status);
    CREATE INDEX IF NOT EXISTS idx_incident_created_at ON incident_logs(created_at);
  `;

  try {
    await pool.query(createTableQuery);
    await pool.query(createIndexQuery);
    console.log("✅ Database Schema & Indexes ready.");
  } catch (err) {
    console.error("❌ DB Setup Error:", err);
  }
};

// ==========================================
// 2. LOGIC DETEKSI ANOMALI (ATTENTION LOGIC)
// ==========================================
// Fungsi ini menyaring kata kunci darurat dari deskripsi insiden secara aman
const detectAnomaly = (description = '', title = '') => {
  const urgentKeywords = ['meledak', 'bocor', 'mati total', 'kebakaran', 'kritis', 'berhenti operasi'];
  const lowerDesc = String(description || '').toLowerCase();
  const lowerTitle = String(title || '').toLowerCase();
  
  // Jika ada kata kunci yang cocok, return true
  const isAnomaly = urgentKeywords.some(keyword => lowerDesc.includes(keyword) || lowerTitle.includes(keyword));
  return isAnomaly;
};


// ==========================================
// 3. CRUD API ENDPOINTS (RAW SQL, NO ORM)
// ==========================================

// A. Create Incident (POST) + Auto Anomaly Detection
app.post('/api/incidents', async (req, res) => {
  const { title, description, created_by } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title dan Description wajib diisi" });
  }

  // Terapkan Anomaly Logic
  const isAnomaly = detectAnomaly(description, title);
  console.log(`Deteksi Anomali: ${isAnomaly}`);
  // Set severity ke CRITICAL secara otomatis jika terdeteksi anomali
  const severity = isAnomaly ? 'CRITICAL' : 'LOW'; 

  try {
    const insertQuery = `
      INSERT INTO incident_logs (title, description, severity, is_anomaly, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [title, description, severity, isAnomaly, created_by || 'User'];
    
    const result = await pool.query(insertQuery, values);
    res.status(201).json({ 
        message: "Insiden berhasil dicatat", 
        data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// B. Read All Incidents (GET) - Mengabaikan data yang sudah di-soft-delete
app.get('/api/incidents', async (req, res) => {
  // Mendukung query parameter untuk filter (Contoh: /api/incidents?severity=CRITICAL&status=OPEN)
  const { severity, status } = req.query;
  
  let fetchQuery = `SELECT * FROM incident_logs WHERE deleted_at IS NULL`;
  const queryParams = [];
  let paramCount = 1;

  if (severity) {
    fetchQuery += ` AND severity = $${paramCount}`;
    queryParams.push(severity);
    paramCount++;
  }

  if (status) {
    fetchQuery += ` AND status = $${paramCount}`;
    queryParams.push(status);
    paramCount++;
  }

  // Urutkan dari yang terbaru (Memudahkan dashboard)
  fetchQuery += ` ORDER BY created_at DESC`;

  try {
    const result = await pool.query(fetchQuery, queryParams);
    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. Update Incident Status/Severity (PUT)
app.put('/api/incidents/:id', async (req, res) => {
  const { id } = req.params;
  const { status, severity } = req.body;

  try {
    const updateQuery = `
      UPDATE incident_logs 
      SET status = COALESCE($1, status), 
          severity = COALESCE($2, severity), 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [status, severity, id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Insiden tidak ditemukan" });
    res.status(200).json({ message: "Insiden diperbarui", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// D. Soft Delete Incident (DELETE)
app.delete('/api/incidents/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Kita tidak menggunakan DELETE FROM, melainkan UPDATE deleted_at
    const softDeleteQuery = `
      UPDATE incident_logs 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id;
    `;
    const result = await pool.query(softDeleteQuery, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Insiden tidak ditemukan atau sudah dihapus" });
    res.status(200).json({ message: "Insiden berhasil dihapus (Soft Delete)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inisialisasi DB dan jalankan server
setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 MVP Backend running on http://localhost:${port}`);
  });
});