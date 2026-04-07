import { useState } from 'react';
import type { Rack } from '../types';
import { RackCanvas } from './RackCanvas';
import { COLLECTION_COLORS } from '../constants';

interface RackDetailProps {
  rack: Rack;
  rackIndex: number;
  totalRacks: number;
  zoom: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onUnassignPainting?: (paintingId: string) => Promise<void>;
  onAddPaintingToRack?: () => void;
  onPaintingMove?: (paintingId: string, newX: number, newY: number) => Promise<void>;
  onReorganise?: () => Promise<void>;
}

export function RackDetail({
  rack,
  rackIndex,
  totalRacks,
  zoom,
  onBack,
  onPrev,
  onNext,
  onUnassignPainting,
  onAddPaintingToRack,
  onPaintingMove,
  onReorganise,
}: RackDetailProps) {
  const { rackType } = rack;
  const [editMode, setEditMode] = useState(false);
  const [reorganising, setReorganising] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <button onClick={onBack} className="text-blue-600 hover:underline font-medium">
            Dashboard
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{rack.name}</span>
        </nav>
        <div className="flex items-center gap-2">
          {onAddPaintingToRack && (
            <button
              onClick={onAddPaintingToRack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              + Schilderij toevoegen
            </button>
          )}
          {onReorganise && (
            <button
              onClick={async () => {
                setReorganising(true);
                try { await onReorganise(); } finally { setReorganising(false); }
              }}
              disabled={reorganising}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm font-medium text-gray-700 hover:border-green-500 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Herbereken de optimale positionering van alle schilderijen op dit rek"
            >
              {reorganising ? '⏳ Bezig…' : '🔄 Optimaliseer rek'}
            </button>
          )}
          {onPaintingMove && (
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                editMode
                  ? 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
              }`}
            >
              {editMode ? '✏️ Bewerken aan' : '✏️ Bewerken'}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm text-gray-700 hover:text-gray-900 hover:border-blue-500 transition-colors"
          >
            🖨️ Afdrukken
          </button>
        </div>
      </div>

      {/* Rack info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex flex-wrap gap-4">
        <span><strong>Type:</strong> {rackType.id}</span>
        <span><strong>Afmetingen:</strong> {rackType.height} × {rackType.width} cm (H × B)</span>
        <span><strong>Max. diepte:</strong> {rackType.maxDepth} cm</span>
        <span><strong>Schilderijen:</strong> {rack.paintings.length}</span>
      </div>

      {/* Print area */}
      <div id="print-area">
        {/* Single canvas */}
        <div className="flex flex-col gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800">{rack.name}</h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {rack.paintings.length} schilderijen
            </span>
          </div>
          <RackCanvas rack={rack} scale={zoom} editMode={editMode} onPaintingMove={onPaintingMove} />
        </div>

        {/* Print-only legend table */}
        <div className="print-only mt-8">
          <h2 className="text-xl font-bold mb-3">{rack.name} – Schilderijen</h2>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Signatuur</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Afmetingen</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Diepte</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Positie</th>
              </tr>
            </thead>
            <tbody>
              {rack.paintings.map((p) => (
                <tr key={p.signatuur}>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{p.signatuur}</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{p.width} cm × {p.height} cm</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{p.depth} cm</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>x: {p.x} cm, y: {p.y} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paintings list (screen only) */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Schilderijen op dit rek ({rack.paintings.length})
        </h3>
        <div className="flex flex-col gap-1">
          {rack.paintings.map((p) => {
            const color = COLLECTION_COLORS[p.collection] ?? COLLECTION_COLORS['Unknown'];
            return (
              <div
                key={p.signatuur}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs border border-gray-200"
              >
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-gray-700 truncate">{p.signatuur}</span>
                <span className="text-gray-500 ml-auto flex-shrink-0">{p.width}×{p.height} cm</span>
                {onUnassignPainting && (
                  <button
                    type="button"
                    onClick={() => onUnassignPainting(p.id)}
                    className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                    title="Verwijder van rek"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={rackIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-gray-300 text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Vorig rek
        </button>
        <span className="text-sm text-gray-600 font-medium">
          Rek {rackIndex + 1} / {totalRacks}
        </span>
        <button
          onClick={onNext}
          disabled={rackIndex === totalRacks - 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-gray-300 text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Volgend rek →
        </button>
      </div>
    </div>
  );
}
