-- =============================================================
-- G-Link | D-13 | hall_bookings table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 11_hall_bookings.sql
-- A hall is booked for part of one day; total_amount is the day rate.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS hall_bookings (
  hall_booking_id  INT           NOT NULL AUTO_INCREMENT,
  hall_id          INT           NOT NULL,
  user_id          INT           NOT NULL,
  event_date       DATE          NOT NULL,
  start_time       TIME          NOT NULL,
  end_time         TIME          NOT NULL,
  attendees        SMALLINT UNSIGNED NOT NULL,
  purpose          VARCHAR(255)  NOT NULL,
  guest_type       ENUM('RUB Staff','RUB Student','Official','Private','International') NOT NULL,
  rate_amount      DECIMAL(10,2) NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  status           ENUM('Pending','Approved','Rejected','Cancelled','Completed') NOT NULL DEFAULT 'Pending',
  admin_note       VARCHAR(255)  NULL,
  reviewed_by      INT           NULL,
  reviewed_at      DATETIME      NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_hall_bookings PRIMARY KEY (hall_booking_id),
  CONSTRAINT fk_hall_bookings_hall_id FOREIGN KEY (hall_id) REFERENCES halls (hall_id),
  CONSTRAINT fk_hall_bookings_user_id FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_hall_bookings_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (user_id),
  CONSTRAINT chk_hall_bookings_times CHECK (end_time > start_time),
  CONSTRAINT chk_hall_bookings_attendees CHECK (attendees >= 1),
  INDEX idx_hall_bookings_hall_id_event_date (hall_id, event_date),
  INDEX idx_hall_bookings_user_id (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
