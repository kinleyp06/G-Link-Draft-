# G-Link web client

React 19 + Vite + React Router. Owner: Tandin.

```bash
npm install
npm run dev        # http://localhost:5173 (the API must run on http://localhost:5000)
npm run build      # production build in dist/
```

The API address comes from `VITE_API_URL` (default `http://localhost:5000/api`); copy `.env.example` to `.env.local` to change it.

## Layout

| Folder | What |
|---|---|
| `src/App.jsx` | Every page and who may open it |
| `src/pages/auth` | Sign in, sign up, check email, verify, forgot / reset password (F-04 to F-07) |
| `src/pages/guest` | Rooms, room page, booking steps, my bookings, booking detail, longer stay, meeting hall, profile (F-08 to F-18) |
| `src/pages/admin` | Dashboard, requests, review, extensions, international, blocks, change room, rooms & hall, rates (F-19 to F-26) |
| `src/pages/incharge` | Bookings, today, check-in/out desk (F-27, F-28) |
| `src/pages/super` | Accounts (F-29) |
| `src/pages/dev/StyleGuide.jsx` | Every UI part (F-01), at `/dev/style-guide` |
| `src/components/ui` | Shared UI parts; see `STYLE_GUIDE.md` |
| `src/api/client.js` | Calls the API; errors come back as `{ message, code, fields }` |
| `src/auth` | Signed-in user, role-based page guard |
| `src/layout` | Top bar, role menus, page shells |

Menus per role are in `src/layout/menus.js`. Sign-in tokens are kept in `localStorage` and sent as `Authorization: Bearer …`.
