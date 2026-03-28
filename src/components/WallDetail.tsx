import type { Wall } from '../types';
import { WallCanvas } from './WallCanvas';
import { getCollection } from '../utils/parseCsv';
import { COLLECTION_COLORS } from '../constants';

interface WallDetailProps {
  wall: Wall;
  totalWalls: number;
  zoom: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function WallDetail({
  wall,
  totalWalls,
  zoom,
  onBack,
  onPrev,
  onNext,
}: WallDetailProps) {
  const wallNumber = wall.index + 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + print button */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="text-amber-400 hover:underline font-medium"
          >
            Dashboard
          </button>
          <span className="text-gray-500">/</span>
          <span className="text-white font-medium">Muur {wallNumber}</span>
        </nav>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
        >
          🖨️ Afdrukken
        </button>
      </div>

      {/* Print area */}
      <div id="print-area">
        <div className="overflow-x-auto">
          <WallCanvas wall={wall} scale={zoom} />
        </div>

        {/* Print-only legend table */}
        <div className="print-only mt-8">
          <h2 className="text-xl font-bold mb-3">Muur {wallNumber} – Schilderijen</h2>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>
                  Signatuur
                </th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>
                  Afmetingen
                </th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>
                  Positie
                </th>
              </tr>
            </thead>
            <tbody>
              {wall.paintings.map((p) => (
                <tr key={p.signatuur}>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{p.signatuur}</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>
                    {p.width} cm × {p.height} cm
                  </td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>
                    x: {p.x} cm, y: {p.y} cm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paintings list (screen only) */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          Schilderijen op deze muur ({wall.paintings.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {wall.paintings.map((p) => {
            const collection = getCollection(p.signatuur);
            const color = COLLECTION_COLORS[collection] ?? COLLECTION_COLORS['Unknown'];
            return (
              <div
                key={p.signatuur}
                className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 text-xs"
              >
                <span
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-300 truncate">{p.signatuur}</span>
                <span className="text-gray-500 ml-auto flex-shrink-0">
                  {p.width}×{p.height}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={wall.index === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-800 border border-gray-700 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Vorige muur
        </button>
        <span className="text-sm text-gray-400 font-medium">
          Muur {wallNumber} / {totalWalls}
        </span>
        <button
          onClick={onNext}
          disabled={wall.index === totalWalls - 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-800 border border-gray-700 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Volgende muur →
        </button>
      </div>
    </div>
  );
}
