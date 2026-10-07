# Guest house data

The database starts with **sample** guest houses, rooms, a hall and rates (`database/seed/01_sample_data.sql`).
Before going live, collect the real data with `rooms_template.csv` (one row per room) and enter it through
**Rooms & hall** and **Rate table** in the admin pages, or turn it into a seed file.

Still needed from each guest house: name, location, contact phone, every room (number, type, number of beds,
description), halls (name, seats), and the approved rates per guest type.
