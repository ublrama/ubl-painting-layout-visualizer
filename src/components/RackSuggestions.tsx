import type { RackSuggestion } from '../types';

interface RackSuggestionsProps {
  suggestions: RackSuggestion[];
  selectedRack: string | null;
  onSelect: (rackName: string) => void;
  onForcePlacement?: (rackName: string) => void;
}

export function RackSuggestions({
  suggestions,
  selectedRack,
  onSelect,
  onForcePlacement,
}: RackSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-3 text-center">
        Geen geschikte rekken gevonden.
      </p>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700">Aanbevolen rekken</span>
      </div>
      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {suggestions.map((s) => (
          <button
            key={s.rackName}
            type="button"
            onClick={() => {
              if (!s.canFit && onForcePlacement) {
                onForcePlacement(s.rackName);
              } else {
                onSelect(s.rackName);
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
              selectedRack === s.rackName ? 'bg-blue-50 border-l-2 border-blue-500' : ''
            }`}
          >
            <span className="text-lg flex-shrink-0">
              {s.canFit ? '✅' : '❌'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">{s.rackName}</span>
                <span className="text-xs text-gray-500">Type {s.rackType.id}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">
                  {s.paintingCount} schilderijen
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {s.rackType.height} × {s.rackType.width} cm
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                s.canFit
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {s.canFit ? 'Past ✓' : 'Vol'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
