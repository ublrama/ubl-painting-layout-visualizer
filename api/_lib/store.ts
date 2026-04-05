/**
 * Supabase storage abstraction layer.
 * Replaces the previous @vercel/kv implementation.
 *
 * Public API is identical to the old store.ts so no API route files change.
 *
 * Environment variables required:
 *   SUPABASE_URL          — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role secret key (NOT the anon key)
 */

import { createClient } from '@supabase/supabase-js';
import { Agent } from 'undici';
import type { Painting, Rack, RackType, PlacedPainting, AssignmentResult } from '../../src/types';

// ── Custom undici agent with keepalive fully disabled ────────────────────────
// This is the ONLY way to prevent 30s timeouts in Vercel serverless functions.
// Node.js 18+ fetch (via undici) ignores the keepalive: false option and pools
// connections with 5-second keepalive timers. Those timers block the event loop
// from becoming empty, so Vercel waits the full 30s timeout before killing the
// function. Setting keepAliveTimeout: 1 (minimum allowed) forces connections to
// close almost immediately (1ms is effectively disabled).
const httpAgent = new Agent({
  keepAliveTimeout: 1,          // minimum allowed (1ms = effectively disabled)
  keepAliveMaxTimeout: 1,       // minimum allowed
  pipelining: 0,                // disable HTTP pipelining (not needed for our use case)
});

// ---------------------------------------------------------------------------
// Singleton Supabase client
// Re-using one client across warm serverless invocations avoids the cost of
// re-initialising the SDK on every request.  A custom fetch wrapper adds an
// explicit AbortController timeout so individual queries can never hang the
// entire function – this is the root cause of the "never gets a response"
// issue seen with Node.js 18+ undici + Supabase chunked responses.
// ---------------------------------------------------------------------------
let _supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (_supabaseClient) return _supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  }

  _supabaseClient = createClient(url, key, {
    auth: {
      // Serverless functions have no session to persist or auto-refresh.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        // *** ROOT-CAUSE FIX ***
        // Supabase/Cloudflare returns responses as  Transfer-Encoding: chunked
        // + Content-Encoding: gzip.  Node.js 18+ undici (the native fetch
        // implementation) has a known bug where it never fires the 'end' event
        // when it has to decompress a chunked+gzip body, causing every
        // supabase-js query to hang forever.
        // Sending  Accept-Encoding: identity  tells Cloudflare to skip gzip,
        // so the body arrives as plain chunked JSON that undici handles fine.
        'Accept-Encoding': 'identity',
      },
      // Safety-net timeout: even if a future response somehow still hangs,
      // abort after 9 s so the serverless function can surface the error
      // instead of silently timing out.
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url    = typeof input === 'string' ? input : (input as Request).url ?? String(input);
        const method = init?.method ?? 'GET';
        const t0     = Date.now();

        console.log(`[supabase → req]  ${method} ${url}`);
        if (init?.body) {
          try {
            const preview = typeof init.body === 'string'
              ? init.body.slice(0, 500)
              : JSON.stringify(init.body).slice(0, 500);
            console.log(`[supabase → body] ${preview}${preview.length === 500 ? '…' : ''}`);
          } catch { /* non-serialisable body — skip */ }
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9_000); // 9 s

        try {
          // *** CRITICAL FIX for production 504 timeouts ***
          // Pass the custom undici agent with keepalive disabled as the
          // dispatcher. This forces connections to close immediately at the
          // TCP level, preventing connection-pool timers from blocking the
          // serverless function from terminating.
          const res = await fetch(input as RequestInfo, {
            ...init,
            signal: controller.signal,
            // @ts-ignore — dispatcher is undici-specific, not in standard fetch types
            dispatcher: httpAgent,
          });
          const elapsed = Date.now() - t0;
          console.log(`[supabase ← res]  ${method} ${url} → ${res.status} (${elapsed} ms)`);

          return res;
        } catch (err) {
          console.error(`[supabase ← err]  ${method} ${url} → ${String(err)} (${Date.now() - t0} ms)`);
          throw err;
        } finally {
          clearTimeout(timer);
        }
      },
    },
  });

  return _supabaseClient;
}

// ── Paintings ────────────────────────────────────────────────────────────────

export async function getPaintings(opts?: {
  limit?: number;
  offset?: number;
}): Promise<{ paintings: Painting[]; total: number }> {
  const supabase = getSupabase();
  const limit  = opts?.limit  ?? 100;
  const offset = opts?.offset ?? 0;

  const { data, error, count } = await supabase
    .from('paintings')
    .select('*', { count: 'exact' })
    .order('signatuur', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { paintings: (data ?? []).map(rowToPainting), total: count ?? 0 };
}

export async function setPaintings(paintings: Painting[]): Promise<void> {
  const supabase = getSupabase();
  const rows = paintings.map(paintingToRow);
  const { error } = await supabase
    .from('paintings')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function getPaintingById(id: string): Promise<Painting | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return rowToPainting(data);
}

export async function upsertPainting(painting: Painting): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('paintings')
    .upsert(paintingToRow(painting), { onConflict: 'id' });
  if (error) throw error;
}

export async function deletePainting(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('paintings').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Update only the x/y position of a painting in the placed_paintings table.
 * Does NOT touch placement logic — caller is responsible for validating the
 * new position before calling this.
 */
export async function updatePaintingPosition(id: string, x: number, y: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('placed_paintings')
    .update({ x, y })
    .eq('id', id);
  if (error) throw error;
}

// ── Racks ────────────────────────────────────────────────────────────────────

export async function getRacks(): Promise<Rack[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('racks')
    .select('name, rack_type_id, rack_types(id, height, width, max_depth)');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    name: row.name,
    rackType: {
      id: row.rack_types.id,
      height: row.rack_types.height,
      width: row.rack_types.width,
      maxDepth: row.rack_types.max_depth,
    } as RackType,
    paintings: [],
  }));
}

export async function setRacks(racks: Rack[]): Promise<void> {
  const supabase = getSupabase();
  // Upsert rack_types first
  const rackTypeRows = Array.from(new Map(racks.map((r) => [r.rackType.id, r.rackType])).values()).map(
    (rt) => ({ id: rt.id, height: rt.height, width: rt.width, max_depth: rt.maxDepth }),
  );
  const { error: rtError } = await supabase
    .from('rack_types')
    .upsert(rackTypeRows, { onConflict: 'id' });
  if (rtError) throw rtError;

  // Upsert racks
  const rackRows = racks.map((r) => ({ name: r.name, rack_type_id: r.rackType.id }));
  const { error: rError } = await supabase
    .from('racks')
    .upsert(rackRows, { onConflict: 'name' });
  if (rError) throw rError;
}

// ── Assignment ───────────────────────────────────────────────────────────────

export async function getAssignment(): Promise<AssignmentResult | null> {
  const supabase = getSupabase();

  // ── 3 simple queries, no joins ────────────────────────────────────────
  // Previously we used 4 queries including a heavy placed_paintings JOIN that
  // embedded full painting rows (~76 KB, ~1 s).  Now we:
  //   1. Fetch placed_paintings without any join  → tiny (~10 KB)
  //   2. Fetch ALL paintings in one shot          → moderate (~50 KB, no join)
  //   3. Merge positions into paintings in memory → O(n) client-side
  // This cuts the total payload and removes the expensive PostgREST JOIN.
  console.log('[getAssignment] starting 3 parallel queries (no join)');
  const t0 = Date.now();

  const [racksResult, placedResult, paintingsResult, stateResult] = await Promise.all([
    supabase
      .from('racks')
      .select('name, rack_type_id, rack_types(id, height, width, max_depth)'),
    supabase
      .from('placed_paintings')
      .select('id, rack_name, x, y'),               // ← no paintings() join
    supabase
      .from('paintings')
      .select('*'),                                  // ← all paintings in one query
    supabase
      .from('assignment_state')
      .select('confirmed_at')
      .eq('id', 1)
      .single(),
  ]);

  console.log(`[getAssignment] Promise.all resolved in ${Date.now() - t0} ms`);

  // ── Log each query outcome ─────────────────────────────────────────────
  console.log('[getAssignment] racks       →', racksResult.error
    ? `ERROR: ${JSON.stringify(racksResult.error)}`
    : `${racksResult.data?.length ?? 0} rows`);
  console.log('[getAssignment] placed      →', placedResult.error
    ? `ERROR: ${JSON.stringify(placedResult.error)}`
    : `${placedResult.data?.length ?? 0} rows (no join)`);
  console.log('[getAssignment] paintings   →', paintingsResult.error
    ? `ERROR: ${JSON.stringify(paintingsResult.error)}`
    : `${paintingsResult.data?.length ?? 0} rows`);
  console.log('[getAssignment] state       →', stateResult.error
    ? `ERROR code=${stateResult.error.code}: ${stateResult.error.message}`
    : `confirmedAt=${stateResult.data?.confirmed_at ?? null}`);

  if (racksResult.error)    throw racksResult.error;
  if (placedResult.error)   throw placedResult.error;
  if (paintingsResult.error) throw paintingsResult.error;
  if (stateResult.error && stateResult.error.code !== 'PGRST116') throw stateResult.error;

  // ── Build painting lookup map (id → row) ──────────────────────────────
  const paintingMap = new Map<string, any>(
    (paintingsResult.data ?? []).map((r: any) => [r.id, r]),
  );

  // ── Build rack map ─────────────────────────────────────────────────────
  const rackMap = new Map<string, Rack>();
  for (const row of racksResult.data ?? []) {
    if (!row.rack_types) {
      console.warn(`[getAssignment] rack "${row.name}" missing rack_type — skipping`);
      continue;
    }
    rackMap.set(row.name, {
      name: row.name,
      rackType: {
        id:       row.rack_types.id,
        height:   row.rack_types.height,
        width:    row.rack_types.width,
        maxDepth: row.rack_types.max_depth,
      } as RackType,
      paintings: [],
    });
  }

  // ── Merge positions into paintings and slot into racks ─────────────────
  let skipped = 0;
  for (const row of placedResult.data ?? []) {
    const pRow = paintingMap.get(row.id);
    if (!pRow) { skipped++; continue; }
    const rack = rackMap.get(row.rack_name);
    if (!rack)  { skipped++; continue; }
    rack.paintings.push({ ...rowToPainting(pRow), x: row.x, y: row.y } as PlacedPainting);
  }
  if (skipped) console.warn(`[getAssignment] skipped ${skipped} placed paintings (missing rack or painting row)`);

  // ── Unassigned = paintings not referenced in placed_paintings ──────────
  const placedIds = new Set((placedResult.data ?? []).map((r: any) => r.id));
  const unassigned: Painting[] = (paintingsResult.data ?? [])
    .filter((r: any) => !placedIds.has(r.id))
    .map(rowToPainting);

  const result: AssignmentResult = {
    racks: Array.from(rackMap.values()),
    unassigned,
    confirmedAt: stateResult.data?.confirmed_at ?? null,
  };

  console.log(
    `[getAssignment] done in ${Date.now() - t0} ms total —` +
    ` racks=${result.racks.length}` +
    `  totalPlaced=${result.racks.reduce((s, r) => s + r.paintings.length, 0)}` +
    `  unassigned=${result.unassigned.length}` +
    `  confirmedAt=${result.confirmedAt}`,
  );

  return result;
}

export async function setAssignment(assignment: AssignmentResult): Promise<void> {
  const supabase = getSupabase();

  // 1. Delete all existing placed_paintings in one call
  const { error: delError } = await supabase
    .from('placed_paintings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) throw delError;

  // 2. Collect ALL placed paintings across every rack into one array
  const allPlacedRows: { id: string; rack_name: string; x: number; y: number }[] = [];
  for (const rack of assignment.racks) {
    for (const p of rack.paintings) {
      allPlacedRows.push({ id: p.id, rack_name: rack.name, x: p.x, y: p.y });
    }
  }

  // 3. Single bulk upsert for all placed_paintings (avoids N round-trips)
  if (allPlacedRows.length > 0) {
    const { error } = await supabase
      .from('placed_paintings')
      .upsert(allPlacedRows, { onConflict: 'id' });
    if (error) throw error;
  }

  // 4. Update paintings.assigned_rack_name — run all in parallel
  const unassignedIds = assignment.unassigned.map((p) => p.id);
  const rackUpdates = assignment.racks
    .filter((rack) => rack.paintings.length > 0)
    .map((rack) =>
      supabase
        .from('paintings')
        .update({ assigned_rack_name: rack.name })
        .in('id', rack.paintings.map((p) => p.id)),
    );

  await Promise.all([
    ...(unassignedIds.length > 0
      ? [supabase.from('paintings').update({ assigned_rack_name: null }).in('id', unassignedIds)]
      : []),
    ...rackUpdates,
  ]);

  // 5. Persist confirmedAt
  const { error: stateError } = await supabase
    .from('assignment_state')
    .upsert({ id: 1, confirmed_at: assignment.confirmedAt }, { onConflict: 'id' });
  if (stateError) throw stateError;
}

// ── Clear all data ───────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('placed_paintings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('paintings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('racks').delete().neq('name', '');
  await supabase.from('rack_types').delete().neq('id', 0);
  await supabase.from('assignment_state').upsert({ id: 1, confirmed_at: null }, { onConflict: 'id' });
}

// ── Rack Types CRUD ──────────────────────────────────────────────────────────

export async function getRackTypes(): Promise<RackType[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('rack_types')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    height: row.height,
    width: row.width,
    maxDepth: row.max_depth,
  }));
}

export async function upsertRackType(rt: RackType): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('rack_types')
    .upsert({ id: rt.id, height: rt.height, width: rt.width, max_depth: rt.maxDepth }, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteRackType(id: number): Promise<void> {
  const supabase = getSupabase();
  // Check if any racks reference this type
  const { data: refs } = await supabase.from('racks').select('name').eq('rack_type_id', id).limit(1);
  if (refs && refs.length > 0) {
    throw new Error(`Cannot delete rack type ${id}: still referenced by rack "${refs[0].name}"`);
  }
  const { error } = await supabase.from('rack_types').delete().eq('id', id);
  if (error) throw error;
}

// ── Single Rack CRUD ─────────────────────────────────────────────────────────

export async function upsertSingleRack(name: string, rackTypeId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('racks')
    .upsert({ name, rack_type_id: rackTypeId }, { onConflict: 'name' });
  if (error) throw error;
}

export async function deleteRack(name: string): Promise<void> {
  const supabase = getSupabase();
  // Remove placed paintings on this rack first
  await supabase.from('placed_paintings').delete().eq('rack_name', name);
  // Unassign paintings that were on this rack
  await supabase.from('paintings').update({ assigned_rack_name: null }).eq('assigned_rack_name', name);
  const { error } = await supabase.from('racks').delete().eq('name', name);
  if (error) throw error;
}

// ── Row mappers ──────────────────────────────────────────────────────────────

function rowToPainting(row: any): Painting {
  return {
    id: row.id,
    signatuur: row.signatuur,
    collection: row.collection,
    width: row.width,
    height: row.height,
    depth: row.depth,
    assignedRackName: row.assigned_rack_name ?? null,
    manuallyPlaced: row.manually_placed ?? false,
    predefinedRack: row.predefined_rack ?? null,
  };
}

function paintingToRow(p: Painting): Record<string, unknown> {
  return {
    id: p.id,
    signatuur: p.signatuur,
    collection: p.collection,
    width: p.width,
    height: p.height,
    depth: p.depth,
    assigned_rack_name: p.assignedRackName,
    manually_placed: p.manuallyPlaced,
    predefined_rack: p.predefinedRack ?? null,
  };
}
