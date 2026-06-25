-- Migration 006: Add categories feature
-- Jalankan ini jika database sudah ada sebelumnya
-- Usage: mysql -u root -p ticketing_db < backend/db/migrations/006_add_categories.sql

USE ticketing_db;

-- 1. Buat tabel categories
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_name (name)
);

-- 2. Default categories
INSERT IGNORE INTO categories (name, description) VALUES
  ('Maintenance',    'Perawatan dan perbaikan perangkat'),
  ('Request',        'Permintaan layanan IT'),
  ('Infrastructure', 'Jaringan dan infrastruktur IT'),
  ('EDC Machine',    'Mesin EDC dan payment terminal'),
  ('Software',       'Masalah aplikasi dan software'),
  ('Hardware',       'Masalah perangkat keras');

-- 3. Tambah kolom category_id ke tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS category_id INT UNSIGNED NULL AFTER priority,
  ADD CONSTRAINT fk_tickets_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

SELECT 'Migration 006 complete!' AS status;
