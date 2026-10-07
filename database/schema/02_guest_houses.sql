-- =============================================================
-- G-Link | D-04 | guest_houses table
-- Run after the lower-numbered files:  mysql -u <your_login> -p g_link < 02_guest_houses.sql
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS guest_houses (
  guest_house_id  INT          NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  location        VARCHAR(100) NOT NULL,
  description     VARCHAR(500) NULL,
  contact_phone   VARCHAR(11)  NULL,
  status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_guest_houses PRIMARY KEY (guest_house_id),
  CONSTRAINT uk_guest_houses_name UNIQUE (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
