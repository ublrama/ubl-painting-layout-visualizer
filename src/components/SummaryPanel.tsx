import { Wall } from '../types';

interface SummaryPanelProps {
  walls: Wall[];
}

export default function SummaryPanel({ walls }: SummaryPanelProps) {
  if (!walls || walls.length === 0) return null;

  const totalPaintings = walls.reduce((sum, w) => sum + w.paintings.length, 0);
  const avgPerWall = walls.length > 0 ? (totalPaintings / walls.length).toFixed(1) : '0';

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Samenvatting
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-300 flex items-center gap-2">
            🧱 Muren
          </span>
          <span className="text-sm font-bold text-amber-400">{walls.length}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-300 flex items-center gap-2">
            🖼️ Schilderijen
          </span>
          <span className="text-sm font-bold text-amber-400">{totalPaintings}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-300">Gem. p/muur</span>
          <span className="text-sm font-bold text-amber-400">{avgPerWall}</span>
        </div>
      </div>
    </div>
  );
}
