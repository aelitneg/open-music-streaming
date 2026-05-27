# Open Music Streaming

Music's future depends on a sustainable relationship between the people who create it and the people who love it. Open Music Streaming exists to protect that future. It is decentralised and federated by design. Each part of the service, from playback and hosting to analytics and payments, can be run independently by anyone, playing their part in the ecosystem. This repository provides the tools that make these parts work together, along with reference implementations to build from.

## Development

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (with Compose)
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)
- `make`
- `jq`

### Environment setup

Copy the example env file and fill in values:

```sh
cp .env.example .env
```

| Variable                                    | Description                                                    |
| ------------------------------------------- | -------------------------------------------------------------- |
| `POSTGRES_USER`                             | Postgres superuser name                                        |
| `POSTGRES_PASSWORD`                         | Postgres superuser password                                    |
| `POSTGRES_DB`                               | Default Postgres database                                      |
| `PDS_ADMIN_PASSWORD`                        | Password for the PDS admin account                             |
| `PDS_SERVICE_HANDLE_DOMAINS`                | Allowed handle domains for new accounts (default: `.test.com`) |
| `PDS_JWT_SECRET`                            | Random secret — generate with `openssl rand -hex 32`           |
| `PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX` | Secp256k1 private key — generate with `openssl rand -hex 32`   |

### Local development origin

**Access the app at `http://127.0.0.1:8080`, not `http://localhost:8080`.**

The AT Protocol PDS rejects OAuth requests from `localhost` because the browser sets `Sec-Fetch-Site: same-site` when both the frontend and PDS share that hostname. Using `127.0.0.1` for the frontend makes the navigation cross-site, which the PDS requires. The session cookie is also scoped to `127.0.0.1`, so using `localhost` will silently break authentication. See [docs/decisions/0005](docs/decisions/0005-127-0-0-1-local-dev-origin.md) for the full rationale.

### Stack

| Service    | Description                                 | Local port |
| ---------- | ------------------------------------------- | ---------- |
| PostgreSQL | Shared database                             | `5432`     |
| PLC        | DID PLC directory (built from source)       | `2582`     |
| PDS        | AT Protocol Personal Data Server (dev mode) | `3000`     |
| Backend    | App View REST API                           | `4000`     |
| Frontend   | Web client (Vite dev server)                | `8080`     |

### Commands

| Command               | Description                                    |
| --------------------- | ---------------------------------------------- |
| `make stack-up`       | Build the PLC image and start the stack        |
| `make stack-down`     | Stop the stack                                 |
| `make backend-up`     | Start the backend API dev server (port 4000)   |
| `make frontend-up`    | Start the frontend dev server (port 8080)      |
| `make db-generate`    | Generate a SQL migration from schema changes   |
| `make db-migrate`     | Apply pending migrations to the database       |
| `make db-studio`      | Open Drizzle Studio (local DB GUI)             |
| `make create-account` | Create an AT Protocol account on the local PDS |

`create-account` accepts optional overrides:

```sh
make create-account HANDLE=alice.test.com EMAIL=alice@test.com PASSWORD=secret
```

`PDS_SERVICE_HANDLE_DOMAINS` controls which handle domains the PDS accepts for new accounts. It defaults to `.test.com`, so handles take the form `<username>.test.com`.

## License

This project uses dual licensing. Interoperability tools are released under the [MIT License](LICENSE-MIT.txt), and reference implementations are released under the [AGPL-3.0 License](LICENSE-AGPL.txt). Each directory contains a LICENSE file indicating which applies.
