import { Wall } from '../types';
import WallCanvas from './WallCanvas';

interface WallDetailProps {
  wall: Wall;
  walls: Wall[];
  scale: number;
  onBack: () => void;
  onNavigate: (index: number) => void;
}

export default function WallDetail({ wall, walls, scale, onBack, onNavigate }: WallDetailProps) {
  const total = walls.length;
  const current = wall.index;

  return (
    <div className="p-6">
      {/* Breadcrumb + print button */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Dashboard
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">Muur {current + 1}</span>
        </nav>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors border border-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Afdrukken
        </button>
      </div>

      {/* Wall heading */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-white">Muur {current + 1}</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
          {wall.paintings.length} schilderijen
        </span>
      </div>

      {/* Print area */}
      <div id="print-area">
        <div className="overflow-x-auto">
          <WallCanvas wall={wall} scale={scale} />
        </div>

        {/* Printed legend (hidden on screen, visible in print) */}
        <div className="hidden print:block mt-6">
          <h3 className="font-semibold text-lg mb-2">Muur {current + 1} — Schilderijlijst</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1 pr-4">Signatuur</th>
                <th className="text-left py-1 pr-4">Breedte (cm)</th>
                <th className="text-left py-1 pr-4">Hoogte (cm)</th>
                <th className="text-left py-1 pr-4">Positie X (cm)</th>
                <th className="text-left py-1">Positie Y (cm)</th>
              </tr>
            </thead>
            <tbody>
              {wall.paintings.map((p) => (
                <tr key={p.signatuur} className="border-b border-gray-100">
                  <td className="py-1 pr-4 font-medium">{p.signatuur}</td>
                  <td className="py-1 pr-4">{p.width}</td>
                  <td className="py-1 pr-4">{p.height}</td>
                  <td className="py-1 pr-4">{p.x}</td>
                  <td className="py-1">{p.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination bar */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => onNavigate(current - 1)}
          disabled={current === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border disabled:opacity-40 disabled:cursor-not-allowed border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Vorige muur
        </button>

        <span className="text-sm text-gray-400 font-medium px-2">
          Muur {current + 1} / {total}
        </span>

        <button
          onClick={() => onNavigate(current + 1)}
          disabled={current === total - 1}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border disabled:opacity-40 disabled:cursor-not-allowed border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-600"
        >
          Volgende muur
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
