-- Migration 008: Add ticket tracking fields
-- Tambah kolom untuk tracking tanggal per status dan nama store
USE ticketing_db;

-- Tambah kolom nama_store dan tracking tanggal ke tabel tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS nama_store        VARCHAR(255) NULL AFTER title,
  ADD COLUMN IF NOT EXISTS tanggal_open      DATETIME NULL AFTER sla_deadline,
  ADD COLUMN IF NOT EXISTS tanggal_progress  DATETIME NULL AFTER tanggal_open,
  ADD COLUMN IF NOT EXISTS tanggal_resolved  DATETIME NULL AFTER tanggal_progress;

-- Set tanggal_open = created_at untuk tiket yang sudah ada
UPDATE tickets SET tanggal_open = created_at WHERE tanggal_open IS NULL;

-- Set tanggal_progress untuk tiket in_progress/resolved/closed
UPDATE tickets SET tanggal_progress = updated_at
WHERE status IN ('in_progress', 'resolved', 'closed') AND tanggal_progress IS NULL;

-- Set tanggal_resolved untuk tiket resolved/closed
UPDATE tickets SET tanggal_resolved = updated_at
WHERE status IN ('resolved', 'closed') AND tanggal_resolved IS NULL;

SELECT 'Migration 008 complete!' AS status;
