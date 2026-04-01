import { useState, useEffect } from 'react';
import type { Painting, RackSuggestion } from '../types';
import { RackSuggestions } from './RackSuggestions';

interface AssignRackModalProps {
  painting: Painting;
  onSave: (rackName: string) => Promise<void>;
  onCancel: () => void;
}

export function AssignRackModal({ painting, onSave, onCancel }: AssignRackModalProps) {
  const [suggestions,  setSuggestions]  = useState<RackSuggestion[]>([]);
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams({
      width:  String(painting.width),
      height: String(painting.height),
      depth:  String(painting.depth),
    });
    fetch(`/api/suggest-rack?${p}`)
      .then((r) => r.json())
      .then(setSuggestions)
      .finally(() => setLoading(false));
  }, [painting.width, painting.height, painting.depth]);

  async function handleSave() {
    if (!selectedRack) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(selectedRack);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Rek toewijzen</h3>
            <p className="text-xs text-gray-500 mt-0.5">{painting.signatuur} — {painting.width}×{painting.height} cm</p>
          </div>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-sm text-gray-500 py-4 text-center">Rekken laden…</p>
          ) : (
            <RackSuggestions
              suggestions={suggestions}
              selectedRack={selectedRack}
              onSelect={setSelectedRack}
            />
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
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
            onClick={handleSave}
            disabled={!selectedRack || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
