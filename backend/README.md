# Backend

Node.js + TypeScript REST API built with [Fastify](https://fastify.dev). Listens on port `4000`.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)
- The full dev stack running (PostgreSQL, PLC, PDS) — managed from the [workspace root](../README.md)

### Environment

Copy the example env file and fill in values:

```sh
cp .env.example .env
```

| Variable       | Description                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string. Injected automatically by `make backend-up` from root `.env` |
| `PLC_URL`      | AT Protocol PLC directory URL. Defaults to `http://localhost:2582` (local dev stack)       |
| `PDS_URL`      | AT Protocol PDS URL used for handle resolution. Defaults to `http://localhost:3000`        |
| `PORT`         | Port the server listens on. Defaults to `4000`                                             |

`DATABASE_URL` is constructed and injected by `make backend-up`, so it only needs to be set manually when running the dev server outside of `make`.

### Running the dev server

From the workspace root:

```sh
make backend-up
```

Or directly with pnpm:

```sh
pnpm --filter open-music-streaming-backend dev
```

Database and migration commands are run from the workspace root — see the [root README](../README.md).
