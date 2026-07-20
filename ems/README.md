# Nexus HR — Employee Management System

A full-stack, production-style Employee Management System built with **Spring Boot + Spring Security (JWT)** on the backend and **React + Recharts** on the frontend. Built to demonstrate real-world engineering patterns — role-based access control, org hierarchy modeling, approval workflows, analytics, and audit trails — rather than a bare CRUD demo.

## Why this project stands out

Most "employee management" portfolio projects are a single table with Create/Read/Update/Delete. This one models how an actual internal HR tool works:

- **Authentication & Authorization** — JWT-based login with three roles (Admin, Manager, Employee), each with different permissions enforced both in the UI and on the backend (`@PreAuthorize`).
- **Organizational hierarchy** — employees report to managers; a recursive org chart visualizes the full reporting structure, and each profile page shows a manager and direct reports.
- **Leave management workflow** — employees apply for leave; managers/admins approve or reject with comments; approved leave automatically updates employee status.
- **Analytics dashboard** — live charts (headcount by department, salary distribution, hiring trend over time) built with Recharts, backed by a dedicated aggregation endpoint.
- **Audit trail** — every create/update/delete/approve/reject action is logged with who did it and when, visible to Admins.
- **Department management** — departments are first-class entities with a head, location, and description, not just a text field.
- **Server-side pagination, search, and filtering** — the employee table uses real backend pagination (Spring Data `Pageable` + JPA `Specification`), not client-side array filtering.
- **CSV export** and **employee photo upload** (multipart file handling).
- **DTO-based API design** — entities are never serialized directly, avoiding circular-reference and over-fetching problems common in naive Spring Boot demos.

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Java 17, Spring Boot 3.3, Spring Security 6 (JWT via `jjwt`), Spring Data JPA, Bean Validation |
| Database  | H2 in-memory (swap the datasource for Postgres/MySQL in `application.properties` for production) |
| Frontend  | React 18, Vite, React Router 6, Axios, Recharts |
| Auth      | Stateless JWT, BCrypt password hashing, role-based method security |

## Project Structure

```
ems/
├── backend/                          Spring Boot REST API
│   └── src/main/java/com/example/ems/
│       ├── config/                   Security & web MVC config
│       ├── security/                 JWT filter, JWT service, UserDetails
│       ├── model/                    JPA entities + enums
│       ├── repository/               Spring Data repositories
│       ├── service/                  Business logic, audit logging
│       ├── controller/               REST endpoints
│       ├── dto/                      Request/response DTOs
│       └── exception/                Global exception handling
└── frontend/                         React SPA
    └── src/
        ├── api/                      Axios client with JWT interceptor
        ├── context/                  Auth & toast context providers
        ├── components/               Layout, modals, reusable UI
        └── pages/                    Dashboard, Employees, Departments, Org Chart, Leaves, Audit Log
```

## Running Locally (two dev servers)

### 1. Backend (IntelliJ IDEA)

1. `File → Open...` and select the `backend` folder (the one containing `pom.xml`).
2. Let Maven import dependencies (needs internet the first time).
3. Run `EmsBackendApplication.java` (green ▶ next to `main`).
4. Confirm it's up: `http://localhost:8080/api/departments` should return `401` (expected — it needs a token) rather than a connection error.

No Lombok, no extra IntelliJ plugins required — entities use plain getters/setters to avoid JDK/annotation-processor version conflicts.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` and `/uploads` to `http://localhost:8080`, so both servers just need to be running — no CORS setup needed on your end.

### Demo accounts (seeded automatically on first backend startup)

| Role     | Username   | Password      | Notes |
|----------|------------|---------------|-------|
| Admin    | `admin`    | `admin123`    | Full access, including department & audit management |
| Manager  | `manager`  | `manager123`  | Linked to "Aarav Sharma" (Engineering Manager) — can manage employees & review leave |
| Employee | `employee` | `employee123` | Linked to "Rohan Mehta" — can view own profile & apply for leave |

The login page also has one-click buttons to fill these in.

## Key REST Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST   | `/api/auth/login` | Public |
| GET    | `/api/employees?query=&departmentId=&status=&page=&size=&sortBy=&direction=` | Authenticated |
| POST/PUT `/api/employees` | Admin, Manager |
| DELETE `/api/employees/{id}` | Admin |
| GET    | `/api/employees/{id}/reports` | Authenticated (org chart data) |
| POST   | `/api/employees/{id}/photo` | Admin, Manager (multipart upload) |
| GET    | `/api/employees/export/csv` | Admin, Manager |
| GET/POST/PUT/DELETE `/api/departments` | GET: all; write: Admin |
| POST   | `/api/leaves` | Apply for leave |
| GET    | `/api/leaves?status=` | Admin, Manager (review queue) |
| PATCH  | `/api/leaves/{id}/review` | Admin, Manager (approve/reject) |
| GET    | `/api/dashboard/stats` | Authenticated (chart data) |
| GET    | `/api/audit` | Admin only |

## Notes for Production Use

- H2 is in-memory and resets on restart — point `spring.datasource.url` at Postgres/MySQL for persistence.
- `app.jwt.secret` in `application.properties` is a dev-only placeholder — replace it and load it from an environment variable before deploying.
- File uploads are stored on local disk under `backend/uploads/` — swap `FileStorageService` for S3/Cloud Storage in production.
- CORS is currently open to `http://localhost:*` for local dev; restrict `SecurityConfig.corsConfigurationSource()` to your real frontend origin before deploying.
