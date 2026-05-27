# 0003: OAuth Loopback Session Handoff

**Date:** 2026-05-21
**Status:** Accepted

## Context

AT Protocol OAuth requires the redirect URI for loopback (dev) clients to use `127.0.0.1` rather than `localhost`, per RFC 8252. The `@atproto/oauth-client-node` SDK enforces this strictly.

This creates a cookie origin mismatch in development: when the PDS redirects back to `http://127.0.0.1:4000/oauth/callback`, any session cookie set in that response is scoped to the `127.0.0.1` origin. Subsequent browser requests to `http://localhost:4000` (the app's normal address) will not include that cookie, breaking authentication.

Options considered:

1. **Use `127.0.0.1` everywhere** — have the frontend also use `127.0.0.1` as the API base URL so the cookie origin is consistent. Simple, but requires every dev tool (frontend dev server, browser, fetch base URL) to agree on the address. Fragile.

2. **Token-based sessions** — return a JWT or opaque token from the callback rather than setting a cookie. The frontend stores it in memory or `localStorage`. Avoids the origin problem entirely but sacrifices `httpOnly` cookie security and complicates the frontend.

3. **Post-callback redirect with session handoff** — the `127.0.0.1` callback handler exchanges the auth code, stores the session in the database, issues a short-lived single-use handoff token, then redirects to `http://localhost:4000/auth/finalize?token=<handoff>`. The `/auth/finalize` handler (served on `localhost`) validates the handoff token, sets the `httpOnly` session cookie on the correct origin, then redirects to the app.

## Decision

Use **option 3** (post-callback session handoff) for development.

The `127.0.0.1` callback route:

1. Calls `oauthClient.callback()` to exchange the code — session is persisted to the database by `SessionStore`.
2. Generates a short-lived (≤60s), single-use random token stored in the database keyed to the authenticated DID.
3. Redirects to `http://localhost:PORT/auth/finalize?token=<token>`.

The `localhost` finalize route:

1. Looks up and immediately invalidates the handoff token.
2. Sets an `httpOnly` session cookie (containing the DID) on the `localhost` origin.
3. Redirects to the app.

This keeps `httpOnly` cookie security intact, requires no frontend changes, and is a dev-only concern — in production the redirect URI is a real HTTPS URL on the same origin as the app, so the handoff step is not needed.

## Consequences

- Two additional auth routes are needed: `GET /oauth/callback` (on `127.0.0.1`) and `GET /auth/finalize` (on `localhost`). Both are simple.
- A handoff token table or short-lived in-memory store is required. Given the ≤60s TTL and single-use semantics, a small database table with a `created_at` column (plus a periodic cleanup) is sufficient. An in-memory map also works for dev, but a DB table keeps things consistent with the existing session storage approach.
- This complexity is entirely dev-specific. When the app is deployed with a public URL, `atprotoLoopbackClientMetadata` is replaced with a real confidential client and the handoff route is unused.
- `NodeOAuthClient` must be constructed with `allowHttp: true` (or equivalent) in development. The client refuses to fetch OAuth server metadata from HTTP endpoints by default, and the failure manifests as a misleading "Handle does not resolve to a DID" error rather than anything about the HTTP/HTTPS mismatch. Gate this on `NODE_ENV !== 'production'`.
