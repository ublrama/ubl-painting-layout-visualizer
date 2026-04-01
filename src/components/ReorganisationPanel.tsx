import type { ForcePlacementResult } from '../types';

interface ReorganisationPanelProps {
  targetRackName: string;
  paintingSignatuur: string;
  result: ForcePlacementResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReorganisationPanel({
  targetRackName,
  paintingSignatuur,
  result,
  onConfirm,
  onCancel,
}: ReorganisationPanelProps) {
  if (result.moveSuggestions.length === 0) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-orange-800 mb-2">
          Geen reorganisatie mogelijk
        </h4>
        <p className="text-sm text-orange-700">
          Er is geen ruimte op {targetRackName} voor {paintingSignatuur},
          en er zijn geen schilderijen die verplaatst kunnen worden.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 px-3 py-1.5 text-xs font-medium bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
        >
          Annuleer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-amber-800 mb-1">
        Reorganisatieadvies voor {targetRackName}
      </h4>
      <p className="text-sm text-amber-700 mb-3">
        Om <strong>{paintingSignatuur}</strong> hier te plaatsen, verplaats:
      </p>
      <ul className="space-y-2 mb-4">
        {result.moveSuggestions.map((ms) => (
          <li key={ms.painting.id} className="flex items-center gap-2 text-sm">
            <span className="text-amber-600">•</span>
            <span className="font-medium text-gray-800">{ms.painting.signatuur}</span>
            <span className="text-gray-500">
              ({ms.painting.width}×{ms.painting.height} cm)
            </span>
            <span className="text-gray-400">→</span>
            <span className={ms.canFit ? 'text-green-700 font-medium' : 'text-red-600'}>
              {ms.suggestedRack} {ms.canFit ? '✓ past' : '✗ past niet'}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={result.moveSuggestions.some((ms) => !ms.canFit)}
          className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Bevestig reorganisatie
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuleer
        </button>
      </div>
    </div>
  );
}
