# UBL Painting Layout Visualizer

A **full-stack museum rack management system** built with React + TypeScript + Supabase that manages paintings across museum storage racks using a **Maximal Rectangles bin-packing algorithm**. Features secure authentication, real-time database sync, and an interactive visual dashboard.

---

## Features

### Core Functionality
- **Dashboard view** — all racks shown as responsive cards with miniature previews
- **Detail view** — full-scale rack rendering with signatuur labels and hover tooltips
- **Maximal Rectangles bin-packing** — fills every available gap in a rack (2 cm margin), not just horizontal rows
- **Database-backed** — all data persisted in Supabase with real-time sync
- **Secure authentication** — Clerk-based user authentication and authorization

### Painting Management
- **CSV bulk import** — seed database with paintings, racks, and rack types from CSV files
- **Manual painting entry** — add individual paintings with dimensions and optional rack assignment
- **Search & filter** — find paintings by signatuur, dimensions, or assignment status
- **Unassign with confirmation** — custom modal dialog with loading state, 30 s timeout, and retry
- **Delete with safety** — shows fill suggestions for freed space before deletion

### Rack Management
- **Rack types** — define reusable rack configurations (width, height, max depth)
- **Add/remove racks** — create racks from rack types or delete existing ones
- **Visual rack preview** — see exactly how paintings are arranged on each rack
- **Fill suggestions** — smart recommendations for paintings that fit freed space
- **Force placement** — manually assign paintings to specific racks

### User Experience
- **Zoom slider** — adjust render scale (1–4 px/cm) in detail view
- **Responsive tabs** — switch between racks view and paintings list
- **Loading indicators** — spinners and progress feedback for all async operations
- **Error recovery** — timeout handling (30 s) with retry capability
- **Database panel** — manage and seed database with demo data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript (strict mode) |
| Styling | Tailwind CSS v3 |
| State management | SWR for server state, React hooks for local state |
| Backend | Supabase (PostgreSQL) |
| Authentication | Clerk (optional) |
| API | Vercel Serverless Functions (TypeScript) |
| Bundler | Vite 6 |
| CSV parsing | PapaParse |
| Development | Docker / Podman with hot reload |
| Production | Vercel (serverless) or self-hosted Express |

---

## Project Structure

```
src/
├── types.ts                         # Core types: Painting, Rack, RackType, etc.
├── constants.ts                     # MARGIN (2 cm), SCALE
├── App.tsx                          # Root: state, routing, dialog management
├── main.tsx                         # Entry point with auth providers
├── components/
│   ├── Header.tsx                   # App header with database button
│   ├── Sidebar.tsx                  # Summary stats + zoom control
│   ├── Dashboard.tsx                # Rack cards grid
│   ├── RackCard.tsx                 # Single rack card with preview
│   ├── RackDetail.tsx               # Full rack view with painting list
│   ├── RackCanvas.tsx               # Rack rendering canvas
│   ├── PaintingRect.tsx             # Painting rectangle + tooltip
│   ├── PaintingsList.tsx            # Searchable paintings table
│   ├── DatabasePanel.tsx            # Database management & CSV seeding
│   ├── AddPaintingModal.tsx         # Add new painting form
│   ├── AddRackModal.tsx             # Add new rack form
│   ├── AddRackTypeModal.tsx         # Add new rack type form
│   ├── UnassignPaintingDialog.tsx   # Unassign confirmation with loading states
│   ├── RemovePaintingDialog.tsx     # Delete confirmation with fill suggestions
│   ├── AuthGuard.tsx                # Authentication wrapper
│   ├── Tooltip.tsx / Legend.tsx / SummaryPanel.tsx / ZoomSlider.tsx
│   └── ...
├── hooks/
│   ├── useAssignment.ts             # SWR hook for rack assignment
│   ├── usePaintings.ts              # SWR hook for paintings
│   ├── useAuthFetch.ts              # Authenticated fetch wrapper
│   └── ...
├── utils/
│   ├── assignPaintingsToRacks.ts    # Maximal Rectangles algorithm (frontend)
│   ├── getPlacementFailReason.ts    # Why a painting couldn't be placed
│   ├── parsePaintingsCsv.ts
│   ├── parseRacksCsv.ts
│   └── parseRackTypesCsv.ts
└── lib/
    ├── clerk.ts                     # Clerk configuration
    └── supabase.ts                  # Supabase client

api/                                 # Vercel Serverless Functions
├── health.ts                        # GET /api/health — DB health check
├── paintings.ts                     # GET/POST /api/paintings
├── paintings/[id].ts                # GET/PUT/DELETE /api/paintings/:id
├── racks.ts                         # GET/POST/DELETE /api/racks
├── rack-types.ts                    # GET/POST /api/rack-types
├── assignment.ts                    # GET/POST /api/assignment
├── suggest-rack.ts                  # GET /api/suggest-rack
├── fill-suggestions.ts              # GET /api/fill-suggestions
├── clear-all.ts                     # DELETE /api/clear-all
├── seed.ts                          # POST /api/seed
└── _lib/
    ├── placement.ts                 # Maximal Rectangles algorithm (API copy)
    ├── store.ts                     # Supabase data access layer
    └── auth.ts                      # Token verification

supabase/migrations/
├── 001_initial_schema.sql
└── 002_indexes.sql
```

---

## Bin-Packing Algorithm

The application uses a **Maximal Rectangles (MAXRECTS)** algorithm with **Best Short Side Fit (BSSF)** to pack paintings into every available space on a rack — not just left-to-right rows.

### How It Works

1. **Free rectangles** — the rack starts as a single free rectangle. After each placement, the used area is subtracted and the overlapping free rects are split into up to 4 axis-aligned pieces.
2. **Dominated rect pruning** — any free rect fully contained within another is removed, keeping the list minimal and correct.
3. **Best Short Side Fit** — for each painting, the free rect that minimises the shorter leftover dimension is chosen (tightest fit).
4. **Area-descending sort** — in bulk assignment, largest paintings are placed first, which leaves smaller gaps for smaller paintings.
5. **Two-phase assignment** — paintings with a predefined rack go there first; remaining paintings use priority racks (best-fit depth), then all other racks.

### Example (user scenario)

Rack **280 × 242 cm**, paintings **101×206**, **66×87**, **66×87**:

```
Old algorithm (shelf-based):
  Row 1: [101×206] [66×87] [66×87]
  → 119 cm tall space below the 66×87 paintings is WASTED

New algorithm (MAXRECTS):
  [101×206] [66×87] [66×87]   ← top area
             [fits here  ]     ← any painting ≤ 173×149 cm fills the gap below
```

### Placement Constraints

- **Width**: `painting.width + 2 × MARGIN ≤ rack.width`
- **Height**: `painting.height + 2 × MARGIN ≤ rack.height`
- **Depth**: `painting.depth ≤ rack.maxDepth`
- **MARGIN**: 2 cm on all sides (between paintings and between paintings and walls)

Algorithm lives in `src/utils/assignPaintingsToRacks.ts` and is mirrored in `api/_lib/placement.ts`.

---

## Dialog System

### Unassign Painting Dialog (`UnassignPaintingDialog.tsx`)
- ✅ Confirmation with painting & rack details
- ✅ Loading spinner while API call runs
- ✅ 30-second timeout — painting stays assigned on timeout
- ✅ Error message + retry button
- ✅ Auto-closes on success

### Delete Painting Dialog (`RemovePaintingDialog.tsx`)
- ✅ All of the above
- ✅ Shows fill suggestions (paintings from the unassigned list that fit the freed space)
- ✅ One-click assign from suggestions

---

## Local Development

### Prerequisites
- Node.js 20+, npm 9+
- Supabase account (free tier)
- Clerk account (optional)

### 1. Environment variables

Create `.env.local`:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Clerk (optional)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 2. Database migrations

```bash
supabase db push
# or run supabase/migrations/*.sql manually in the Supabase SQL editor
```

### 3. Run

```bash
npm install
npm run dev     # http://localhost:5173
```

### 4. Seed demo data

Click **Database** in the app header → **Load Demo Data**.

---

## Docker / Podman

```bash
# Development (hot reload)
podman compose up painting-layout-dev

# Rebuild after dependency changes
podman compose down -v
podman compose build --no-cache painting-layout-dev
podman compose up painting-layout-dev

# Production
podman compose --profile prod up painting-layout-prod   # http://localhost:3000
```

The `node_modules` named volume persists dependencies between restarts.

---

## Deploy to Vercel

1. Push to GitHub
2. **Add New Project** → import repo
3. Set environment variables (same as `.env.local` above)
4. **Deploy** — every `git push` to `main` auto-deploys ✅

`vercel.json` configures API routes as serverless functions with 30 s timeout.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Database health check |
| GET | `/api/paintings` | — | List paintings (paginated) |
| POST | `/api/paintings` | ✅ | Create painting |
| GET | `/api/paintings/:id` | — | Get single painting |
| PUT | `/api/paintings/:id` | ✅ | Update / reassign painting |
| DELETE | `/api/paintings/:id` | ✅ | Delete painting |
| GET | `/api/racks` | — | List racks |
| POST | `/api/racks` | ✅ | Create rack |
| DELETE | `/api/racks` | ✅ | Delete rack |
| GET | `/api/rack-types` | — | List rack types |
| POST | `/api/rack-types` | ✅ | Create rack type |
| GET | `/api/assignment` | — | Current placement result |
| POST | `/api/assignment` | ✅ | Save assignment |
| GET | `/api/suggest-rack` | — | Rack suggestions for a painting |
| GET | `/api/fill-suggestions` | — | Paintings that fit freed space |
| POST | `/api/seed` | ✅ | Bulk import from CSV |
| DELETE | `/api/clear-all` | ✅ | Wipe all data |

---

## CSV Format

### Paintings
```csv
signatuur;afmetingen
BWB 853;61cm x 61,5cm
AHM-1989-81;85cm x 55cm
```
Width = first number, Height = second. Dutch decimal commas handled automatically.

### Rack Types
```csv
id;height;width;max_depth
1;240;375;50
```

### Racks
```csv
name;rack_type_id
Rek A;1
```

Demo files: `public/demo-paintings.csv`, `public/demo-rack-types.csv`, `public/demo-racks.csv`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/*` returns JS source instead of JSON | Add missing route to `apiRouterPlugin()` in `vite.config.ts` |
| `paintings.findIndex is not a function` | `getPaintings()` returns `{ paintings, total }` — destructure it |
| Docker: module not found | `podman compose down -v && podman compose build --no-cache` |
| Supabase timeout on `/api/health` | Project may be paused (free tier). Resume it in the Supabase dashboard |
| `SUPABASE_SERVICE_KEY` errors | Use the **service_role** key, not the anon key |

---

## Contributing

1. Fork → feature branch → PR
2. Keep `src/utils/assignPaintingsToRacks.ts` and `api/_lib/placement.ts` in sync — they contain the same algorithm.

---

## License

Available for educational and museum use. Credit the original authors when reusing.
