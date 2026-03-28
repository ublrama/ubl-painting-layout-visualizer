import { PlacedPainting } from '../types';

interface TooltipProps {
  painting: PlacedPainting;
  color: string;
}

export default function Tooltip({ painting, color }: TooltipProps) {
  const { signatuur, width, height, x, y } = painting;

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[160px] text-left">
        <p className="text-sm font-bold text-white mb-1">{signatuur}</p>
        <p className="text-xs text-gray-300">{width} cm × {height} cm</p>
        <p className="text-xs text-gray-400">x: {x} cm, y: {y} cm</p>
        <div className="mt-2 flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm border border-white/20 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-gray-400">{signatuur.split(' ')[0]}</span>
        </div>
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700" />
    </div>
  );
}
