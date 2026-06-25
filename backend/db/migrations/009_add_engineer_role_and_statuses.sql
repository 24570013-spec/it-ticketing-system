-- Migration 009: Add engineer role and expanded ticket statuses
-- Run this on your existing database

USE ticketing_db;

-- 1. Add 'engineer' to users role ENUM
ALTER TABLE users
  MODIFY COLUMN role ENUM('user', 'admin', 'engineer') NOT NULL DEFAULT 'user';

-- 2. Expand ticket status ENUM with waiting, checking, pending
ALTER TABLE tickets
  MODIFY COLUMN status ENUM('open','waiting','in_progress','checking','pending','resolved','closed') NOT NULL DEFAULT 'open';

-- 3. Update setup.sql reference data (SLA rules already exist, no change needed)

SELECT 'Migration 009 complete: engineer role and expanded statuses added.' AS status;
