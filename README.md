# NEUZEN AI — HRMS Platform

A full-stack Human Resource Management System supporting **Admin**, **HR**, and **Employee** roles: onboarding & offer letters, attendance, leave approval workflow, payroll & payslips, and a shared HR calendar.

**Stack:** React (Vite) + Tailwind CSS · Node.js/Express · MongoDB (Mongoose) · JWT auth.

---

## 1. Project Structure

```
neuzen-hrms/
├── backend/                 # Express REST API
│   ├── config/db.js         # MongoDB connection
│   ├── models/              # Mongoose schemas
│   ├── middleware/          # JWT auth, RBAC, error handler
│   ├── controllers/         # Business logic per module
│   ├── routes/               # Route definitions per module
│   ├── seed.js               # Seeds test accounts + sample holidays
│   └── server.js             # App entrypoint
└── frontend/                # React + Tailwind SPA
    └── src/
        ├── api/axios.js      # Axios client with JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/       # Layout, ProtectedRoute, Loading/Error/Empty states, Badge
        └── pages/             # Login, Dashboard, admin/, hr/, employee/, CalendarPage
```

---

## 2. Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # creates test accounts + sample holidays (safe to re-run)
npm run dev                 # starts API on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env      # points VITE_API_URL at the backend
npm install
npm run dev                 # starts app on http://localhost:5173
```

Open `http://localhost:5173` and log in with one of the seeded accounts below.

---

## 3. Test Login Accounts (seeded via `npm run seed`)

| Role     | Email                    | Password       |
|----------|---------------------------|----------------|
| Admin    | admin@neuzenai.com        | Admin@123      |
| HR       | hr@neuzenai.com           | Hr@12345       |
| Employee | employee@neuzenai.com     | Employee@123   |

The login page also has one-click buttons to autofill these.

---

## 4. System Architecture

```
React SPA (Vite)  ──HTTPS/JSON──▶  Express REST API  ──Mongoose──▶  MongoDB
   │                                     │
   ├─ AuthContext (JWT in localStorage)  ├─ protect  (verifies JWT, loads user)
   ├─ Axios interceptor (adds Bearer)    ├─ authorize(...roles)  (RBAC gate)
   └─ ProtectedRoute (role-gated routes) └─ Centralized error handler (JSON errors)
```

- **Authentication:** `POST /api/auth/login` issues a JWT (`{ id, role }`) signed with `JWT_SECRET`. The frontend stores it in `localStorage` and attaches it as `Authorization: Bearer <token>` on every request via an Axios interceptor. A 401 response anywhere triggers auto-logout and redirect to `/login`.
- **RBAC:** Every protected backend route is wrapped in `protect` (verifies the JWT and loads the live user) and, where relevant, `authorize('admin', 'hr', ...)` which checks `req.user.role` against an allow-list. Sensitive record-level checks (e.g. an employee viewing only their own payslip) are additionally enforced inside controllers.
- **Data ownership model:** `User` (login + role) is separate from `Employee` (HR profile: department, salary, leave balances). A `User.employee` reference links the two — this lets Admin/HR accounts exist without an employee profile, and lets onboarding create both records atomically.

---

## 5. Database Model Summary (MongoDB / Mongoose)

| Collection     | Purpose | Key fields |
|----------------|---------|-----------|
| `User`         | Login credentials + role | `email`, `password` (bcrypt-hashed), `role` (admin/hr/employee), `employee` (ref) |
| `Employee`     | HR profile | `employeeId`, `department`, `designation`, `salary {basic, hra, allowances, deductions}`, `leaveBalance {casual, sick, earned}`, `status` |
| `OfferLetter`  | Onboarding | `candidateName/Email`, `designation`, `ctc`, `joiningDate`, `status` (draft→sent→accepted/rejected→onboarded), `letterBody` |
| `Attendance`   | Daily check-in/out | `employee` (ref), `date` (unique per employee), `checkIn`, `checkOut`, `workHours`, `status` |
| `Leave`        | Leave workflow | `employee` (ref), `leaveType`, `startDate`, `endDate`, `days`, `status` (pending→approved/rejected/cancelled), `reviewedBy` |
| `Payroll`      | Monthly payslips | `employee` (ref), `month`, `year` (unique per employee), `grossPay`, `lopDays/lopAmount`, `netPay`, `status` |
| `Holiday`      | Company/public holidays | `name`, `date`, `type` |

**Relationships:** `Employee.user → User`, `Attendance.employee / Leave.employee / Payroll.employee → Employee`, `OfferLetter.linkedEmployee → Employee` (set once onboarded). Approving a leave request automatically decrements the employee's leave balance and back-fills `Attendance` records as `on-leave` for each day in range; generating payroll pulls approved unpaid-leave days as Loss-of-Pay deductions.

---

## 6. API Overview

All endpoints are under `/api`. All except `/auth/login`, `/auth/register` require `Authorization: Bearer <token>`.

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `PUT /auth/change-password` |
| Employees | `GET/POST /employees` (admin/hr), `GET/PUT /employees/:id`, `DELETE /employees/:id` (admin), `PUT /employees/:id/role` (admin) |
| Onboarding | `POST/GET /onboarding/offer-letters`, `PUT /onboarding/offer-letters/:id/status`, `POST /onboarding/offer-letters/:id/onboard` (admin/hr) |
| Attendance | `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/me`, `GET /attendance` (admin/hr), `POST /attendance/mark` (admin/hr) |
| Leave | `POST /leaves`, `GET /leaves/me`, `GET /leaves` (admin/hr), `PUT /leaves/:id/review` (admin/hr), `PUT /leaves/:id/cancel` |
| Payroll | `POST /payroll/generate`, `POST /payroll/generate-bulk` (admin/hr), `GET /payroll/me`, `GET /payroll` (admin/hr), `GET /payroll/:id`, `PUT /payroll/:id/mark-paid` |
| Calendar | `GET/POST /calendar/holidays`, `DELETE /calendar/holidays/:id` (admin/hr), `GET /calendar/events` |

Every response follows `{ success, message?, data, meta? }`; errors return `{ success: false, message }` with an appropriate HTTP status.

---

## 7. Production Deployment & CI/CD Notes

**Suggested split deployment:**
- **Backend** → Render / Railway (Node web service). Set env vars `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_ORIGIN` (your deployed frontend URL), `NODE_ENV=production`.
- **Frontend** → Vercel / Netlify. Set `VITE_API_URL` to the deployed backend's `/api` URL. Build command `npm run build`, output dir `dist`.
- **Database** → MongoDB Atlas free tier (M0), with IP allow-list including the backend host (or `0.0.0.0/0` for PaaS hosts with dynamic IPs, restricted via Atlas network peering where possible).

**CI/CD considerations:**
- GitHub Actions workflow per package (`backend/`, `frontend/`) triggered on push to `main`:
  - `npm ci` → lint → (add test suite) → build (frontend) → deploy via provider's Git integration or CLI (e.g. `vercel --prod`, Render auto-deploy on push).
- Keep `.env` out of version control (already gitignored); manage secrets via the hosting provider's dashboard/GitHub Actions secrets.
- Run `npm run seed` once against the production database after first deploy to create the initial Admin account (or replace with a one-time secured admin-bootstrap script for production instead of the demo seed).
- Add a `/api/health` check (already implemented) to your platform's health-check config for zero-downtime deploys.

---

## 8. Engineering Notes

- **Loading / Error / Empty states**: every data-fetching page uses shared `<Loading />`, `<ErrorState onRetry />`, and `<EmptyState />` components consistently instead of ad-hoc handling.
- **No mock data**: all frontend pages call the real REST API; the only "seed" data is the one-time `npm run seed` script for demo accounts and public holidays, stored in the real database like any other record.
- **Validation**: `express-validator` on auth routes; controller-level validation (required fields, date ranges, leave balance checks, duplicate payroll prevention) throughout.
