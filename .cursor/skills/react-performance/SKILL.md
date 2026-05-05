---
name: react-performance
description: |
  High-performance React and Next.js (App Router): fewer waterfalls, sensible Server/Client split,
  and efficient data loading and re-renders.
trigger:
  - when user asks "optimize frontend performance"
  - when reviewing frontend code
  - when implementing data fetching logic
  - when dealing with re-render issues
priority: high
---

# REACT & NEXT.JS PERFORMANCE SKILL

The agent acts as a **Frontend Performance Engineer**.
Goal: Keep the app fast as data and UI grow.

---

# 1️⃣ ELIMINATING WATERFALLS (ASYNC)

Independent operations MUST run concurrently when they do not depend on each other. Avoid sequential `await` chains that only add latency.

**🔴 Incorrect (Sequential):**
```typescript
const user = await fetchUser();
const posts = await fetchPosts();
const comments = await fetchComments();
```

**🟢 Correct (Parallel):**
```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
]);
```

On the server (Server Components), structure async work the same way: parallelize independent IO.

---

# 2️⃣ NEXT.JS APP ROUTER

- **Server Components**: Fetch close to the source; pass serializable props to children. Avoid pushing large server-only work into Client Components.
- **Streaming & loading UI**: Use `loading.tsx` and Suspense boundaries where appropriate so users see progress instead of blank waits.
- **Dynamic imports**: Use `next/dynamic` for heavy client-only widgets to reduce initial client JS.
- **Images**: Prefer `next/image` with sensible sizes and formats when using the Next.js image pipeline.
- **Bundle hygiene**: Do not import server-only modules into Client Components; keep client islands small.

---

# 3️⃣ CLIENT DATA LIBRARIES (OPTIONAL)

If using TanStack Query (or similar):

- **Stable query keys** (e.g. `['users', userId]`)
- **Prefetch** when navigation makes data predictable
- Tune **`staleTime`** to avoid useless refetches

---

# 4️⃣ RE-RENDER OPTIMIZATION (CLIENT)

- **Split components** so only subtrees that change re-render
- **`useMemo` / `useCallback`**: For expensive work or stable references passed to `memo` children—avoid blanket memoization everywhere
- **Avoid inline object/array props** to `React.memo` children when it causes churn

---

# 5️⃣ PERFORMANCE QUALITY GATE

During review, flag:

- [ ] Independent `await` not parallelized on server or client
- [ ] Unnecessary `'use client'` boundaries wrapping large trees
- [ ] Client-side fetching that could be a Server Component fetch (when it does not need browser-only behavior)
- [ ] Missing loading/streaming where UX suffers on slow IO
- [ ] Oversized client bundles from importing heavy deps in Client Components

---

# 6️⃣ Vietnamese Support

When explaining performance issues, use Vietnamese for context; keep standard technical terms (RSC, hydration, waterfall, bundle).
