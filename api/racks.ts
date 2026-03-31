/**
 * GET /api/racks — list all racks with painting count and available space info
 */

import { getAssignment, getRacks } from './_lib/store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  const [assignment, storedRacks] = await Promise.all([getAssignment(), getRacks()]);

  if (!assignment) {
    // Return stored rack definitions with zero paintings
    return Response.json(
      storedRacks.map((r) => ({ ...r, paintings: [], paintingCount: 0, usedArea: 0, totalArea: r.rackType.width * r.rackType.height })),
      { headers: CORS_HEADERS },
    );
  }

  const racksWithInfo = assignment.racks.map((rack) => {
    const totalArea  = rack.rackType.width * rack.rackType.height;
    const usedArea   = rack.paintings.reduce((s, p) => s + p.width * p.height, 0);
    return {
      ...rack,
      paintingCount: rack.paintings.length,
      usedArea,
      totalArea,
      availableArea: totalArea - usedArea,
    };
  });

  return Response.json(racksWithInfo, { headers: CORS_HEADERS });
}
