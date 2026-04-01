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
import type { Painting, Rack, RackType, PlacedPainting, AssignmentResult } from '../../src/types';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  }
  return createClient(url, key);
}

// ── Paintings ────────────────────────────────────────────────────────────────

export async function getPaintings(): Promise<Painting[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .order('signatuur', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPainting);
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
  const rackTypeRows = [...new Map(racks.map((r) => [r.rackType.id, r.rackType])).values()].map(
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

  // 1. Load all racks with their rack types
  const racks = await getRacks();
  const rackMap = new Map<string, Rack>(racks.map((r) => [r.name, { ...r, paintings: [] }]));

  // 2. Load placed paintings with painting details
  const { data: placedRows, error: placedError } = await supabase
    .from('placed_paintings')
    .select('id, rack_name, x, y, paintings(id, signatuur, collection, width, height, depth, assigned_rack_name, manually_placed, predefined_rack)');
  if (placedError) throw placedError;

  for (const row of placedRows ?? []) {
    const p = row.paintings as any;
    if (!p) continue;
    const placed: PlacedPainting = {
      id: p.id,
      signatuur: p.signatuur,
      collection: p.collection,
      width: p.width,
      height: p.height,
      depth: p.depth,
      assignedRackName: p.assigned_rack_name,
      manuallyPlaced: p.manually_placed,
      predefinedRack: p.predefined_rack ?? null,
      x: row.x,
      y: row.y,
    };
    const rack = rackMap.get(row.rack_name);
    if (rack) rack.paintings.push(placed);
  }

  // 3. Load unassigned paintings
  const { data: unassignedRows, error: uaError } = await supabase
    .from('paintings')
    .select('*')
    .is('assigned_rack_name', null);
  if (uaError) throw uaError;

  const unassigned: Painting[] = (unassignedRows ?? []).map(rowToPainting);

  // 4. Load assignment state (confirmedAt)
  const { data: stateRow, error: stateError } = await supabase
    .from('assignment_state')
    .select('confirmed_at')
    .eq('id', 1)
    .single();
  if (stateError && stateError.code !== 'PGRST116') throw stateError;

  return {
    racks: Array.from(rackMap.values()),
    unassigned,
    confirmedAt: stateRow?.confirmed_at ?? null,
  };
}

export async function setAssignment(assignment: AssignmentResult): Promise<void> {
  const supabase = getSupabase();

  // 1. Delete all existing placed_paintings.
  // Supabase requires a WHERE clause; .neq() with the nil UUID effectively
  // matches all rows since real UUIDs are never all-zeros.
  const { error: delError } = await supabase
    .from('placed_paintings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) throw delError;

  // 2. Update paintings.assigned_rack_name = null for all unassigned
  const unassignedIds = assignment.unassigned.map((p) => p.id);
  if (unassignedIds.length > 0) {
    await supabase.from('paintings').update({ assigned_rack_name: null }).in('id', unassignedIds);
  }

  // 3. Insert placed_paintings and update paintings.assigned_rack_name
  for (const rack of assignment.racks) {
    if (rack.paintings.length === 0) continue;
    const placedRows = rack.paintings.map((p) => ({
      id: p.id,
      rack_name: rack.name,
      x: p.x,
      y: p.y,
    }));
    const { error: insertError } = await supabase
      .from('placed_paintings')
      .upsert(placedRows, { onConflict: 'id' });
    if (insertError) throw insertError;

    const ids = rack.paintings.map((p) => p.id);
    await supabase.from('paintings').update({ assigned_rack_name: rack.name }).in('id', ids);
  }

  // 4. Update confirmedAt
  const { error: stateError } = await supabase
    .from('assignment_state')
    .upsert({ id: 1, confirmed_at: assignment.confirmedAt }, { onConflict: 'id' });
  if (stateError) throw stateError;
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
