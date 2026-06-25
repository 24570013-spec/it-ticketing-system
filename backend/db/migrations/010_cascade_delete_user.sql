-- Migration 010: Cascade delete user — semua data terkait user ikut terhapus
-- Saat user dihapus: tiket, komentar, notifikasi, refresh token otomatis terhapus

USE ticketing_db;

-- 1. tickets.user_id → CASCADE (pembuat tiket)
ALTER TABLE tickets
  DROP FOREIGN KEY fk_tickets_user,
  ADD CONSTRAINT fk_tickets_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. tickets.assigned_to → SET NULL (engineer/admin yang di-assign, bukan dihapus)
ALTER TABLE tickets
  DROP FOREIGN KEY fk_tickets_assigned,
  ADD CONSTRAINT fk_tickets_assigned
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- 3. comments.user_id → CASCADE
ALTER TABLE comments
  DROP FOREIGN KEY fk_comments_user,
  ADD CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. refresh_tokens sudah CASCADE dari migration 004, tidak perlu diubah

-- 5. ticket_audit_log.user_id → SET NULL (log tetap ada, user_id jadi null)
ALTER TABLE ticket_audit_log
  DROP FOREIGN KEY fk_audit_user,
  ADD CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 6. notifications sudah CASCADE dari setup.sql, tidak perlu diubah

SELECT 'Migration 010 complete: cascade delete on user configured.' AS status;
