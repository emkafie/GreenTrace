# GreenTrace

**Incident & Anomaly Monitoring System** — Platform pemantauan insiden dan deteksi anomali lingkungan berbasis web untuk mendukung operasi lapangan industri secara real-time.

---

## Deskripsi Singkat

GreenTrace adalah sistem dashboard yang memungkinkan tim lapangan untuk:
- Melaporkan insiden lingkungan secara real-time
- Mendeteksi anomali berbahaya secara otomatis berdasarkan kata kunci yang dapat dikonfigurasi
- Mengelola status insiden dengan role-based access control (ADMIN / OPERATOR)
- Menelusuri riwayat insiden dengan fitur pencarian dan pagination yang efisien

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔐 **JWT Authentication** | Login aman dengan token berbatas waktu (8 jam) |
| 👥 **Role-Based Access Control** | ADMIN (full access) vs OPERATOR (laporan & lihat saja) |
| 🤖 **Deteksi Anomali Otomatis** | Keyword matching dari database — dapat dikonfigurasi via UI |
| 🔍 **Server-side Search** | Pencarian langsung di PostgreSQL dengan `ILIKE`, tidak membebani client |
| 📄 **Pagination** | 10 insiden per halaman, navigasi Sebelumnya/Selanjutnya dengan ringkasan total |
| 🛡️ **Security Hardened** | Helmet headers, rate limiting, CORS restrictions, error sanitization |
| 🗑️ **Soft Delete** | Data tidak benar-benar dihapus — admin dapat melihat riwayat terhapus |
| ⚙️ **Manajemen Keywords** | Admin dapat menambah/hapus kata kunci anomali via modal UI |
| ✅ **Confirm Modal** | Konfirmasi human-error prevention sebelum aksi kritis dieksekusi |
| 📱 **Responsive Design** | Tampilan optimal di desktop dan mobile (login split-screen) |

---

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Lucide React |
| Backend | Node.js 18+, Express v5 |
| Database | PostgreSQL 14+ |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, express-rate-limit |
| DB Driver | pg (node-postgres) |
| Config | dotenv |

---

## Struktur Proyek

```
GreenTrace/
├── backend/
│   ├── .env                  ← Environment variables
│   ├── package.json
│   ├── server.js             ← API server (Express + PostgreSQL)
│   └── api-tests/            ← Bruno API test collection
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           ← Root component (dashboard + pagination)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   ├── authApi.js
│   │   │   ├── incidentApi.js
│   │   │   └── settingsApi.js
│   │   └── components/
│   │       ├── LoginPage.jsx
│   │       ├── Header.jsx
│   │       ├── Filters.jsx
│   │       ├── IncidentList.jsx
│   │       ├── IncidentCard.jsx
│   │       ├── CreateIncidentModal.jsx
│   │       ├── ConfirmModal.jsx
│   │       └── SettingsModal.jsx
│   └── package.json
│
├── SYSTEM_DESIGN.md          ← Arsitektur sistem, diagram alur, skema DB, API reference
├── DEPLOYMENT_GUIDE.md       ← Panduan deployment, env variables, Nginx, PM2
└── README.md                 ← Dokumen ini
```

---

## Cara Menjalankan Secara Lokal (Development)

### Prasyarat

- Node.js >= 18
- PostgreSQL >= 14 (running locally atau via cloud)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/greentrace.git
cd greentrace
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Salin template environment variable
cp .env.example .env
# Edit .env dengan konfigurasi database lokal Anda
```

**Isi `.env` minimal untuk dev lokal:**
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=dev_secret_key_for_local_only
DB_USER=postgres
DB_HOST=localhost
DB_NAME=greentrace_db
DB_PASSWORD=your_local_password
DB_PORT=5432
DB_SSL=false
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

```bash
# Buat database di PostgreSQL terlebih dahulu:
# psql -U postgres -c "CREATE DATABASE greentrace_db;"

# Jalankan server (tabel dibuat otomatis saat startup)
node server.js
```

Output yang diharapkan:
```
✅ Database Schema & Indexes ready.
✅ Default users seeded (admin_utama / operator_satu).
✅ Default urgent keywords seeded.
🚀 MVP Backend running on http://localhost:3000
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Frontend tersedia di: **http://localhost:5173**

---

## Akun Default untuk Testing

| Username | Password | Role |
|---|---|---|
| `admin_utama` | `admin123` | ADMIN |
| `operator_satu` | `operator123` | OPERATOR |

> ⚠️ **Ganti password default segera setelah deployment ke production.**

---

## API Endpoints (Ringkasan)

### Autentikasi
```
POST   /api/auth/login       # Login (rate-limited: 15 req/15 min)
GET    /api/auth/me          # Profil user dari token
```

### Insiden
```
GET    /api/incidents        # Daftar insiden (pagination, search, filter)
POST   /api/incidents        # Buat insiden baru + deteksi anomali
PUT    /api/incidents/:id    # Update status/severity [Admin only]
DELETE /api/incidents/:id    # Soft-delete [Admin only]
```

### Settings
```
GET    /api/settings/keywords   # Ambil urgent keywords [Admin only]
PUT    /api/settings/keywords   # Update urgent keywords [Admin only]
```

Detail lengkap API dan request/response format tersedia di **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)**.

---

## Deployment ke Production

Lihat panduan lengkap di **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** yang mencakup:

- Konfigurasi environment variables produksi
- Setup Nginx sebagai reverse proxy + HTTPS (Let's Encrypt)
- Menjalankan server dengan PM2 (cluster mode + auto-restart)
- Opsi hosting frontend (Vercel, Netlify, Nginx static)
- Opsi database cloud (Supabase, Neon, Railway, AWS RDS)
- Checklist pre-deployment
- Monitoring, backup, dan troubleshooting

---

## Dokumentasi Teknis

| Dokumen | Isi |
|---|---|
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arsitektur sistem, workflow diagram, database schema, security layers, API reference |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Panduan deployment production, env config, Nginx, PM2, database setup, maintenance |