-- =============================================================
-- G-Link | D-01 | Create the database
-- Run as a MySQL admin account:  mysql -u root -p < 00_create_database.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS g_link
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE g_link;

-- -------------------------------------------------------------
-- Example: a personal login for one team member.
-- Copy, replace <name> and CHANGE_ME with a strong password,
-- and run it yourself. NEVER commit the real password to Git
-- or post it in the group chat. Share it privately.
-- -------------------------------------------------------------
-- CREATE USER IF NOT EXISTS 'glink_<name>'@'localhost' IDENTIFIED BY 'CHANGE_ME';
-- GRANT ALL PRIVILEGES ON g_link.* TO 'glink_<name>'@'localhost';
-- FLUSH PRIVILEGES;
