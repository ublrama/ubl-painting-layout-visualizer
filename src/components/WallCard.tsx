import { Wall } from '../types';
import { WALL_WIDTH, WALL_HEIGHT } from '../constants';
import PaintingRect from './PaintingRect';

interface WallCardProps {
  wall: Wall;
  onViewDetail: () => void;
}

// Scale the preview to fit ~200px tall
const CARD_PREVIEW_HEIGHT = 200;
const PREVIEW_SCALE = CARD_PREVIEW_HEIGHT / WALL_HEIGHT;

export default function WallCard({ wall, onViewDetail }: WallCardProps) {
  const previewW = WALL_WIDTH * PREVIEW_SCALE;
  const previewH = WALL_HEIGHT * PREVIEW_SCALE;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-amber-400/50 hover:scale-[1.02] transition-all duration-200 shadow-lg cursor-default">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="font-semibold text-white text-sm">Muur {wall.index + 1}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
          {wall.paintings.length} schilderijen
        </span>
      </div>

      {/* Miniature preview */}
      <div className="p-3 flex justify-center bg-gray-950">
        <div
          style={{
            position: 'relative',
            width: previewW,
            height: previewH,
            backgroundColor: '#f5f0e8',
            flexShrink: 0,
          }}
          className="border border-gray-600 overflow-hidden"
        >
          {wall.paintings.map((p) => (
            <PaintingRect key={p.signatuur} painting={p} scale={PREVIEW_SCALE} />
          ))}
        </div>
      </div>

      {/* Action button */}
      <div className="px-4 py-3 border-t border-gray-800">
        <button
          onClick={onViewDetail}
          className="w-full text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center justify-center gap-1 transition-colors"
        >
          Bekijk details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
