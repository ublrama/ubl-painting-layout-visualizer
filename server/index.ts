/**
 * Express server entrypoint for Railway deployment.
 *
 * Wraps all existing api/*.ts handlers (which use the Fetch API Request/Response
 * interface) and serves the static dist/ folder for all non-API routes.
 *
 * Environment variables:
 *   PORT               — HTTP port to listen on (default: 3000)
 *   SUPABASE_URL       — Supabase project URL
 *   SUPABASE_SERVICE_KEY — Supabase service role key
 *   CLERK_SECRET_KEY   — Clerk secret key
 *
 * Railway only needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set;
 * this server bridges them to the non-prefixed names the API handlers expect.
 */

// Bridge VITE_-prefixed build-time vars to the runtime names that API modules expect.
// Must happen before any API module is imported (they read process.env at call time,
// but this ensures the values are present before any lazy singleton initialises).
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}
if (!process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY =
    process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_SERVICE_KEY;
}
if (!process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY_VITE) {
  process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY_VITE;
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn(
    '[server] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — running without auth',
  );
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import type { IncomingMessage, ServerResponse } from 'http';

import healthHandler from '../api/health.js';
import assignmentHandler from '../api/assignment.js';
import paintingsHandler from '../api/paintings.js';
import paintingByIdHandler from '../api/paintings/[id].js';
import racksHandler from '../api/racks.js';
import rackTypesHandler from '../api/rack-types.js';
import seedHandler from '../api/seed.js';
import clearAllHandler from '../api/clear-all.js';
import fillSuggestionsHandler from '../api/fill-suggestions.js';
import suggestRackHandler from '../api/suggest-rack.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Fetch API adapter helpers (same pattern as vite.config.ts) ──────────────

/** Convert a Node.js IncomingMessage to a Fetch API Request */
async function nodeToFetchRequest(req: IncomingMessage, base: string): Promise<Request> {
  const url = new URL((req as { url?: string }).url ?? '/', base);
  const headers: Record<string, string> = {};
  const raw = req.rawHeaders ?? [];
  for (let i = 0; i < raw.length; i += 2) {
    headers[raw[i].toLowerCase()] = raw[i + 1];
  }
  let body: Buffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of req as AsyncIterable<Buffer>) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }
  // Buffer is a Uint8Array subclass; the Fetch API Request constructor accepts
  // ArrayBufferView at runtime, but the DOM type definition requires the more
  // specific ArrayBuffer type. Cast is safe — Node.js 18+ fetch handles Buffer.
  return new Request(url.toString(), { method: req.method ?? 'GET', headers, body: body as unknown as BodyInit });
}

/** Write a Fetch API Response to a Node.js ServerResponse */
async function fetchResponseToNode(fetchRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = fetchRes.status;
  fetchRes.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await fetchRes.arrayBuffer()));
}

// ── Express setup ────────────────────────────────────────────────────────────

const app = express();

/**
 * Wraps a Fetch-API-style handler `(req: Request) => Promise<Response>`
 * into an Express route handler.
 */
function makeHandler(handler: (req: Request) => Promise<Response>) {
  return async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const fetchReq = await nodeToFetchRequest(req, `http://localhost`);
      const fetchRes = await handler(fetchReq);
      await fetchResponseToNode(fetchRes, res);
    } catch (err) {
      console.error('[API Router]', err);
      if (!res.headersSent) {
        res.status(500).json({ error: String(err) });
      }
    }
  };
}

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Stricter limit for endpoints that perform filesystem access or heavy operations
const seedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ── API routes ───────────────────────────────────────────────────────────────
// Use app.all() so OPTIONS preflight is forwarded to each handler as well
// (every handler already returns 204 + CORS headers for OPTIONS).

app.all('/api/health', makeHandler(healthHandler));

// Assignment routes — all handled by the same assignment.ts handler
app.all('/api/assignment', makeHandler(assignmentHandler));
app.all('/api/assignment/confirm', makeHandler(assignmentHandler));
app.all('/api/assignment/reset', makeHandler(assignmentHandler));

// Paintings routes — specific path before wildcard
app.all('/api/paintings/:id', makeHandler(paintingByIdHandler));
app.all('/api/paintings', makeHandler(paintingsHandler));

// Racks routes
app.all('/api/racks', makeHandler(racksHandler));

// Rack types routes
app.all('/api/rack-types', makeHandler(rackTypesHandler));

// Utility routes
app.all('/api/seed', seedLimiter, makeHandler(seedHandler));
app.all('/api/clear-all', makeHandler(clearAllHandler));
app.all('/api/fill-suggestions', makeHandler(fillSuggestionsHandler));
app.all('/api/suggest-rack', makeHandler(suggestRackHandler));

// ── Static frontend (SPA fallback) ───────────────────────────────────────────

// dist/ is at ../../dist relative to dist-server/server/index.js
const distDir = path.join(__dirname, '..', '..', 'dist');

app.use(express.static(distDir));

// SPA fallback — serve the pre-built index.html for any non-API route.
// The path is hardcoded (not derived from user input), so there is no
// path-traversal or uncontrolled filesystem access risk here.
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`[server] listening on http://0.0.0.0:${PORT}`);
});
