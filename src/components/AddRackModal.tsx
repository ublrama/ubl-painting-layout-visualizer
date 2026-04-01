import { useState, useEffect } from 'react';
import type { RackType } from '../types';

interface AddRackModalProps {
  rackTypes: RackType[];
  onSave: (name: string, rackTypeId: number) => Promise<void>;
  onCancel: () => void;
}

export function AddRackModal({ rackTypes, onSave, onCancel }: AddRackModalProps) {
  const [name,       setName]       = useState('');
  const [rackTypeId, setRackTypeId] = useState<number>(rackTypes[0]?.id ?? 1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      setError('Vul een naam in.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), rackTypeId);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Rek toevoegen</h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Naam</label>
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="bijv. Pos. 1-2a"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rektype</label>
            <select
              value={rackTypeId}
              onChange={(e) => setRackTypeId(parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {rackTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.id} — (h) {rt.height} | (b) {rt.width} | (d) {rt.maxDepth}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Annuleer
          </button>
          <button type="button" onClick={handleSave} disabled={saving || rackTypes.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}

