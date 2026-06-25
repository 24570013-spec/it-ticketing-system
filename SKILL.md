---
name: it-ticketing-system
description: >
  Skill untuk membangun, mengembangkan, dan mendebug aplikasi IT Helpdesk Ticketing System
  berbasis Node.js + Express (backend), React + Vite (frontend), dan MySQL (database).
  Gunakan skill ini setiap kali user ingin: membuat fitur baru pada ticketing system,
  memperbaiki bug, menambah endpoint API, mengerjakan autentikasi JWT, mengelola role user
  (user/support/admin), membuat komponen React, query MySQL, atau menyusun laporan ilmiah
  terkait sistem ini. Juga gunakan ketika user menyebut "tiket", "helpdesk", "IT support",
  "status tiket", "dashboard admin", atau konteks apapun yang berkaitan dengan
  proyek ticketing IT ini.
---

# IT Helpdesk Ticketing System

Sistem manajemen tiket IT berbasis web untuk perusahaan. Dibangun dengan Node.js + Express
(backend REST API), React + Vite (frontend SPA), dan MySQL (database).

---

## Stack Teknologi

```
Backend  : Node.js + Express
Database : MySQL + mysql2
Frontend : React + Vite + Tailwind CSS
Auth     : JWT (jsonwebtoken) + bcryptjs
Tools    : Postman (dokumentasi API), VS Code / Cursor / Kiro / Antigravity
```

---

## Struktur Folder Project

```
ticketing-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # Koneksi MySQL
│   ├── controllers/
│   │   ├── authController.js      # Register, Login
│   │   ├── ticketController.js    # CRUD tiket
│   │   ├── commentController.js   # Komentar tiket
│   │   └── userController.js      # Kelola user (admin)
│   ├── middleware/
│   │   ├── authMiddleware.js      # Verifikasi JWT
│   │   └── roleMiddleware.js      # Cek role (user/support/admin)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── ticketRoutes.js
│   │   ├── commentRoutes.js
│   │   └── userRoutes.js
│   ├── .env                       # Variabel environment
│   ├── package.json
│   └── server.js                  # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── TicketCard.jsx
    │   │   └── StatusBadge.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── CreateTicket.jsx
    │   │   ├── TicketDetail.jsx
    │   │   └── AdminPanel.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state
    │   ├── services/
    │   │   └── api.js             # Axios instance + API calls
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Skema Database MySQL

### Tabel `users`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'support', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel `categories`
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL  -- Hardware, Software, Network, Account, Other
);
```

### Tabel `tickets`
```sql
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id INT,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  user_id INT NOT NULL,
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Tabel `comments`
```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tabel `ticket_logs`
```sql
CREATE TABLE ticket_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  changed_by INT NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

---

## Role & Hak Akses

| Aksi                          | User | Support | Admin |
|-------------------------------|------|---------|-------|
| Buat tiket                    | ✅   | ✅      | ✅    |
| Lihat tiket sendiri           | ✅   | ✅      | ✅    |
| Lihat semua tiket             | ❌   | ✅      | ✅    |
| Update status tiket           | ❌   | ✅      | ✅    |
| Assign tiket ke support       | ❌   | ❌      | ✅    |
| Tambah komentar               | ✅   | ✅      | ✅    |
| Kelola user                   | ❌   | ❌      | ✅    |
| Lihat dashboard & rekap       | ❌   | ✅      | ✅    |

---

## Alur Status Tiket

```
OPEN ──→ IN_PROGRESS ──→ RESOLVED ──→ CLOSED
              ↑               │
              └───────────────┘ (bisa reopen)
```

---

## Endpoint API (REST)

### Auth
```
POST /api/auth/register   → Daftar user baru
POST /api/auth/login      → Login, dapat JWT token
```

### Tickets
```
GET    /api/tickets          → Semua tiket (support/admin) / tiket sendiri (user)
GET    /api/tickets/:id      → Detail tiket
POST   /api/tickets          → Buat tiket baru
PATCH  /api/tickets/:id      → Update status/assign (support/admin)
DELETE /api/tickets/:id      → Hapus tiket (admin)
```

### Comments
```
GET  /api/tickets/:id/comments   → Semua komentar tiket
POST /api/tickets/:id/comments   → Tambah komentar
```

### Users (Admin only)
```
GET    /api/users          → Semua user
PATCH  /api/users/:id      → Update role user
DELETE /api/users/:id      → Hapus user
```

---

## Konfigurasi .env Backend

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ticketing_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

---

## Panduan Coding

### Pattern Controller
Setiap controller mengikuti pola:
1. Ambil data dari `req.body` / `req.params` / `req.user`
2. Query ke database via `db.js`
3. Return JSON response dengan status code yang tepat

### Pattern Middleware Auth
```javascript
// authMiddleware.js — selalu gunakan ini untuk route yang butuh login
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token invalid' });
    req.user = decoded;
    next();
  });
};
```

### Pattern Frontend API Call
```javascript
// services/api.js — selalu gunakan instance ini, bukan fetch langsung
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
```

---

## Laporan Ilmiah — Kerangka 5W+2H

| Pertanyaan  | Jawaban |
|-------------|---------|
| **What**    | Aplikasi web IT Helpdesk Ticketing System untuk manajemen laporan masalah IT |
| **Who**     | Karyawan (user), Tim IT Support, Administrator sistem |
| **Where**   | Diakses via browser di lingkungan perusahaan (localhost/hosting) |
| **When**    | Kapan saja saat ada masalah IT yang perlu dilaporkan & ditangani |
| **Why**     | Pencatatan masalah IT manual tidak terstruktur, sulit dilacak & direkap |
| **How**     | Node.js + Express (API), React (UI), MySQL (data), JWT (autentikasi) |
| **How Much**| Gratis dan open source, dapat dijalankan di server lokal maupun VPS |

---

## Urutan Pengerjaan yang Disarankan

```
1. Buat database MySQL & jalankan semua DDL script
2. Setup backend (server.js, db.js, .env)
3. Buat authController + routes (register/login)
4. Buat ticketController + routes (CRUD)
5. Buat commentController + routes
6. Test semua endpoint via Postman
7. Setup frontend React + Vite
8. Buat AuthContext + halaman Login/Register
9. Buat halaman Dashboard, CreateTicket, TicketDetail
10. Buat AdminPanel
11. Uji end-to-end semua fitur
12. Susun laporan ilmiah
```

---

## Catatan Penting

- Selalu hash password dengan `bcryptjs` sebelum simpan ke DB
- JWT token disimpan di `localStorage` pada frontend
- Gunakan `PATCH` (bukan `PUT`) untuk update sebagian field tiket
- Setiap perubahan status tiket wajib dicatat ke tabel `ticket_logs`
- Frontend menggunakan React Router v6 untuk navigasi antar halaman
- Tailwind CSS untuk styling — hindari CSS custom kecuali perlu
