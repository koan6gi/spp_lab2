# Minimalist Notes SPA (Laboratory Work #2 & #3)

A secure, responsive single-page note-taking application built with React (Vite + Tailwind CSS), Node.js (Express), PostgreSQL, Mailpit, and Docker Compose.

---

## Key Features

- **Role-Based Access Control (RBAC)**: 3 distinct roles (`user`, `moderator`, `admin`) enforced on both backend and frontend.
- **Temporary Key Authentication**: Dual-token model with short-lived JWT Access Tokens (15m) and persistent Refresh Tokens (7d).
- **Brute-Force Defense**: IP-based rate limiting + 5-attempt account lockout for 15 minutes returning HTTP `429 Too Many Requests`.
- **Active Session Management**: Audit and revoke active sessions/devices, or log out everywhere else.
- **Email Password Recovery**: Integrated local SMTP testing server (**Mailpit**) with interactive web UI.
- **Structured JSON Logging**: Production-ready structured logging with **Pino**, including correlation IDs (`x-request-id`) and request latency.
- **Interactive Swagger Documentation**: Full OpenAPI 3.0 specification served directly at `/api/docs`.
- **Automated CI Verification**: GitHub Actions workflow (`.github/workflows/ci.yml`) running ESLint and Jest/Supertest integration test suites.
- **20 MB Media Uploads**: Multer file uploads with strict size limits, instant client previews, and disk cleanup.
- **Responsive Masonry Grid**: Google Keep-style card layout with reactive, zero-reload state updates.

---

## Quick Start (Docker Compose)

### 1. Launch All Services
```bash
docker compose up --build
```

### 2. Service Endpoints
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/notes](http://localhost:5000/api/notes)
- **Swagger UI Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Mailpit Web UI (Password Reset Inbox)**: [http://localhost:8025](http://localhost:8025)
- **PostgreSQL**: `localhost:5432` (`notes_db` / `postgres` / `postgres`)

### 3. Demo Accounts
The database automatically seeds three accounts upon first startup:
- **Admin**: `admin@example.com` / `Password123!`
- **Moderator**: `moderator@example.com` / `Password123!`
- **Regular User**: `user@example.com` / `Password123!`

---

## Automated Verification & Testing

### Running Tests Locally (Backend)
```bash
cd backend
npm test
```

### Running Linter
```bash
cd backend
npm run lint
```

### GitHub Actions CI
On every push/pull-request, `.github/workflows/ci.yml` spins up a PostgreSQL service container, runs ESLint, executes the Jest test suites, and verifies the frontend build.

---

## Documentation Links
- [USER_WORKFLOW.md](./USER_WORKFLOW.md): Complete guide to user journeys, RBAC matrix, sessions, and password recovery.
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md): Detailed REST endpoints, payload schemas, and HTTP status code definitions.
