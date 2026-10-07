# G-Link email texts

The server sends these (code: `server/src/emails/templates.js`). Every email ends with
"— G-Link, Royal University of Bhutan". `GL-0012` = room booking ref, `GH-0003` = hall booking ref.
In development (`EMAIL_HOST` blank) emails are printed in the server log instead of being sent.

| When | Subject | Body |
|---|---|---|
| Sign up / resend | Verify your G-Link email | Welcome to G-Link. Click the link below to verify your email. It works for 24 hours. **[Verify my email]** |
| Forgot password | Reset your G-Link password | Someone asked to reset your G-Link password. The link works for 1 hour. If it was not you, ignore this email. **[Choose a new password]** |
| Booking sent | Booking GL-0012 received | We received your booking request: Room A-102, CST Guest House, 2026-10-12 to 2026-10-14. Total: Nu. 1,200. An admin will approve or reject it soon; we will email you. |
| Approved | Booking GL-0012 approved | Your booking is approved: *stay*. Total: *amount*. Please pay at the guest house when you check in. (+ admin note if any) |
| Rejected | Booking GL-0012 rejected | Sorry, your booking was rejected: *stay*. Reason: *admin note* |
| Cancelled | Booking GL-0012 cancelled | Your booking was cancelled: *stay*. (+ reason) |
| Room changed | Booking GL-0012: room changed | Your room has been changed. New stay: *stay*. Reason: *reason* |
| Longer stay asked | Booking GL-0012: request to stay longer received | You asked to stay until *date* (now *date*). Extra cost if approved: *amount*. We will email you when an admin decides. |
| Longer stay approved | Booking GL-0012: longer stay approved | You can now stay until *date*. New total: *amount*. |
| Longer stay rejected | Booking GL-0012: longer stay not approved | Your request to stay until *date* was not approved. Your stay still ends on *date*. Reason: *note* |
| Hall request sent | Hall booking GH-0003 received | We received your request for *hall* on *date*, *time*. Total: *amount*. We will email you when an admin decides. |
| Hall approved | Hall booking GH-0003 approved | *Hall* is booked for you on *date*, *time*. Total: *amount*. |
| Hall rejected | Hall booking GH-0003 rejected | Sorry, your request for *hall* on *date* was rejected. Reason: *note* |

To change a text, edit `templates.js` and this table together.
