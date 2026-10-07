-- =============================================================
-- G-Link | D-09 | booking_guests table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 07_booking_guests.sql
-- Extra people on a booking (one bed each). citizenship_id holds a CID or passport number.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS booking_guests (
  booking_guest_id  INT          NOT NULL AUTO_INCREMENT,
  booking_id        INT          NOT NULL,
  full_name         VARCHAR(50)  NOT NULL,
  gender            ENUM('Male','Female','Other') NULL,
  citizenship_id    VARCHAR(20)  NULL,
  nationality       VARCHAR(50)  NOT NULL DEFAULT 'Bhutanese',
  phone_number      VARCHAR(15)  NULL,
  CONSTRAINT pk_booking_guests PRIMARY KEY (booking_guest_id),
  CONSTRAINT fk_booking_guests_booking_id FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
  INDEX idx_booking_guests_booking_id (booking_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
