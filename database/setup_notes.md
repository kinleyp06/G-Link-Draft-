# G-Link database setup (D-01)

Owner: Sonam · Database: **MySQL 8** · Name: **`g_link`** · Charset: **utf8mb4 / utf8mb4_unicode_ci**

## 1. Install MySQL 8

| OS | How |
|---|---|
| Windows | Download *MySQL Installer* from <https://dev.mysql.com/downloads/installer/>, choose **Server only** (or *Developer Default* to also get Workbench). Keep port **3306**. Set a strong root password and write it somewhere private. |
| macOS | `brew install mysql` then `brew services start mysql`, then `mysql_secure_installation`. |
| Ubuntu / Debian | `sudo apt install mysql-server`, then `sudo mysql_secure_installation`. |

Check it works:

```bash
mysql --version          # should say 8.x
mysql -u root -p         # log in with the root password
```

## 2. Create the database and tables

From the repository root:

```bash
sh database/setup_all.sh -u root -p        # every table + sample data, in order
```

Or one file at a time:

```bash
mysql -u root -p < database/schema/00_create_database.sql
mysql -u root -p g_link < database/schema/01_users.sql
# ... 02 to 12 in number order, then:
mysql -u root -p g_link < database/seed/01_sample_data.sql
```

Scripts are numbered; always run them in order. They use `IF NOT EXISTS`, so running them twice is safe.
What each table is for: `data_model.md`.

Checks (print PASS/FAIL and remove their own test rows):

```bash
mysql -u root -p g_link < database/tests/01_users_checks.sql
mysql -u root -p g_link < database/tests/02_booking_rules_checks.sql
```

## 3. Give each member their own login

Each member gets a personal login, never the shared root account. As root:

```sql
CREATE USER IF NOT EXISTS 'glink_<name>'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON g_link.* TO 'glink_<name>'@'localhost';
FLUSH PRIVILEGES;
```

Replace `<name>` (e.g. `glink_kinley`) and `CHANGE_ME` with a strong password. On a member's own laptop they can create their own login the same way.

Each member puts their login in `server/.env` (copied from `server/.env.example`):

```
DB_USER=glink_<name>
DB_PASSWORD=<your password>
DB_NAME=g_link
```

## 4. Sharing login details safely

- **Never** put a real password in Git, in a `.sql` file, in `.env.example`, in screenshots, or in the group chat.
- Share a password one-to-one only (in person, or a private direct message that is deleted afterwards).
- `.env` files are ignored by Git. Only `.env.example` (with blank values) is committed.
- If a password is leaked, change it straight away: `ALTER USER 'glink_<name>'@'localhost' IDENTIFIED BY '<new>';`

## 5. Naming rules

1. Tables are lowercase snake_case and plural: `users`, `guest_houses`, `rooms`, `bookings`, `booking_guests`, `room_sharing`, `stay_extensions`, `room_blocks`, `halls`, `hall_bookings`, `rates`, `payments`.
2. Columns are lowercase snake_case, exactly as in our Data Types document.
3. Primary keys are `<name>_id INT AUTO_INCREMENT`, as in the Data Types document (e.g. `user_id`, `booking_id`).
4. Keys are named `fk_<table>_<column>`, `uk_<table>_<column>`, `idx_<table>_<columns>` (e.g. `uk_users_email`, `fk_bookings_user_id`, `idx_bookings_check_in_check_out`).
5. ENUM values are written exactly as in the Data Types document (e.g. `'Super Admin'`, not `'super_admin'`), and every table uses `ENGINE=InnoDB` with `utf8mb4` / `utf8mb4_unicode_ci`.

## Files

| File | Task | What it does |
|---|---|---|
| `schema/00_create_database.sql` | D-01 | Creates `g_link` (utf8mb4) and shows how to make a personal login |
| `schema/01_users.sql` | D-03 | `users` table |
| `tests/01_users_checks.sql` | D-03 | PASS/FAIL checks: duplicate email/CID refused, role limited to 4 values |
| `schema/02` … `schema/12` | D-04 … D-14 | The other eleven tables (see `data_model.md`) |
| `seed/01_sample_data.sql` | D-15 | Sample guest houses, rooms, hall and rates |
| `tests/02_booking_rules_checks.sql` | D-15 | PASS/FAIL checks for the booking tables |
| `setup_all.sh` | D-15 | Runs everything in order |
