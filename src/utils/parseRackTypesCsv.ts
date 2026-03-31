import Papa from 'papaparse';
import type { RackType } from '../types';

interface CsvRow {
  'Type schilderijenrekken': string;
  'Hoogte (cm)': string;
  'Breedte (cm)': string;
  'Maximale diepte (cm)': string;
  [key: string]: string;
}

/**
 * Parse the rack types CSV:
 * Type schilderijenrekken;Hoogte (cm);Breedte (cm);Maximale diepte (cm)
 */
export function parseRackTypesCsv(csvText: string): RackType[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  const rackTypes: RackType[] = [];
  for (const row of result.data) {
    const id = parseInt(row['Type schilderijenrekken'] ?? '', 10);
    const height = parseFloat((row['Hoogte (cm)'] ?? '').replace(',', '.'));
    const width = parseFloat((row['Breedte (cm)'] ?? '').replace(',', '.'));
    const maxDepth = parseFloat((row['Maximale diepte (cm)'] ?? '').replace(',', '.'));
    if (isNaN(id) || isNaN(height) || isNaN(width) || isNaN(maxDepth)) continue;
    rackTypes.push({ id, height, width, maxDepth });
  }
  return rackTypes;
}
