-- =============================================================
-- G-Link | D-12 | room_blocks table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 10_room_blocks.sql
-- Beds taken out of use (repairs, reserved). Like bookings, end_date is not blocked itself.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS room_blocks (
  room_block_id  INT          NOT NULL AUTO_INCREMENT,
  room_id        INT          NOT NULL,
  beds           TINYINT UNSIGNED NOT NULL,
  start_date     DATE         NOT NULL,
  end_date       DATE         NOT NULL,
  reason         VARCHAR(255) NOT NULL,
  created_by     INT          NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_room_blocks PRIMARY KEY (room_block_id),
  CONSTRAINT fk_room_blocks_room_id FOREIGN KEY (room_id) REFERENCES rooms (room_id) ON DELETE CASCADE,
  CONSTRAINT fk_room_blocks_created_by FOREIGN KEY (created_by) REFERENCES users (user_id),
  CONSTRAINT chk_room_blocks_dates CHECK (end_date > start_date),
  CONSTRAINT chk_room_blocks_beds CHECK (beds >= 1),
  INDEX idx_room_blocks_room_id_start_date_end_date (room_id, start_date, end_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
