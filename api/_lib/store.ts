/**
 * KV abstraction layer.
 * Uses @vercel/kv when KV_REST_API_URL is configured; falls back to an in-memory
 * Map for local development without Vercel credentials.
 */

import type { Painting, Rack, AssignmentResult } from '../../src/types';

export interface StoreData {
  paintings: Painting[];
  racks: Rack[];
  assignment: AssignmentResult;
}

// ── In-memory fallback ────────────────────────────────────────────────────────
const memoryStore = new Map<string, unknown>();

const memoryKv = {
  async get<T>(key: string): Promise<T | null> {
    return (memoryStore.get(key) as T) ?? null;
  },
  async set(key: string, value: unknown): Promise<void> {
    memoryStore.set(key, value);
  },
};

// ── KV provider ───────────────────────────────────────────────────────────────
const USE_KV = !!process.env.KV_REST_API_URL;

async function getKv() {
  if (USE_KV) {
    const { kv } = await import('@vercel/kv');
    return kv;
  }
  return memoryKv;
}

// ── Public helpers ─────────────────────────────────────────────────────────────

export async function getPaintings(): Promise<Painting[]> {
  const kv = await getKv();
  return (await kv.get<Painting[]>('paintings')) ?? [];
}

export async function setPaintings(paintings: Painting[]): Promise<void> {
  const kv = await getKv();
  await kv.set('paintings', paintings);
}

export async function getRacks(): Promise<Rack[]> {
  const kv = await getKv();
  return (await kv.get<Rack[]>('racks')) ?? [];
}

export async function setRacks(racks: Rack[]): Promise<void> {
  const kv = await getKv();
  await kv.set('racks', racks);
}

export async function getAssignment(): Promise<AssignmentResult | null> {
  const kv = await getKv();
  return kv.get<AssignmentResult>('assignment');
}

export async function setAssignment(assignment: AssignmentResult): Promise<void> {
  const kv = await getKv();
  await kv.set('assignment', assignment);
}
