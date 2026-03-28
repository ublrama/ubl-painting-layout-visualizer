# Schilderijen Planner — Museum Layout Visualizer

A **polished museum dashboard** built with React + TypeScript + Tailwind CSS that calculates an optimised 2D bin-packing layout for paintings across museum walls and visualises the result as an interactive dashboard.

![Dashboard overview](https://github.com/user-attachments/assets/8765936d-aa12-4c00-8bdc-30b724b0c957)

---

## Features

- **Dashboard view** — all walls shown as responsive cards with miniature previews
- **Detail view** — full-scale wall rendering with signatuur labels and hover tooltips
- **Breadcrumb navigation** and prev/next pagination through walls
- **Print support** — prints the wall diagram + painting list via `window.print()`
- **CSV upload** — load any semicolon-delimited painting dataset
- **Zoom slider** — adjust render scale (1–4 px/cm) in the detail view
- **Color-coded collections** — BWB, AHM, Bild. Mus. Geerts, Icones, Unknown
- **Shelf bin-packing algorithm** — efficiently places paintings (375 × 240 cm walls, 5 cm padding)
- Demo data pre-loaded (`public/demo.csv`, 137 paintings)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS v3 + Inter font |
| Bundler | Vite 6 |
| CSV parsing | PapaParse |
| Containers | Docker / Podman multi-stage |
| Production server | nginx with SPA fallback + gzip |

---

## Project Structure

```
src/
├── types.ts                 # Painting, PlacedPainting, Wall, Collection
├── constants.ts             # WALL_WIDTH, WALL_HEIGHT, PADDING, SCALE, COLLECTION_COLORS
├── App.tsx                  # Root: state, CSV loading, view routing
├── main.tsx                 # Entry point
├── index.css                # Tailwind directives + print styles
├── components/
│   ├── Header.tsx           # App title, CSV upload, stats badges
│   ├── Sidebar.tsx          # Legend + Summary + Zoom slider
│   ├── Dashboard.tsx        # Wall cards grid
│   ├── WallCard.tsx         # Single wall card with miniature preview
│   ├── WallDetail.tsx       # Full wall view with pagination + print
│   ├── WallCanvas.tsx       # Wall rendering container
│   ├── PaintingRect.tsx     # Painting rectangle + tooltip
│   ├── Tooltip.tsx          # Floating tooltip component
│   ├── Legend.tsx           # Collection color legend
│   ├── SummaryPanel.tsx     # Stats cards
│   └── ZoomSlider.tsx       # Zoom range input
└── utils/
    ├── parseCsv.ts          # CSV parsing + dimension extraction
    └── packPaintings.ts     # Shelf bin-packing algorithm
```

---

## Local Development

### Prerequisites
- Node.js 20+
- npm 9+

### Install & run

```bash
npm install
npm run dev
# App available at http://localhost:5173
```

### Build for production

```bash
npm run build
npm run preview
# Preview at http://localhost:4173
```

---

## Docker / Podman

### Development (live reload)

```bash
docker compose up painting-layout-dev
# or
podman-compose up painting-layout-dev
# App available at http://localhost:5173
```

### Production build (nginx)

```bash
docker compose --profile prod up painting-layout-prod
# or
podman-compose --profile prod up painting-layout-prod
# App available at http://localhost:8080
```

### Rebuild after dependency changes

```bash
docker compose build --no-cache
```

---

## Deploy to Vercel (free)

1. Push to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Vercel auto-detects Vite/React — click **Deploy**
4. Every `git push` to `main` auto-deploys ✅

---

## CSV Format

Semicolon-delimited with columns `signatuur` and `afmetingen`:

```csv
signatuur;afmetingen
BWB 853;61cm x 61,5cm
AHM-1989-81;85cm x 55cm
Icones 117;87cm x 66cm
```

- Width = first number, Height = second number
- Dutch decimal notation (comma) is handled automatically
- Collection is inferred from the signatuur prefix

---

## Wall Constraints

| Property | Value |
|---|---|
| Wall width | 375 cm |
| Wall height | 240 cm |
| Padding per painting | 5 cm on all four sides |
| Default scale | 2 px/cm |
