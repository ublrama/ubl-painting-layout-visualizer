import Papa from 'papaparse';

/**
 * Parse a semicolon-delimited CSV string/file and return an array of painting objects.
 * Each object has: { signatuur, width, height }
 *
 * @param {string|File} input - CSV text or a File object
 * @returns {Promise<Array<{signatuur: string, width: number, height: number}>>}
 */
export function parseCsv(input) {
  return new Promise((resolve, reject) => {
    const config = {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const paintings = [];
        for (const row of results.data) {
          const signatuur = (row['signatuur'] || '').trim();
          const afmetingen = (row['afmetingen'] || '').trim();
          if (!signatuur || !afmetingen) continue;

          const match = afmetingen.match(
            /(\d+(?:[,\.]\d+)?)\s*cm\s*x\s*(\d+(?:[,\.]\d+)?)\s*cm/i
          );
          if (!match) continue;

          const width = parseFloat(match[1].replace(',', '.'));
          const height = parseFloat(match[2].replace(',', '.'));
          if (isNaN(width) || isNaN(height)) continue;

          paintings.push({ signatuur, width, height });
        }
        resolve(paintings);
      },
      error(err) {
        reject(err);
      },
    };

    Papa.parse(input, config);
  });
}
