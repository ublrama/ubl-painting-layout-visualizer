import { useState, useEffect } from 'react';
import { useAuthFetch } from '../hooks/useAuthFetch';

type SeedMode = 'default' | 'custom';
type PanelState = 'idle' | 'loading' | 'success' | 'error';

interface DatabasePanelProps {
  onClose: () => void;
  onSeedComplete: () => void;
}

export function DatabasePanel({ onClose, onSeedComplete }: DatabasePanelProps) {
  const authFetch = useAuthFetch();
  const [mode, setMode] = useState<SeedMode>('default');
  const [state, setState] = useState<PanelState>('idle');
  const [message, setMessage] = useState('');

  const [paintingsFile, setPaintingsFile] = useState<File | null>(null);
  const [rackTypesFile, setRackTypesFile] = useState<File | null>(null);
  const [racksFile, setRacksFile] = useState<File | null>(null);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleSeedDefault() {
    setState('loading');
    setMessage('');
    try {
      const res = await authFetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✓ ${data.paintingCount} schilderijen en ${data.rackCount} rekken geladen`);
        setState('success');
        setTimeout(() => { onSeedComplete(); onClose(); }, 1500);
      } else {
        setMessage(`Fout: ${data.error ?? data.detail ?? 'Onbekende fout'}`);
        setState('error');
      }
    } catch (e) {
      setMessage(`Fout: ${String(e)}`);
      setState('error');
    }
  }

  async function handleSeedCustom() {
    if (!paintingsFile) {
      setMessage('Selecteer minimaal een schilderijen CSV');
      setState('error');
      return;
    }
    setState('loading');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('paintings', paintingsFile);
      if (rackTypesFile) formData.append('rackTypes', rackTypesFile);
      if (racksFile) formData.append('racks', racksFile);

      const res = await authFetch('/api/seed', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✓ ${data.paintingCount} schilderijen en ${data.rackCount} rekken geladen`);
        setState('success');
        setTimeout(() => { onSeedComplete(); onClose(); }, 1500);
      } else {
        setMessage(`Fout: ${data.error ?? data.detail ?? 'Onbekende fout'}`);
        setState('error');
      }
    } catch (e) {
      setMessage(`Fout: ${String(e)}`);
      setState('error');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">🗄️ Database beheer</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-4 pb-0">
          <button
            type="button"
            onClick={() => setMode('default')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === 'default'
                ? 'bg-[#0a2060] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Demo data
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-[#0a2060] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Eigen bestanden
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mode === 'default' ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Laad de ingebouwde demo-dataset met schilderijen en rekken.
                Dit overschrijft alle huidige data.
              </p>
              <button
                type="button"
                onClick={handleSeedDefault}
                disabled={state === 'loading'}
                className="w-full py-2 px-4 rounded-lg bg-[#0a2060] hover:bg-[#001158] text-white font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                {state === 'loading' ? 'Bezig…' : 'Demo data laden'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Upload eigen CSV-bestanden. Alleen schilderijen is verplicht; rektypen en rekken vallen terug op de demo-standaard.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Schilderijen CSV <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setPaintingsFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rektypen CSV <span className="text-gray-400">(optioneel)</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setRackTypesFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rekken CSV <span className="text-gray-400">(optioneel)</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setRacksFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <button
                type="button"
                onClick={handleSeedCustom}
                disabled={state === 'loading'}
                className="w-full py-2 px-4 rounded-lg bg-[#0a2060] hover:bg-[#001158] text-white font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                {state === 'loading' ? 'Bezig…' : 'Bestanden laden'}
              </button>
            </div>
          )}

          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                state === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
