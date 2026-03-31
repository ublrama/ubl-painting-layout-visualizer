import { useState, useEffect } from 'react';
import type { Painting, RackSuggestion, ForcePlacementResult } from '../types';
import { RackSuggestions } from './RackSuggestions';
import { ReorganisationPanel } from './ReorganisationPanel';

const COLLECTIONS = ['UBL', 'KITLV', 'BWB', 'AHM', 'Bilderdijk', 'Unknown'];

interface AddPaintingModalProps {
  initialRackName?: string;     // pre-select a rack (from RackDetail)
  isConfirmed?: boolean;        // assignment frozen — show warning
  onSave: (data: Omit<Painting, 'id' | 'manuallyPlaced'>) => Promise<void>;
  onCancel: () => void;
}

type Step = 'form' | 'rack';

export function AddPaintingModal({
  initialRackName,
  isConfirmed,
  onSave,
  onCancel,
}: AddPaintingModalProps) {
  const [step, setStep] = useState<Step>('form');

  const [signatuur,  setSignatuur]  = useState('');
  const [collection, setCollection] = useState(COLLECTIONS[0]);
  const [height,     setHeight]     = useState('');
  const [width,      setWidth]      = useState('');
  const [depth,      setDepth]      = useState('');

  const [selectedRack,     setSelectedRack]     = useState<string | null>(initialRackName ?? null);
  const [suggestions,      setSuggestions]      = useState<RackSuggestion[]>([]);
  const [loadingSuggest,   setLoadingSuggest]   = useState(false);
  const [forceResult,      setForceResult]      = useState<ForcePlacementResult | null>(null);
  const [forceRack,        setForceRack]        = useState<string | null>(null);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const dimensionsFilled = height !== '' && width !== '' && depth !== '';

  async function fetchSuggestions() {
    if (!dimensionsFilled) return;
    setLoadingSuggest(true);
    try {
      const p = new URLSearchParams({ width, height, depth });
      const res = await fetch(`/api/suggest-rack?${p}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function handleNextStep() {
    if (!dimensionsFilled) {
      await handleSave(null);
      return;
    }
    await fetchSuggestions();
    setStep('rack');
  }

  async function handleForcePlacement(rackName: string) {
    setForceRack(rackName);
    const p = new URLSearchParams({ targetRack: rackName, width, height, depth });
    const res = await fetch(`/api/suggest-rack?${p}`);
    if (res.ok) {
      const data = await res.json();
      setForceResult(data);
    }
  }

  async function handleSave(rackName: string | null) {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        signatuur,
        collection,
        width:  parseFloat(width)  || 0,
        height: parseFloat(height) || 0,
        depth:  parseFloat(depth)  || 0,
        assignedRackName: rackName,
      });
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {step === 'form' ? 'Schilderij toevoegen' : 'Rek kiezen'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Confirmed warning */}
        {isConfirmed && (
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            ⚠️ De plaatsing is bevestigd. Wijzigingen zijn handmatig.
          </div>
        )}

        {/* Step 1 — Form */}
        {step === 'form' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Signatuur</label>
              <input
                type="text"
                value={signatuur}
                onChange={(e) => setSignatuur(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="bijv. Icones 67"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Collectie</label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {COLLECTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hoogte (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Breedte (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Diepte (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {/* Step 2 — Rack suggestions */}
        {step === 'rack' && (
          <div className="p-5 space-y-4">
            {forceRack && forceResult ? (
              <ReorganisationPanel
                targetRackName={forceRack}
                paintingSignatuur={signatuur}
                result={forceResult}
                onConfirm={() => handleSave(forceRack)}
                onCancel={() => { setForceRack(null); setForceResult(null); }}
              />
            ) : (
              <>
                {loadingSuggest ? (
                  <p className="text-sm text-gray-500 py-4 text-center">Rekken laden…</p>
                ) : (
                  <RackSuggestions
                    suggestions={suggestions}
                    selectedRack={selectedRack}
                    onSelect={setSelectedRack}
                    onForcePlacement={handleForcePlacement}
                  />
                )}
              </>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2">
          {step === 'form' ? (
            <>
              <button
                type="button"
                onClick={() => handleSave(null)}
                disabled={!signatuur || saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Opslaan zonder rek
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!signatuur || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {dimensionsFilled ? 'Volgende: Rek kiezen →' : 'Opslaan'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Terug
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(null)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Geen rek
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(selectedRack)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {saving ? 'Opslaan…' : 'Schilderij opslaan'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
