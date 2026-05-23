require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;

// Enforce JWT_SECRET in production mode
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ CRITICAL ERROR: JWT_SECRET environment variable is missing. Server cannot start in production.");
    process.exit(1);
  }
  console.warn("⚠️ WARNING: JWT_SECRET environment variable is missing. Using insecure fallback secret key for development.");
  return 'dev_fallback_secret_key_2026';
})();

// Middleware CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Konfigurasi Database PostgreSQL
const dbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

// Enable SSL dynamically (useful for cloud database like Supabase or AWS RDS)
if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(dbConfig);

// ==========================================
// 1. SETUP DATABASE SCHEMA & INDEXES (RAW SQL)
// ==========================================
const setupDatabase = async () => {
  // --- Incident Logs Table ---
  const createIncidentTable = `
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

  // --- Users Table ---
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR'
    );
  `;

  // --- System Settings Table ---
  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL
    );
  `;

  // Indexing untuk mempercepat query filtering di Dashboard
  const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_incident_severity ON incident_logs(severity);
    CREATE INDEX IF NOT EXISTS idx_incident_status ON incident_logs(status);
    CREATE INDEX IF NOT EXISTS idx_incident_created_at ON incident_logs(created_at);
  `;

  try {
    await pool.query(createIncidentTable);
    await pool.query(createUsersTable);
    await pool.query(createSettingsTable);
    await pool.query(createIndexQuery);
    console.log("✅ Database Schema & Indexes ready.");

    // Seed default users (hanya jika belum ada)
    const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      const operatorHash = await bcrypt.hash('operator123', 10);

      await pool.query(
        `INSERT INTO users (username, password, role) VALUES ($1, $2, $3), ($4, $5, $6)`,
        ['admin_utama', adminHash, 'ADMIN', 'operator_satu', operatorHash, 'OPERATOR']
      );
      console.log("✅ Default users seeded (admin_utama / operator_satu).");
    }

    // Seed default keywords (hanya jika belum ada)
    const existingSettings = await pool.query(
      `SELECT COUNT(*) FROM system_settings WHERE key = 'URGENT_KEYWORDS'`
    );
    if (parseInt(existingSettings.rows[0].count) === 0) {
      await pool.query(
        `INSERT INTO system_settings (key, value) VALUES ($1, $2)`,
        ['URGENT_KEYWORDS', 'meledak,bocor,mati total,kebakaran,kritis,berhenti operasi']
      );
      console.log("✅ Default urgent keywords seeded.");
    }
  } catch (err) {
    console.error("❌ DB Setup Error:", err);
  }
};

// ==========================================
// 2. MIDDLEWARE: AUTH & RBAC
// ==========================================

// Verify JWT Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah expired.' });
  }
};

// Check Admin Role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya ADMIN yang diizinkan.' });
  }
  next();
};

// ==========================================
// 3. LOGIC DETEKSI ANOMALI (DYNAMIC KEYWORDS)
// ==========================================
const detectAnomaly = async (description = '', title = '') => {
  // Ambil keywords dari database
  let urgentKeywords = ['meledak', 'bocor', 'mati total', 'kebakaran', 'kritis', 'berhenti operasi'];

  try {
    const result = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'URGENT_KEYWORDS'`
    );
    if (result.rows.length > 0) {
      urgentKeywords = result.rows[0].value.split(',').map(k => k.trim()).filter(Boolean);
    }
  } catch (err) {
    console.error('⚠️ Gagal mengambil keywords dari DB, menggunakan default:', err.message);
  }

  const lowerDesc = String(description || '').toLowerCase();
  const lowerTitle = String(title || '').toLowerCase();

  const isAnomaly = urgentKeywords.some(
    keyword => lowerDesc.includes(keyword.toLowerCase()) || lowerTitle.includes(keyword.toLowerCase())
  );
  return isAnomaly;
};


// ==========================================
// 4. AUTH ENDPOINTS
// ==========================================

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Get Current User Info (from token)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// ==========================================
// 5. SETTINGS ENDPOINTS (ADMIN ONLY)
// ==========================================

// Get Urgent Keywords
app.get('/api/settings/keywords', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'URGENT_KEYWORDS'`
    );

    const keywords = result.rows.length > 0
      ? result.rows[0].value.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    res.status(200).json({ keywords });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Update Urgent Keywords
app.put('/api/settings/keywords', verifyToken, isAdmin, async (req, res) => {
  const { keywords } = req.body;

  if (!Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Keywords harus berupa array.' });
  }

  const keywordsString = keywords.map(k => k.trim()).filter(Boolean).join(',');

  try {
    await pool.query(
      `INSERT INTO system_settings (key, value) VALUES ('URGENT_KEYWORDS', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [keywordsString]
    );

    res.status(200).json({ message: 'Keywords berhasil diperbarui.', keywords: keywordsString.split(',') });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// ==========================================
// 6. CRUD API ENDPOINTS (RAW SQL, NO ORM)
// ==========================================

// A. Create Incident (POST) + Auto Anomaly Detection
app.post('/api/incidents', verifyToken, async (req, res) => {
  const { title, description, created_by } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title dan Description wajib diisi" });
  }

  // Terapkan Anomaly Logic (sekarang async — mengambil keywords dari DB)
  const isAnomaly = await detectAnomaly(description, title);
  console.log(`Deteksi Anomali: ${isAnomaly}`);
  const severity = isAnomaly ? 'CRITICAL' : 'LOW';

  try {
    const insertQuery = `
      INSERT INTO incident_logs (title, description, severity, is_anomaly, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    // Gunakan username dari token jika created_by tidak diberikan
    const reporter = created_by || req.user.username || 'User';
    const values = [title, description, severity, isAnomaly, reporter];

    const result = await pool.query(insertQuery, values);
    res.status(201).json({
      message: "Insiden berhasil dicatat",
      data: result.rows[0]
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// B. Read All Incidents (GET) — mendukung include_deleted untuk admin
app.get('/api/incidents', verifyToken, async (req, res) => {
  const { severity, status, include_deleted } = req.query;

  // Tentukan base WHERE: admin bisa lihat data terhapus
  let fetchQuery;
  if (include_deleted === 'true' && req.user.role === 'ADMIN') {
    fetchQuery = `SELECT * FROM incident_logs WHERE 1=1`;
  } else {
    fetchQuery = `SELECT * FROM incident_logs WHERE deleted_at IS NULL`;
  }

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

  // Urutkan dari yang terbaru
  fetchQuery += ` ORDER BY created_at DESC`;

  try {
    const result = await pool.query(fetchQuery, queryParams);
    res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// C. Update Incident Status/Severity (PUT) — Admin Only
app.put('/api/incidents/:id', verifyToken, isAdmin, async (req, res) => {
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
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// D. Soft Delete Incident (DELETE) — Admin Only
app.delete('/api/incidents/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
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
    console.error('API Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Inisialisasi DB dan jalankan server
setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 MVP Backend running on http://localhost:${port}`);
  });
});