# 0002: App View Tech Stack

**Date:** 2026-05-20
**Status:** Accepted

## Context

The AT Protocol development stack is in place (PLC, PDS, PostgreSQL). The next phase is building the App View — the application layer that reads from the AT Protocol network and presents a usable music streaming experience. Two immediate concerns drove the stack evaluation:

1. **Simplicity**: AT Protocol introduces significant conceptual overhead (DIDs, records, lexicons, federation). The application stack should not add to that burden.
2. **Decoupling**: The first client is a web client, but mobile clients will follow. The API must be independent of the presentation layer so clients can be built and evolved separately.

Options considered spanned the Node.js backend ecosystem and the major React-based frontend frameworks (Next.js, TanStack Start, Remix/React Router, and SvelteKit as an alternative).

## Decision

### Backend: Node.js + TypeScript + Fastify

Node.js with TypeScript is the natural backend choice because the official AT Protocol SDK (`@atproto/api`) is TypeScript-first. Using a different language would require writing wrappers around the SDK or forgoing it entirely, adding cost with no clear benefit. Consistency with the existing dev stack (PLC and PDS are both Node-based) is an additional factor.

Fastify is preferred over Express. Both share the same mental model (routes, plugins, handlers) and onboarding cost is low for anyone familiar with Express. Fastify offers better TypeScript ergonomics out of the box, built-in JSON Schema validation (useful for validating AT Protocol record shapes at API boundaries), and clearer async semantics.

The API is REST. This keeps the backend client-agnostic and is well-suited to the decoupled architecture.

**Database access:** Drizzle ORM. TypeScript-native, lightweight, and works well with the existing PostgreSQL instance.

### Frontend: Vite + React + React Router v7

**Next.js is ruled out.** The App View is a decoupled static frontend — it has no need for SSR, ISR, or React Server Components. Using Next.js would mean fighting the framework's defaults (its `output: 'export'` static mode loses most of its value-add features) while paying the full mental overhead of the Next.js model.

**TanStack Start is ruled out.** TanStack Start is a full-stack server framework competing with Next.js, which is not what is needed here. TanStack Router (the standalone router) is excellent on TypeScript but is still maturing; the documentation has rough edges and the API continues to evolve.

**React Router v7 in library mode** is the routing choice. React Router v7 ships in two modes: framework mode (the former Remix experience, server-side) and library mode (client-side, static-compatible, the classic React Router model). Library mode provides mature nested routing — important for a music catalogue with deep navigation hierarchies (artists → albums → tracks, playlists, search) — without coupling the frontend to a server runtime.

**React** as the UI library positions the project well for future mobile clients. Sharing hooks, auth context, and patterns with a React Native mobile app reduces the overhead of maintaining two clients. The atproto community's tooling and reference implementations are also predominantly React.

**Vite** handles the build. It outputs a proper static bundle deployable to any CDN (S3, Cloudflare Pages, etc.) with no server required.

**State management:**

- **TanStack Query** for server state — handles caching, background refetching, and pagination for catalogue and API data.
- **Zustand** for client state — lightweight and composable, well-suited to playback queue and auth session management.

### Stack Summary

| Layer              | Choice                         |
| ------------------ | ------------------------------ |
| Backend runtime    | Node.js + TypeScript           |
| Backend framework  | Fastify                        |
| API style          | REST                           |
| ORM                | Drizzle                        |
| Frontend bundler   | Vite                           |
| Frontend framework | React                          |
| Routing            | React Router v7 (library mode) |
| Server state       | TanStack Query                 |
| Client state       | Zustand                        |

## Consequences

- The atproto SDK can be used directly on the backend without adaptation, reducing integration friction.
- The REST API is the single contract between backend and all clients. API design decisions have lasting impact and should be made carefully.
- The static frontend has no server-side rendering fallback. SEO for public-facing pages (artist profiles, album pages) will be limited to what client-side rendering and prerendering can achieve. This is an accepted trade-off for now; prerendering strategies can be introduced later if needed.
- Choosing React now makes React Native the natural path for mobile. A decision to use a different mobile approach would forfeit the shared-pattern benefit.
- SvelteKit was considered as an alternative that would reduce boilerplate and improve bundle size. It was set aside in favour of React's stronger atproto ecosystem alignment and the mobile story, but remains worth revisiting if React proves to be unnecessary overhead.
