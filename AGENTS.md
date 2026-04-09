# AGENTS.md — UBL Painting Layout Visualizer

## Architecture Overview

Full-stack museum rack management app: **React 18 + TypeScript** frontend, **Vercel Serverless Functions** (`api/`) as the backend, and **Supabase (PostgreSQL)** as the database. In local dev, `vite.config.ts` routes `/api/*` requests to the same TypeScript serverless handlers via `apiRouterPlugin()` (SSR module loading — no separate server needed).

```
Frontend (src/)  →  /api/* routes (api/)  →  Supabase (api/_lib/store.ts)
```

Authentication uses **Supabase JWTs** verified in `api/_lib/auth.ts` via `verifyToken` (aliased as `verifyClerkToken` for backwards-compatibility). The frontend attaches tokens via `useAuthFetch` (`src/hooks/useAuthFetch.ts`). If env vars are absent, auth falls back to a `dev-user` stub (all writes allowed in dev).

## Critical: Duplicated Algorithm

`src/utils/assignPaintingsToRacks.ts` and `api/_lib/placement.ts` are **verbatim copies** of the Maximal Rectangles bin-packing (BSSF) algorithm. **Always edit both files together** when changing placement logic.

## Developer Workflows

```bash
npm install
npm run dev          # Vite dev server + API router at http://localhost:5173
npm run build        # tsc -b && vite build (frontend)
npm run build:all    # also builds server/ (Express self-host)
npm run lint         # eslint
```

Docker (Podman) dev with hot reload:
```bash
podman compose up painting-layout-dev
```

Seed demo data via the UI: **Header → Database → Start data → Start data laden**.

## Adding a New API Route

1. Create `api/my-route.ts` exporting `default async function handler(req: Request): Promise<Response>`
2. Register it in `apiRouterPlugin()` in `vite.config.ts` (the `if/else if` pathname block)
3. Add the route to `vercel.json` if deploying to Vercel

Forgetting step 2 causes the dev server to return the raw TypeScript source as text instead of JSON.

## Key Conventions

- **All dimensions are in centimetres** (`Painting.width`, `.height`, `.depth`). `MARGIN = 2` cm between paintings and walls. `SCALE = 2` px/cm default render.
- **CSV delimiter**: semicolon (`;`). **Dutch decimal notation**: comma as decimal separator (`86,5`).
- **Depth-bracket rule**: a painting is placed only on racks at the *lowest* `maxDepth` tier that fits its depth. E.g., a 3 cm painting goes to `maxDepth=9` racks only — never to `maxDepth=25` racks.
- **Two-phase assignment**: Phase 1 places paintings with a `Rek` CSV value on their predefined rack (bypasses depth rule); Phase 2 auto-assigns the rest by area descending.
- **Unassign ≠ reorganise**: removing a painting from a rack leaves all other paintings at their exact `(x, y)` positions. Use `POST /api/reorganise-rack` (or the "🔄 Optimaliseer rek" button) to repack a rack.
- **State priority**: `apiAssignment` (SWR-fetched from Supabase) overrides `localAssignment` (CSV-derived, in-memory). See `App.tsx` line: `const assignmentResult = apiAssignment ?? localAssignment`.

## Core Types (`src/types.ts`)

```ts
Painting     — id, signatuur, collection, width/height/depth (cm), assignedRackName, predefinedRack
PlacedPainting — extends Painting with x/y (cm from top-left of rack face)
Rack         — name, rackType, paintings: PlacedPainting[]
AssignmentResult — { racks, unassigned, confirmedAt }
```

## Supabase / Serverless Gotchas

- Use `SUPABASE_SERVICE_KEY` (service_role), **not** the anon key, in serverless functions.
- The singleton client in `api/_lib/store.ts` sends `Accept-Encoding: identity` to prevent a Node.js 18+ undici bug where chunked+gzip responses never resolve.
- `keepAliveTimeout: 1` on the undici Agent avoids 30-second Vercel function timeouts caused by keep-alive connection pooling.
- Individual queries have a 9-second `AbortController` safety net inside the custom `fetch` wrapper in `store.ts`.

## Environment Variables

```env
VITE_SUPABASE_URL        # frontend Supabase client
VITE_SUPABASE_ANON_KEY   # frontend Supabase client
SUPABASE_URL             # serverless functions
SUPABASE_SERVICE_KEY     # serverless functions (service_role key)
VITE_CLERK_PUBLISHABLE_KEY  # optional Clerk auth
CLERK_SECRET_KEY            # optional Clerk auth
```

## Key Files

| File | Purpose |
|---|---|
| `src/utils/assignPaintingsToRacks.ts` | MAXRECTS algorithm — keep in sync with `api/_lib/placement.ts` |
| `api/_lib/store.ts` | Supabase data access layer (all DB queries here) |
| `api/_lib/auth.ts` | JWT verification; `verifyClerkToken` is alias for `verifyToken` |
| `vite.config.ts` | `apiRouterPlugin()` — routes `/api/*` in dev |
| `src/types.ts` | All shared TypeScript interfaces |
| `src/constants.ts` | `MARGIN`, `SCALE`, `COLLECTION_COLORS` |
| `src/hooks/useAuthFetch.ts` | Authenticated fetch for all mutating API calls |
| `supabase/migrations/` | SQL migrations — run via `supabase db push` |

