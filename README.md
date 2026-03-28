# Schilderijen Planner 🏛️

A **museum dashboard** for visualizing optimal painting layouts across walls. Built with **React + TypeScript + Tailwind CSS**, powered by Vite.

![Dashboard view](https://github.com/user-attachments/assets/87e89980-b88d-4c39-b24f-a22bf66063f2)

---

## Features

- 📊 **Dashboard overview** — all walls as interactive cards in a responsive grid
- 🖼️ **Wall detail view** — full-scale view with signatuur labels and hover tooltips
- 📄 **Print support** — print any wall with its painting list legend
- 📂 **CSV upload** — upload your own semicolon-delimited painting dataset
- 🔍 **Zoom control** — adjust scale (px/cm) in the detail view
- 🎨 **Collection color coding** — BWB, AHM, Bild. Mus. Geerts, Icones

---

## Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS v3 | Styling |
| Vite | Build tool |
| PapaParse | CSV parsing |

---

## CSV Format

The app expects a **semicolon-delimited** CSV file with these columns:

```
signatuur;afmetingen
BWB 853;61cm x 61,5cm
AHM-2011-139/1;135cm x 200cm
```

- `signatuur` — painting identifier
- `afmetingen` — dimensions in the format `{width}cm x {height}cm` (Dutch decimal notation with commas is supported)

A demo dataset (`public/demo.csv`) with 137 paintings is loaded automatically on startup.

---

## Wall Layout Algorithm

Paintings are placed using a **shelf bin-packing algorithm**:

- Sort paintings by height (tallest first)
- Place on shelves of 375 cm wide × 240 cm tall walls
- 5 cm padding around every painting
- Open a new wall when the current one is full

---

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Run

```bash
npm install
npm run dev
# App available at http://localhost:5173
```

### Build

```bash
npm run build
npm run preview
```

### Type check

```bash
npm run typecheck
```

---

## Docker / Podman

The project includes a multi-stage `Dockerfile` and `compose.yaml`.

### Development (with live reload)

```bash
podman-compose up painting-layout-dev
# App available at http://localhost:5173
```

### Production (nginx, port 8080)

```bash
podman-compose --profile prod up painting-layout-prod
# App available at http://localhost:8080
```

### Rebuild after dependency changes

```bash
podman-compose build --no-cache
```

---

## Deploy to Vercel (free)

1. Push to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**
3. Click **Add New Project** → import your repo
4. Vercel auto-detects Vite — click **Deploy**
5. Every `git push` to `main` auto-deploys ✅

---

## Project Structure

```
src/
├── types.ts                  # Shared TypeScript interfaces
├── constants.ts              # WALL_WIDTH, WALL_HEIGHT, PADDING, SCALE, COLLECTION_COLORS
├── App.tsx                   # Root: state, CSV loading, view routing
├── main.tsx                  # Entry point
├── index.css                 # Tailwind directives + print styles
├── vite-env.d.ts             # Vite client type declarations
├── components/
│   ├── Header.tsx            # App title, CSV upload, stats badges
│   ├── Sidebar.tsx           # Legend + Summary + Zoom slider
│   ├── Dashboard.tsx         # Wall cards grid (overview)
│   ├── WallCard.tsx          # Single wall card for dashboard grid
│   ├── WallDetail.tsx        # Full wall detail view with pagination + print
│   ├── WallCanvas.tsx        # Wall rendering (used in both card + detail)
│   ├── PaintingRect.tsx      # Single painting rectangle + tooltip
│   ├── Tooltip.tsx           # Floating tooltip component
│   ├── Legend.tsx            # Collection color legend
│   ├── SummaryPanel.tsx      # Stats cards
│   └── ZoomSlider.tsx        # Zoom range input
└── utils/
    ├── parseCsv.ts           # CSV parsing + dimension extraction
    └── packPaintings.ts      # Shelf bin-packing algorithm
```

---

## Screenshots

**Dashboard — Wall Cards Overview**

![Dashboard](https://github.com/user-attachments/assets/87e89980-b88d-4c39-b24f-a22bf66063f2)

**Wall Detail View**

![Detail](https://github.com/user-attachments/assets/c5ecc1b0-b226-425b-a46b-22bf2693e45f)
