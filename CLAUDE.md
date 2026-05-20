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

| Command                                        | Description                                  |
| ---------------------------------------------- | -------------------------------------------- |
| `pnpm --filter @open-music/backend dev`        | Start dev server with hot reload (tsx watch) |
| `pnpm --filter @open-music/backend build`      | Compile TypeScript to `dist/`                |
| `pnpm --filter @open-music/backend start`      | Run compiled output                          |
| `pnpm --filter @open-music/backend test`       | Run tests (vitest)                           |
| `pnpm --filter @open-music/backend test:watch` | Run tests in watch mode                      |

Application entry: `backend/src/server.ts`  
App factory (for testing): `backend/src/app.ts`  
Routes: `backend/src/routes/`

## Dev Stack

The local development environment is controlled with `make`:

| Command               | Description                                    |
| --------------------- | ---------------------------------------------- |
| `make up`             | Build PLC image and start all services         |
| `make down`           | Stop all services                              |
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
