# System Design, Workflow & Architecture Diagram

## GreenTrace — Incident & Anomaly Monitoring System

---

## 1. Gambaran Umum Sistem (System Overview)

GreenTrace adalah platform pemantauan insiden dan deteksi anomali lingkungan berbasis web yang dibangun untuk mendukung operasi lapangan di industri. Sistem ini memungkinkan pelaporan insiden secara real-time, deteksi otomatis anomali berbahaya berdasarkan kata kunci, dan pengelolaan data dengan akses berbasis peran (Role-Based Access Control).

---

## 2. Arsitektur Sistem (System Architecture)

Sistem terdiri dari dua bagian utama yang terpisah secara fisik: **Frontend SPA** dan **REST API Backend**, keduanya berkomunikasi menggunakan protokol HTTP/HTTPS dengan autentikasi berbasis token JWT.

```
┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              React 19 SPA (Vite + Tailwind CSS v4)               │  │
│  │                                                                    │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐   │  │
│  │   │  LoginPage  │  │  Dashboard  │  │   SettingsModal (Admin)│   │  │
│  │   └─────────────┘  └─────────────┘  └───────────────────────┘   │  │
│  │                                                                    │  │
│  │   ┌────────────────────────────────────────────────────────────┐ │  │
│  │   │  Services Layer (incidentApi | authApi | settingsApi)       │ │  │
│  │   └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                             │  HTTPS (REST API)
                             │  Bearer Token (JWT)
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express v5)                     │
│                                                                         │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────────────┐   │
│  │  Helmet     │  │   CORS Filter   │  │  express-rate-limit       │   │
│  │ (Security   │  │  (ALLOWED_      │  │  (15 req/15min on login)  │   │
│  │  Headers)   │  │   ORIGINS)      │  │                           │   │
│  └─────────────┘  └────────────────┘  └──────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Middleware Stack                                                  │ │
│  │  ┌────────────────────────┐   ┌──────────────────────────────┐   │ │
│  │  │  verifyToken (JWT)      │   │  isAdmin (Role Gate)          │   │ │
│  │  └────────────────────────┘   └──────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  API Routes                                                        │ │
│  │  POST /api/auth/login         GET  /api/auth/me                    │ │
│  │  GET  /api/settings/keywords  PUT  /api/settings/keywords          │ │
│  │  GET  /api/incidents          POST /api/incidents                  │ │
│  │  PUT  /api/incidents/:id      DELETE /api/incidents/:id            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Business Logic                                                   │   │
│  │  detectAnomaly() — ILIKE keyword match from system_settings DB   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                             │
                             │  pg (PostgreSQL Driver / SSL)
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        DATABASE (PostgreSQL)                            │
│                                                                         │
│  ┌──────────────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │   incident_logs       │   │    users      │   │ system_settings  │  │
│  │  ─────────────────── │   │ ───────────── │   │ ──────────────── │  │
│  │  id (PK)              │   │ id (PK)       │   │ key (PK)         │  │
│  │  title                │   │ username      │   │ value            │  │
│  │  description          │   │ password      │   │                  │  │
│  │  severity             │   │  (bcrypt)     │   │ URGENT_KEYWORDS  │  │
│  │  status               │   │ role          │   │ (comma-sep list) │  │
│  │  is_anomaly           │   └──────────────┘   └──────────────────┘  │
│  │  created_by           │                                              │
│  │  area                 │   Indexes:                                   │
│  │  created_at           │   • idx_incident_severity                    │
│  │  updated_at           │   • idx_incident_status                      │
│  │  deleted_at (soft)    │   • idx_incident_created_at                  │
│  └──────────────────────┘                                              │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Struktur File Proyek (Project Structure)

```
GreenTrace/
├── backend/
│   ├── .env                        ← Environment variables
│   ├── package.json                ← Dependencies: express, pg, cors, jsonwebtoken,
│   │                                  bcryptjs, helmet, express-rate-limit, dotenv
│   ├── server.js                   ← Monolithic backend: DB schema, middleware,
│   │                                  routes, business logic
│   └── api-tests/                  ← Bruno API test collection (15 test files)
│       ├── admin_login.yml
│       ├── operator_login.yml
│       ├── admin_update_keyword.yml
│       └── ...
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json                ← Dependencies: react 19, lucide-react,
    │                                  tailwindcss v4, @tailwindcss/vite
    ├── src/
    │   ├── main.jsx                ← Entry point, wraps <App> with <AuthProvider>
    │   ├── index.css               ← Tailwind v4 @import
    │   ├── App.jsx                 ← Root component: auth gate, pagination state,
    │   │                              dashboard layout, event handlers
    │   ├── contexts/
    │   │   └── AuthContext.jsx     ← JWT token management, login/logout, auto-restore
    │   ├── services/
    │   │   ├── authApi.js          ← fetch /api/auth/* (login, me)
    │   │   ├── incidentApi.js      ← fetch /api/incidents (CRUD + pagination)
    │   │   └── settingsApi.js      ← fetch /api/settings/keywords
    │   ├── components/
    │   │   ├── LoginPage.jsx       ← Split-screen login (quote + form)
    │   │   ├── Header.jsx          ← User badge, Settings button, Logout
    │   │   ├── Filters.jsx         ← Search (debounced) + severity/status dropdowns
    │   │   ├── IncidentList.jsx    ← Maps incidents → IncidentCard
    │   │   ├── IncidentCard.jsx    ← Incident display, RBAC buttons, deleted badge
    │   │   ├── CreateIncidentModal.jsx  ← Form modal for new incident
    │   │   ├── ConfirmModal.jsx    ← Confirmation modal for state changes
    │   │   └── SettingsModal.jsx   ← Admin keyword tag management
    │   └── utils/                  ← Utility functions (badges, formatters)
    └── dist/                       ← Production build output
```

---

## 4. Skema Database (Database Schema)

### 4.1 Tabel `incident_logs`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | SERIAL (PK) | Auto-increment ID |
| `title` | VARCHAR(255) | Judul insiden (wajib) |
| `description` | TEXT | Deskripsi detail kejadian (wajib) |
| `severity` | VARCHAR(50) | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` (auto-generated oleh anomaly detector) |
| `status` | VARCHAR(50) | `OPEN`, `IN_PROGRESS`, atau `RESOLVED` |
| `is_anomaly` | BOOLEAN | True jika terdeteksi anomali berbahaya |
| `created_by` | VARCHAR(100) | Username pelapor (default: dari JWT token) |
| `area` | VARCHAR(100) | Lokasi area di mana insiden terjadi |
| `created_at` | TIMESTAMP | Waktu dibuat (default: now) |
| `updated_at` | TIMESTAMP | Waktu terakhir diupdate |
| `deleted_at` | TIMESTAMP | Soft-delete marker, NULL jika aktif |

**Indexes:** `severity`, `status`, `created_at`

### 4.2 Tabel `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | SERIAL (PK) | Auto-increment ID |
| `username` | VARCHAR(50) UNIQUE | Nama pengguna unik |
| `password` | VARCHAR(255) | Hash bcrypt (cost factor: 10) |
| `role` | VARCHAR(20) | `ADMIN` atau `OPERATOR` |

### 4.3 Tabel `system_settings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `key` | VARCHAR(50) (PK) | Identifier setting |
| `value` | TEXT | Nilai setting |

**Data default:** `URGENT_KEYWORDS` = `meledak,bocor,mati total,kebakaran,kritis,berhenti operasi`

---

## 5. Alur Kerja Sistem (System Workflows)

### 5.1 Alur Autentikasi (Authentication Flow)

```
Pengguna             Frontend               Backend              Database
   │                     │                     │                     │
   │  Isi username &     │                     │                     │
   │  password, Submit   │                     │                     │
   │────────────────────▶│                     │                     │
   │                     │ POST /api/auth/login │                     │
   │                     │ (max 15 req/15 min)  │                     │
   │                     │────────────────────▶│                     │
   │                     │                     │  SELECT * FROM      │
   │                     │                     │  users WHERE        │
   │                     │                     │  username = $1      │
   │                     │                     │────────────────────▶│
   │                     │                     │◀────────────────────│
   │                     │                     │  bcrypt.compare()   │
   │                     │                     │  jwt.sign({ id,     │
   │                     │                     │   username, role },  │
   │                     │                     │   secret, 8h)       │
   │                     │◀────────────────────│                     │
   │                     │  { token, user }     │                     │
   │                     │  localStorage.       │                     │
   │                     │  setItem('token')    │                     │
   │◀────────────────────│                     │                     │
   │  Dashboard Dimuat   │                     │                     │
```

### 5.2 Alur Pelaporan Insiden + Deteksi Anomali

```
OPERATOR / ADMIN         Frontend               Backend              Database
       │                     │                     │                     │
       │  Isi form insiden   │                     │                     │
       │  & klik Submit      │                     │                     │
       │────────────────────▶│                     │                     │
       │                     │ POST /api/incidents  │                     │
       │                     │ Authorization:       │                     │
       │                     │  Bearer <token>      │                     │
       │                     │────────────────────▶│                     │
       │                     │                     │  verifyToken()      │
       │                     │                     │  (decode JWT)       │
       │                     │                     │                     │
       │                     │                     │  detectAnomaly():   │
       │                     │                     │  SELECT URGENT_     │
       │                     │                     │  KEYWORDS FROM      │
       │                     │                     │  system_settings    │
       │                     │                     │────────────────────▶│
       │                     │                     │◀────────────────────│
       │                     │                     │  Match title &      │
       │                     │                     │  description        │
       │                     │                     │  (toLowerCase +     │
       │                     │                     │   includes)         │
       │                     │                     │                     │
       │                     │                     │  severity = CRITICAL || HIGH || MEDIUM │
       │                     │                     │  (jika anomaly)     │
       │                     │                     │  severity = LOW     │
       │                     │                     │  (jika normal)      │
       │                     │                     │                     │
       │                     │                     │  INSERT INTO        │
       │                     │                     │  incident_logs      │
       │                     │                     │────────────────────▶│
       │                     │                     │◀────────────────────│
       │                     │◀────────────────────│  { data: incident } │
       │◀────────────────────│ Dashboard Refresh    │                     │
```

### 5.3 Alur Pagination & Server-side Search

```
User mengetik di          Filters.jsx          App.jsx             Backend
   search input               │                   │                   │
       │                      │                   │                   │
       │ onChange              │                   │                   │
       │─────────────────────▶│                   │                   │
       │                      │ localSearch state  │                   │
       │                      │ berubah            │                   │
       │                      │                   │                   │
       │  [400ms debounce]     │                   │                   │
       │                      │ onSearchChange()   │                   │
       │                      │──────────────────▶│                   │
       │                      │                   │ setSearchQuery()  │
       │                      │                   │ setPage(1)        │
       │                      │                   │                   │
       │                      │                   │ GET /api/incidents │
       │                      │                   │ ?search=...       │
       │                      │                   │ &page=1&limit=10  │
       │                      │                   │──────────────────▶│
       │                      │                   │                   │
       │                      │                   │                   │ SELECT COUNT(*)
       │                      │                   │                   │ ... WHERE ILIKE
       │                      │                   │                   │
       │                      │                   │                   │ SELECT * ...
       │                      │                   │                   │ LIMIT 10 OFFSET 0
       │                      │                   │◀──────────────────│
       │                      │                   │ { data, pagination}│
       │                      │                   │ setIncidents()    │
       │                      │                   │ setPagination()   │
       │◀─────────────────────│◀──────────────────│                   │
       │ Hasil pencarian       │ UI Update         │                   │
       │ tampil + controls     │                   │                   │
       │ pagination update     │                   │                   │
```

### 5.4 Alur Manajemen Status Insiden (ADMIN Only)

```
ADMIN                    Frontend              Backend              Database
  │                          │                    │                    │
  │  Klik "Proses" /         │                    │                    │
  │  "Selesaikan" /          │                    │                    │
  │  "Hapus"                 │                    │                    │
  │─────────────────────────▶│                    │                    │
  │                          │  Tampilkan         │                    │
  │                          │  ConfirmModal      │                    │
  │◀─────────────────────────│  (konfirmasi human │                    │
  │  Klik "Ya, Lanjutkan"    │   error prevention)│                    │
  │─────────────────────────▶│                    │                    │
  │                          │  PUT/DELETE        │                    │
  │                          │  /api/incidents/:id│                    │
  │                          │  Authorization:    │                    │
  │                          │   Bearer <token>   │                    │
  │                          │───────────────────▶│                    │
  │                          │                    │ verifyToken()      │
  │                          │                    │ isAdmin()          │
  │                          │                    │ (403 jika OPERATOR)│
  │                          │                    │                    │
  │                          │                    │ UPDATE/soft-DELETE │
  │                          │                    │ incident_logs      │
  │                          │                    │───────────────────▶│
  │                          │                    │◀───────────────────│
  │                          │◀───────────────────│                    │
  │◀─────────────────────────│  Dashboard Refresh │                    │
```

---

## 6. Security Architecture

### 6.1 Layer Keamanan

```
  REQUEST
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 1. NETWORK LAYER                                 │
│    • HTTPS (SSL/TLS) di server produksi          │
│    • Reverse Proxy (Nginx/Caddy)                  │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│ 2. APPLICATION LAYER — Middleware Stack           │
│    • helmet() → Security Headers                  │
│      - X-Powered-By: dihapus                      │
│      - Content-Security-Policy                    │
│      - X-Frame-Options: DENY (anti-clickjacking)  │
│    • CORS → allowedOrigins filter                 │
│    • express-rate-limit → 15 req/15 min (login)   │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│ 3. AUTH LAYER                                    │
│    • verifyToken — validasi JWT signature         │
│    • isAdmin — validasi role === 'ADMIN'          │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│ 4. DATA LAYER                                    │
│    • Parameterized Queries ($1, $2, ...) → anti-  │
│      SQL Injection                                │
│    • bcryptjs (cost 10) → password hashing        │
│    • DB SSL (DB_SSL=true) → enkripsi koneksi DB   │
│    • Error sanitization → client hanya menerima   │
│      generic error message                        │
└─────────────────────────────────────────────────┘
```

### 6.2 RBAC Matrix (Role-Based Access Control)

| Aksi | ADMIN | OPERATOR |
|---|:---:|:---:|
| Login | ✅ | ✅ |
| Lihat daftar insiden aktif | ✅ | ✅ |
| Buat insiden baru | ✅ | ✅ |
| Ubah status insiden (Proses/Selesai) | ✅ | ❌ |
| Hapus insiden (soft-delete) | ✅ | ❌ |
| Lihat data yang sudah dihapus | ✅ | ❌ |
| Kelola Urgent Keywords | ✅ | ❌ |

---

## 7. API Endpoint Reference

### Auth

| Method | Path | Auth | Desc |
|---|---|---|---|
| POST | `/api/auth/login` | Public (Rate-limited) | Login, return JWT |
| GET | `/api/auth/me` | JWT | Get current user info |

### Incidents

| Method | Path | Auth | Desc |
|---|---|---|---|
| GET | `/api/incidents` | JWT | List incidents. Query: `severity`, `status`, `search`, `page`, `limit`, `include_deleted` |
| POST | `/api/incidents` | JWT | Create incident + auto anomaly detect |
| PUT | `/api/incidents/:id` | JWT + Admin | Update status/severity |
| DELETE | `/api/incidents/:id` | JWT + Admin | Soft-delete incident |

### Settings

| Method | Path | Auth | Desc |
|---|---|---|---|
| GET | `/api/settings/keywords` | JWT + Admin | Get urgent keywords list |
| PUT | `/api/settings/keywords` | JWT + Admin | Update urgent keywords |

### Response Format — Incidents (GET)

```json
{
  "data": [...],
  "pagination": {
    "totalItems": 54,
    "totalPages": 6,
    "currentPage": 1,
    "limit": 10
  }
}
```

---

## 8. Technology Stack Summary

| Layer | Teknologi | Versi |
|---|---|---|
| **Frontend** | React | 19 |
| **Frontend Build** | Vite | 8.x |
| **Frontend Styling** | Tailwind CSS | v4 |
| **Frontend Icons** | Lucide React | latest |
| **Backend Runtime** | Node.js | 18+ |
| **Backend Framework** | Express | v5 |
| **Database** | PostgreSQL | 14+ |
| **DB Driver** | pg (node-postgres) | ^8.x |
| **Auth** | JSON Web Token (JWT) | 9h expiry: 8h |
| **Password Hashing** | bcryptjs | cost: 10 |
| **Security Headers** | Helmet | latest |
| **Rate Limiting** | express-rate-limit | latest |
| **Config** | dotenv | latest |
