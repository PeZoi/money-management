---
name: project-architecture
description: |
  Next.js App Router full-stack + Supabase: layout, Server/Client split, Server Actions and Route Handlers,
  Supabase clients (browser vs server), RLS and secrets policy, shared lib, optional REST envelopes.
trigger:
  - when creating new feature
  - when scaffolding project
  - when adding new module
  - when generating files
priority: high
---

# PROJECT ARCHITECTURE SKILL

This project targets **Next.js (App Router)**. The agent MUST follow the rules below when generating or modifying code.
Never invent new structure unless explicitly requested.

---

# GLOBAL PRINCIPLES

1. Follow existing architecture before creating new patterns.
2. Prefer reuse over creation.
3. Maintain strict separation: **routes/layouts**, **server logic**, **client UI**, **shared lib**.
4. Generate minimal and consistent changes.
5. Reusable types belong in dedicated modules (e.g. `lib/types`, `types/`, or colocated `types.ts`)—avoid endless duplication.
6. Utilities must NOT be duplicated—search `lib/` and existing helpers first.

---

# 1️⃣ APP ARCHITECTURE (NEXT.JS APP ROUTER)

## Tech stack (this repo)

* Next.js (App Router) — **single app for UI and server logic**
* React + TypeScript
* Tailwind CSS + shadcn/ui (when present)
* **Supabase** — Postgres, Auth, Storage (and Realtime if used)

## Baseline folder layout (align with repo)

```text
app/                    # routes, layouts, route segments, route handlers
components/             # UI; components/ui for shadcn primitives
lib/                    # utils, server helpers, API clients, validators
hooks/                  # optional client hooks
public/                 # static assets
```

Add feature folders only when the codebase already uses them or the user asks.

## `app/`

* **Server Components by default**—async components may fetch on the server.
* Use **`'use client'`** only for:
  * event handlers and browser APIs
  * React hooks (`useState`, `useEffect`, …)
  * client-only libraries
* **Route Handlers**: `app/api/.../route.ts` for HTTP APIs.
* **Colocation**: route-specific components can live under `app/` next to `page.tsx` if that matches repo style.

## `components/`

* Reusable UI; **no scattered raw `fetch`**—data enters via props, composition, or thin wrappers that call shared `lib` functions.
* **`components/ui/`**: shadcn-generated primitives—treat as design system layer.

## `lib/`

* Shared helpers (`cn`, formatters), **Supabase client factories** (browser vs server), Zod schemas, server-only modules used by actions/route handlers.
* **Server-only secrets** (e.g. `service_role`) live in server code only—never import into Client Components.

## Data flow (preferred patterns)

```text
Server Component → Supabase server client / helpers → props → children
Server Action / Route Handler → lib (Supabase) → Postgres / Auth / Storage
Client island → Supabase browser client (anon + session) OR Server Action
```

**Forbidden:** copy-pasting the same Supabase queries or fetch logic in many unrelated components.

---

# 2️⃣ SUPABASE (DATABASE, AUTH, STORAGE)

* **Postgres** is the primary datastore. Schema changes go through **migrations** (Supabase CLI or dashboard—follow repo convention).
* **RLS is required** for protected tables: policies must match real user capabilities; do not rely on “hiding” queries in the UI.
* **Two client patterns** (official Next.js + Supabase approach):
  * **Browser**: `anon` key + user session; operations allowed only what **RLS** permits.
  * **Server** (RSC, Server Actions, Route Handlers): `@supabase/ssr` (or equivalent in repo); cookie/session as configured; **`service_role` is server-only**, never shipped to the client bundle.
* **Auth**: Supabase Auth; session alignment with Next (middleware, cookies) per project setup.
* **Storage / Realtime**: use when needed; follow bucket/policies and permission models consistent with RLS where applicable.

---

# 3️⃣ SERVER API SHAPE (WHEN RETURNING JSON FROM ROUTE HANDLERS)

If the project exposes REST-style JSON from **Route Handlers**, prefer a **consistent envelope** (adapt field names to existing code):

```json
{
  "code": "SUCCESS_CODE",
  "message": "Human readable message",
  "status": 200,
  "data": {},
  "timestamp": "ISO_DATE_TIME"
}
```

Rules:

* Typed response builders/helpers live in `lib/` (or similar), not inlined in every `route.ts`.
* Reuse existing codes/enums before inventing new ones.

If the repo uses plain JSON or framework conventions only, **match the existing pattern** instead of forcing this envelope.

---

# 4️⃣ PAGINATION (ONLY WHEN REQUESTED)

Implement list pagination **only** when the user asks (pagination, paging, infinite scroll, large lists).

* Include **page/limit (or cursor)** in cache keys for client libraries.
* Do **not** add pagination to tiny lists by default.

---

# 5️⃣ DOCUMENTATION & TESTS

* **OpenAPI**: optional; add when the team maintains a public or partner API surface.
* **Tests**: add when the repo already has a runner; prefer testing critical server actions, route handlers, and pure `lib` logic.

---

# 6️⃣ AUTHENTICATION

* **Supabase Auth** + session wiring per repo (middleware, cookies).
* Intentional RLS bypass or elevated access: **server only** (see §2).

---

# 7️⃣ FORBIDDEN ACTIONS

DO NOT:

* Mark entire app trees `'use client'` without need
* Import server-only modules (including Supabase **service_role**) into Client Components
* Duplicate utilities or Supabase access logic
* Put long domain orchestration only in leaf UI with no shared module
* Access sensitive user data without RLS/policies when the project standard is Supabase-backed, per-user protection

---

# 8️⃣ AGENT EXECUTION CHECKLIST

Before finishing any task:

* [ ] Correct folder (`app/`, `components/`, `lib/`) chosen
* [ ] Server vs client boundary respected
* [ ] Supabase: correct client (browser vs server); `service_role` never exposed to client
* [ ] RLS/policies updated when adding tables or changing permissions
* [ ] Utilities/types not duplicated
* [ ] Data access goes through shared Supabase helpers when repeated
* [ ] shadcn rules respected (see shadcn-ui skill)
