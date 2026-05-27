---
name: project-env-structure
description: Backend has its own .env and .env.example separate from the root; FRONTEND_URL is already configured there
metadata:
  type: project
---

The backend has its own `.env` file at `backend/.env` (and `backend/.env.example`). Environment variables like `FRONTEND_URL`, `COOKIE_SECRET`, `PORT`, `PLC_URL`, `PDS_URL`, and `DATABASE_URL` are configured there, not at the repo root.

`FRONTEND_URL=http://localhost:8080` is already set in `backend/.env.example` (and presumably `.env`).

**Why:** The backend is a separate workspace package with its own env config.
**How to apply:** When adding new backend env vars, update `backend/.env` and `backend/.env.example`, not a root-level `.env`.
