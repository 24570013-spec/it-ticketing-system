-- ============================================================
-- IT Helpdesk Ticketing System — Database Setup Script
-- Jalankan script ini sekali untuk setup database dari awal
-- Usage: mysql -u root -p < backend/db/setup.sql
-- ============================================================

-- 1. Buat database (skip jika sudah ada)
CREATE DATABASE IF NOT EXISTS ticketing_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ticketing_db;

-- 2. Users table (Migration 001 + 009)
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED                    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)                    NOT NULL,
  email         VARCHAR(255)                    NOT NULL,
  password_hash VARCHAR(255)                    NOT NULL,
  role          ENUM('user','admin','engineer') NOT NULL DEFAULT 'user',
  created_at    DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

-- 3. Categories table (Migration 006)
CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_name (name)
);

-- Default categories
INSERT IGNORE INTO categories (name, description) VALUES
  ('Maintenance',    'Perawatan dan perbaikan perangkat'),
  ('Request',        'Permintaan layanan IT'),
  ('Infrastructure', 'Jaringan dan infrastruktur IT'),
  ('EDC Machine',    'Mesin EDC dan payment terminal'),
  ('Software',       'Masalah aplikasi dan software'),
  ('Hardware',       'Masalah perangkat keras');

-- 4. Tickets table (Migration 002 + 009)
CREATE TABLE IF NOT EXISTS tickets (
  id               INT UNSIGNED                                                              NOT NULL AUTO_INCREMENT,
  title            VARCHAR(255)                                                              NOT NULL,
  nama_store       VARCHAR(255)                                                              NULL,
  description      TEXT                                                                      NOT NULL,
  status           ENUM('open','waiting','in_progress','checking','pending','resolved','closed') NOT NULL DEFAULT 'open',
  priority         ENUM('low','medium','high')                                               NOT NULL DEFAULT 'medium',
  category_id      INT UNSIGNED                                        NULL,
  user_id          INT UNSIGNED                                        NOT NULL,
  assigned_to      INT UNSIGNED                                        NULL,
  created_at       DATETIME                                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME                                           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  sla_deadline     DATETIME                                           NULL,
  tanggal_open     DATETIME                                           NULL,
  tanggal_progress DATETIME                                           NULL,
  tanggal_resolved DATETIME                                           NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_tickets_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Comments table (Migration 003)
CREATE TABLE IF NOT EXISTS comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  content    TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Refresh tokens table (Migration 004)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(512) NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_token (token),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Ticket audit log (Migration 005)
CREATE TABLE IF NOT EXISTS ticket_audit_log (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NULL,
  action     VARCHAR(50)  NOT NULL,
  field      VARCHAR(50)  NULL,
  old_value  VARCHAR(255) NULL,
  new_value  VARCHAR(255) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Ticket attachments (Migration 005)
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  filename   VARCHAR(255) NOT NULL,
  filepath   VARCHAR(500) NOT NULL,
  mimetype   VARCHAR(100) NOT NULL,
  size       INT UNSIGNED NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_attach_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_attach_user   FOREIGN KEY (user_id)   REFERENCES users(id)
);

-- 8. SLA rules (Migration 005)
CREATE TABLE IF NOT EXISTS sla_rules (
  id               INT UNSIGNED               NOT NULL AUTO_INCREMENT,
  priority         ENUM('low','medium','high') NOT NULL,
  response_hours   INT UNSIGNED               NOT NULL,
  resolution_hours INT UNSIGNED               NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sla_priority (priority)
);

-- Default SLA rules (high=2h, medium=4h, low=8h)
INSERT IGNORE INTO sla_rules (priority, response_hours, resolution_hours) VALUES
  ('high',   1,  2),
  ('medium', 2,  4),
  ('low',    4,  8);

-- 9. SLA deadline column on tickets (Migration 005)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_deadline DATETIME NULL;

-- 10. Notifications (Migration 005)
CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  message    VARCHAR(500) NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'info',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  ticket_id  INT UNSIGNED NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- 11. Ticket status log (Migration 012) — detailed progress timeline
CREATE TABLE IF NOT EXISTS ticket_status_log (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id        INT UNSIGNED NOT NULL,
  user_id          INT UNSIGNED NOT NULL,
  from_status      VARCHAR(50)  NULL,
  to_status        VARCHAR(50)  NOT NULL,
  note             TEXT         NULL,
  duration_minutes INT UNSIGNED NULL COMMENT 'Minutes spent in previous status',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_statuslog_ticket (ticket_id),
  CONSTRAINT fk_statuslog_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_statuslog_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
);

-- ============================================================
-- Seed: Default admin account
-- Email   : admin@ticketing.com
-- Password: Admin1234!
-- ============================================================
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (
  'Administrator',
  'admin@ticketing.com',
  '$2b$10$iDV8xhgO0OXNUei1jOpjfucmJ1qEjKK8uPjRHDi7aAF3vNUiwvOha',
  'admin'
);

-- ============================================================
-- Setup selesai! Semua tabel berhasil dibuat.
-- ============================================================
SELECT 'Database setup complete! Admin: admin@ticketing.com / Admin1234!' AS status;
