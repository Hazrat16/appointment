# Doctor appointment platform

[![CI](https://github.com/Hazrat16/appointment/actions/workflows/ci.yml/badge.svg)](https://github.com/Hazrat16/appointment/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Hazrat16/appointment/actions/workflows/codeql.yml/badge.svg)](https://github.com/Hazrat16/appointment/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](./backend/Dockerfile)

Full-stack doctor appointment booking: patients discover doctors and book slots, doctors manage availability and visits, admins oversee verification and users. Built as a portfolio-grade monorepo (Next.js + Express + MongoDB).

## Live demo

After you complete [Phase 1 hosting](./deployment/PHASE1.md), add your URLs here for recruiters and README visitors:

| Resource | URL |
|----------|-----|
| **Web app** | *e.g. `https://….vercel.app`* |
| **API health** | *e.g. `https://….onrender.com/health`* |

## Roles

| Role    | Capabilities (high level)                                      |
|---------|-----------------------------------------------------------------|
| Patient | Register, profile, browse doctors, book and manage appointments |
| Doctor  | Profile, weekly availability, dashboard for appointments       |
| Admin   | Dashboard, doctor list / verification workflows              |

## Architecture

```text
Browser (Next.js 14, TypeScript, Tailwind)
        │  HTTPS / JSON
        ▼
Express API (JWT, validation, rate limit, Helmet)
        │
        ▼
MongoDB (Mongoose — users, doctors, availability, appointments)
```

- **Frontend:** `frontend/` — Next.js App Router, React Query, Axios (`NEXT_PUBLIC_API_URL`).
- **Backend:** `backend/` — **TypeScript** Express API, REST under `/api/*` (`backend/src/`). Production entry: `npm run build` → `dist/src/app.js`.
- **Database:** MongoDB (local, Docker, or Atlas). Connection string in `MONGODB_URI`.

**Hosted stack (Phase 1):** Atlas + Render (API) + Vercel (UI) — step-by-step in [**deployment/PHASE1.md**](./deployment/PHASE1.md). Summary: [**DEPLOYMENT.md**](./DEPLOYMENT.md).

## Prerequisites

- Node.js 18+
- npm
- MongoDB **or** Docker + Docker Compose (recommended for a one-command database)

## Quick start (local Node + Mongo)

### 1. Database

- **Option A — Docker only for Mongo:**

  ```bash
  docker compose up -d mongo
  ```

  MongoDB is available at `mongodb://localhost:27017`.

- **Option B — MongoDB already installed:** ensure `mongod` is running on port `27017`.

### 2. Backend

```bash
cd backend
cp env.example .env
# Edit .env if needed — MONGODB_URI must point at your MongoDB
npm install
npm run seed        # demo users, doctors, availability, appointments (skipped if already seeded)
npm run dev         # API on http://localhost:5000 (tsx watch)
```

Health check: `GET http://localhost:5000/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev         # App on http://localhost:3000
```

Ensure `FRONTEND_URL` in `backend/.env` includes `http://localhost:3000` (default in `env.example`) so CORS allows the browser.

## Quick start (full stack in Docker)

From the repository root, this brings up MongoDB, the API, and the Next.js app — all containerized:

```bash
docker compose up -d --build
```

- Web app: `http://localhost:3000`
- API: `http://localhost:5000`
- MongoDB: `localhost:27017` (same DB name `appointment_dev` as in compose)

Seed from your machine (uses the published Mongo port):

```bash
cd backend
cp env.example .env
# Set:
# MONGODB_URI=mongodb://127.0.0.1:27017/appointment_dev
npm install
npm run seed
```

Optional: set `JWT_SECRET` in a root `.env` file when running `docker compose`; otherwise compose uses a dev default (change before any real deployment).

## Environment variables

### Backend (`backend/env.example` → `.env`)

| Variable        | Purpose |
|----------------|---------|
| `PORT`         | API port (default `5000`) |
| `NODE_ENV`     | `development` / `production` |
| `MONGODB_URI`  | Mongo connection string |
| `JWT_SECRET`   | Signing secret for JWTs |
| `JWT_EXPIRE`   | Token lifetime (e.g. `7d`) |
| `FRONTEND_URL` | Comma-separated browser origins for CORS |
| `TRUST_PROXY`  | Set `true` on Render / Fly / Railway (see `deployment/PHASE1.md`) |
| `LISTEN_HOST`  | Optional bind address (default `0.0.0.0` for containers) |
| `LOG_LEVEL` | pino log level (default `info`) |
| `MIN_BOOKING_NOTICE_HOURS` | Min hours before slot start (default `2`) |
| `CANCELLATION_NOTICE_HOURS` | Patient cancel must be this many hours before start (default `24`) |

### Frontend (`frontend/.env.example` → `.env.local`)

| Variable               | Purpose |
|------------------------|---------|
| `NEXT_PUBLIC_API_URL`  | Base API URL including `/api` (e.g. `http://localhost:5000/api`) |

Production-style frontend env notes: `frontend/env.production.example`.

## Demo data (`npm run seed`)

Idempotent: if `admin@seedmed.dev` exists, seed does nothing unless you use reset.

| Account            | Role   | Notes |
|--------------------|--------|--------|
| `admin@seedmed.dev` | Admin  | |
| `patient@seedmed.dev` | Patient | |
| `jane@seedmed.dev` | Patient | |
| `drsmith@seedmed.dev` … `drokafor@seedmed.dev` | Doctor | 14 doctors across all 12 specializations shown in the UI filter, each with a full profile, rating, and weekly availability. All verified except `drjones@seedmed.dev` (pending — for demoing the admin verification flow). |

**Password for all demo accounts:** `DemoPass123`

A few sample appointments are seeded too (upcoming + one completed/past), so the patient dashboard and appointments page aren't empty on first login.

Re-seed from scratch (⚠️ deletes all users, doctors, availability, appointments in that database):

```bash
cd backend && npm run seed:reset
```

## API overview

| Area           | Base path        |
|----------------|------------------|
| Auth           | `/api/auth`      |
| Doctors        | `/api/doctors`   |
| Appointments   | `/api/appointments` |

Examples: `POST /api/auth/login`, `GET /api/doctors`, `POST /api/appointments` (authenticated patient).

**Interactive docs:** Swagger UI is served at `/api/docs` (e.g. `http://localhost:5000/api/docs`) — spec source is [`backend/src/docs/openapi.ts`](./backend/src/docs/openapi.ts).

## Repository layout

```text
appointment/
├── backend/           # Express API (TypeScript)
│   ├── src/
│   ├── scripts/seed.ts
│   ├── tsconfig.json
│   ├── env.example
│   └── Dockerfile
├── frontend/          # Next.js 14 (TypeScript)
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── .env.example
├── docker-compose.yml # mongo + api
├── render.yaml        # optional Render Blueprint (API)
├── deployment/
│   ├── README.md
│   ├── PHASE1.md      # Atlas + Render + Vercel
│   └── PHASE2.md      # booking rules & DB constraints
├── DEPLOYMENT.md
└── README.md
```

## Scripts reference

| Location   | Command        | Purpose |
|------------|----------------|---------|
| `backend`  | `npm run dev`  | Nodemon API |
| `backend`  | `npm run seed` | Insert demo data |
| `backend`  | `npm run seed:reset` | Wipe + seed |
| `frontend` | `npm run dev`  | Next dev server |

## Continuous integration

GitHub Actions runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml) on pushes and pull requests to `main` / `develop` / `staging`: backend lint, frontend lint + TypeScript, frontend production build, backend security audit (blocking on critical), and backend tests when they pass (non-blocking if the test script exits non-zero today).

On merge to `main`, a `docker-publish` job builds the backend and frontend Docker images and pushes them to GitHub Container Registry:

- `ghcr.io/hazrat16/appointment-backend:latest` / `:<short-sha>`
- `ghcr.io/hazrat16/appointment-frontend:latest` / `:<short-sha>`

[`.github/workflows/codeql.yml`](.github/workflows/codeql.yml) runs static analysis (CodeQL) on push/PR to `main` and weekly. [`.github/dependabot.yml`](.github/dependabot.yml) opens weekly dependency-update PRs for both packages and GitHub Actions.

## Infrastructure as code

[`infra/terraform/`](./infra/terraform/) manages the MongoDB Atlas project/cluster/user via Terraform, replacing the manual dashboard setup in [Phase 1](./deployment/PHASE1.md) §1. See [`infra/terraform/README.md`](./infra/terraform/README.md).

## Roadmap

- **Phase 0** — Local + Docker + seed + env docs (done).
- **Phase 1** — Public demo on Atlas + Render + Vercel: [**deployment/PHASE1.md**](./deployment/PHASE1.md).
- **Phase 2** — Booking rules, overlap prevention, cancellation policy, indexes: [**deployment/PHASE2.md**](./deployment/PHASE2.md).
- **AWS** — ECS Fargate + ALB, App Runner, and single-EC2 alternatives: [**deployment/AWS.md**](./deployment/AWS.md).
- **AWS (Terraform + Ansible)** — 3-node (control/web1/db1), self-hosted MongoDB, real config management: [**ansible/README.md**](./ansible/README.md).
- Later — Verification hardening, email reminders, richer CI tests, etc.
