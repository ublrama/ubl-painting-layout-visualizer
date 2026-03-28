import type { PlacedPainting } from '../types';

interface TooltipProps {
  painting: PlacedPainting;
  color: string;
  collection: string;
  x: number;
  y: number;
}

export function Tooltip({ painting, color, collection, x, y }: TooltipProps) {
  return (
    <div
      className="absolute z-50 pointer-events-none bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 w-52 text-sm"
      style={{ left: x + 12, top: y - 8 }}
    >
      <p className="font-semibold text-white mb-1 truncate">{painting.signatuur}</p>
      <p className="text-gray-400 text-xs mb-1">
        {painting.width} cm × {painting.height} cm
      </p>
      <p className="text-gray-500 text-xs mb-2">
        x: {painting.x} cm, y: {painting.y} cm
      </p>
      <span
        className="inline-block px-2 py-0.5 rounded-full text-white text-xs font-medium"
        style={{ backgroundColor: color }}
      >
        {collection}
      </span>
    </div>
  );
}
