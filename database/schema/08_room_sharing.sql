-- =============================================================
-- G-Link | D-10 | room_sharing table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 08_room_sharing.sql
-- Which approved bookings share a room on overlapping nights.
-- Filled in when a booking is approved; used for the shared-room notice.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS room_sharing (
  room_sharing_id         INT      NOT NULL AUTO_INCREMENT,
  booking_id              INT      NOT NULL,
  shared_with_booking_id  INT      NOT NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_room_sharing PRIMARY KEY (room_sharing_id),
  CONSTRAINT uk_room_sharing_booking_id_shared_with_booking_id UNIQUE (booking_id, shared_with_booking_id),
  CONSTRAINT fk_room_sharing_booking_id FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
  CONSTRAINT fk_room_sharing_shared_with_booking_id FOREIGN KEY (shared_with_booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
  CONSTRAINT chk_room_sharing_not_self CHECK (booking_id <> shared_with_booking_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
