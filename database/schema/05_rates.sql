-- =============================================================
-- G-Link | D-07 | rates table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 05_rates.sql
-- One current rate per guest type and rate type, in Ngultrum.
-- Room: per bed per night. Hall: per day. Bookings copy the rate when they are made,
-- so a new rate only applies to new bookings.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS rates (
  rate_id         INT           NOT NULL AUTO_INCREMENT,
  guest_type      ENUM('RUB Staff','RUB Student','Official','Private','International') NOT NULL,
  rate_type       ENUM('Room','Hall') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  updated_by      INT           NULL,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_rates PRIMARY KEY (rate_id),
  CONSTRAINT uk_rates_guest_type_rate_type UNIQUE (guest_type, rate_type),
  CONSTRAINT fk_rates_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id),
  CONSTRAINT chk_rates_amount CHECK (amount >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
