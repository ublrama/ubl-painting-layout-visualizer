import Papa from 'papaparse';
import type { Painting } from '../types';

interface CsvRow {
  signatuur: string;
  afmetingen: string;
  [key: string]: string;
}

/**
 * Parse a dimension string like "61cm x 61,5cm" into { width, height } in cm.
 * Handles Dutch decimal notation (comma → dot).
 */
function parseDimensions(raw: string): { width: number; height: number } | null {
  const match = raw.match(/(\d+(?:[,.]\d+)?)\s*cm\s*x\s*(\d+(?:[,.]\d+)?)\s*cm/i);
  if (!match) return null;
  const width = parseFloat(match[1].replace(',', '.'));
  const height = parseFloat(match[2].replace(',', '.'));
  if (isNaN(width) || isNaN(height)) return null;
  return { width, height };
}

/**
 * Derive the collection name from the signatuur prefix.
 */
export function getCollection(signatuur: string): string {
  if (signatuur.startsWith('BWB')) return 'BWB';
  if (signatuur.startsWith('AHM')) return 'AHM';
  if (signatuur.startsWith('Bild. Mus. Geerts')) return 'Bild. Mus. Geerts';
  if (signatuur.startsWith('Icones')) return 'Icones';
  return 'Unknown';
}

/**
 * Parse a semicolon-delimited CSV string and return an array of Paintings.
 */
export function parseCsv(csvText: string): Painting[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  const paintings: Painting[] = [];
  for (const row of result.data) {
    const signatuur = (row.signatuur ?? '').trim();
    const afmetingen = (row.afmetingen ?? '').trim();
    if (!signatuur || !afmetingen) continue;
    const dims = parseDimensions(afmetingen);
    if (!dims) continue;
    paintings.push({ signatuur, width: dims.width, height: dims.height });
  }
  return paintings;
}
