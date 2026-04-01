import Papa from 'papaparse';
import type { Painting } from '../types';

interface CsvRow {
  Collectie: string;
  signatuur: string;
  'Hoogte (cm)': string;
  'Breedte (cm)': string;
  'Diepte (cm)': string;
  Rek: string;
  [key: string]: string;
}

const KNOWN_COLLECTIONS = new Set(['UBL', 'KITLV', 'BWB', 'AHM', 'Bilderdijk']);

/**
 * Map the Collectie column value to a canonical collection name.
 */
export function getCollection(collectie: string): string {
  const trimmed = collectie.trim();
  return KNOWN_COLLECTIONS.has(trimmed) ? trimmed : 'Unknown';
}

/**
 * Parse a Dutch decimal number string (comma as decimal separator).
 */
function parseDutchFloat(value: string): number {
  return parseFloat(value.trim().replace(',', '.'));
}

/**
 * Parse the new paintings CSV format:
 * Collectie;signatuur;Hoogte (cm);Breedte (cm);Diepte (cm)
 *
 * Skips rows where height or width are missing/NaN.
 * Depth defaults to 0 if empty/missing.
 *
 * NOTE: id is derived from signatuur for CSV-loaded paintings (no uuid dependency in browser).
 * The API seed endpoint generates proper UUIDs.
 */
export function parsePaintingsCsv(csvText: string): Painting[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  const paintings: Painting[] = [];
  for (const row of result.data) {
    const signatuur = (row.signatuur ?? '').trim();
    if (!signatuur) continue;

    const heightStr = (row['Hoogte (cm)'] ?? '').trim();
    const widthStr = (row['Breedte (cm)'] ?? '').trim();
    const depthStr = (row['Diepte (cm)'] ?? '').trim();

    if (!heightStr || !widthStr) continue;

    const height = parseDutchFloat(heightStr);
    const width = parseDutchFloat(widthStr);

    if (isNaN(height) || isNaN(width)) continue;

    const depth = depthStr ? parseDutchFloat(depthStr) : 0;
    const collection = getCollection((row.Collectie ?? '').trim());
    const predefinedRack = (row.Rek ?? '').trim() || null;

    paintings.push({
      id: signatuur,
      signatuur,
      collection,
      width,
      height,
      depth: isNaN(depth) ? 0 : depth,
      assignedRackName: null,
      manuallyPlaced: false,
      predefinedRack,
    });
  }
  return paintings;
}
