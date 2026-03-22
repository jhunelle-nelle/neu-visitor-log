# NEU University Library Lab — Visitor Log

A web-based visitor logging application for New Era University Library Lab.

---

## 🔗 Live Application

Vercel (Primary):
https://neu-visitor-log-nine.vercel.app/

---

## Features

### Visitor (Public — No Login Required)
- Clock In / Clock Out using Student/Employee Number
- First-time visitors: Enter full details (Name, ID, Gmail, College, Purpose, Status)
- Returning visitors: Details auto-filled from previous visits
- Greeting popup after Clock In (Welcome message with animation)
- Confirmation popup after Clock Out

---

### Admin (Google Authentication Only)
- Dashboard:
  - Total Visits
  - Currently Active
  - Unique Visitors
  - Average Duration
- Visit Logs:
  - Name
  - Student Number
  - Gmail
  - Purpose
  - Date
  - Time In / Time Out
- Visitors:
  - List of unique visitors
- Admin Panel:
  - Logged-in account info

---

### Search & Filters
- Search by:
  - Student Number
  - Name
  - Gmail
  - Purpose
  - Date / Time
- Filter options:
  - Date range
  - College
  - Purpose
  - Status (student/teacher/staff)

---

## Authentication & Access Control

- Google Authentication only
- Only allowed admin accounts can access admin dashboard:
