-- =============================================================
-- G-Link | D-05 | rooms table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 03_rooms.sql
-- A room has one or more beds. Guests book beds, so a dormitory can be shared.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS rooms (
  room_id         INT          NOT NULL AUTO_INCREMENT,
  guest_house_id  INT          NOT NULL,
  room_number     VARCHAR(10)  NOT NULL,
  room_type       ENUM('Single','Double','Dormitory') NOT NULL,
  total_beds      TINYINT UNSIGNED NOT NULL,
  description     VARCHAR(500) NULL,
  status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_rooms PRIMARY KEY (room_id),
  CONSTRAINT uk_rooms_guest_house_id_room_number UNIQUE (guest_house_id, room_number),
  CONSTRAINT fk_rooms_guest_house_id FOREIGN KEY (guest_house_id) REFERENCES guest_houses (guest_house_id),
  CONSTRAINT chk_rooms_total_beds CHECK (total_beds BETWEEN 1 AND 20)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
