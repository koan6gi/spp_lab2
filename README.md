# Minimalist Notes SPA (Google Keep Clone)

A lightweight, responsive single-page note-taking application built with React (Vite + Tailwind CSS), Node.js (Express), PostgreSQL, and Docker Compose.

---

## Features
- **Responsive Masonry Grid**: Note cards automatically adjust to screen width.
- **Image Attachments**: Upload one image per note with client preview, in-place replacement, or removal.
- **Clean In-Memory Updates**: Reactive DOM updates without full-page reloads.
- **Modals**: Edit note modal and confirmation dialog for note deletion.
- **Toasts**: Floating alert notifications for success and error states.
- **RESTful API**: Standardized JSON/Multipart endpoints with proper HTTP status codes.
- **Containerized**: Production-ready `docker-compose.yml` with health checks and volume persistence.

---

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Nginx
- **Backend**: Node.js 20, Express 4, Multer, `pg` (PostgreSQL client), CORS
- **Database**: PostgreSQL 16
- **DevOps**: Docker, Docker Compose

---

## Quick Start (Docker Compose)

### 1. Launch All Services
```bash
docker compose up --build
```

### 2. Access the Application
- **Frontend (Web UI)**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/notes](http://localhost:5000/api/notes)
- **PostgreSQL**: `localhost:5432` (`notes_db` / `postgres` / `postgres`)

### 3. Stopping Services
```bash
docker compose down
```
To also remove stored volume data:
```bash
docker compose down -v
```

---

## Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- Running PostgreSQL instance

### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Adjust credentials in .env if needed
npm run dev
```
Backend runs on [http://localhost:5000](http://localhost:5000).

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on [http://localhost:3000](http://localhost:3000) and automatically proxies `/api` and `/uploads` to `http://localhost:5000`.

---

## API Documentation
For complete schema details, payload structures, update logic, and reactive flow, refer to [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).
