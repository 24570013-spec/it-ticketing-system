-- ============================================================
-- Seed Data: Tiket selama Juni 2026 (data realistis)
-- Jalankan SETELAH migration 006_add_categories.sql
-- Usage: mysql -u root -p ticketing_db < backend/db/migrations/007_seed_tickets.sql
-- ============================================================

USE ticketing_db;

-- ── Seed Users (selain admin) ─────────────────────────────────────────────────
-- Password semua user: User1234!
-- hash: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi.
INSERT IGNORE INTO users (id, name, email, password_hash, role, created_at) VALUES
  (2, 'Budi Santoso',    'budi@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-01 08:00:00'),
  (3, 'Siti Rahayu',     'siti@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-02 09:00:00'),
  (4, 'Andi Wijaya',     'andi@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-03 10:00:00'),
  (5, 'Dewi Kurniawan',  'dewi@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-05 08:30:00'),
  (6, 'Rudi Hermawan',   'rudi@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-06 09:15:00'),
  (7, 'Maya Sari',       'maya@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-07 11:00:00'),
  (8, 'Hendra Gunawan',  'hendra@ticketing.com',  '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-08 08:45:00'),
  (9, 'Rina Wati',       'rina@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-10 10:30:00'),
  (10,'Agus Prasetyo',   'agus@ticketing.com',    '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha', 'user',  '2026-05-12 09:00:00');

-- ── Pastikan categories ada ───────────────────────────────────────────────────
INSERT IGNORE INTO categories (id, name, description) VALUES
  (1, 'Maintenance',    'Perawatan dan perbaikan perangkat'),
  (2, 'Request',        'Permintaan layanan IT'),
  (3, 'Infrastructure', 'Jaringan dan infrastruktur IT'),
  (4, 'EDC Machine',    'Mesin EDC dan payment terminal'),
  (5, 'Software',       'Masalah aplikasi dan software'),
  (6, 'Hardware',       'Masalah perangkat keras');

-- ── Seed Tickets Juni 2026 ────────────────────────────────────────────────────
-- Minggu 1: 1-7 Juni
INSERT INTO tickets (title, description, status, priority, category_id, user_id, assigned_to, created_at, updated_at, sla_deadline) VALUES
('Monitor tidak menyala di meja kasir', 'Monitor kasir tiba-tiba mati, sudah coba restart tapi tetap tidak menyala. Lampu power berkedip merah.', 'closed', 'high', 6, 2, 1, '2026-06-01 08:15:00', '2026-06-01 14:30:00', '2026-06-01 16:15:00'),
('Request instalasi software akuntansi', 'Mohon bantu install software Accurate 5 di laptop Finance dept. License sudah tersedia.', 'resolved', 'medium', 2, 3, 1, '2026-06-01 09:30:00', '2026-06-02 10:00:00', '2026-06-02 09:30:00'),
('Printer tidak bisa print dari semua komputer', 'Printer HP LaserJet di lantai 2 tidak bisa diakses dari semua PC. Error "printer offline".', 'closed', 'high', 6, 4, 1, '2026-06-01 10:00:00', '2026-06-01 15:45:00', '2026-06-01 18:00:00'),
('Internet lambat di ruang operasional', 'Koneksi internet sangat lambat sejak pagi. Speed test hanya 1 Mbps padahal seharusnya 100 Mbps.', 'closed', 'high', 3, 5, 1, '2026-06-02 08:05:00', '2026-06-02 11:20:00', '2026-06-02 10:05:00'),
('Keyboard laptop rusak beberapa tombol', 'Tombol A, S, D pada keyboard laptop Lenovo ThinkPad tidak berfungsi. Butuh penggantian keyboard.', 'resolved', 'medium', 6, 6, 1, '2026-06-02 09:45:00', '2026-06-03 14:00:00', '2026-06-03 09:45:00'),
('EDC BRI tidak bisa transaksi', 'Mesin EDC BRI menampilkan error "Cannot Connect to Host" saat proses payment. Customer tidak bisa bayar kartu.', 'closed', 'high', 4, 7, 1, '2026-06-02 10:30:00', '2026-06-02 12:45:00', '2026-06-02 12:30:00'),
('Request tambah RAM laptop manager', 'Laptop Asus Manager Marketing perlu upgrade RAM dari 8GB ke 16GB karena sering hang saat multitasking.', 'closed', 'medium', 2, 8, 1, '2026-06-03 08:20:00', '2026-06-04 16:00:00', '2026-06-04 08:20:00'),
('Virus terdeteksi di PC accounting', 'Antivirus melaporkan ada trojan di folder Documents PC accounting. Butuh pembersihan dan scan menyeluruh.', 'closed', 'high', 5, 9, 1, '2026-06-03 09:00:00', '2026-06-03 13:30:00', '2026-06-03 11:00:00'),
('CCTV tidak merekam di area gudang', 'Kamera CCTV area gudang belakang tidak merekam sejak 2 hari lalu. Tampilan layar monitor hitam.', 'resolved', 'medium', 1, 10, 1, '2026-06-03 10:15:00', '2026-06-05 11:00:00', '2026-06-04 10:15:00'),
('Email tidak bisa kirim attachment besar', 'Gagal kirim email dengan attachment lebih dari 5MB. Error "Message too large". Butuh penyesuaian limit.', 'closed', 'low', 5, 2, 1, '2026-06-04 08:30:00', '2026-06-05 10:00:00', '2026-06-07 08:30:00'),

-- Minggu 2: 8-14 Juni
('Switch jaringan lantai 3 mati mendadak', 'Switch utama lantai 3 mati, semua komputer di lantai 3 tidak bisa akses internet dan server.', 'closed', 'high', 3, 3, 1, '2026-06-08 07:55:00', '2026-06-08 10:30:00', '2026-06-08 09:55:00'),
('Request setup VPN untuk WFH', 'Mohon bantu setup VPN di laptop pribadi untuk keperluan WFH. Sudah punya credential VPN dari IT.', 'closed', 'medium', 2, 4, 1, '2026-06-08 09:00:00', '2026-06-09 14:00:00', '2026-06-09 09:00:00'),
('EDC Mandiri gagal settlement', 'Mesin EDC Mandiri tidak bisa settlement akhir hari. Error code 91. Sudah coba restart tapi tetap gagal.', 'closed', 'high', 4, 5, 1, '2026-06-09 17:30:00', '2026-06-09 19:00:00', '2026-06-09 19:30:00'),
('PC kasir blue screen saat jam sibuk', 'PC kasir 2 sering BSOD terutama saat jam makan siang. Error memory dump. Terjadi 3 kali minggu ini.', 'resolved', 'high', 6, 6, 1, '2026-06-09 13:00:00', '2026-06-11 15:00:00', '2026-06-09 15:00:00'),
('Request Microsoft Office 2021 license', 'Komputer baru tidak ada lisensi MS Office. Mohon aktivasi untuk keperluan pekerjaan sehari-hari.', 'closed', 'medium', 2, 7, 1, '2026-06-10 08:45:00', '2026-06-10 11:30:00', '2026-06-11 08:45:00'),
('Finger print absensi error', 'Mesin fingerprint di pintu masuk utama tidak bisa baca sidik jari. Layar blank setelah restart.', 'resolved', 'medium', 1, 8, 1, '2026-06-10 07:30:00', '2026-06-12 09:00:00', '2026-06-11 07:30:00'),
('Website company tidak bisa diakses', 'Website perusahaan down. Tidak bisa diakses dari dalam maupun luar kantor. Error 502 Bad Gateway.', 'closed', 'high', 3, 9, 1, '2026-06-11 10:00:00', '2026-06-11 14:30:00', '2026-06-11 12:00:00'),
('Recover data laptop kena format', 'Laptop Manager Finance tidak sengaja diformat. Data penting bulan Mei belum di-backup. Perlu recovery.', 'resolved', 'high', 5, 10, 1, '2026-06-11 11:30:00', '2026-06-12 17:00:00', '2026-06-11 13:30:00'),
('Request headset untuk customer service', 'Tim CS butuh 5 unit headset baru untuk mengganti yang sudah rusak. Spec: noise cancelling, USB.', 'closed', 'low', 2, 2, 1, '2026-06-12 09:15:00', '2026-06-15 10:00:00', '2026-06-15 09:15:00'),
('Software POS crash saat cetak struk', 'Aplikasi POS retail tiba-tiba close sendiri setiap kali mencetak struk. Sudah terjadi 10x hari ini.', 'closed', 'high', 5, 3, 1, '2026-06-13 10:30:00', '2026-06-13 14:00:00', '2026-06-13 12:30:00'),

-- Minggu 3: 15-21 Juni
('Proyektor ruang meeting tidak connect', 'Proyektor di meeting room A tidak bisa dihubungkan dengan laptop via HDMI. Ada meeting penting jam 2.', 'closed', 'high', 6, 4, 1, '2026-06-15 12:30:00', '2026-06-15 13:45:00', '2026-06-15 14:30:00'),
('Backup server gagal 3 hari berturut', 'Scheduled backup server ke NAS gagal sejak Rabu. Error log menunjukkan "disk full" di NAS storage.', 'closed', 'high', 3, 5, 1, '2026-06-15 08:00:00', '2026-06-16 11:00:00', '2026-06-15 10:00:00'),
('EDC BCA tidak bisa tap kartu', 'Fitur contactless/tap di EDC BCA tidak berfungsi. Hanya bisa swipe. Customer komplain tidak bisa pakai Apple Pay.', 'resolved', 'medium', 4, 6, 1, '2026-06-16 09:30:00', '2026-06-18 14:00:00', '2026-06-17 09:30:00'),
('Request setup dual monitor', 'Mohon setup monitor kedua untuk workstation Designer. Sudah ada monitor extra, tinggal pasang kabel dan setting.', 'closed', 'low', 2, 7, 1, '2026-06-16 10:00:00', '2026-06-17 15:00:00', '2026-06-19 10:00:00'),
('Laptop mati tidak bisa nyala sama sekali', 'Laptop Lenovo IdeaPad tiba-tiba mati saat dipakai dan tidak bisa dinyalakan. Charger tidak ada indikator.', 'in_progress', 'high', 6, 8, 1, '2026-06-17 09:00:00', '2026-06-17 09:00:00', '2026-06-17 11:00:00'),
('Koneksi WiFi putus-putus di lantai 2', 'WiFi di lantai 2 sering disconnect setiap 30-60 menit. Sudah terjadi sejak minggu lalu setelah maintenance AP.', 'closed', 'medium', 3, 9, 1, '2026-06-17 10:15:00', '2026-06-19 16:00:00', '2026-06-18 10:15:00'),
('Antivirus expired di 5 komputer', '5 komputer di divisi marketing antivirus-nya sudah expired bulan lalu. Butuh perpanjangan lisensi.', 'resolved', 'medium', 5, 10, 1, '2026-06-18 08:30:00', '2026-06-19 11:00:00', '2026-06-19 08:30:00'),
('Printer struk EDC macet', 'Roll kertas struk di mesin EDC BRI sering macet di tengah cetak. Perlu perbaikan atau penggantian mesin.', 'closed', 'medium', 4, 2, 1, '2026-06-18 14:00:00', '2026-06-20 10:00:00', '2026-06-19 14:00:00'),
('Request migrasi data ke laptop baru', 'Laptop lama akan diganti. Mohon bantu pindahkan semua data, setting, dan aplikasi ke laptop baru Lenovo.', 'resolved', 'low', 2, 3, 1, '2026-06-19 09:00:00', '2026-06-21 14:00:00', '2026-06-22 09:00:00'),
('Server intranet tidak bisa diakses', 'Aplikasi HR internal tidak bisa dibuka dari semua komputer. Server respond timeout. Absensi online tidak bisa.', 'closed', 'high', 3, 4, 1, '2026-06-19 07:45:00', '2026-06-19 10:15:00', '2026-06-19 09:45:00'),

-- Minggu 4: 22-30 Juni
('EDC semua jaringan gagal batch', 'Semua mesin EDC (BRI, BCA, Mandiri) tidak bisa batch setelah server EDC provider maintenance tadi malam.', 'closed', 'high', 4, 5, 1, '2026-06-22 08:00:00', '2026-06-22 10:30:00', '2026-06-22 10:00:00'),
('Request penambahan user AD baru', 'Ada 3 karyawan baru mulai kerja minggu ini. Butuh pembuatan akun Active Directory dan email perusahaan.', 'closed', 'medium', 2, 6, 1, '2026-06-22 09:30:00', '2026-06-23 11:00:00', '2026-06-23 09:30:00'),
('PC terkena ransomware', 'PC di gudang muncul pesan merah "Your files have been encrypted". Semua file tidak bisa dibuka. URGENT!', 'in_progress', 'high', 5, 7, 1, '2026-06-23 08:30:00', '2026-06-23 08:30:00', '2026-06-23 10:30:00'),
('Kabel LAN putus di server room', 'Beberapa kabel patch di server room putus akibat tikus. Perlu penggantian dan pengamanan kabel.', 'resolved', 'high', 3, 8, 1, '2026-06-23 10:00:00', '2026-06-24 15:00:00', '2026-06-23 12:00:00'),
('Maintenance rutin UPS server', 'UPS server ruangan IT perlu maintenance dan penggantian battery yang sudah 3 tahun. Sesuai jadwal tahunan.', 'resolved', 'low', 1, 9, 1, '2026-06-24 09:00:00', '2026-06-26 14:00:00', '2026-06-27 09:00:00'),
('Software report tidak bisa export PDF', 'Fitur export ke PDF di software report keuangan error sejak update terakhir. Hanya bisa export Excel.', 'open', 'medium', 5, 10, NULL, '2026-06-24 10:30:00', '2026-06-24 10:30:00', '2026-06-25 10:30:00'),
('Headset CS rusak saat WFH', 'Headset yang dipinjam untuk WFH speaker sebelah kiri mati. Butuh penggantian sebelum shift besok.', 'open', 'medium', 6, 2, NULL, '2026-06-25 14:00:00', '2026-06-25 14:00:00', '2026-06-26 14:00:00'),
('Request instalasi AutoCAD 2025', 'Engineer baru butuh software AutoCAD 2025 untuk mulai project minggu depan. License sudah disetujui.', 'in_progress', 'medium', 2, 3, 1, '2026-06-25 09:30:00', '2026-06-25 09:30:00', '2026-06-26 09:30:00'),
('Server database lambat sejak upgrade', 'Performa server database menurun drastis setelah upgrade versi MySQL. Query yang biasa 1 detik jadi 30 detik.', 'open', 'high', 3, 4, NULL, '2026-06-26 08:00:00', '2026-06-26 08:00:00', '2026-06-26 10:00:00'),
('EDC BRI minta settlement ulang', 'EDC BRI cabang Sudirman minta settlement ulang karena kemarin gagal. Data transaksi belum masuk rekening.', 'open', 'high', 4, 5, NULL, '2026-06-26 09:15:00', '2026-06-26 09:15:00', '2026-06-26 11:15:00'),
('Mouse wireless tidak terdeteksi', 'Mouse wireless Logitech di PC desainer tidak terdeteksi setelah ganti baterai. Receiver USB juga sudah dicoba pindah port.', 'open', 'low', 6, 6, NULL, '2026-06-27 10:00:00', '2026-06-27 10:00:00', '2026-06-30 10:00:00'),
('Request recovery password akun Office 365', 'Lupa password akun Office 365, tidak bisa login Teams dan Outlook. Meeting penting jam 10 pagi.', 'closed', 'high', 2, 7, 1, '2026-06-27 08:45:00', '2026-06-27 09:30:00', '2026-06-27 10:45:00'),
('Kamera CCTV area parkir offline', 'Kamera CCTV di area parkir basement tidak mengirimkan feed ke monitor sejak tadi malam. Perlu dicek kabel.', 'in_progress', 'medium', 1, 8, 1, '2026-06-27 11:00:00', '2026-06-27 11:00:00', '2026-06-28 11:00:00'),
('PC kasir 3 tidak bisa buka aplikasi POS', 'Setelah update Windows otomatis semalam, aplikasi POS tidak bisa dibuka. Error "DLL file missing".', 'open', 'high', 5, 9, NULL, '2026-06-28 07:30:00', '2026-06-28 07:30:00', '2026-06-28 09:30:00'),
('Request setup printer baru di HR', 'Printer baru Canon sudah datang tapi belum di-setup. Perlu instalasi driver dan koneksi ke jaringan.', 'open', 'low', 2, 10, NULL, '2026-06-28 10:00:00', '2026-06-28 10:00:00', '2026-07-01 10:00:00'),
('Laptop overheating dan shutdown sendiri', 'Laptop Dell Latitude sering shutdown tiba-tiba terutama saat meeting video call. Kipas terdengar kencang.', 'open', 'medium', 6, 2, NULL, '2026-06-29 09:00:00', '2026-06-29 09:00:00', '2026-06-30 09:00:00'),
('Gangguan jaringan seluruh gedung', 'Seluruh gedung kehilangan koneksi internet sejak pukul 14.00. ISP sedang dicek, kemungkinan gangguan upstream.', 'in_progress', 'high', 3, 3, 1, '2026-06-29 14:05:00', '2026-06-29 14:05:00', '2026-06-29 16:05:00'),
('EDC Mandiri error pasca update firmware', 'Setelah update firmware oleh teknisi Mandiri kemarin, semua transaksi debit gagal. Kredit masih bisa.', 'open', 'high', 4, 4, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00', '2026-06-30 10:00:00'),
('Request penambahan storage PC desainer', 'SSD PC desainer hampir penuh (95%). Perlu tambah SSD atau ganti HDD untuk project file yang besar.', 'open', 'medium', 2, 5, NULL, '2026-06-30 09:30:00', '2026-06-30 09:30:00', '2026-07-01 09:30:00'),
('Maintenance AC server room terjadwal', 'AC server room perlu service rutin bulanan. Jadwalkan dengan vendor AC untuk pembersihan filter dan freon.', 'open', 'low', 1, 6, NULL, '2026-06-30 10:00:00', '2026-06-30 10:00:00', '2026-07-03 10:00:00');

-- ── Seed Comments ─────────────────────────────────────────────────────────────
-- Tambah beberapa komentar untuk tiket yang sudah resolved/closed
INSERT INTO comments (ticket_id, user_id, content, created_at) VALUES
(1,  1, 'Sudah dicek, kabel power monitor putus. Sudah diganti dengan yang baru, monitor kembali normal.', '2026-06-01 12:00:00'),
(1,  2, 'Terima kasih, sudah bisa digunakan kembali!', '2026-06-01 14:30:00'),
(4,  1, 'Ditemukan router yang restart loop. Sudah direplace dengan unit backup. Internet kembali normal.', '2026-06-02 10:30:00'),
(6,  1, 'EDC sudah dihubungi ke support BRI. Masalah ada di setting host IP yang berubah. Sudah diperbaiki.', '2026-06-02 12:00:00'),
(8,  1, 'Virus berhasil dibersihkan. Ditemukan 3 file trojan di folder Downloads. PC sudah di-scan ulang dan bersih.', '2026-06-03 13:00:00'),
(8,  9, 'Terima kasih sudah cepat ditangani! Sekarang sudah aman.', '2026-06-03 13:30:00'),
(11, 1, 'Switch rusak akibat power surge. Sudah diganti unit baru. Semua koneksi lantai 3 kembali normal.', '2026-06-08 09:00:00'),
(13, 1, 'Settlement berhasil dilakukan manual melalui hotline Mandiri. EDC kembali normal pagi ini.', '2026-06-10 09:00:00'),
(17, 1, 'Website down karena server ran out of memory. Sudah di-restart dan tambah RAM virtual. Monitoring aktif.', '2026-06-11 12:00:00'),
(20, 1, 'Ditemukan bug di versi POS 3.2.1. Sudah rollback ke versi 3.2.0. Vendor sedang siapkan patch.', '2026-06-13 13:00:00'),
(33, 1, 'Sedang investigasi. Kemungkinan ada perubahan config setelah upgrade. DBA sedang analisis query execution plan.', '2026-06-26 10:00:00'),
(33, 4, 'Ada info tambahan: masalah muncul setelah upgrade dari MySQL 5.7 ke 8.0. Beberapa index tidak compatible.', '2026-06-26 11:00:00');

-- ── Seed Audit Log ────────────────────────────────────────────────────────────
INSERT INTO ticket_audit_log (ticket_id, user_id, action, field, old_value, new_value, created_at) VALUES
(1,  1, 'status_changed', 'status', 'open', 'in_progress', '2026-06-01 09:00:00'),
(1,  1, 'status_changed', 'status', 'in_progress', 'closed', '2026-06-01 14:30:00'),
(4,  1, 'status_changed', 'status', 'open', 'in_progress', '2026-06-02 09:00:00'),
(4,  1, 'status_changed', 'status', 'in_progress', 'closed', '2026-06-02 11:20:00'),
(6,  1, 'status_changed', 'status', 'open', 'closed', '2026-06-02 12:45:00'),
(8,  1, 'status_changed', 'status', 'open', 'closed', '2026-06-03 13:30:00'),
(11, 1, 'status_changed', 'status', 'open', 'closed', '2026-06-08 10:30:00'),
(17, 1, 'status_changed', 'status', 'open', 'closed', '2026-06-11 14:30:00'),
(31, 1, 'status_changed', 'status', 'open', 'in_progress', '2026-06-23 09:00:00');

SELECT CONCAT('Seed complete! Total tiket: ', COUNT(*), ' tiket bulan Juni 2026') AS status FROM tickets;
