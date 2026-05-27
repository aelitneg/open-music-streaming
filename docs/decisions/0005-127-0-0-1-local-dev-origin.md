# 0005: Use 127.0.0.1 as the Local Development Origin

**Date:** 2026-05-27
**Status:** Accepted
**Supersedes:** [0003 — OAuth Loopback Session Handoff](0003-oauth-loopback-session-handoff.md)

## Context

Two constraints shaped how the local dev environment is structured:

**RFC 8252 / atproto loopback requirement.** AT Protocol OAuth requires loopback client redirect URIs to use `127.0.0.1`, not `localhost`. The `@atproto/oauth-client-node` SDK enforces this. So the OAuth callback has always been registered at `http://127.0.0.1:PORT/oauth/callback`.

**PDS `Sec-Fetch-Site` check.** The local PDS (Bluesky PDS in dev mode) rejects OAuth authorization requests unless the browser sends `Sec-Fetch-Site: cross-site` or `none`. This is a standard CSRF defense: in production the app and PDS are on different domains and the header is always `cross-site`. Locally, if both the frontend and PDS are on `localhost`, the browser sets `Sec-Fetch-Site: same-site` and the PDS rejects the request.

Decision 0003 addressed the first constraint by introducing a session handoff: the `127.0.0.1` callback redirected to a `localhost` finalize route that set the session cookie on the `localhost` origin, where the frontend could pick it up. This solved the cookie mismatch but did not address the `Sec-Fetch-Site` problem.

## Decision

Run the frontend dev server and backend on `127.0.0.1`, keeping the PDS on `localhost`. This resolves both constraints at once.

Browsers treat IP addresses and domain names as distinct sites. A navigation from `http://127.0.0.1:8080` (frontend) to `http://localhost:3000` (PDS) produces `Sec-Fetch-Site: cross-site`, satisfying the PDS check.

With the frontend on `127.0.0.1`, the OAuth callback at `http://127.0.0.1:PORT/oauth/callback` can set the `httpOnly` session cookie directly and redirect to the frontend — no handoff token and no finalize route needed. Cookie domain is `127.0.0.1` throughout; the frontend's requests through the Vite proxy include the cookie because port is not part of the cookie domain.

**Practical requirements:**

- Vite dev server binds to `0.0.0.0` so it is reachable on `127.0.0.1`.
- `FRONTEND_URL` is set to `http://127.0.0.1:8080`.
- Developers must access the app at `http://127.0.0.1:8080`. Using `http://localhost:8080` will not work — the session cookie is scoped to `127.0.0.1` and will not be sent with requests to `localhost`.

## Consequences

- The `/auth/finalize` route and handoff token map are removed from the backend. The `/oauth/callback` route sets the session cookie and redirects directly to `FRONTEND_URL`.
- Local dev setup is simpler: one fewer route, no in-memory token store.
- Developers need to be aware of the `127.0.0.1` requirement. It is documented in the README.
- In production, the loopback client is replaced with a confidential client whose redirect URI is a real HTTPS URL. The `Sec-Fetch-Site` and cookie origin issues do not apply. No production changes are needed.
