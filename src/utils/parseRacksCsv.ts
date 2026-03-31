import Papa from 'papaparse';
import type { Rack, RackType } from '../types';

interface CsvRow {
  Nummer: string;
  Type: string;
  [key: string]: string;
}

/**
 * Parse the racks CSV:
 * Nummer;Type
 *
 * Joins with rack types by type ID.
 * Returns Rack[] with an empty paintings array.
 */
export function parseRacksCsv(csvText: string, rackTypes: RackType[]): Rack[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  const typeMap = new Map<number, RackType>(rackTypes.map((rt) => [rt.id, rt]));

  const racks: Rack[] = [];
  for (const row of result.data) {
    const name = (row.Nummer ?? '').trim();
    const typeId = parseInt((row.Type ?? '').trim(), 10);
    if (!name || isNaN(typeId)) continue;
    const rackType = typeMap.get(typeId);
    if (!rackType) continue;
    racks.push({ name, rackType, paintings: [] });
  }
  return racks;
}
