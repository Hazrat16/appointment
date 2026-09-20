# Contributing

## Local setup

See the [README](./README.md#quick-start-local-node--mongo) for backend/frontend setup, env vars, and demo data.

## Before opening a PR

Run these from each package directory and make sure they're clean:

```bash
cd backend && npm run lint && npm run build
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

These are the same checks CI runs in the `code-quality` and `build-and-test` jobs — a PR won't merge if they fail there.

## Branching & commits

- Branch off `main`: `feature/<short-description>` or `fix/<short-description>`.
- Keep commits focused; write the message around *why*, not just *what*.
- Open PRs against `main`. CI must be green (lint, build, TypeScript check, backend security audit, CodeQL) before merging.

## What CI gates

- **`code-quality`**: backend/frontend lint, backend TypeScript build, frontend TypeScript check, backend `npm audit` (blocks on critical), frontend `npm audit` (reported but non-blocking — see the comment in [`ci.yml`](./.github/workflows/ci.yml)).
- **`build-and-test`**: backend build, frontend production build. Backend tests run if present but don't currently block (no test suite yet).
- **`docker-publish`**: only on merge to `main` — builds and pushes backend/frontend images to GHCR.
- **CodeQL**: static analysis on push/PR to `main` and weekly.

## Dependency updates

Dependabot opens weekly PRs for `backend`, `frontend`, and GitHub Actions dependencies. Review and merge these regularly rather than batching large manual upgrades.
