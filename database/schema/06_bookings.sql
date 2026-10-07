-- =============================================================
-- G-Link | D-08 | bookings table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 06_bookings.sql
-- check_out is the day the guest leaves, so nights = check_out - check_in.
-- beds = number of people staying (the account holder plus booking_guests,
-- or only booking_guests when an admin books for an international guest).
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS bookings (
  booking_id        INT           NOT NULL AUTO_INCREMENT,
  user_id           INT           NOT NULL,
  room_id           INT           NOT NULL,
  check_in          DATE          NOT NULL,
  check_out         DATE          NOT NULL,
  beds              TINYINT UNSIGNED NOT NULL,
  guest_type        ENUM('RUB Staff','RUB Student','Official','Private','International') NOT NULL,
  purpose           VARCHAR(255)  NULL,
  share_room        BOOLEAN       NOT NULL DEFAULT FALSE,
  is_international  BOOLEAN       NOT NULL DEFAULT FALSE,
  rate_amount       DECIMAL(10,2) NOT NULL,
  total_amount      DECIMAL(10,2) NOT NULL,
  status            ENUM('Pending','Approved','Rejected','Cancelled','Completed') NOT NULL DEFAULT 'Pending',
  admin_note        VARCHAR(255)  NULL,
  reviewed_by       INT           NULL,
  reviewed_at       DATETIME      NULL,
  checked_in_at     DATETIME      NULL,
  checked_out_at    DATETIME      NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_bookings PRIMARY KEY (booking_id),
  CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_bookings_room_id FOREIGN KEY (room_id) REFERENCES rooms (room_id),
  CONSTRAINT fk_bookings_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (user_id),
  CONSTRAINT chk_bookings_dates CHECK (check_out > check_in),
  CONSTRAINT chk_bookings_beds CHECK (beds >= 1),
  CONSTRAINT chk_bookings_amounts CHECK (rate_amount >= 0 AND total_amount >= 0),
  INDEX idx_bookings_room_id_check_in_check_out (room_id, check_in, check_out),
  INDEX idx_bookings_user_id (user_id),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
