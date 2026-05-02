# Phase 1 — Hosted demo (Atlas + API + Vercel)

This guide wires a **public demo** without a VPS: **MongoDB Atlas**, **Express on Render** (Dockerfile in repo), and **Next.js on Vercel**. You can swap Render for Fly.io or Railway using the same env vars.

## Order of operations

Do **Atlas first** (connection string), then **API** (needs `MONGODB_URI`), then **frontend** (needs public API URL), then fix **CORS** on the API with the real Vercel URL.

---

## 1. MongoDB Atlas

1. Create a project and a **free M0** cluster (any region).
2. **Database Access** → Add user (password auth) → save username/password.
3. **Database** → Browse collections (optional) or skip — the app creates collections on first write.
4. **Network Access** → Add IP Address:
   - For a quick portfolio demo: `0.0.0.0/0` (allows anywhere — tighten later).
   - Stricter: add Render [outbound IPs](https://render.com/docs/outbound-ip-addresses) if your plan includes static egress.
5. **Database** → **Connect** → Drivers → copy the **SRV** connection string.
6. Replace `<password>` with the URL-encoded password (escape special characters like `@` as `%40`).
7. Append a database name if missing, e.g. `...mongodb.net/appointment?retryWrites=true&w=majority`.

Keep this string for Render as `MONGODB_URI`.

---

## 2. API on Render (Docker)

1. Push this repository to GitHub (if it is not already).
2. [Render](https://render.com) → **New +** → **Blueprint** (optional) or **Web Service**.
3. **Web Service** → Connect the repo → **Runtime: Docker**.
4. Set:
   - **Dockerfile path:** `backend/Dockerfile`
   - **Docker build context:** `backend`
5. **Instance type:** Free is fine for demos (cold starts ~50s).
6. **Environment** (minimum):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas SRV string |
   | `JWT_SECRET` | Run locally: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
   | `JWT_EXPIRE` | `7d` (optional) |
   | `FRONTEND_URL` | Temporary: `http://localhost:3000` — you will replace after Vercel (step 4) |
   | `TRUST_PROXY` | `true` |

7. **Health check path:** `/health` (Render reads `PORT` automatically; the app listens on `0.0.0.0`).
8. Deploy. When live, open `https://<your-service>.onrender.com/health` — expect JSON `{ "success": true, ... }`.

Optional: connect the repo with **Blueprint** using the root [`render.yaml`](../render.yaml), then add the secret variables in the dashboard (they are not stored in the file).

---

## 3. Seed demo users (optional)

From your laptop (recommended), with Atlas URI and **without** forcing production Node env:

```bash
cd backend
export MONGODB_URI="mongodb+srv://..."
npm run seed
```

If you ever run the seed script in an environment where `NODE_ENV=production`, you must also set `SEED_ALLOW_PRODUCTION=true` or the script will exit (safety guard). Prefer seeding from local `NODE_ENV=development` against a **dedicated** Atlas database used only for demos.

---

## 4. Frontend on Vercel

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import the same GitHub repo.
2. **Root Directory:** `frontend`
3. **Framework:** Next.js (auto).
4. **Environment variables:**

   | Name | Production value |
   |------|------------------|
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-host>.onrender.com/api` |

   Use the exact Render URL, **no trailing slash** before `/api`.

5. Deploy. Visit the `.vercel.app` URL.

---

## 5. CORS (required once Vercel exists)

In Render → your Web Service → **Environment**:

- Set `FRONTEND_URL` to your real site origin(s), comma-separated, **no path**:

  ```text
  https://your-app.vercel.app,https://your-custom-domain.com
  ```

- Include **Preview** deployment URLs only if you want preview builds to call production API (often you use a second Render service + second Atlas DB for true staging).

Save → **Manual Deploy** → **Clear build cache & deploy** (or wait for auto deploy).

---

## 6. README demo links

Edit the root [`README.md`](../README.md) **Live demo** section and paste:

- Frontend production URL  
- API base URL (optional; health URL is enough for reviewers)

---

## Checklist

- [ ] Atlas user + network access + `MONGODB_URI` works from local `npm run seed`
- [ ] Render deploy green; `/health` returns JSON
- [ ] Vercel build green; login page loads
- [ ] `FRONTEND_URL` on Render includes your Vercel origin; browser login/API calls succeed (no CORS errors in DevTools)
- [ ] README updated with live links

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| CORS error in browser | `FRONTEND_URL` must match the **exact** origin (scheme + host + port). No trailing slash. |
| 401 / works locally only | `NEXT_PUBLIC_API_URL` wrong or cached — rebuild Vercel after env change. |
| Atlas “connection refused” | Network Access allowlist; password special chars URL-encoded. |
| Rate limit oddness on Render | `TRUST_PROXY=true` must be set. |
| Seed refuses to run | Production guard — run from local without `NODE_ENV=production`, or set `SEED_ALLOW_PRODUCTION=true` for intentional demo DB only. |

---

## Alternatives (same env model)

- **Railway / Fly.io:** container or Node start command `node src/app.js`, set the same env vars; keep `TRUST_PROXY=true` behind their proxies.
- **API + DB on same host:** possible but not covered here; prefer Atlas for a clear CV story (“managed MongoDB”).
