/**
 * GET /api/export
 * Returns the current assignment state as three semicolon-delimited CSV strings,
 * ready to be re-imported via POST /api/seed (multipart).
 *
 * Response: { paintings: string; racks: string; rackTypes: string }
 *
 * The paintings CSV has the `Rek` column set to each painting's current
 * assignedRackName so that re-seeding restores all rack assignments via the
 * Phase-1 (predefined rack) bin-packing path.
 *
 * Numbers use Dutch decimal notation (comma) to match the original CSV format.
 *
 * Protected by Clerk JWT verification.
 */

import { getPaintings, getRacks, getRackTypes } from './_lib/store.js';
import { verifyClerkToken, unauthorized } from './_lib/auth.js';
import type { Painting, Rack, RackType } from '../src/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Format a number in Dutch notation (comma decimal separator). */
function nl(n: number): string {
  if (n % 1 === 0) return String(n);
  return String(n).replace('.', ',');
}

/** Escape a CSV cell value (semicolon-delimited). */
function cell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  // Wrap in quotes if the value contains a semicolon, quote, or newline
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildPaintingsCsv(paintings: Painting[]): string {
  const header = 'Collectie;signatuur;Hoogte (cm);Breedte (cm);Diepte (cm);Rek';
  const rows = paintings.map((p) =>
    [
      cell(p.collection),
      cell(p.signatuur),
      cell(nl(p.height)),
      cell(nl(p.width)),
      cell(nl(p.depth)),
      cell(p.assignedRackName ?? ''),
    ].join(';'),
  );
  return [header, ...rows].join('\n');
}

function buildRacksCsv(racks: Rack[]): string {
  const header = 'Nummer;Type';
  const rows = racks.map((r) => [cell(r.name), cell(r.rackType.id)].join(';'));
  return [header, ...rows].join('\n');
}

function buildRackTypesCsv(rackTypes: RackType[]): string {
  const header = 'Type schilderijenrekken;Hoogte (cm);Breedte (cm);Maximale diepte (cm)';
  const rows = rackTypes.map((rt) =>
    [
      cell(rt.id),
      cell(nl(rt.height)),
      cell(nl(rt.width)),
      cell(nl(rt.maxDepth)),
    ].join(';'),
  );
  return [header, ...rows].join('\n');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  const auth = await verifyClerkToken(req);
  if (!auth) return unauthorized();

  // Fetch all data in parallel — getPaintings with a high limit to get everything
  const [{ paintings }, racks, rackTypes] = await Promise.all([
    getPaintings({ limit: 100_000 }),
    getRacks(),
    getRackTypes(),
  ]);

  return Response.json(
    {
      paintings: buildPaintingsCsv(paintings),
      racks:     buildRacksCsv(racks),
      rackTypes: buildRackTypesCsv(rackTypes),
    },
    { headers: CORS_HEADERS },
  );
}

