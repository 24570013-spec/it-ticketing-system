-- Migration 012: Add ticket_status_log for detailed progress timeline
USE ticketing_db;

CREATE TABLE IF NOT EXISTS ticket_status_log (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id   INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  from_status VARCHAR(50)  NULL,
  to_status   VARCHAR(50)  NOT NULL,
  note        TEXT         NULL,
  duration_minutes INT UNSIGNED NULL COMMENT 'Minutes spent in previous status',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_status_log_ticket (ticket_id),
  CONSTRAINT fk_statuslog_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_statuslog_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
);

SELECT 'Migration 012 complete: ticket_status_log created.' AS status;
