# Schilderijen Layout Visualizer

A React (Vite) application that reads painting data from a semicolon-delimited CSV file and visualises an optimised 2D bin-packing layout of paintings across multiple walls.

## Features

- Upload your own CSV file (columns: `signatuur`, `afmetingen`)
- Automatic shelf bin-packing across walls of 375 cm × 240 cm
- Color-coded paintings per collection (BWB, AHM, Bild. Mus. Geerts, Icones)
- Wall pagination navigator
- Summary panel (walls used, paintings per wall)
- Zoom slider (1–4 px/cm)
- Hover tooltips with signatuur, dimensions, and position

---

## Local Development with Podman / Docker

### Prerequisites

- [Podman](https://podman.io/) or [Docker](https://www.docker.com/) with Compose support
- `podman-compose` or `docker compose` CLI

### Start the development server

```bash
podman-compose up painting-layout-dev
```

The app is available at **http://localhost:5173** with live reload.

### Build and run the production image

```bash
podman-compose --profile prod up painting-layout-prod
```

The production build is served by nginx at **http://localhost:8080**.

### Rebuild after dependency changes

```bash
podman-compose build --no-cache
```

---

## Vercel Deployment (free)

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and sign up / log in with GitHub.
3. Click **Add New Project** and import your repository.
4. Vercel auto-detects Vite — click **Deploy**.
5. Every `git push` to `main` triggers an automatic re-deployment.

---

## Using the App

1. Open the app in your browser.
2. The demo dataset (`public/demo.csv`) loads automatically on startup.
3. To use your own data, click **"CSV-bestand uploaden"** and select a semicolon-delimited CSV with columns `signatuur` and `afmetingen` (e.g. `87cm x 66cm`).
4. Navigate between walls using the **← Vorige / Volgende →** buttons.
5. Adjust the zoom level with the **Zoom** slider.
6. Hover over any painting rectangle to see its signatuur, dimensions, and position on the wall.

---

## CSV Format

```
signatuur;afmetingen
BWB 853;61cm x 61,5cm
Icones 117;87cm x 66cm
```

- Delimiter: `;`
- Dimensions format: `{width}cm x {height}cm` (Dutch decimal notation with `,` supported)