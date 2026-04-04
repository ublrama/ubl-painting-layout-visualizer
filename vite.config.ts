import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

/** Convert a Node.js IncomingMessage to a Fetch API Request */
async function nodeToFetchRequest(req: IncomingMessage, base: string): Promise<Request> {
  const url = new URL(req.url ?? '/', base);
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
  return new Request(url.toString(), { method: req.method ?? 'GET', headers, body });
}

/** Write a Fetch API Response to a Node.js ServerResponse */
async function fetchResponseToNode(fetchRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = fetchRes.status;
  fetchRes.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await fetchRes.arrayBuffer()));
}

/** Vite plugin that handles /api/* requests via ssrLoadModule */
function apiRouterPlugin() {
  return {
    name: 'vite-api-router',
    configureServer(server: any) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (!req.url?.startsWith('/api')) return next();
          try {
            const fetchReq = await nodeToFetchRequest(req, 'http://localhost');
            const pathname = new URL(fetchReq.url).pathname;

            let modulePath: string | null = null;
            if (/^\/api\/paintings\/[^/]+$/.test(pathname)) {
              modulePath = '/api/paintings/[id].ts';
            } else if (pathname === '/api/paintings' || pathname === '/api/paintings/') {
              modulePath = '/api/paintings.ts';
            } else if (pathname.startsWith('/api/assignment')) {
              modulePath = '/api/assignment.ts';
            } else if (pathname === '/api/racks' || pathname === '/api/racks/') {
              modulePath = '/api/racks.ts';
            } else if (pathname === '/api/rack-types' || pathname === '/api/rack-types/') {
              modulePath = '/api/rack-types.ts';
            } else if (pathname === '/api/clear-all' || pathname === '/api/clear-all/') {
              modulePath = '/api/clear-all.ts';
            } else if (pathname === '/api/seed' || pathname === '/api/seed/') {
              modulePath = '/api/seed.ts';
            } else if (pathname === '/api/fill-suggestions') {
              modulePath = '/api/fill-suggestions.ts';
            } else if (pathname === '/api/suggest-rack') {
              modulePath = '/api/suggest-rack.ts';
            } else if (pathname === '/api/health' || pathname === '/api/health/') {
              modulePath = '/api/health.ts';
            }

            if (modulePath) {
              const mod = await server.ssrLoadModule(modulePath);
              const handler = mod.default as (req: Request) => Promise<Response>;
              const fetchRes = await handler(fetchReq);
              await fetchResponseToNode(fetchRes, res);
            } else {
              next();
            }
          } catch (err) {
            console.error('[API Router]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        },
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load ALL env vars (no VITE_ prefix restriction) from .env.local / .env.local.local
  // and inject them into process.env so SSR API modules can read them.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  // Bridge VITE_-prefixed vars to the non-prefixed names that the API modules expect.
  // This lets you keep a single .env.local file with VITE_ names for both client and server.
  if (!process.env.SUPABASE_URL)      process.env.SUPABASE_URL      = env.VITE_SUPABASE_URL;
  if (!process.env.SUPABASE_SERVICE_KEY) process.env.SUPABASE_SERVICE_KEY = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_SERVICE_KEY;
  if (!process.env.CLERK_SECRET_KEY)  process.env.CLERK_SECRET_KEY  = env.CLERK_SECRET_KEY;

  return {
    plugins: [react(), apiRouterPlugin()],
  };
});
