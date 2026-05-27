# 0004: Zustand Store Architecture

**Date:** 2026-05-27
**Status:** Accepted

## Context

The tech stack decision (0002) selected Zustand for client state management. Before scaffolding the frontend, two organizational patterns were evaluated:

1. **Multiple independent stores** — separate `create()` calls per concern, each exported as its own hook (e.g., `useAuthStore`, `usePlayerStore`).
2. **Slices pattern** — a single `create()` call that composes multiple `StateCreator` functions via object spread into one unified store.

The slices pattern is useful when state domains need to reference each other's state or actions directly. The independent stores pattern is simpler and appropriate when concerns are genuinely decoupled.

## Decision

Use **multiple independent stores**, one per concern.

The primary state domains in this application — authentication session and (eventually) playback — are genuinely independent. Auth state does not need to know about the playback queue, and the player does not need to access the session token. The slices pattern's main benefit (cross-slice state access) is therefore not needed and would add boilerplate without value.

The first store to be created is `useAuthStore`, holding the authenticated user's DID and handle, with `setSession` and `clearSession` actions. Additional stores (e.g., for playback) will be added as separate files under `src/stores/` when those features are introduced.

## Consequences

- Each store is a self-contained file in `src/stores/`, making it easy to locate and reason about independently.
- Stores cannot directly call each other's actions or read each other's state. If a cross-cutting concern emerges, it should be handled at the component or hook level rather than by migrating to the slices pattern.
- If a future feature genuinely requires shared state across domains, the slices pattern remains available as a migration path.
