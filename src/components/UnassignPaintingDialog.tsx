import { useEffect, useState } from 'react';
import type { Painting } from '../types';

interface UnassignPaintingDialogProps {
  painting: Painting;
  rackName: string;
  onUnassign: () => Promise<void>;
  onCancel: () => void;
}

type DialogState = 'confirm' | 'loading' | 'error' | 'timeout';

export function UnassignPaintingDialog({
  painting,
  rackName,
  onUnassign,
  onCancel,
}: UnassignPaintingDialogProps) {
  const [state, setState] = useState<DialogState>('confirm');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleUnassign = async () => {
    setState('loading');
    setErrorMessage('');

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30 second timeout
    });

    try {
      // Race between the actual operation and the timeout
      await Promise.race([onUnassign(), timeoutPromise]);
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
            : 'Er is een fout opgetreden bij het loskoppelen van het schilderij.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {state === 'confirm' && 'Schilderij loskoppelen'}
            {state === 'loading' && 'Bezig met loskoppelen...'}
            {state === 'error' && 'Fout opgetreden'}
            {state === 'timeout' && 'Time-out'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {state === 'confirm' && (
            <>
              <p className="text-sm text-gray-700">
                Weet u zeker dat u <strong>{painting.signatuur}</strong> wilt loskoppelen van rek{' '}
                <strong>{rackName}</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                Het schilderij wordt verplaatst naar de lijst met niet-toegewezen schilderijen.
              </div>
            </>
          )}

          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-600">
                Even geduld, het schilderij wordt losgekoppeld...
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
                Het schilderij blijft toegewezen aan rek <strong>{rackName}</strong>.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
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
                onClick={handleUnassign}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                Loskoppelen
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
                onClick={handleUnassign}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
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

