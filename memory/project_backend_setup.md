---
name: project-backend-setup
description: Backend API server scaffolded as pnpm workspace package using Fastify + TypeScript
metadata:
  type: project
---

Backend API server (`@open-music/backend`) scaffolded in `backend/`.

**Why:** First application layer on top of the AT Protocol dev stack (PLC + PDS).

**How to apply:** When working in backend/, use pnpm filter commands. Port 4000. App factory pattern (`buildApp()` in `app.ts`) separates server startup from app construction for testability. Routes live in `src/routes/`. Test with `vitest`, lint with eslint from repo root.

Stack: Node.js + TypeScript (NodeNext modules), Fastify v5, Vitest v3, tsx for hot reload.
Root tooling: ESLint (typescript-eslint flat config), Prettier.
