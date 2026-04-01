 import { useState, useEffect } from 'react';
import type { Painting, RackSuggestion, ForcePlacementResult } from '../types';
import { RackSuggestions } from './RackSuggestions';
import { ReorganisationPanel } from './ReorganisationPanel';

interface Props {
  painting: Painting;
  onAssign: (paintingId: string, rackName: string) => Promise<void>;
  onCancel: () => void;
}

export function AssignPaintingModal({ painting, onAssign, onCancel }: Props) {
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RackSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceResult, setForceResult] = useState<ForcePlacementResult | null>(null);
  const [forceRack, setForceRack] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams({
      width: String(painting.width),
      height: String(painting.height),
      depth: String(painting.depth),
    });
    fetch(`/api/suggest-rack?${p}`)
      .then((r) => r.json())
      .then(setSuggestions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [painting]);

  async function handleForce(rackName: string) {
    setForceRack(rackName);
    const p = new URLSearchParams({
      targetRack: rackName,
      width: String(painting.width),
      height: String(painting.height),
      depth: String(painting.depth),
    });
    const res = await fetch(`/api/suggest-rack?${p}`);
    if (res.ok) setForceResult(await res.json());
  }

  async function handleAssign(rackName: string) {
    setSaving(true);
    setError(null);
    try {
      await onAssign(painting.id, rackName);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            Rek kiezen voor {painting.signatuur}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800 flex flex-wrap gap-3">
            <span><strong>Afmetingen:</strong> {painting.width}×{painting.height} cm</span>
            <span><strong>Diepte:</strong> {painting.depth} cm</span>
            <span><strong>Collectie:</strong> {painting.collection}</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {forceRack && forceResult ? (
            <ReorganisationPanel
              targetRackName={forceRack}
              paintingSignatuur={painting.signatuur}
              result={forceResult}
              onConfirm={() => handleAssign(forceRack)}
              onCancel={() => { setForceRack(null); setForceResult(null); }}
            />
          ) : loading ? (
            <p className="text-sm text-gray-500 py-4 text-center">Rekken laden…</p>
          ) : (
            <RackSuggestions
              suggestions={suggestions}
              selectedRack={selectedRack}
              onSelect={setSelectedRack}
              onForcePlacement={handleForce}
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Annuleer
          </button>
          <button type="button"
            onClick={() => selectedRack && handleAssign(selectedRack)}
            disabled={!selectedRack || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
            {saving ? 'Toewijzen…' : 'Toewijzen aan rek'}
          </button>
        </div>
      </div>
    </div>
  );
}

