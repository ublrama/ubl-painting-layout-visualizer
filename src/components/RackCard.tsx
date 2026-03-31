import type { Rack } from '../types';
import { RackCanvas } from './RackCanvas';

interface RackCardProps {
  rack: Rack;
  onSelect: () => void;
}

// Fixed preview height in px; derive scale from that
const PREVIEW_HEIGHT = 180;

export function RackCard({ rack, onSelect }: RackCardProps) {
  const previewScale = PREVIEW_HEIGHT / rack.rackType.height;
  const previewWidth = Math.round(rack.rackType.width * previewScale);
  const totalPaintings = rack.frontPaintings.length + rack.backPaintings.length;

  return (
    <div
      className="
        bg-white border-2 border-gray-200 rounded-xl overflow-hidden
        transition-all duration-200
        hover:border-blue-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10
        cursor-pointer group
      "
      onClick={onSelect}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{rack.name}</h3>
          <p className="text-xs text-gray-500">
            Type {rack.rackType.id} · max {rack.rackType.maxDepth} cm diep
          </p>
        </div>
        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {totalPaintings} schilderijen
        </span>
      </div>

      {/* Miniature preview (front side) */}
      <div className="flex items-center justify-center bg-gray-50 py-4 px-3 overflow-hidden">
        <div style={{ width: previewWidth, height: PREVIEW_HEIGHT, flexShrink: 0 }}>
          <RackCanvas rack={rack} side="front" scale={previewScale} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          V: {rack.frontPaintings.length} · A: {rack.backPaintings.length}
        </span>
        <button
          className="text-xs text-blue-600 font-medium group-hover:underline"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          Bekijk details →
        </button>
      </div>
    </div>
  );
}
