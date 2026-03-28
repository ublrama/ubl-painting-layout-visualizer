import Papa from 'papaparse';
import { Painting } from '../types';

/**
 * Parse a semicolon-delimited CSV string/file and return an array of painting objects.
 */
export function parseCsv(input: string | File): Promise<Painting[]> {
  return new Promise((resolve, reject) => {
    const config: Papa.ParseConfig = {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const paintings: Painting[] = [];
        for (const row of results.data as Record<string, string>[]) {
          const signatuur = (row['signatuur'] || '').trim();
          const afmetingen = (row['afmetingen'] || '').trim();
          if (!signatuur || !afmetingen) continue;

          const match = afmetingen.match(
            /(\d+(?:[,.]\d+)?)\s*cm\s*x\s*(\d+(?:[,.]\d+)?)\s*cm/i,
          );
          if (!match) continue;

          const width = parseFloat(match[1].replace(',', '.'));
          const height = parseFloat(match[2].replace(',', '.'));
          if (isNaN(width) || isNaN(height)) continue;

          paintings.push({ signatuur, width, height });
        }
        resolve(paintings);
      },
    };

    try {
      Papa.parse(input as string, config);
    } catch (err) {
      reject(err);
    }
  });
}
