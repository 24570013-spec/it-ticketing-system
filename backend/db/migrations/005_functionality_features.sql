-- Ticket audit log
CREATE TABLE IF NOT EXISTS ticket_audit_log (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  action     VARCHAR(50)  NOT NULL,
  field      VARCHAR(50)  NULL,
  old_value  VARCHAR(255) NULL,
  new_value  VARCHAR(255) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_user   FOREIGN KEY (user_id)   REFERENCES users(id)
);

-- Ticket attachments
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

-- SLA rules based on priority
CREATE TABLE IF NOT EXISTS sla_rules (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  priority          ENUM('low','medium','high') NOT NULL,
  response_hours    INT UNSIGNED NOT NULL,
  resolution_hours  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sla_priority (priority)
);

-- Default SLA rules
INSERT IGNORE INTO sla_rules (priority, response_hours, resolution_hours) VALUES
  ('low',    24, 72),
  ('medium', 8,  24),
  ('high',   2,  8);

-- Add SLA deadline to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_deadline DATETIME NULL;

-- Notifications table
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
