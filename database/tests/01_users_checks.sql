-- =============================================================
-- G-Link | D-03 | Checks for the users table
-- Run after 01_users.sql:  mysql -u <your_login> -p g_link < tests/01_users_checks.sql
-- Each check prints PASS or FAIL. Test rows are removed at the end.
-- =============================================================

USE g_link;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP PROCEDURE IF EXISTS check_users_rules;
DELIMITER //
CREATE PROCEDURE check_users_rules()
BEGIN
  DECLARE refused BOOLEAN DEFAULT FALSE;
  -- Bad ENUM values raise SQLSTATE 01000 in strict mode, so catch warnings too
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION, SQLWARNING SET refused = TRUE;

  DELETE FROM users WHERE email LIKE '%@test.glink';

  -- 1. A normal sign up (only email + password) is accepted with defaults
  SET refused = FALSE;
  INSERT INTO users (email, password, citizenship_id)
  VALUES ('first@test.glink', '$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz01234', 'TEST-CID-1');
  SELECT IF(NOT refused AND (SELECT role = 'Guest' AND status = 'Active' AND email_verified = FALSE
             FROM users WHERE email = 'first@test.glink'), 'PASS', 'FAIL')
         AS `1. sign up with email+password gets defaults`;

  -- 2. Same email again is refused
  SET refused = FALSE;
  INSERT INTO users (email, password) VALUES ('first@test.glink', 'x');
  SELECT IF(refused, 'PASS', 'FAIL') AS `2. duplicate email refused`;

  -- 3. Same citizenship ID again is refused
  SET refused = FALSE;
  INSERT INTO users (email, password, citizenship_id) VALUES ('second@test.glink', 'x', 'TEST-CID-1');
  SELECT IF(refused, 'PASS', 'FAIL') AS `3. duplicate citizenship_id refused`;

  -- 4. Role outside the four values is refused
  SET refused = FALSE;
  INSERT INTO users (email, password, role) VALUES ('third@test.glink', 'x', 'Manager');
  SELECT IF(refused, 'PASS', 'FAIL') AS `4. unknown role refused`;

  -- 5. All four roles are accepted
  SET refused = FALSE;
  INSERT INTO users (email, password, role) VALUES
    ('r1@test.glink', 'x', 'Guest'), ('r2@test.glink', 'x', 'Incharge'),
    ('r3@test.glink', 'x', 'Admin'), ('r4@test.glink', 'x', 'Super Admin');
  SELECT IF(NOT refused, 'PASS', 'FAIL') AS `5. four valid roles accepted`;

  -- 6. Several users without a CID are allowed (NULL is not a duplicate)
  SET refused = FALSE;
  INSERT INTO users (email, password) VALUES ('n1@test.glink', 'x'), ('n2@test.glink', 'x');
  SELECT IF(NOT refused, 'PASS', 'FAIL') AS `6. many users without CID allowed`;

  DELETE FROM users WHERE email LIKE '%@test.glink';
END //
DELIMITER ;

CALL check_users_rules();
DROP PROCEDURE check_users_rules;
