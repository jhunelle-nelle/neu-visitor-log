# NEU Library — Visitor Log
Trigger deploy!
A web-based visitor logging application for New Era University Library.

🔗 **Live Application:** [https://neu-visitor-logbook.lovable.app](https://neu-visitor-logbook.lovable.app)
https://neu-visitor-log-nine.vercel.app/

adding vercel.json
---

## Features

### Visitor (Public — No Login Required)
- **Clock In / Clock Out** using Student/Employee Number
- **First-time visitors**: Enter full details (Name, ID, College, Purpose, Status)
- **Returning visitors**: Details auto-filled from previous visits
- Greeting: **"Welcome to NEU Library!"**

### Admin (Google OAuth — Role-Based Access)
- **Dashboard**: Stats cards — Total Visits, Currently Active, Unique Visitors, Avg. Duration
- **Visit Logs**: Table with Name, St. No., College, Purpose, Status, Date, Time In, Time Out
- **Visitors**: Unique visitor list with total visit count and last visit date
- **Admin**: Account info and quick actions
- **Search Bar**: Search by name, student no., purpose, date
- **Filters**: By date range (today/week/custom), purpose, college, employee status
- **Export**: Download filtered logs as CSV
- **Clear All**: Delete all logs (with confirmation)

### Authentication & Authorization
- Google OAuth only (NEU accounts supported)
- Role-based access control (RBAC) via separate `user_roles` table
- Admin accounts: `jcesperanza@neu.edu.ph`, `jhunelle.remo@neu.edu.ph`
- Automatic role assignment on first login
- `has_role()` security-definer function for safe RLS policies

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, TypeScript, Vite        |
| Styling    | Tailwind CSS, shadcn/ui           |
| Backend    | Lovable Cloud (PostgreSQL)        |
| Auth       | Google OAuth 2.0                  |
| Deployment | Lovable Platform                  |

---

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # App shell with nav & footer
│   └── ui/                 # shadcn/ui components
├── hooks/
│   └── useAuth.tsx         # Auth context with role management
├── lib/
│   ├── utils.ts            # Utility functions
│   └── time.ts             # Local time formatting helpers
├── pages/
│   ├── VisitorForm.tsx     # Public clock-in / clock-out
│   ├── AdminDashboard.tsx  # Admin panel with 4 tabs
│   ├── LoginPage.tsx       # Google OAuth login
│   └── NotFound.tsx        # 404 page
└── integrations/
    └── supabase/           # Auto-generated client & types
```

---

## Local Development

```bash
npm install
npm run dev
```

Requires Node.js 18+ and npm.

---

## License

© 2026 New Era University Library. All rights reserved.
