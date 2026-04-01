import { useEffect, useState } from 'react';
import type { Painting, FillSuggestion } from '../types';

interface RemovePaintingDialogProps {
  painting: Painting;
  rackName: string | null;
  onRemove: () => void;
  onAssignFillSuggestion?: (paintingId: string) => void;
  onCancel: () => void;
}

export function RemovePaintingDialog({
  painting,
  rackName,
  onRemove,
  onAssignFillSuggestion,
  onCancel,
}: RemovePaintingDialogProps) {
  // Fetch fill suggestions if the painting is on a rack
  const suggestionsKey = rackName
    ? `/api/fill-suggestions?rackName=${encodeURIComponent(rackName)}&removedPaintingWidth=${painting.width}&removedPaintingHeight=${painting.height}`
    : null;

  const [suggestions, setSuggestions] = useState<FillSuggestion[] | undefined>(undefined);
  useEffect(() => {
    if (!suggestionsKey) { setSuggestions(undefined); return; }
    fetch(suggestionsKey)
      .then((r) => r.json() as Promise<FillSuggestion[]>)
      .then(setSuggestions)
      .catch(() => setSuggestions(undefined));
  }, [suggestionsKey]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Schilderij verwijderen</h3>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">
            Weet u zeker dat u{' '}
            <strong>{painting.signatuur}</strong>{' '}
            {rackName ? (
              <>wilt verwijderen van rek <strong>{rackName}</strong>?</>
            ) : (
              'wilt verwijderen?'
            )}
          </p>

          {rackName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
              Na verwijdering is er ~{painting.width}×{painting.height} cm ruimte beschikbaar.
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Schilderijen die hier kunnen passen:
              </p>
              <ul className="space-y-1.5">
                {suggestions.map((s) => (
                  <li
                    key={s.painting.id}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-gray-700">
                      <strong>{s.painting.signatuur}</strong>{' '}
                      <span className="text-gray-500">
                        ({s.painting.width}×{s.painting.height} cm) — niet toegewezen
                      </span>
                    </span>
                    {onAssignFillSuggestion && (
                      <button
                        type="button"
                        onClick={() => onAssignFillSuggestion(s.painting.id)}
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        Wijs toe
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuleer
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}
