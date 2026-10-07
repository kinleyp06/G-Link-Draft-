-- =============================================================
-- G-Link | D-11 | stay_extensions table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 09_stay_extensions.sql
-- A request to stay longer. extra_amount = extra nights x beds x the booking's rate.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS stay_extensions (
  stay_extension_id  INT           NOT NULL AUTO_INCREMENT,
  booking_id         INT           NOT NULL,
  current_check_out  DATE          NOT NULL,
  new_check_out      DATE          NOT NULL,
  reason             VARCHAR(255)  NULL,
  extra_amount       DECIMAL(10,2) NOT NULL,
  status             ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  admin_note         VARCHAR(255)  NULL,
  reviewed_by        INT           NULL,
  reviewed_at        DATETIME      NULL,
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_stay_extensions PRIMARY KEY (stay_extension_id),
  CONSTRAINT fk_stay_extensions_booking_id FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
  CONSTRAINT fk_stay_extensions_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (user_id),
  CONSTRAINT chk_stay_extensions_dates CHECK (new_check_out > current_check_out),
  INDEX idx_stay_extensions_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
