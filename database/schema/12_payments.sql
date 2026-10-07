-- =============================================================
-- G-Link | D-14 | payments table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 12_payments.sql
-- Money received for a room booking OR a hall booking (exactly one of the two).
-- A booking is paid when the sum of its payments reaches total_amount.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS payments (
  payment_id       INT           NOT NULL AUTO_INCREMENT,
  booking_id       INT           NULL,
  hall_booking_id  INT           NULL,
  amount           DECIMAL(10,2) NOT NULL,
  method           ENUM('Cash','Bank Transfer','mBoB') NOT NULL,
  reference_no     VARCHAR(50)   NULL,
  recorded_by      INT           NOT NULL,
  paid_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_payments PRIMARY KEY (payment_id),
  CONSTRAINT fk_payments_booking_id FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
  CONSTRAINT fk_payments_hall_booking_id FOREIGN KEY (hall_booking_id) REFERENCES hall_bookings (hall_booking_id),
  CONSTRAINT fk_payments_recorded_by FOREIGN KEY (recorded_by) REFERENCES users (user_id),
  CONSTRAINT chk_payments_amount CHECK (amount > 0),
  CONSTRAINT chk_payments_one_target CHECK ((booking_id IS NULL) <> (hall_booking_id IS NULL)),
  INDEX idx_payments_booking_id (booking_id),
  INDEX idx_payments_hall_booking_id (hall_booking_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
