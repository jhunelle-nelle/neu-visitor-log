# NEU Library Visitor Log System

A full-stack web application for managing visitor logs at the **New Era University Library**. Built as a modern, responsive system with role-based access control and real-time visitor tracking.

🔗 **Live Application:** [https://neu-visitor-logbook.lovable.app](https://neu-visitor-logbook.lovable.app)

---

## Features

### Visitor Log (Public — No Login Required)
- **Clock In** — Visitors enter their Name, ID Number, College, Purpose of Visit, and Status (Student / Teacher / Staff)
- **Clock Out** — Visitors enter their ID Number to end their session
- Greeting message: *"Welcome to NEU Library!"*

### Admin Dashboard (Authenticated Users Only)
- **Google OAuth Sign-In** — Admins log in with their NEU Google account (e.g. `jcesperanza@neu.edu.ph`)
- **Role-Based Access Control (RBAC)** — Secure authorization with `admin` and `user` roles stored in a separate `user_roles` table
- **Visitor Statistics Cards** — Total Visits, Currently Active, Unique Visitors, Average Duration
- **Advanced Filtering** — Filter logs by:
  - Date range (Today, This Week, Custom Range)
  - Purpose of visit (Study/Research, Borrow Books, etc.)
  - College / Department
  - Employee status (Student, Teacher, Staff)
- **CSV Export** — Download filtered visitor logs as a `.csv` file
- **Clear All Logs** — Admin-only action with confirmation dialog

### Security
- Row-Level Security (RLS) policies on all database tables
- `has_role()` security-definer function prevents recursive RLS checks
- Admin privileges verified server-side, never client-side

---

## Tech Stack

| Layer        | Technology                              |
|--------------|----------------------------------------|
| Frontend     | React 18, TypeScript, Vite             |
| Styling      | Tailwind CSS, shadcn/ui               |
| Backend      | Lovable Cloud (Supabase)              |
| Auth         | Google OAuth 2.0                       |
| Database     | PostgreSQL with RLS                    |
| Deployment   | Lovable Platform                       |

---

## Account Roles

| Email                         | Role    | Access                                      |
|-------------------------------|---------|---------------------------------------------|
| `jcesperanza@neu.edu.ph`     | Admin   | Dashboard, statistics, filters, CSV export  |
| `jhunelle.remo@neu.edu.ph`   | Admin   | Dashboard, statistics, filters, CSV export  |
| Any other Google account      | User    | Greeted with "Welcome to NEU Library!"      |

---

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # App shell with nav & footer
│   └── ui/                 # shadcn/ui components
├── hooks/
│   └── useAuth.tsx         # Auth context with role management
├── pages/
│   ├── VisitorForm.tsx     # Public clock-in / clock-out form
│   ├── LoginPage.tsx       # Google OAuth login
│   ├── AdminDashboard.tsx  # Admin stats, filters, table
│   └── NotFound.tsx        # 404 page
└── integrations/
    └── supabase/           # Auto-generated client & types
```

---

## Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start dev server
npm run dev
```

Requires **Node.js 18+** and npm.

---

## License

© 2026 New Era University Library. All rights reserved.
