"""Generates the G-Link low-fidelity wireframes (SVG) from the SCREENS list.

Run from the repository root:  python3 docs/wireframes/tools/make_wireframes.py
Edit SCREENS below and re-run to update the drawings and README table.
"""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # docs/wireframes
W = 1000
INK, MUTED, LINE, FILL, SOFT = "#333", "#777", "#999", "#f2f2f2", "#e3e3e3"

MENUS = {
    "Guest": ["Rooms", "My bookings", "Meeting hall", "Profile"],
    "Admin": ["Dashboard", "Booking requests", "Extension requests", "International booking",
              "Block rooms/beds", "Change room", "Rooms & hall", "Rate table"],
    "Incharge": ["Bookings", "Today", "Check-in/out"],
    "Super Admin": ["Accounts", "Dashboard", "Booking requests", "Extension requests", "International booking",
                    "Block rooms/beds", "Change room", "Rooms & hall", "Rate table"],
}


def t(x, y, s, size=14, weight="normal", fill=INK, anchor="start"):
    return (f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'text-anchor="{anchor}">{escape(s)}</text>')


def box(x, y, w, h, fill="#fff", stroke=LINE, r=4, dash=False):
    d = ' stroke-dasharray="6 4"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"{d}/>'


def draw(el, x, y, w):
    """Draws one element at (x, y) with width w. Returns (svg, height)."""
    kind, *a = el
    if kind == "h1":
        return t(x, y + 26, a[0], 24, "bold"), 40
    if kind == "h2":
        return t(x, y + 20, a[0], 18, "bold"), 32
    if kind == "p":
        return t(x, y + 16, a[0], 14, fill=MUTED), 26
    if kind == "input":
        label, value = a[0], (a[1] if len(a) > 1 else "")
        return (t(x, y + 14, label, 13, "bold") + box(x, y + 22, w, 36) + t(x + 10, y + 45, value, 13, fill=MUTED)), 68
    if kind == "select":
        label, value = a
        return (t(x, y + 14, label, 13, "bold") + box(x, y + 22, w, 36) + t(x + 10, y + 45, value, 13, fill=MUTED)
                + t(x + w - 20, y + 45, "▾", 13)), 68
    if kind == "textarea":
        return t(x, y + 14, a[0], 13, "bold") + box(x, y + 22, w, 80), 112
    if kind == "error":
        return t(x, y + 12, "⚠ " + a[0], 12, fill="#b03a3a"), 22
    if kind == "check":
        return box(x, y + 4, 16, 16) + t(x + 26, y + 17, a[0], 13), 28
    if kind == "buttons":
        svg, bx = "", x
        for label, style in a[0]:
            bw = max(90, 9 * len(label) + 30)
            fill = {"primary": "#555", "danger": "#a44", "secondary": "#fff"}[style]
            col = INK if style == "secondary" else "#fff"
            svg += box(bx, y, bw, 38, fill, "#555") + t(bx + bw / 2, y + 24, label, 13, "bold", col, "middle")
            bx += bw + 10
        return svg, 50
    if kind == "link":
        return t(x, y + 14, a[0], 13, fill="#2e4a7a"), 24
    if kind == "table":
        headers, rows = a
        cw = w / len(headers)
        svg = box(x, y, w, 34, SOFT, LINE, 0)
        for i, h in enumerate(headers):
            svg += t(x + 10 + i * cw, y + 22, h, 12, "bold")
        for r, row in enumerate(rows):
            ry = y + 34 + r * 34
            svg += box(x, ry, w, 34, "#fff", LINE, 0)
            for i, c in enumerate(row):
                if c.startswith("[") and c.endswith("]"):
                    svg += box(x + 8 + i * cw, ry + 6, min(cw - 16, 9 * len(c) + 10), 22, "#fff", "#555") + \
                        t(x + 14 + i * cw, ry + 21, c[1:-1], 11)
                else:
                    svg += t(x + 10 + i * cw, ry + 22, c, 12)
        return svg, 34 * (len(rows) + 1) + 12
    if kind == "stats":
        n = len(a[0])
        sw = (w - 10 * (n - 1)) / n
        svg = ""
        for i, (label, value) in enumerate(a[0]):
            sx = x + i * (sw + 10)
            svg += box(sx, y, sw, 76, FILL) + t(sx + 12, y + 24, label, 12, fill=MUTED) + t(sx + 12, y + 58, value, 24, "bold")
        return svg, 88
    if kind == "card":
        title, lines = a
        h = 40 + 22 * len(lines)
        svg = box(x, y, w, h, FILL) + t(x + 14, y + 26, title, 15, "bold")
        for i, line in enumerate(lines):
            svg += t(x + 14, y + 50 + 22 * i, line, 13)
        return svg, h + 12
    if kind == "note":
        lines = a[0] if isinstance(a[0], list) else [a[0]]
        h = 18 + 20 * len(lines)
        svg = box(x, y, w, h, "#fffbe6", "#b45309", 4, dash=True)
        for i, line in enumerate(lines):
            svg += t(x + 12, y + 24 + 20 * i, line, 13, fill="#7a3d00")
        return svg, h + 12
    if kind == "image":
        h = a[1] if len(a) > 1 else 160
        return (box(x, y, w, h, SOFT) + f'<line x1="{x}" y1="{y}" x2="{x + w}" y2="{y + h}" stroke="{LINE}"/>'
                + f'<line x1="{x + w}" y1="{y}" x2="{x}" y2="{y + h}" stroke="{LINE}"/>'
                + t(x + w / 2, y + h / 2 + 5, a[0], 13, "bold", MUTED, "middle")), h + 12
    if kind == "tabs":
        names, active = a
        svg, tx = "", x
        for n in names:
            tw = 9 * len(n) + 30
            svg += box(tx, y, tw, 32, "#555" if n == active else "#fff", "#555") + \
                t(tx + tw / 2, y + 21, n, 12, "bold", "#fff" if n == active else INK, "middle")
            tx += tw + 6
        return svg, 44
    if kind == "row":
        parts = a[0]
        gap = 16
        pw = (w - gap * (len(parts) - 1)) / len(parts)
        svg, hmax = "", 0
        for i, p in enumerate(parts):
            s, h = draw(p, x + i * (pw + gap), y, pw)
            svg += s
            hmax = max(hmax, h)
        return svg, hmax
    if kind == "space":
        return "", a[0]
    raise ValueError(kind)


def render(screen):
    role, active = screen.get("role"), screen.get("active")
    body = screen["body"]
    out = []
    if role:  # signed-in layout: top bar + side menu
        cx, cw, top = 230, W - 260, 80
    else:     # signed-out layout: centred card
        cx, cw, top = 320, 360, 110
    y = top
    for el in body:
        s, h = draw(el, cx, y, cw)
        out.append(s)
        y += h + 6
    height = max(y + 70, 560)

    chrome = [box(0, 0, W, height, "#fff", "#555", 0), box(0, 0, W, 56, FILL, LINE, 0),
              t(24, 35, "G-Link", 20, "bold"), t(108, 35, "RUB Guest House Booking", 12, fill=MUTED)]
    if role:
        chrome.append(t(W - 24, 35, f"Signed in as {role}  ·  Sign out", 12, fill=MUTED, anchor="end"))
        chrome.append(box(0, 56, 200, height - 56 - 36, FILL, LINE, 0))
        for i, item in enumerate(MENUS[role]):
            iy = 72 + i * 38
            if item == active:
                chrome.append(box(8, iy, 184, 32, "#555", "#555"))
            chrome.append(t(20, iy + 21, item, 13, "bold" if item == active else "normal",
                            "#fff" if item == active else INK))
    else:
        chrome.append(box(cx - 30, top - 30, cw + 60, y - top + 40, "#fff", LINE, 8))
    footer = (box(0, height - 36, W, 36, SOFT, LINE, 0) +
              t(16, height - 13, f'{screen["task"]} · {screen["title"]}', 12, "bold") +
              t(W - 16, height - 13, "Low-fidelity wireframe · G-Link", 12, fill=MUTED, anchor="end"))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{height}" viewBox="0 0 {W} {height}" '
            f'font-family="Arial, Helvetica, sans-serif">\n<title>{escape(screen["task"] + " " + screen["title"])}</title>\n'
            + "\n".join(chrome + out) + "\n" + footer + "\n</svg>\n")


# --------------------------------------------------------------------------- screens
D = "Dashboard"
SCREENS = [
    # ---------- Guest, first half of O-01 ----------
    dict(folder="guest", file="F-04-sign-in.svg", task="F-04", title="Sign in", body=[
        ("h1", "Sign in"), ("p", "Book a room at an RUB guest house."),
        ("input", "Email", "name@rub.edu.bt"), ("input", "Password", "••••••••   [Show]"),
        ("error", "Email or password is wrong."),
        ("buttons", [("Sign in", "primary")]), ("link", "New here? Create an account"),
        ("link", "Forgot password?")]),
    dict(folder="guest", file="F-05-sign-up.svg", task="F-05", title="Sign up", body=[
        ("h1", "Create an account"), ("p", "Only email and password now. Profile later."),
        ("input", "Email", "name@rub.edu.bt"), ("input", "Password", "At least 8 characters   [Show]"),
        ("input", "Confirm password", ""), ("buttons", [("Create account", "primary")]),
        ("link", "Already have an account? Sign in")]),
    dict(folder="guest", file="F-06-check-email.svg", task="F-06", title="Check your email", body=[
        ("h1", "Check your email"), ("p", "We sent a link to name@rub.edu.bt."),
        ("p", "Click the link to verify your account."), ("p", "The link works for 24 hours."),
        ("buttons", [("Resend email", "secondary")]), ("link", "Back to sign in")]),
    dict(folder="guest", file="F-09-room-list.svg", task="F-09", title="Room list with free beds", role="Guest",
         active="Rooms", body=[
        ("h1", "Rooms"), ("row", [("select", "Guest house", "All guest houses"), ("input", "Check-in", "12/10/2026"),
                                   ("input", "Check-out", "14/10/2026")]),
        ("buttons", [("Search", "primary")]),
        ("table", ["Room", "Guest house", "Type", "Beds", "Free beds", "Rate / night", ""],
         [["A-101", "CST Guest House", "Double", "2", "2", "Nu. 500", "[View]"],
          ["A-102", "CST Guest House", "Dormitory", "6", "3", "Nu. 300", "[View]"],
          ["B-201", "CST Guest House", "Single", "1", "0 (full)", "Nu. 700", "[View]"]]),
        ("note", "Free beds = total beds − booked beds − blocked beds for the chosen dates.")]),
    dict(folder="guest", file="F-10-room-page.svg", task="F-10", title="Room page", role="Guest", active="Rooms", body=[
        ("link", "← Back to rooms"), ("h1", "Room A-102 · Dormitory"), ("image", "Room photo", 180),
        ("row", [("card", "About this room", ["CST Guest House, Block A", "6 beds · shared bathroom",
                                              "Wi-Fi, hot water, blanket"]),
                 ("card", "For 12–14 Oct 2026", ["Free beds: 3 of 6", "Rate: Nu. 300 per bed per night",
                                                 "You may share the room with other guests"])]),
        ("buttons", [("Book this room", "primary")])]),
    # ---------- Guest, second half of O-01 ----------
    dict(folder="guest", file="F-11-booking-form.svg", task="F-11", title="Booking form", role="Guest", active="Rooms",
         body=[("h1", "Book room A-102"), ("row", [("input", "Check-in", "12/10/2026"), ("input", "Check-out", "14/10/2026")]),
               ("row", [("select", "Guest type", "RUB staff"), ("input", "Number of beds", "1")]),
               ("input", "Purpose of visit", "Workshop at CST"),
               ("check", "I agree to share the room with other guests if beds are free"),
               ("p", "Bringing someone? Add them on the next step."),
               ("buttons", [("Next: guests", "primary"), ("Cancel", "secondary")])]),
    dict(folder="guest", file="F-12-extra-guest-form.svg", task="F-12", title="Extra guest form", role="Guest",
         active="Rooms", body=[("h1", "Who is staying?"), ("p", "One bed per person. You are guest 1."),
               ("card", "Guest 2", ["Full name · Gender · CID / passport no. · Phone"]),
               ("row", [("input", "Full name", ""), ("select", "Gender", "Choose…")]),
               ("row", [("input", "CID / passport no.", ""), ("input", "Phone", "")]),
               ("buttons", [("+ Add another guest", "secondary"), ("Remove", "danger")]),
               ("buttons", [("Next: bill", "primary"), ("Back", "secondary")])]),
    dict(folder="guest", file="F-13-shared-room-notice.svg", task="F-13", title="Shared-room notice", role="Guest",
         active="Rooms", body=[("h1", "This room is shared"),
               ("note", ["Room A-102 has 6 beds. Other guests may stay in the same room on your dates.",
                         "Your belongings are your own responsibility. Lockers are at the reception."]),
               ("check", "I understand that I will share the room"),
               ("buttons", [("Continue", "primary"), ("Choose another room", "secondary")])]),
    dict(folder="guest", file="F-14-bill.svg", task="F-14", title="Bill page", role="Guest", active="Rooms", body=[
        ("h1", "Your bill"),
        ("table", ["Item", "Nights", "Beds", "Rate", "Amount"],
         [["Room A-102 (RUB staff)", "2", "2", "Nu. 300", "Nu. 1,200"], ["", "", "", "Total", "Nu. 1,200"]]),
        ("p", "Pay at the guest house when you check in. Booking needs admin approval."),
        ("buttons", [("Send booking request", "primary"), ("Back", "secondary")])]),
    dict(folder="guest", file="F-15-my-bookings.svg", task="F-15", title="My bookings", role="Guest",
         active="My bookings", body=[("h1", "My bookings"), ("tabs", ["Upcoming", "Past", "All"], "Upcoming"),
        ("table", ["Ref", "Room", "Check-in", "Check-out", "Status", ""],
         [["GL-0012", "A-102", "12 Oct", "14 Oct", "Pending", "[Open]"],
          ["GL-0009", "B-201", "20 Oct", "22 Oct", "Approved", "[Open]"],
          ["GL-0004", "A-101", "2 Oct", "4 Oct", "Completed", "[Open]"]])]),
    dict(folder="guest", file="F-16-booking-detail.svg", task="F-16", title="Booking detail", role="Guest",
         active="My bookings", body=[("link", "← My bookings"), ("h1", "Booking GL-0009 · Approved"),
        ("row", [("card", "Stay", ["Room B-201, CST Guest House", "20 Oct → 22 Oct 2026 (2 nights)", "Beds: 1"]),
                 ("card", "Bill", ["Total: Nu. 1,400", "Payment: Unpaid", "Pay at check-in"])]),
        ("card", "Guests", ["1. You", "2. Pema Wangmo"]),
        ("buttons", [("Ask to stay longer", "secondary"), ("Cancel booking", "danger")])]),
    dict(folder="guest", file="F-17-longer-stay-request.svg", task="F-17", title="Longer-stay request", role="Guest",
         active="My bookings", body=[("h1", "Ask to stay longer"), ("p", "Booking GL-0009 · now ends 22 Oct 2026"),
        ("input", "New check-out date", "24/10/2026"), ("textarea", "Reason"),
        ("note", "The admin checks the room is free and approves or rejects. You get an email."),
        ("buttons", [("Send request", "primary"), ("Cancel", "secondary")])]),
    dict(folder="guest", file="F-18-meeting-hall.svg", task="F-18", title="Meeting hall page", role="Guest",
         active="Meeting hall", body=[("h1", "Meeting hall"),
        ("card", "CST Conference Hall", ["Seats 60 · projector, sound system", "Rate: Nu. 3,000 per day"]),
        ("row", [("input", "Date", "15/10/2026"), ("input", "From", "09:00"), ("input", "To", "13:00")]),
        ("row", [("input", "Number of people", "40"), ("input", "Purpose", "Department meeting")]),
        ("buttons", [("Request hall", "primary")]),
        ("table", ["My hall bookings", "Date", "Time", "Status"], [["Dept meeting", "15 Oct", "09–13", "Pending"]])]),
    # ---------- Admin / Incharge / Super Admin (O-02) ----------
    dict(folder="admin-incharge-superadmin", file="F-19-admin-home.svg", task="F-19", title="Admin home", role="Admin",
         active=D, body=[("h1", "Dashboard"),
        ("stats", [("Pending requests", "7"), ("Guests today", "12"), ("Free beds today", "18"), ("Extensions", "2")]),
        ("h2", "Needs your action"),
        ("table", ["Ref", "Guest", "Room", "Dates", "Status", ""],
         [["GL-0012", "Pema Wangmo", "A-102", "12–14 Oct", "Pending", "[Review]"],
          ["GL-0013", "Karma Dorji", "A-101", "13–15 Oct", "Pending", "[Review]"]])]),
    dict(folder="admin-incharge-superadmin", file="F-20-booking-requests.svg", task="F-20", title="Booking requests list",
         role="Admin", active="Booking requests", body=[("h1", "Booking requests"),
        ("row", [("select", "Status", "Pending"), ("select", "Guest house", "All"), ("input", "Search", "Name or ref")]),
        ("table", ["Ref", "Guest", "Room", "Check-in", "Check-out", "Beds", "Status", ""],
         [["GL-0012", "Pema Wangmo", "A-102", "12 Oct", "14 Oct", "2", "Pending", "[Review]"],
          ["GL-0013", "Karma Dorji", "A-101", "13 Oct", "15 Oct", "1", "Pending", "[Review]"],
          ["GL-0011", "Sonam Choden", "B-201", "11 Oct", "12 Oct", "1", "Approved", "[Open]"]])]),
    dict(folder="admin-incharge-superadmin", file="F-20-booking-review.svg", task="F-20", title="Booking review (Approve / Reject)",
         role="Admin", active="Booking requests", body=[("link", "← Booking requests"), ("h1", "Review GL-0012"),
        ("row", [("card", "Guest", ["Pema Wangmo · RUB staff", "pema@rub.edu.bt · 17xxxxxx", "Purpose: workshop"]),
                 ("card", "Stay", ["Room A-102 (Dormitory)", "12 → 14 Oct 2026 · 2 beds", "Free beds on dates: 3"])]),
        ("card", "Bill", ["2 nights × 2 beds × Nu. 300 = Nu. 1,200"]),
        ("textarea", "Note to guest (needed when rejecting)"),
        ("buttons", [("Approve", "primary"), ("Reject", "danger")])]),
    dict(folder="admin-incharge-superadmin", file="F-21-extension-requests.svg", task="F-21", title="Extension requests",
         role="Admin", active="Extension requests", body=[("h1", "Extension requests"),
        ("table", ["Ref", "Guest", "Room", "Now ends", "New end", "Free?", ""],
         [["GL-0009", "Karma Dorji", "B-201", "22 Oct", "24 Oct", "Yes", "[Approve] [Reject]"],
          ["GL-0007", "Tashi Lhamo", "A-101", "18 Oct", "21 Oct", "No", "[Approve] [Reject]"]]),
        ("note", "Approve is blocked when the room has no free bed for the extra nights.")]),
    dict(folder="admin-incharge-superadmin", file="F-22-international-booking.svg", task="F-22", title="International guest booking",
         role="Admin", active="International booking", body=[("h1", "Book for an international guest"),
        ("row", [("input", "Full name", ""), ("input", "Passport no.", "")]),
        ("row", [("input", "Nationality", ""), ("input", "Email", "")]),
        ("row", [("select", "Room", "A-101 (2 free)"), ("input", "Check-in", ""), ("input", "Check-out", "")]),
        ("row", [("input", "Beds", "1"), ("input", "Rate", "International · Nu. 1,500")]),
        ("buttons", [("Create booking (approved)", "primary"), ("Cancel", "secondary")])]),
    dict(folder="admin-incharge-superadmin", file="F-23-block-rooms-beds.svg", task="F-23", title="Block rooms or beds",
         role="Admin", active="Block rooms/beds", body=[("h1", "Block rooms or beds"),
        ("row", [("select", "Room", "A-102"), ("input", "Beds to block", "2 of 6")]),
        ("row", [("input", "From", "20/10/2026"), ("input", "To", "25/10/2026")]),
        ("input", "Reason", "Repair work"), ("buttons", [("Block", "primary")]),
        ("table", ["Room", "Beds", "From", "To", "Reason", ""],
         [["A-102", "2", "20 Oct", "25 Oct", "Repair work", "[Remove]"]])]),
    dict(folder="admin-incharge-superadmin", file="F-24-change-room.svg", task="F-24", title="Change room", role="Admin",
         active="Change room", body=[("h1", "Change room"), ("input", "Booking ref", "GL-0011"),
        ("card", "Current", ["Sonam Choden · Room B-201 · 11 → 12 Oct · 1 bed"]),
        ("select", "Move to room", "A-101 (2 free beds on these dates)"), ("input", "Reason", ""),
        ("buttons", [("Change room", "primary")]), ("note", "Only rooms with enough free beds are listed. Guest gets an email.")]),
    dict(folder="admin-incharge-superadmin", file="F-25-rooms-and-hall.svg", task="F-25", title="Rooms and hall", role="Admin",
         active="Rooms & hall", body=[("h1", "Rooms and hall"), ("tabs", ["Rooms", "Hall", "Guest houses"], "Rooms"),
        ("buttons", [("+ Add room", "primary")]),
        ("table", ["Room", "Guest house", "Type", "Beds", "Status", ""],
         [["A-101", "CST Guest House", "Double", "2", "Active", "[Edit]"],
          ["A-102", "CST Guest House", "Dormitory", "6", "Active", "[Edit]"],
          ["B-201", "CST Guest House", "Single", "1", "Inactive", "[Edit]"]])]),
    dict(folder="admin-incharge-superadmin", file="F-26-rate-table.svg", task="F-26", title="Rate table editor", role="Admin",
         active="Rate table", body=[("h1", "Rate table"), ("p", "Amounts in Nu. Room rates are per bed per night; hall per day."),
        ("table", ["Guest type", "Room / bed / night", "Hall / day"],
         [["RUB staff", "[ 300 ]", "[ 2,000 ]"], ["RUB student", "[ 150 ]", "[ 1,000 ]"],
          ["Official guest", "[ 500 ]", "[ 3,000 ]"], ["Private guest", "[ 700 ]", "[ 4,000 ]"],
          ["International", "[ 1,500 ]", "[ 6,000 ]"]]),
        ("buttons", [("Save rates", "primary")]), ("note", "New rates apply to new bookings only.")]),
    dict(folder="admin-incharge-superadmin", file="F-27-incharge-bookings.svg", task="F-27", title="Incharge bookings",
         role="Incharge", active="Bookings", body=[("h1", "Bookings"), ("tabs", ["Today", "This week", "All approved"], "This week"),
        ("table", ["Ref", "Guest", "Room", "Check-in", "Check-out", "Paid", ""],
         [["GL-0011", "Sonam Choden", "B-201", "11 Oct", "12 Oct", "No", "[Open]"],
          ["GL-0012", "Pema Wangmo", "A-102", "12 Oct", "14 Oct", "No", "[Open]"]])]),
    dict(folder="admin-incharge-superadmin", file="F-28-check-in-out.svg", task="F-28", title="Check-in and check-out",
         role="Incharge", active="Check-in/out", body=[("h1", "Check-in / check-out"), ("input", "Find booking", "Ref, name or CID"),
        ("card", "GL-0012 · Pema Wangmo", ["Room A-102 · 12 → 14 Oct · 2 beds", "Bill: Nu. 1,200 · Unpaid"]),
        ("row", [("select", "Payment method", "Cash"), ("input", "Receipt / ref no.", "")]),
        ("buttons", [("Record payment", "secondary"), ("Check in", "primary"), ("Check out", "primary")])]),
    dict(folder="admin-incharge-superadmin", file="F-29-manage-accounts.svg", task="F-29", title="Super Admin: manage accounts",
         role="Super Admin", active="Accounts", body=[("h1", "Accounts"),
        ("row", [("input", "Search", "Name or email"), ("select", "Role", "All")]),
        ("table", ["Name", "Email", "Role", "Status", ""],
         [["Kinley P.", "kinley@rub.edu.bt", "Admin", "Active", "[Edit]"],
          ["Tandin", "tandin@rub.edu.bt", "Incharge", "Active", "[Edit]"],
          ["Pema Wangmo", "pema@rub.edu.bt", "Guest", "Inactive", "[Edit]"]]),
        ("note", "Change role (Guest / Incharge / Admin / Super Admin) or set Active / Inactive.")]),
]


README_HEAD = """# G-Link wireframes

Low-fidelity wireframes, one SVG per screen. Each drawing names its task ID in the bottom bar.
They show the main fields and buttons only; colours and exact spacing come from `client/STYLE_GUIDE.md`.

- **O-02** Admin, Incharge and Super Admin screens: `admin-incharge-superadmin/`
- **O-01** Guest screens: `guest/` (first half F-04 to F-10, second half F-11 to F-18)

> F-11 to F-18 are numbered in the order of the plan (booking form, extra guest form, shared-room notice,
> bill, My bookings, booking detail, longer-stay request, meeting hall). Check the numbers against the task plan.

To change a drawing, edit `SCREENS` in `tools/make_wireframes.py` and run
`python3 docs/wireframes/tools/make_wireframes.py` from the repository root. It rewrites the SVGs and this file.

## Files

| File | Task | Screen | Role |
|---|---|---|---|
"""


def main():
    rows = []
    for s in SCREENS:
        path = ROOT / s["folder"] / s["file"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(render(s), encoding="utf-8")
        rows.append(f'| [`{s["folder"]}/{s["file"]}`]({s["folder"]}/{s["file"]}) | {s["task"]} | {s["title"]} | {s.get("role") or "Signed out"} |')
    menus = "\n".join(f"- **{role}**: {', '.join(items)}" for role, items in MENUS.items())
    (ROOT / "README.md").write_text(README_HEAD + "\n".join(rows) + "\n\n## Role menus\n\n" + menus + "\n", encoding="utf-8")
    print(f"Wrote {len(SCREENS)} wireframes and README.md")


if __name__ == "__main__":
    main()
