import { useEffect, useState } from 'react';
import type { Painting, FillSuggestion } from '../types';

interface RemovePaintingDialogProps {
  painting: Painting;
  rackName: string | null;
  onRemove: () => Promise<void>;
  onAssignFillSuggestion?: (paintingId: string) => void;
  onCancel: () => void;
}

type DialogState = 'confirm' | 'loading' | 'error' | 'timeout';

export function RemovePaintingDialog({
  painting,
  rackName,
  onRemove,
  onAssignFillSuggestion,
  onCancel,
}: RemovePaintingDialogProps) {
  const [state, setState] = useState<DialogState>('confirm');
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  const handleRemove = async () => {
    setState('loading');
    setErrorMessage('');

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30 second timeout
    });

    try {
      // Race between the actual operation and the timeout
      await Promise.race([onRemove(), timeoutPromise]);
      // Success - dialog will be closed by parent
    } catch (error) {
      if (error instanceof Error && error.message === 'TIMEOUT') {
        setState('timeout');
        setErrorMessage('De bewerking duurt te lang. Probeer het later opnieuw.');
      } else {
        setState('error');
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : 'Er is een fout opgetreden bij het verwijderen van het schilderij.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {state === 'confirm' && 'Schilderij verwijderen'}
            {state === 'loading' && 'Bezig met verwijderen...'}
            {state === 'error' && 'Fout opgetreden'}
            {state === 'timeout' && 'Time-out'}
          </h3>
        </div>

        <div className="p-5 space-y-4">
          {state === 'confirm' && (
            <>
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
            </>
          )}

          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-600">
                Even geduld, het schilderij wordt verwijderd...
              </p>
            </div>
          )}

          {(state === 'error' || state === 'timeout') && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-sm text-red-800 font-medium">
                  {errorMessage}
                </p>
              </div>
              <p className="text-sm text-gray-700">
                Het schilderij is niet verwijderd en blijft{' '}
                {rackName ? (
                  <>toegewezen aan rek <strong>{rackName}</strong>.</>
                ) : (
                  'niet toegewezen.'
                )}
              </p>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
          {state === 'confirm' && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleer
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Verwijderen
              </button>
            </>
          )}

          {state === 'loading' && (
            <button
              type="button"
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
            >
              Bezig...
            </button>
          )}

          {(state === 'error' || state === 'timeout') && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sluiten
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Opnieuw proberen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
