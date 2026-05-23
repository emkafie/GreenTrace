# Deployment & High Availability Guideline

## GreenTrace — Incident & Anomaly Monitoring System

---

## 1. Gambaran Arsitektur Deployment (Deployment Architecture Overview)

Panduan ini mencakup prosedur deployment standar yang direkomendasikan untuk GreenTrace, mulai dari konfigurasi environment variable, hosting platform yang disarankan, hingga strategi high availability dasar.

```
                            ┌─────────────────────────────┐
                            │    PENGGUNA (Browser)        │
                            │  Admin / Operator            │
                            └──────────────┬──────────────┘
                                           │ HTTPS
                                           ▼
                            ┌─────────────────────────────┐
                            │     CDN / Hosting Frontend   │
                            │  (Vercel / Netlify / S3)     │
                            │  React SPA (Static Build)    │
                            └──────────────┬──────────────┘
                                           │ HTTPS REST API
                                           ▼
                            ┌─────────────────────────────┐
                            │  Reverse Proxy (Nginx)       │
                            │  • SSL Termination (HTTPS)   │
                            │  • Load Balancing (opsional) │
                            │  • Rate Limiting (tambahan)   │
                            └──────────────┬──────────────┘
                                           │ HTTP (lokal)
                                           ▼
                            ┌─────────────────────────────┐
                            │  Backend Server              │
                            │  Node.js + Express v5        │
                            │  (PM2 Cluster Mode)          │
                            │  PORT: 3000                  │
                            └──────────────┬──────────────┘
                                           │ SSL/TLS
                                           ▼
                            ┌─────────────────────────────┐
                            │  Database                    │
                            │  PostgreSQL 14+              │
                            │  (Cloud Managed: Supabase /  │
                            │   AWS RDS / Neon / Railway)  │
                            └─────────────────────────────┘
```

---

## 2. Environment Variables

### 2.1 Backend (`/backend/.env`)

Salin dan isi file `.env` berikut sebelum menjalankan server:

```env
# ======================================================
# GREENTRACE BACKEND — Environment Variables
# Salin file ini ke .env dan isi sesuai environment Anda
# ======================================================

# Server
PORT=3000
NODE_ENV=production

# JWT Authentication
# Generate secret kuat: node -e "require('crypto').randomBytes(64).toString('hex')"
JWT_SECRET=YOUR_STRONG_RANDOM_SECRET_64_CHARS_MINIMUM

# CORS (daftar domain frontend yang diizinkan, pisahkan dengan koma)
# Contoh: https://greentrace.company.com,https://app.company.com
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Database — Pilih salah satu:
# Opsi A: Unified Connection String (Supabase / Neon / Railway / Heroku)
DATABASE_URL=postgresql://user:password@host:5432/greentrace_db

# Opsi B: Parameter individual (self-hosted PostgreSQL)
DB_USER=greentrace_user
DB_HOST=db.your-server.com
DB_NAME=greentrace_db
DB_PASSWORD=your_secure_db_password
DB_PORT=5432

# SSL Database (set ke 'true' untuk cloud managed database)
DB_SSL=true
```

> **⚠️ Penting:** Jangan pernah menyimpan file `.env` di Git. Pastikan `.env` sudah tercantum di `.gitignore`.

### 2.2 Frontend (`/frontend/.env.production`)

Buat file `.env.production` di folder frontend:

```env
# URL backend API untuk production
VITE_API_BASE_URL=https://your-backend-api-domain.com
```

Untuk development lokal (`.env.local` atau gunakan fallback default):
```env
VITE_API_BASE_URL=http://localhost:3000
```

> **Catatan:** Vite secara otomatis membaca `.env.production` saat menjalankan `npm run build`.

---

## 3. Deployment Backend

### 3.1 Instalasi Dependencies

```bash
cd backend
npm install --production
```

### 3.2 Menjalankan Server dengan PM2 (Rekomendasi Produksi)

[PM2](https://pm2.keymetrics.io/) adalah process manager untuk Node.js yang mendukung auto-restart, clustering, dan monitoring log.

**Install PM2 secara global:**
```bash
npm install -g pm2
```

**Jalankan dengan Cluster Mode** (memanfaatkan semua CPU core):
```bash
pm2 start server.js --name "greentrace-backend" -i max
```

**Buat startup script agar PM2 aktif otomatis saat server reboot:**
```bash
pm2 startup
pm2 save
```

**Perintah PM2 yang berguna:**
```bash
pm2 status                     # Lihat status semua proses
pm2 logs greentrace-backend    # Lihat log aplikasi
pm2 restart greentrace-backend # Restart aplikasi
pm2 stop greentrace-backend    # Hentikan aplikasi
pm2 monit                      # Dashboard monitoring real-time
```

### 3.3 Konfigurasi Nginx sebagai Reverse Proxy

Contoh konfigurasi Nginx (`/etc/nginx/sites-available/greentrace`):

```nginx
server {
    listen 80;
    server_name api.greentrace.company.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.greentrace.company.com;

    ssl_certificate     /etc/letsencrypt/live/api.greentrace.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.greentrace.company.com/privkey.pem;

    # Security Headers tambahan di level Nginx
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass          http://localhost:3000;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade $http_upgrade;
        proxy_set_header    Connection 'upgrade';
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto $scheme;
        proxy_cache_bypass  $http_upgrade;
    }
}
```

**Aktifkan site dan reload Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/greentrace /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Setup SSL gratis dengan Let's Encrypt (Certbot):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.greentrace.company.com
```

---

## 4. Deployment Frontend

### 4.1 Build Production Bundle

```bash
cd frontend
npm install
npm run build
```

Output tersimpan di folder `dist/`.

### 4.2 Opsi Hosting Frontend

#### A. Vercel (Rekomendasi untuk kesederhanaan)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy dari folder frontend
cd frontend
vercel --prod
```

Set environment variable di Vercel Dashboard:
- Key: `VITE_API_BASE_URL`
- Value: `https://api.greentrace.company.com`

#### B. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build dan deploy
cd frontend
netlify deploy --prod --dir=dist
```

Tambahkan file `frontend/public/_redirects` untuk SPA routing:
```
/*    /index.html    200
```

#### C. Nginx Static Hosting (Self-hosted)

```nginx
server {
    listen 443 ssl;
    server_name greentrace.company.com;

    ssl_certificate     /etc/letsencrypt/live/greentrace.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/greentrace.company.com/privkey.pem;

    root /var/www/greentrace-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html; # SPA fallback
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Copy build ke server
rsync -avz frontend/dist/ user@server:/var/www/greentrace-frontend/dist/
```

---

## 5. Setup Database (PostgreSQL)

### 5.1 Self-hosted PostgreSQL (Ubuntu/Debian)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Buat database dan user
sudo -u postgres psql
```

```sql
CREATE DATABASE greentrace_db;
CREATE USER greentrace_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE greentrace_db TO greentrace_user;
```

### 5.2 Cloud Managed (Rekomendasi)

Pilihan terbaik untuk deployment mudah dan terpercaya:

| Platform | Keunggulan | Catatan |
|---|---|---|
| **Supabase** | PostgreSQL managed, free tier tersedia, SSL otomatis | Gunakan connection string dari dashboard |
| **Neon** | Serverless PostgreSQL, auto-scale, branching | Ideal untuk tim kecil |
| **Railway** | Deploy database + backend dalam satu platform | CI/CD terintegrasi |
| **AWS RDS** | Enterprise-grade, high availability, backup otomatis | Cocok untuk skala besar |

**Contoh connection string Supabase:**
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DB_SSL=true
```

### 5.3 Pembuatan Skema Database

Saat server pertama kali dijalankan (`node server.js`), fungsi `setupDatabase()` akan secara otomatis:
- Membuat tabel `incident_logs`, `users`, `system_settings`
- Membuat indexes pada `severity`, `status`, `created_at`
- Menyeeding akun default (hanya jika tabel `users` kosong)
- Menyeeding default urgent keywords

> **Catatan Penting:** Setelah server pertama berhasil jalan dan tabel terbuat, perubahan skema di masa depan harus dilakukan secara manual menggunakan perintah SQL `ALTER TABLE` karena fungsi ini menggunakan `CREATE TABLE IF NOT EXISTS` dan tidak akan mengeksekusi ulang jika tabel sudah ada.

---

## 6. Akun Default Sistem

> **⚠️ Wajib Diganti Setelah Deployment Pertama!**

| Username | Password | Role |
|---|---|---|
| `admin_utama` | `admin123` | ADMIN |
| `operator_satu` | `operator123` | OPERATOR |

**Cara mengganti password (gunakan psql atau Supabase SQL editor):**

```sql
-- Generate hash baru terlebih dahulu menggunakan Node.js:
-- node -e "const b = require('bcryptjs'); b.hash('NewPassword123', 10, (err, h) => console.log(h));"

UPDATE users
SET password = '$2a$10$...'  -- ganti dengan hash dari perintah di atas
WHERE username = 'admin_utama';
```

---

## 7. Checklist Pre-Deployment

Lakukan pengecekan berikut sebelum rilis ke production:

```
KONFIGURASI
[ ] File .env backend sudah terisi lengkap dan tidak masuk Git
[ ] JWT_SECRET sudah diisi dengan string acak minimal 64 karakter
[ ] NODE_ENV=production sudah diset
[ ] ALLOWED_ORIGINS hanya berisi domain frontend yang sah
[ ] DATABASE_URL atau DB_* variables sudah benar
[ ] DB_SSL=true untuk cloud database

KEAMANAN
[ ] Default password admin_utama dan operator_satu sudah diganti
[ ] Server PostgreSQL tidak accessible dari public internet
[ ] HTTPS sudah aktif (SSL certificate terpasang)
[ ] Firewall hanya membuka port 80, 443 (dan 22 untuk SSH)

DEPLOYMENT
[ ] npm run build berjalan tanpa error di frontend
[ ] node server.js berjalan dan menampilkan "Database Schema & Indexes ready"
[ ] Nginx reverse proxy sudah terkonfigurasi dan berjalan
[ ] PM2 sudah disetup dengan startup script

VERIFIKASI FUNGSIONAL
[ ] Login berhasil dari browser menggunakan domain produksi
[ ] Buat insiden baru → anomaly detection bekerja
[ ] Filter, search, dan pagination berfungsi
[ ] Admin dapat mengubah status dan menghapus insiden
[ ] Operator tidak dapat mengakses fungsi admin (403)
[ ] Settings modal bisa menambah/menghapus urgent keywords
```

---

## 8. Monitoring & Maintenance

### 8.1 Log Monitoring dengan PM2

```bash
# Lihat log real-time
pm2 logs greentrace-backend --lines 100

# Simpan log ke file
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8.2 Health Check Endpoint (Rekomendasi Tambahan)

Tambahkan endpoint health check dasar di `server.js` untuk monitoring uptime:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 8.3 Backup Database PostgreSQL

**Backup harian (tambahkan ke crontab):**
```bash
# Buka crontab
crontab -e

# Tambahkan baris berikut (backup setiap hari jam 02:00)
0 2 * * * pg_dump -U greentrace_user -h localhost greentrace_db > /backups/greentrace_$(date +\%Y\%m\%d).sql
```

**Untuk cloud managed database** (Supabase/RDS): Aktifkan fitur automated backup dari dashboard masing-masing platform.

---

## 9. Troubleshooting Umum

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `❌ CRITICAL ERROR: JWT_SECRET missing` | `JWT_SECRET` kosong di `.env` | Tambahkan `JWT_SECRET` ke environment variables |
| Frontend tidak bisa konek ke API | CORS error / URL salah | Periksa `ALLOWED_ORIGINS` di backend dan `VITE_API_BASE_URL` di frontend |
| Error koneksi database | SSL, credentials salah, atau DB tidak jalan | Periksa `DATABASE_URL` dan `DB_SSL`, test koneksi manual |
| Login selalu gagal setelah beberapa percobaan | Rate limiter aktif | Tunggu 15 menit atau restart server untuk dev |
| `429 Too Many Requests` saat login | Rate limit tercapai | Normal. Ini mekanisme keamanan brute-force protection |
| Tabel tidak terbuat otomatis | Error koneksi DB saat startup | Periksa log `setupDatabase()` di console PM2 |
