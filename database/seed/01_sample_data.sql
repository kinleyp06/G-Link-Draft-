-- =============================================================
-- G-Link | D-15 | Sample data for development and demos
-- Run after all schema files:  mysql -u <your_login> -p g_link < seed/01_sample_data.sql
-- SAMPLE values only. Replace with the real guest house data (docs/guest-house-data)
-- before going live. No user accounts are created here: make the first
-- Super Admin with `npm run create-super-admin` in server/ (no passwords in Git).
-- Safe to run twice.
-- =============================================================

USE g_link;

INSERT INTO guest_houses (name, location, description, contact_phone) VALUES
  ('CST Guest House', 'College of Science and Technology, Phuentsholing', 'Guest house on the CST campus.', '05252028'),
  ('Paro College Guest House', 'Paro College of Education, Paro', 'Guest house near the main gate.', '08272011')
ON DUPLICATE KEY UPDATE location = VALUES(location);

INSERT INTO rooms (guest_house_id, room_number, room_type, total_beds, description)
SELECT g.guest_house_id, r.room_number, r.room_type, r.total_beds, r.description
FROM guest_houses g
JOIN (
  SELECT 'CST Guest House' AS gh, 'A-101' AS room_number, 'Double' AS room_type, 2 AS total_beds, 'Two beds, attached bathroom, Wi-Fi.' AS description
  UNION ALL SELECT 'CST Guest House', 'A-102', 'Dormitory', 6, 'Six beds, shared bathroom, lockers.'
  UNION ALL SELECT 'CST Guest House', 'B-201', 'Single', 1, 'One bed, attached bathroom, desk.'
  UNION ALL SELECT 'Paro College Guest House', 'P-01', 'Double', 2, 'Two beds, valley view.'
  UNION ALL SELECT 'Paro College Guest House', 'P-02', 'Dormitory', 4, 'Four beds, shared bathroom.'
) r ON r.gh = g.name
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO halls (guest_house_id, name, capacity, description)
SELECT guest_house_id, 'CST Conference Hall', 60, 'Projector and sound system.' FROM guest_houses WHERE name = 'CST Guest House'
ON DUPLICATE KEY UPDATE capacity = VALUES(capacity);

INSERT INTO rates (guest_type, rate_type, amount) VALUES
  ('RUB Staff', 'Room', 300.00),     ('RUB Staff', 'Hall', 2000.00),
  ('RUB Student', 'Room', 150.00),   ('RUB Student', 'Hall', 1000.00),
  ('Official', 'Room', 500.00),      ('Official', 'Hall', 3000.00),
  ('Private', 'Room', 700.00),       ('Private', 'Hall', 4000.00),
  ('International', 'Room', 1500.00),('International', 'Hall', 6000.00)
ON DUPLICATE KEY UPDATE amount = amount;
