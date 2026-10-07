-- =============================================================
-- G-Link | D-06 | halls table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 04_halls.sql
-- Meeting halls are booked by the day (see hall_bookings).
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS halls (
  hall_id         INT          NOT NULL AUTO_INCREMENT,
  guest_house_id  INT          NOT NULL,
  name            VARCHAR(100) NOT NULL,
  capacity        SMALLINT UNSIGNED NOT NULL,
  description     VARCHAR(500) NULL,
  status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_halls PRIMARY KEY (hall_id),
  CONSTRAINT uk_halls_guest_house_id_name UNIQUE (guest_house_id, name),
  CONSTRAINT fk_halls_guest_house_id FOREIGN KEY (guest_house_id) REFERENCES guest_houses (guest_house_id),
  CONSTRAINT chk_halls_capacity CHECK (capacity >= 1)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
