CREATE TABLE IF NOT EXISTS tickets (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL,
  status      ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  priority    ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  user_id     INT UNSIGNED  NOT NULL,
  assigned_to INT UNSIGNED  NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tickets_user     FOREIGN KEY (user_id)     REFERENCES users(id),
  CONSTRAINT fk_tickets_assigned FOREIGN KEY (assigned_to) REFERENCES users(id)
);
