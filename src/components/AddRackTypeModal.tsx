import { useState, useEffect } from 'react';
import type { RackType } from '../types';

interface AddRackTypeModalProps {
  existing?: RackType; // if set → edit mode
  onSave: (rt: RackType) => Promise<void>;
  onCancel: () => void;
}

export function AddRackTypeModal({ existing, onSave, onCancel }: AddRackTypeModalProps) {
  const [id,       setId]       = useState(existing?.id?.toString()       ?? '');
  const [height,   setHeight]   = useState(existing?.height?.toString()   ?? '');
  const [width,    setWidth]    = useState(existing?.width?.toString()    ?? '');
  const [maxDepth, setMaxDepth] = useState(existing?.maxDepth?.toString() ?? '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleSave() {
    const numId       = parseInt(id, 10);
    const numHeight   = parseFloat(height);
    const numWidth    = parseFloat(width);
    const numMaxDepth = parseFloat(maxDepth);

    if (isNaN(numId) || isNaN(numHeight) || isNaN(numWidth) || isNaN(numMaxDepth)) {
      setError('Vul alle velden in met geldige waarden.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({ id: numId, height: numHeight, width: numWidth, maxDepth: numMaxDepth });
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {existing ? 'Rektype bewerken' : 'Rektype toevoegen'}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type ID</label>
            <input
              type="number" min="1" value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={!!existing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              placeholder="bijv. 1"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hoogte (cm)</label>
              <input type="number" min="0" step="0.5" value={height} onChange={(e) => setHeight(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Breedte (cm)</label>
              <input type="number" min="0" step="0.5" value={width} onChange={(e) => setWidth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max diepte (cm)</label>
              <input type="number" min="0" step="0.5" value={maxDepth} onChange={(e) => setMaxDepth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Annuleer
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}

