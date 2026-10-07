-- =============================================================
-- G-Link | D-15 | Checks for the booking tables
-- Run after all schema files and seed/01_sample_data.sql:
--   mysql -u <your_login> -p g_link < tests/02_booking_rules_checks.sql
-- Each check prints PASS or FAIL. Everything it adds is removed at the end.
-- =============================================================

USE g_link;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP PROCEDURE IF EXISTS check_booking_rules;
DELIMITER //
CREATE PROCEDURE check_booking_rules()
BEGIN
  DECLARE refused BOOLEAN DEFAULT FALSE;
  DECLARE uid INT;
  DECLARE rid INT;
  DECLARE bid INT;
  DECLARE hid INT;
  DECLARE hbid INT;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION, SQLWARNING SET refused = TRUE;

  INSERT INTO users (email, password) VALUES ('booker@test.glink', 'x');
  SET uid = LAST_INSERT_ID();
  SELECT room_id INTO rid FROM rooms ORDER BY room_id LIMIT 1;
  SELECT hall_id INTO hid FROM halls ORDER BY hall_id LIMIT 1;

  -- 1. A normal booking is accepted with status Pending
  SET refused = FALSE;
  INSERT INTO bookings (user_id, room_id, check_in, check_out, beds, guest_type, rate_amount, total_amount)
  VALUES (uid, rid, '2030-01-10', '2030-01-12', 1, 'RUB Staff', 300, 600);
  SET bid = LAST_INSERT_ID();
  SELECT IF(NOT refused AND (SELECT status FROM bookings WHERE booking_id = bid) = 'Pending', 'PASS', 'FAIL')
         AS `1. booking accepted, starts Pending`;

  -- 2. check_out must be after check_in
  SET refused = FALSE;
  INSERT INTO bookings (user_id, room_id, check_in, check_out, beds, guest_type, rate_amount, total_amount)
  VALUES (uid, rid, '2030-01-12', '2030-01-12', 1, 'RUB Staff', 300, 0);
  SELECT IF(refused, 'PASS', 'FAIL') AS `2. zero-night booking refused`;

  -- 3. Unknown status refused
  SET refused = FALSE;
  UPDATE bookings SET status = 'Waiting' WHERE booking_id = bid;
  SELECT IF(refused, 'PASS', 'FAIL') AS `3. unknown booking status refused`;

  -- 4. Booking for a room that does not exist refused
  SET refused = FALSE;
  INSERT INTO bookings (user_id, room_id, check_in, check_out, beds, guest_type, rate_amount, total_amount)
  VALUES (uid, 999999, '2030-01-10', '2030-01-12', 1, 'RUB Staff', 300, 600);
  SELECT IF(refused, 'PASS', 'FAIL') AS `4. unknown room refused`;

  -- 5. Room with 0 beds refused
  SET refused = FALSE;
  INSERT INTO rooms (guest_house_id, room_number, room_type, total_beds)
  SELECT guest_house_id, 'TEST-0', 'Single', 0 FROM guest_houses LIMIT 1;
  SELECT IF(refused, 'PASS', 'FAIL') AS `5. room with 0 beds refused`;

  -- 6. Same room number twice in one guest house refused
  SET refused = FALSE;
  INSERT INTO rooms (guest_house_id, room_number, room_type, total_beds)
  SELECT guest_house_id, room_number, room_type, total_beds FROM rooms WHERE room_id = rid;
  SELECT IF(refused, 'PASS', 'FAIL') AS `6. duplicate room number refused`;

  -- 7. Second rate for the same guest type and rate type refused
  SET refused = FALSE;
  INSERT INTO rates (guest_type, rate_type, amount) VALUES ('RUB Staff', 'Room', 1);
  SELECT IF(refused, 'PASS', 'FAIL') AS `7. duplicate rate refused`;

  -- 8. Extension must move check-out later
  SET refused = FALSE;
  INSERT INTO stay_extensions (booking_id, current_check_out, new_check_out, extra_amount)
  VALUES (bid, '2030-01-12', '2030-01-11', 0);
  SELECT IF(refused, 'PASS', 'FAIL') AS `8. extension to an earlier date refused`;

  -- 9. Hall booking that ends before it starts refused
  SET refused = FALSE;
  INSERT INTO hall_bookings (hall_id, user_id, event_date, start_time, end_time, attendees, purpose, guest_type, rate_amount, total_amount)
  VALUES (hid, uid, '2030-01-10', '13:00', '09:00', 10, 'Test', 'RUB Staff', 2000, 2000);
  SELECT IF(refused, 'PASS', 'FAIL') AS `9. hall booking ending before start refused`;

  -- 10. Payment must point at exactly one booking
  SET refused = FALSE;
  INSERT INTO hall_bookings (hall_id, user_id, event_date, start_time, end_time, attendees, purpose, guest_type, rate_amount, total_amount)
  VALUES (hid, uid, '2030-01-10', '09:00', '13:00', 10, 'Test', 'RUB Staff', 2000, 2000);
  SET hbid = LAST_INSERT_ID();
  INSERT INTO payments (booking_id, hall_booking_id, amount, method, recorded_by) VALUES (bid, hbid, 100, 'Cash', uid);
  SELECT IF(refused, 'PASS', 'FAIL') AS `10. payment for two things at once refused`;

  SET refused = FALSE;
  INSERT INTO payments (booking_id, amount, method, recorded_by) VALUES (bid, 0, 'Cash', uid);
  SELECT IF(refused, 'PASS', 'FAIL') AS `11. zero payment refused`;

  SET refused = FALSE;
  INSERT INTO payments (booking_id, amount, method, recorded_by) VALUES (bid, 600, 'mBoB', uid);
  SELECT IF(NOT refused, 'PASS', 'FAIL') AS `12. valid payment accepted`;

  -- 13. Deleting a booking removes its extra guests (cascade)
  SET refused = FALSE;
  DELETE FROM payments WHERE booking_id = bid;
  INSERT INTO booking_guests (booking_id, full_name) VALUES (bid, 'Test Guest');
  DELETE FROM bookings WHERE booking_id = bid;
  SELECT IF(NOT refused AND (SELECT COUNT(*) FROM booking_guests WHERE booking_id = bid) = 0, 'PASS', 'FAIL')
         AS `13. booking guests removed with booking`;

  -- clean up
  DELETE FROM hall_bookings WHERE user_id = uid;
  DELETE FROM bookings WHERE user_id = uid;
  DELETE FROM users WHERE user_id = uid;
END //
DELIMITER ;

CALL check_booking_rules();
DROP PROCEDURE check_booking_rules;
