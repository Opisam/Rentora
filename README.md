# Rentora — Rental Management Platform

A full-stack rental management platform with a **React web app**, an **Expo mobile app**, and a **Node/Express + PostgreSQL API**.

Landlords manage properties, units, applications, leases, rent payments, maintenance requests, expenses and reports. Tenants browse available units, apply to rent, view their lease and payment history, and track maintenance requests — all from one platform.

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


