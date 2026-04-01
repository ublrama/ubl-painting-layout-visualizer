/**
 * POST /api/seed
 * One-time seeding endpoint. Reads CSV files, parses them, runs assignment,
 * and stores the result in KV.
 *
 * Protected by SEED_SECRET header.
 */

import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Painting, RackType, Rack } from '../src/types';
import { assignPaintingsToRacks } from './_lib/placement';
import { setRacks, setAssignment } from './_lib/store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-seed-secret',
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

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  // Check seed secret if configured
  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const provided = req.headers.get('x-seed-secret');
    if (provided !== seedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }
  }

  try {
    // Clear existing data to allow re-seeding.
    // Supabase requires a WHERE clause for DELETE; .neq() with a value that no
    // real row can have effectively means "delete all rows".
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    await supabase.from('placed_paintings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('paintings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('racks').delete().neq('name', '');        // delete all rows (name is never empty)
    await supabase.from('rack_types').delete().neq('id', 0);      // delete all rows (type id starts at 1)
    await supabase.from('assignment_state').upsert({ id: 1, confirmed_at: null }, { onConflict: 'id' });

    const publicDir = join(process.cwd(), 'public');
    const paintingsCsv  = readFileSync(join(publicDir, 'demo-paintings.csv'), 'utf-8');
    const rackTypesCsv  = readFileSync(join(publicDir, 'demo-rack-types.csv'), 'utf-8');
    const racksCsv      = readFileSync(join(publicDir, 'demo-racks.csv'), 'utf-8');

    const rawPaintings  = parsePaintings(paintingsCsv);
    const rackTypes     = parseRackTypes(rackTypesCsv);
    const emptyRacks    = parseRacks(racksCsv, rackTypes);

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
    await setRacks(emptyRacks);
    // Upsert all paintings individually
    const { upsertPainting } = await import('./_lib/store');
    for (const painting of paintings) {
      await upsertPainting(painting);
    }
    // Persist assignment
    await setAssignment(assignment);

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
