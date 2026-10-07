-- =============================================================
-- G-Link | D-03 | users table
-- Run after 00_create_database.sql:
--   mysql -u <your_login> -p g_link < 01_users.sql
-- first_name / last_name stay NULL until the profile is completed,
-- because sign up only asks for email and password.
-- =============================================================

USE g_link;

CREATE TABLE IF NOT EXISTS users (
  user_id         INT          NOT NULL AUTO_INCREMENT,
  first_name      VARCHAR(20)  NULL,
  last_name       VARCHAR(20)  NULL,
  email           VARCHAR(100) NOT NULL,
  email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
  phone_number    VARCHAR(11)  NULL,
  citizenship_id  VARCHAR(20)  NULL,
  gender          ENUM('Male','Female','Other') NULL,
  sid             VARCHAR(20)  NULL,
  department      VARCHAR(50)  NULL,
  password        VARCHAR(60)  NOT NULL COMMENT 'bcrypt hash, never plain text',
  role            ENUM('Guest','Incharge','Admin','Super Admin') NOT NULL DEFAULT 'Guest',
  status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_users PRIMARY KEY (user_id),
  CONSTRAINT uk_users_email UNIQUE (email),
  CONSTRAINT uk_users_citizenship_id UNIQUE (citizenship_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
