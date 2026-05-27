# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Open Music Streaming is a decentralized, federated music streaming platform. Each component — playback, hosting, analytics, payments — is designed to run independently and interoperate within the broader ecosystem. This repo provides shared tooling and reference implementations.

## Status

Early stage. The AT Protocol development stack is running via Docker Compose. The backend API server is scaffolded (`backend/`) but no domain features exist yet.

## Package Manager

**pnpm** with workspaces. Always use `pnpm` (not npm or yarn).

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `pnpm install` | Install all workspace dependencies |
| `pnpm lint`    | Run ESLint across all packages     |
| `pnpm format`  | Run Prettier across all packages   |

## Backend (`backend/`)

Node.js + TypeScript + Fastify REST API. Listens on port `4000`.

Use `make backend-up` to start the dev server (injects `DATABASE_URL` from `.env`). For other tasks, use pnpm filter commands directly:

| Command                                                 | Description                   |
| ------------------------------------------------------- | ----------------------------- |
| `pnpm --filter open-music-streaming-backend build`      | Compile TypeScript to `dist/` |
| `pnpm --filter open-music-streaming-backend start`      | Run compiled output           |
| `pnpm --filter open-music-streaming-backend test`       | Run tests (vitest)            |
| `pnpm --filter open-music-streaming-backend test:watch` | Run tests in watch mode       |

Application entry: `backend/src/server.ts`  
App factory (for testing): `backend/src/app.ts`  
Routes: `backend/src/routes/`  
DB schema: `backend/src/db/schema.ts`  
DB instance: `backend/src/db/index.ts`

Migration files live in `backend/drizzle/` and are committed to git. `DATABASE_URL` is constructed from `POSTGRES_USER`/`POSTGRES_PASSWORD` in `.env` by the make targets.

## Dev Stack

The local development environment is controlled with `make`:

| Command               | Description                                    |
| --------------------- | ---------------------------------------------- |
| `make stack-up`       | Build PLC image and start all services         |
| `make stack-down`     | Stop all services                              |
| `make backend-up`     | Start backend API dev server (port 4000)       |
| `make frontend-up`    | Start frontend dev server (port 8080)          |
| `make db-generate`    | Generate SQL migration from schema diff        |
| `make db-migrate`     | Apply pending migrations to the database       |
| `make db-studio`      | Open Drizzle Studio (local DB GUI)             |
| `make create-account` | Create an AT Protocol account on the local PDS |

Services (defined in `docker-compose.yml`):

| Service    | Port   | Notes                                                                                            |
| ---------- | ------ | ------------------------------------------------------------------------------------------------ |
| PostgreSQL | `5432` | Shared DB; init script creates `plc` and `app` databases                                         |
| PLC        | `2582` | DID PLC directory, built from [did-method-plc](https://github.com/did-method-plc/did-method-plc) |
| PDS        | `3000` | Bluesky PDS in dev mode; handles use `.test.com` domain                                          |

Environment is configured via `.env` (see `.env.example`). The two secret variables (`PDS_JWT_SECRET`, `PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX`) are generated with `openssl rand -hex 32`.

## Architecture Principles

- **Decentralized by design**: Components run independently; avoid tight coupling between services.
- **AT Protocol native**: Identity, data, and federation should use atproto primitives (DIDs, records, lexicons) where applicable.
- **Modular services**: Playback, hosting, analytics, and payments are separate concerns that can be operated by different parties.
- **Reference implementations**: Code here should serve as a usable baseline others can fork and extend.
