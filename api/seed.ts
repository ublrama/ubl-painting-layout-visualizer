/**
 * POST /api/seed
 * One-time seeding endpoint. Reads CSV files, parses them, runs assignment,
 * and stores the result in Supabase.
 *
 * Protected by Supabase JWT verification.
 * Supports multipart/form-data with optional file fields: paintings, rackTypes, racks.
 */


import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Painting, RackType, Rack } from '../src/types';
import { assignPaintingsToRacks } from './_lib/placement.js';
import { setRacks, setAssignment, clearAll, setPaintings } from './_lib/store.js';
import { verifyClerkToken, getHeader } from './_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── CSV parsing helpers (inline, no PapaParse in API routes) ─────────────────

function parseDutchFloat(value: string): number {
  return parseFloat(value.trim().replace(',', '.'));
}

function parseCsv(text: string, delimiter = ';'): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row;
  });
}

const KNOWN_COLLECTIONS = new Set(['UBL', 'KITLV', 'BWB', 'AHM', 'Bilderdijk']);

function parsePaintings(csvText: string): Omit<Painting, 'id' | 'assignedRackName' | 'manuallyPlaced'>[] {
  const rows = parseCsv(csvText);
  const paintings = [];
  for (const row of rows) {
    const signatuur = (row['signatuur'] ?? '').trim();
    if (!signatuur) continue;
    const heightStr = (row['Hoogte (cm)'] ?? '').trim();
    const widthStr  = (row['Breedte (cm)'] ?? '').trim();
    const depthStr  = (row['Diepte (cm)'] ?? '').trim();
    if (!heightStr || !widthStr) continue;
    const height = parseDutchFloat(heightStr);
    const width  = parseDutchFloat(widthStr);
    if (isNaN(height) || isNaN(width)) continue;
    const depth = depthStr ? parseDutchFloat(depthStr) : 0;
    const collection = KNOWN_COLLECTIONS.has((row['Collectie'] ?? '').trim())
      ? (row['Collectie'] ?? '').trim()
      : 'Unknown';
    paintings.push({ signatuur, collection, width, height, depth: isNaN(depth) ? 0 : depth });
  }
  return paintings;
}

function parseRackTypes(csvText: string): RackType[] {
  const rows = parseCsv(csvText);
  const rackTypes: RackType[] = [];
  for (const row of rows) {
    const id       = parseInt(row['Type schilderijenrekken'] ?? '', 10);
    const height   = parseFloat((row['Hoogte (cm)'] ?? '').replace(',', '.'));
    const width    = parseFloat((row['Breedte (cm)'] ?? '').replace(',', '.'));
    const maxDepth = parseFloat((row['Maximale diepte (cm)'] ?? '').replace(',', '.'));
    if (isNaN(id) || isNaN(height) || isNaN(width) || isNaN(maxDepth)) continue;
    rackTypes.push({ id, height, width, maxDepth });
  }
  return rackTypes;
}

function parseRacks(csvText: string, rackTypes: RackType[]): Rack[] {
  const rows = parseCsv(csvText);
  const typeMap = new Map<number, RackType>(rackTypes.map((rt) => [rt.id, rt]));
  const racks: Rack[] = [];
  for (const row of rows) {
    const name   = (row['Nummer'] ?? '').trim();
    const typeId = parseInt((row['Type'] ?? '').trim(), 10);
    if (!name || isNaN(typeId)) continue;
    const rackType = typeMap.get(typeId);
    if (!rackType) continue;
    racks.push({ name, rackType, paintings: [] });
  }
  return racks;
}

// ── File helper ──────────────────────────────────────────────────────────────

function safeReadFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(
      `Cannot read file: ${filePath}. ` +
      `On Vercel, make sure "includeFiles": "public/**" is set in vercel.json under functions > api/seed.ts.`,
    );
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  try {
    // Fail fast if Supabase credentials are not configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return Response.json(
        { error: 'Server misconfiguration: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in Vercel environment variables.' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // Require authentication
    const auth = await verifyClerkToken(req);
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    console.log('[seed] ── authenticated, starting seed ──');

    // ── Step 1: clear existing data ──────────────────────────────────────
    console.log('[seed] step 1/5 – clearAll()');
    await clearAll();
    console.log('[seed] step 1/5 – clearAll() done');

    // ── Step: read CSV sources ────────────────────────────────────────────
    const publicDir = join(process.cwd(), 'public');
    let paintingsCsv: string;
    let rackTypesCsv: string;
    let racksCsv: string;

    const contentType = getHeader(req, 'content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const paintingsBlob = formData.get('paintings') as File | null;
      const rackTypesBlob = formData.get('rackTypes') as File | null;
      const racksBlob = formData.get('racks') as File | null;

      if (!paintingsBlob) {
        return Response.json({ error: 'Missing paintings file' }, { status: 400, headers: CORS_HEADERS });
      }
      paintingsCsv = await paintingsBlob.text();
      rackTypesCsv = rackTypesBlob
        ? await rackTypesBlob.text()
        : safeReadFile(join(publicDir, 'demo-rack-types.csv'));
      racksCsv = racksBlob
        ? await racksBlob.text()
        : safeReadFile(join(publicDir, 'demo-racks.csv'));
    } else {
      paintingsCsv = safeReadFile(join(publicDir, 'demo-paintings.csv'));
      rackTypesCsv = safeReadFile(join(publicDir, 'demo-rack-types.csv'));
      racksCsv     = safeReadFile(join(publicDir, 'demo-racks.csv'));
    }

    const rawPaintings  = parsePaintings(paintingsCsv);
    const rackTypes     = parseRackTypes(rackTypesCsv);
    const emptyRacks    = parseRacks(racksCsv, rackTypes);

    console.log(`[seed] parsed  paintings=${rawPaintings.length}  rackTypes=${rackTypes.length}  racks=${emptyRacks.length}`);
    console.log('[seed] rackTypes:', JSON.stringify(rackTypes));
    console.log('[seed] racks:',     JSON.stringify(emptyRacks.map((r) => ({ name: r.name, typeId: r.rackType.id }))));
    console.log('[seed] paintings sample (first 3):', JSON.stringify(rawPaintings.slice(0, 3)));

    // Add uuid + default fields
    const paintings: Painting[] = rawPaintings.map((p) => ({
      ...p,
      id: uuidv4(),
      assignedRackName: null,
      manuallyPlaced: false,
      predefinedRack: null,
    }));

    // Run assignment algorithm
    const assignment = assignPaintingsToRacks(paintings, emptyRacks);

    console.log(`[seed] assignment  placed=${assignment.racks.reduce((s, r) => s + r.paintings.length, 0)}  unassigned=${assignment.unassigned.length}`);

    // Set assignedRackName on each placed painting
    for (const rack of assignment.racks) {
      for (const pp of rack.paintings) {
        pp.assignedRackName = rack.name;
        // Update in the paintings array too
        const idx = paintings.findIndex((p) => p.id === pp.id);
        if (idx !== -1) paintings[idx].assignedRackName = rack.name;
      }
    }

    // Persist racks first (setRacks upserts rack_types then racks)
    console.log(`[seed] step 2/5 – setRacks()  count=${emptyRacks.length}`);
    await setRacks(emptyRacks);
    console.log('[seed] step 2/5 – setRacks() done');

    // Bulk upsert all paintings via shared store (uses singleton + Accept-Encoding fix)
    console.log(`[seed] step 3/5 – setPaintings()  count=${paintings.length}`);
    console.log('[seed] paintings payload sample (first 3):', JSON.stringify(paintings.slice(0, 3)));
    await setPaintings(paintings);
    console.log('[seed] step 3/5 – setPaintings() done');

    // Persist assignment (placed_paintings + assignment_state)
    console.log(`[seed] step 4/5 – setAssignment()  racks=${assignment.racks.length}`);
    await setAssignment(assignment);
    console.log('[seed] step 4/5 – setAssignment() done');

    console.log('[seed] ── seed complete ──');

    return Response.json(
      { ok: true, paintingCount: paintings.length, rackCount: emptyRacks.length },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error('Seed error:', err);
    return Response.json(
      { error: 'Seed failed', detail: String(err) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
