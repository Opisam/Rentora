# Rentora — Rental Management Platform

A full-stack rental management platform with a **React web app**, an **Expo mobile app**, and a **Node/Express + PostgreSQL API**.

Landlords manage properties, units, applications, leases, rent payments, maintenance requests, expenses and reports. Tenants browse available units, apply to rent, view their lease and payment history, and track maintenance requests — all from one platform.

---

## The problem

Small and mid-sized landlords run their operations on a patchwork of spreadsheets, paper leases, email threads and messaging apps. Property details live in one place, rent tracking in another, and maintenance requests get lost in the inbox. Tenants have no single view of their lease, rent balance or open maintenance tickets, so status updates flow through slow, manual back-and-forth. Rent collections end up unreliable and overdue payments are easy to miss.

## The solution

Rentora consolidates the entire rental lifecycle into one platform backed by a single API:

- **Landlord side** — a dashboard tracking properties, units, applications, leases, rent, maintenance, expenses and reports in real time.
- **Tenant side** — browse vacant units, apply to rent, and track lease details, payment history, balances and maintenance requests from one place.
- **Automation** — rent records are generated monthly on the 1st, lease renewal/expiry reminders run automatically, and balances (arrears) are always current.
- **Consistency across channels** — the same backend powers the web app, the Expo mobile app, and the API, so data is identical everywhere.
- **Secure by default** — JWT auth, role-based access, rate limiting, input sanitization and validation.

## The impact / outcome

- **No more manual bookkeeping** — monthly rent generation and arrears tracking are automatic, so landlords see an accurate rent ledger without spreadsheets.
- **Faster leasing cycles** — applications move from tenant to landlord to approved lease end-to-end in the platform instead of through email threads.
- **Fewer missed tasks** — maintenance requests follow a defined workflow (open → in_progress → resolved) and lease expiries trigger reminders, so nothing slips through the cracks.
- **Better tenant experience** — tenants self-serve their lease, balance and maintenance status, reducing support calls and chasing down information.
- **One source of truth** — web, mobile and API users all operate on the same data, eliminating version skew and inconsistency.

---

## Features

### For tenants
- Browse, search and filter vacant units (by name, city, address, unit number and bedrooms)
- Submit rental applications with a personal message
- View current lease details and rent history with outstanding balances
- Open and track maintenance requests
- Get in-app notifications

### For landlords
- Dashboard with key metrics and vacancy/rental overview
- Manage properties and their units (vacant/occupied status)
- Review, approve or reject applications and create leases end-to-end
- Rent dashboard: mark payments collected, see arrears; rent records are auto-generated monthly on the 1st
- Maintenance board with priorities and statuses (open → in_progress → resolved)
- Track expenses per property (repairs, taxes, insurance, utilities, management fees)
- Reports and in-app notifications
- Lease renewal/expiry reminders

### Platform-wide
- JWT authentication with hashed passwords (bcrypt, 12 rounds)
- Role-based access control (`landlord` vs `tenant`)
- Rate limiting, XSS sanitization, security headers, request validation
- Unauthorized/login-page flows, protected routes and session handling
- Same backend powers the web app, the mobile app, and the API

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Node.js, Express 5, Sequelize ORM, PostgreSQL |
| Auth      | JWT, bcrypt |
| Frontend  | React 19, Vite, React Router, Bootstrap 5 + Bootstrap Icons, Axios |
| Mobile    | Expo (React Native), expo-router, expo-secure-store |
| Scheduling| node-cron (monthly rent generation), lease reminder job |


