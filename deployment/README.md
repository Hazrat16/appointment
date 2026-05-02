# Deployment notes

This repository no longer includes **VPS-specific** scripts (SSH deploy, Nginx templates, server bootstrap). Local and containerized workflows live in the root [README.md](../README.md) (`docker compose`, seed data, env files).

## Current targets

| Environment | How you run it |
|-------------|----------------|
| Local       | Backend + frontend on the host, MongoDB local or via `docker compose up -d mongo` |
| Containers  | Root `docker-compose.yml` — API + Mongo (browser still hits the API on `localhost:5000`) |

## Phase 1 (planned)

Hosted demo without a dedicated VPS, for example:

- **Frontend:** Vercel (or similar) for Next.js  
- **API:** Render, Fly.io, Railway, etc.  
- **Database:** MongoDB Atlas  

`backend/env.production.example` and `frontend/env.production.example` stay as templates when you wire those services.

## Optional: PM2 on any machine

If you self-host the Node processes yourself (VM, home server, etc.), you can still use the repo root `ecosystem.config.js` with PM2. That is separate from this folder and not required for local development.
