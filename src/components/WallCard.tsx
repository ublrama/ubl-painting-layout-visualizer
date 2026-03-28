import type { Wall } from '../types';
import { WALL_WIDTH, WALL_HEIGHT } from '../constants';
import { WallCanvas } from './WallCanvas';

interface WallCardProps {
  wall: Wall;
  onSelect: () => void;
}

// Fixed preview height in px; derive scale from that
const PREVIEW_HEIGHT = 180;
const PREVIEW_SCALE = PREVIEW_HEIGHT / WALL_HEIGHT;
const PREVIEW_WIDTH = Math.round(WALL_WIDTH * PREVIEW_SCALE);

export function WallCard({ wall, onSelect }: WallCardProps) {
  return (
    <div
      className="
        bg-gray-900 border border-gray-800 rounded-xl overflow-hidden
        transition-all duration-200
        hover:border-amber-400/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-400/5
        cursor-pointer group
      "
      onClick={onSelect}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-white text-sm">Muur {wall.index + 1}</h3>
        <span className="bg-amber-400/15 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
          {wall.paintings.length} schilderijen
        </span>
      </div>

      {/* Miniature preview */}
      <div className="flex items-center justify-center bg-gray-950/60 py-4 px-3 overflow-hidden">
        <div style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, flexShrink: 0 }}>
          <WallCanvas wall={wall} scale={PREVIEW_SCALE} />
        </div>
      </div>

      {/* Footer button */}
      <div className="px-4 py-3 border-t border-gray-800">
        <button
          className="w-full text-xs text-amber-400 font-medium group-hover:underline"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          Bekijk details →
        </button>
      </div>
    </div>
  );
}
