import { useState, useEffect } from 'react';
import { useAuthFetch } from '../hooks/useAuthFetch';
import type { RackType } from '../types';
import { AddRackTypeModal } from './AddRackTypeModal';

type Tab = 'seed-default' | 'seed-custom' | 'rack-types' | 'clear';
type PanelState = 'idle' | 'loading' | 'success' | 'error';

interface DatabasePanelProps {
  onClose: () => void;
  onSeedComplete: () => void;
}

export function DatabasePanel({ onClose, onSeedComplete }: DatabasePanelProps) {
  const authFetch = useAuthFetch();
  const [tab, setTab] = useState<Tab>('seed-default');
  const [state, setState] = useState<PanelState>('idle');
  const [message, setMessage] = useState('');

  const [paintingsFile, setPaintingsFile] = useState<File | null>(null);
  const [rackTypesFile, setRackTypesFile] = useState<File | null>(null);
  const [racksFile, setRacksFile] = useState<File | null>(null);

  // Rack types state
  const [rackTypes, setRackTypes] = useState<RackType[]>([]);
  const [rtLoading, setRtLoading] = useState(false);
  const [showAddRT, setShowAddRT] = useState(false);
  const [editRT, setEditRT] = useState<RackType | null>(null);

  type DbStatus = 'checking' | 'ok' | 'error' | 'unavailable';
  const [dbStatus, setDbStatus] = useState<DbStatus>('checking');
  const [dbStatusMsg, setDbStatusMsg] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Check Supabase connection on mount
  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setDbStatus('ok');
          setDbStatusMsg(`Verbonden`);
        } else {
          setDbStatus('error');
          setDbStatusMsg(data.error ?? `Fout (${data.stage ?? 'onbekend'})`);
        }
      })
      .catch(() => {
        setDbStatus('unavailable');
        setDbStatusMsg('API niet bereikbaar');
      });
  }, []);

  // Fetch rack types when that tab is shown
  useEffect(() => {
    if (tab === 'rack-types') fetchRackTypes();
  }, [tab]);

  async function fetchRackTypes() {
    setRtLoading(true);
    try {
      const res = await fetch('/api/rack-types');
      if (res.ok) setRackTypes(await res.json());
    } catch { /* ignore */ }
    setRtLoading(false);
  }

  /** Safely parse a response body as JSON; returns {} on empty or non-JSON bodies. */
  async function safeJson(res: Response): Promise<Record<string, unknown>> {
    try { return await res.json(); } catch { return {}; }
  }

  async function handleSeedDefault() {
    setState('loading'); setMessage('');
    try {
      const res = await authFetch('/api/seed', { method: 'POST' });
      const data = await safeJson(res);
      if (res.ok) {
        setMessage(`✓ ${data.paintingCount} schilderijen en ${data.rackCount} rekken geladen`);
        setState('success');
        setTimeout(() => { onSeedComplete(); onClose(); }, 1500);
      } else {
        setMessage(`Fout: ${(data.error ?? data.detail ?? (res.status === 404 ? 'API niet beschikbaar (gebruik vercel dev)' : 'Onbekende fout')) as string}`);
        setState('error');
      }
    } catch (e) { setMessage(`Fout: ${String(e)}`); setState('error'); }
  }

  async function handleSeedCustom() {
    if (!paintingsFile) { setMessage('Selecteer minimaal een schilderijen CSV'); setState('error'); return; }
    setState('loading'); setMessage('');
    try {
      const formData = new FormData();
      formData.append('paintings', paintingsFile);
      if (rackTypesFile) formData.append('rackTypes', rackTypesFile);
      if (racksFile) formData.append('racks', racksFile);
      const res = await authFetch('/api/seed', { method: 'POST', body: formData });
      const data = await safeJson(res);
      if (res.ok) {
        setMessage(`✓ ${data.paintingCount} schilderijen en ${data.rackCount} rekken geladen`);
        setState('success');
        setTimeout(() => { onSeedComplete(); onClose(); }, 1500);
      } else {
        setMessage(`Fout: ${(data.error ?? data.detail ?? 'Onbekende fout') as string}`);
        setState('error');
      }
    } catch (e) { setMessage(`Fout: ${String(e)}`); setState('error'); }
  }

  async function handleClearAll() {
    setState('loading'); setMessage('');
    try {
      const res = await authFetch('/api/clear-all', { method: 'POST' });
      if (res.ok) {
        setMessage('✓ Alle data gewist');
        setState('success');
        setTimeout(() => { onSeedComplete(); onClose(); }, 1500);
      } else {
        const data = await res.json();
        setMessage(`Fout: ${data.error ?? 'Onbekende fout'}`); setState('error');
      }
    } catch (e) { setMessage(`Fout: ${String(e)}`); setState('error'); }
  }

  async function handleSaveRackType(rt: RackType) {
    const res = await authFetch('/api/rack-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rt),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Fout'); }
    setShowAddRT(false);
    setEditRT(null);
    await fetchRackTypes();
  }

  async function handleDeleteRackType(id: number) {
    if (!confirm(`Rektype ${id} verwijderen?`)) return;
    const res = await authFetch(`/api/rack-types?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error ?? 'Kan niet verwijderen');
      return;
    }
    await fetchRackTypes();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'seed-default', label: 'Start data' },
    { key: 'seed-custom',  label: 'Eigen CSV' },
    { key: 'rack-types',   label: 'Rektypen' },
    { key: 'export',       label: '📥 Exporteer' },
    { key: 'clear',        label: '🗑️ Wissen' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">🗄️ Database beheer</h3>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              dbStatus === 'ok'          ? 'bg-green-100 text-green-700' :
              dbStatus === 'checking'    ? 'bg-gray-100 text-gray-500' :
              dbStatus === 'unavailable' ? 'bg-yellow-100 text-yellow-700' :
                                           'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === 'ok'          ? 'bg-green-500' :
                dbStatus === 'checking'    ? 'bg-gray-400 animate-pulse' :
                dbStatus === 'unavailable' ? 'bg-yellow-500' :
                                             'bg-red-500'
              }`} />
              {dbStatus === 'checking' ? 'Verbinden…' : dbStatusMsg}
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 pb-0 shrink-0 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => { setTab(t.key); setState('idle'); setMessage(''); }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                tab === t.key ? 'bg-[#0a2060] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Seed default */}
          {tab === 'seed-default' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">Laad de ingebouwde demo-dataset. Dit overschrijft alle huidige data.</p>
              <button type="button" onClick={handleSeedDefault} disabled={state === 'loading'}
                className="w-full py-2 px-4 rounded-lg bg-[#0a2060] hover:bg-[#001158] text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {state === 'loading' ? 'Bezig…' : 'Start data laden'}
              </button>
            </div>
          )}

          {/* Seed custom */}
          {tab === 'seed-custom' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Upload eigen CSV-bestanden. Alleen schilderijen is verplicht.</p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Schilderijen CSV <span className="text-red-500">*</span></label>
                <input type="file" accept=".csv" onChange={(e) => setPaintingsFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rektypen CSV <span className="text-gray-400">(optioneel)</span></label>
                <input type="file" accept=".csv" onChange={(e) => setRackTypesFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rekken CSV <span className="text-gray-400">(optioneel)</span></label>
                <input type="file" accept=".csv" onChange={(e) => setRacksFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
              </div>
              <button type="button" onClick={handleSeedCustom} disabled={state === 'loading'}
                className="w-full py-2 px-4 rounded-lg bg-[#0a2060] hover:bg-[#001158] text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {state === 'loading' ? 'Bezig…' : 'Bestanden laden'}
              </button>
            </div>
          )}

          {/* Rack types management */}
          {tab === 'rack-types' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Rektypen beheren</p>
                <button type="button" onClick={() => setShowAddRT(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800">+ Rektype toevoegen</button>
              </div>
              {rtLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">Laden…</p>
              ) : rackTypes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Geen rektypen gevonden.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="px-2 py-1.5 text-left">ID</th>
                        <th className="px-2 py-1.5 text-left">H</th>
                        <th className="px-2 py-1.5 text-left">B</th>
                        <th className="px-2 py-1.5 text-left">D</th>
                        <th className="px-2 py-1.5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rackTypes.map((rt) => (
                        <tr key={rt.id} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 font-medium">{rt.id}</td>
                          <td className="px-2 py-1.5">{rt.height}</td>
                          <td className="px-2 py-1.5">{rt.width}</td>
                          <td className="px-2 py-1.5">{rt.maxDepth}</td>
                          <td className="px-2 py-1.5 text-right space-x-2">
                            <button type="button" onClick={() => setEditRT(rt)} className="text-blue-600 hover:underline">✏️</button>
                            <button type="button" onClick={() => handleDeleteRackType(rt.id)} className="text-red-600 hover:underline">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Export */}
          {tab === 'export' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-blue-900">📥 Exporteer huidige toewijzing</h4>
                <p className="text-sm text-blue-800">
                  Downloadt drie CSV-bestanden die de <strong>huidige staat</strong> vastleggen:
                  de schilderijentoewijzingen, alle rekken en de rektypen.
                </p>
                <p className="text-sm text-blue-800">
                  De kolom <strong>Rek</strong> in de schilderijen-CSV bevat de huidige rektoewijzing
                  per schilderij. Je kunt deze drie bestanden daarna opnieuw importeren via
                  het tabblad <em>Eigen CSV</em> om de toewijzingen te herstellen — zonder
                  dat je de originele startdata overschrijft.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-800">
                  <strong>Let op:</strong> bij herinstallatie worden de posities op een rek
                  herberekend door het plaatsingsalgoritme, maar alle rektoewijzingen blijven
                  intact.
                </p>
              </div>

              {exportError && (
                <div className="rounded-lg px-3 py-2 text-sm bg-red-50 border border-red-200 text-red-800">
                  {exportError}
                </div>
              )}

              <button
                type="button"
                onClick={handleExport}
                disabled={exportLoading}
                className="w-full py-2 px-4 rounded-lg bg-[#0a2060] hover:bg-[#001158] text-white font-semibold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {exportLoading ? '⏳ Bezig met exporteren…' : '📥 Download CSV-pakket (3 bestanden)'}
              </button>
            </div>
          )}

          {/* Clear all */}
          {tab === 'clear' && (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-red-800 mb-1">⚠️ Alle data wissen</h4>
                <p className="text-sm text-red-700">
                  Dit verwijdert alle schilderijen, rekken, rektypen en de huidige toewijzing. Deze actie kan niet ongedaan worden gemaakt.
                </p>
              </div>
              <button type="button" onClick={handleClearAll} disabled={state === 'loading'}
                className="w-full py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {state === 'loading' ? 'Bezig…' : 'Alle data wissen'}
              </button>
            </div>
          )}

          {/* Status message */}
          {message && (
            <div className={`rounded-lg px-3 py-2 text-sm ${
              state === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
            }`}>{message}</div>
          )}
        </div>
      </div>

      {/* Rack type add/edit modals */}
      {showAddRT && (
        <AddRackTypeModal onSave={handleSaveRackType} onCancel={() => setShowAddRT(false)} />
      )}
      {editRT && (
        <AddRackTypeModal existing={editRT} onSave={handleSaveRackType} onCancel={() => setEditRT(null)} />
      )}
    </div>
  );
}