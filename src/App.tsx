import { useState, useEffect, useRef } from 'react';
import type { RackType, Painting, AssignmentResult } from './types';
import { parsePaintingsCsv } from './utils/parsePaintingsCsv';
import { parseRackTypesCsv } from './utils/parseRackTypesCsv';
import { parseRacksCsv } from './utils/parseRacksCsv';
import { assignPaintingsToRacks } from './utils/assignPaintingsToRacks';
import { useAssignment } from './hooks/useAssignment';
import { useAuthFetch } from './hooks/useAuthFetch';
import { AuthGuard } from './components/AuthGuard';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RackDetail } from './components/RackDetail';
import { PaintingsList } from './components/PaintingsList';
import { AddPaintingModal } from './components/AddPaintingModal';
import { DatabasePanel } from './components/DatabasePanel';
import { SCALE } from './constants';

type View =
  | { kind: 'dashboard' }
  | { kind: 'detail'; rackIndex: number };

type Tab = 'racks' | 'paintings';

export default function App() {
  const [localAssignment, setLocalAssignment] = useState<AssignmentResult | null>(null);
  const authFetch = useAuthFetch();

  // SWR-backed assignment (from API)
  const { assignment: apiAssignment, isLoading: apiLoading, isConfirmed, confirmAssignment, mutate } = useAssignment();

  // Keep a ref to the latest rack types so handlers can access without stale closures
  const rackTypesRef = useRef<RackType[]>([]);

  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [showAddPaintingForRack, setShowAddPaintingForRack] = useState<string | null>(null);

  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [zoom, setZoom] = useState<number>(SCALE);
  const [activeTab, setActiveTab] = useState<Tab>('racks');

  // Effective assignment: prefer API assignment (persistent), fall back to local (CSV-derived)
  const assignmentResult: AssignmentResult | null = apiAssignment ?? localAssignment;

  // Load demo data on mount (only if API has no data yet)
  useEffect(() => {
    if (apiLoading) return;
    if (apiAssignment) return;

    Promise.all([
      fetch('/demo-paintings.csv').then((r) => r.text()),
      fetch('/demo-rack-types.csv').then((r) => r.text()),
      fetch('/demo-racks.csv').then((r) => r.text()),
    ])
      .then(([paintingsText, rackTypesText, racksText]) => {
        const demoPaintings = parsePaintingsCsv(paintingsText);
        const demoRackTypes = parseRackTypesCsv(rackTypesText);
        const demoRacks     = parseRacksCsv(racksText, demoRackTypes);
        rackTypesRef.current = demoRackTypes;
        const result = assignPaintingsToRacks(demoPaintings, demoRacks);
        setLocalAssignment(result);
      })
      .catch(() => {});
  }, [apiLoading, apiAssignment]);

  const currentRackIndex = view.kind === 'detail' ? view.rackIndex : 0;

  function goToRack(index: number) {
    setView({ kind: 'detail', rackIndex: index });
  }

  // ── Painting handlers ────────────────────────────────────────────────────

  async function handleAddPainting(data: Omit<Painting, 'id' | 'manuallyPlaced'>) {
    // Try API first
    try {
      const res = await authFetch('/api/paintings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { await mutate(); return; }
    } catch { /* fall through to local */ }

    // Local fallback
    const newPainting: Painting = { ...data, id: `manual-${Date.now()}`, manuallyPlaced: false };
    setLocalAssignment((prev) => {
      if (!prev) return prev;
      const allPaintings: Painting[] = [
        ...prev.racks.flatMap((r) => r.paintings),
        ...prev.unassigned,
        newPainting,
      ];
      const emptyRacks = prev.racks.map((r) => ({ ...r, paintings: [] }));
      return assignPaintingsToRacks(allPaintings, emptyRacks);
    });
  }

  async function handleDeletePainting(paintingId: string) {
    try {
      const res = await authFetch(`/api/paintings/${paintingId}`, { method: 'DELETE' });
      if (res.ok) { await mutate(); return; }
    } catch { /* fall through */ }

    setLocalAssignment((prev) => {
      if (!prev) return prev;
      const allPaintings: Painting[] = [
        ...prev.racks.flatMap((r) => r.paintings),
        ...prev.unassigned,
      ].filter((p) => p.id !== paintingId);
      const emptyRacks = prev.racks.map((r) => ({ ...r, paintings: [] }));
      return assignPaintingsToRacks(allPaintings, emptyRacks);
    });
  }

  async function handleUnassignPainting(paintingId: string) {
    try {
      const res = await authFetch(`/api/paintings/${paintingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedRackName: null }),
      });
      if (res.ok) { await mutate(); return; }
    } catch { /* fall through */ }

    setLocalAssignment((prev) => {
      if (!prev) return prev;
      const allPaintings: Painting[] = [
        ...prev.racks.flatMap((r) => r.paintings),
        ...prev.unassigned,
      ];
      const painting = allPaintings.find((p) => p.id === paintingId);
      if (painting) painting.assignedRackName = null;
      const emptyRacks = prev.racks.map((r) => ({ ...r, paintings: [] }));
      return assignPaintingsToRacks(allPaintings, emptyRacks);
    });
  }

  async function handleAssignPainting(paintingId: string, rackName: string) {
    try {
      const res = await authFetch(`/api/paintings/${paintingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedRackName: rackName }),
      });
      if (res.ok) { await mutate(); return; }
    } catch { /* fall through */ }

    setLocalAssignment((prev) => {
      if (!prev) return prev;
      const allPaintings: Painting[] = [
        ...prev.racks.flatMap((r) => r.paintings),
        ...prev.unassigned,
      ];
      const painting = allPaintings.find((p) => p.id === paintingId);
      if (painting) painting.assignedRackName = rackName;
      const emptyRacks = prev.racks.map((r) => ({ ...r, paintings: [] }));
      return assignPaintingsToRacks(allPaintings, emptyRacks);
    });
  }

  // ── Rack handlers ────────────────────────────────────────────────────────

  async function handleAddRack(name: string, rackTypeId: number) {
    try {
      const res = await authFetch('/api/racks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rackTypeId }),
      });
      if (res.ok) { await mutate(); return; }
      // API responded with an error — surface it, don't fall through to local
      const data = await res.json();
      throw new Error(data.error ?? 'Fout bij toevoegen rek');
    } catch (e) {
      // Only fall through to local on network errors (TypeError from fetch)
      if (e instanceof TypeError) {
        const rt = rackTypesRef.current.find((t) => t.id === rackTypeId);
        if (!rt) throw new Error('Rektype niet gevonden');
        setLocalAssignment((prev) => {
          if (!prev) return prev;
          const newRack = { name, rackType: rt, paintings: [] as any[] };
          return { ...prev, racks: [...prev.racks, newRack] };
        });
        return;
      }
      throw e; // re-throw API errors so the modal can display them
    }
  }

  async function handleDeleteRack(rackName: string) {
    try {
      const res = await authFetch(`/api/racks?name=${encodeURIComponent(rackName)}`, { method: 'DELETE' });
      if (res.ok) { await mutate(); return; }
    } catch { /* fall through */ }

    setLocalAssignment((prev) => {
      if (!prev) return prev;
      const rack = prev.racks.find((r) => r.name === rackName);
      const displaced = rack ? [...rack.paintings] : [];
      const remaining = prev.racks.filter((r) => r.name !== rackName);
      return {
        ...prev,
        racks: remaining,
        unassigned: [...prev.unassigned, ...displaced],
      };
    });
  }

  // ── Confirm ──────────────────────────────────────────────────────────────

  async function handleConfirm() {
    await confirmAssignment();
    const now = new Date().toISOString();
    setLocalAssignment((prev) => prev ? { ...prev, confirmedAt: now } : prev);
  }

  function handleSwitchToPaintingsTab() {
    setActiveTab('paintings');
    setView({ kind: 'dashboard' });
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header
        assignmentResult={assignmentResult}
        isConfirmed={isConfirmed}
        onConfirm={handleConfirm}
        onDatabaseManage={() => setShowDatabasePanel(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          assignmentResult={assignmentResult}
          zoom={zoom}
          onZoomChange={setZoom}
          showZoom={view.kind === 'detail'}
          onSwitchToPaintings={handleSwitchToPaintingsTab}
        />

        <main className="flex-1 overflow-auto p-6">
          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('racks')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'racks'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🗄️ Rekken
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paintings')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'paintings'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🖼️ Schilderijen
            </button>
          </div>

          {activeTab === 'paintings' ? (
            <PaintingsList
              assignmentResult={assignmentResult}
              isConfirmed={isConfirmed}
              onAddPainting={handleAddPainting}
              onSelectRack={(index) => {
                setActiveTab('racks');
                goToRack(index);
              }}
              onUnassignPainting={handleUnassignPainting}
              onAssignPainting={handleAssignPainting}
              onDeletePainting={handleDeletePainting}
            />
          ) : view.kind === 'dashboard' ? (
            <Dashboard
              assignmentResult={assignmentResult}
              onSelectRack={goToRack}
              onSwitchToPaintings={handleSwitchToPaintingsTab}
              onAddRack={handleAddRack}
              onDeleteRack={handleDeleteRack}
            />
          ) : (
            assignmentResult && assignmentResult.racks.length > 0 && (
              <RackDetail
                rack={assignmentResult.racks[currentRackIndex]}
                rackIndex={currentRackIndex}
                totalRacks={assignmentResult.racks.length}
                zoom={zoom}
                isConfirmed={isConfirmed}
                onBack={() => setView({ kind: 'dashboard' })}
                onPrev={() => goToRack(Math.max(0, currentRackIndex - 1))}
                onNext={() =>
                  goToRack(
                    Math.min(assignmentResult.racks.length - 1, currentRackIndex + 1),
                  )
                }
                onUnassignPainting={handleUnassignPainting}
                onAddPaintingToRack={() =>
                  setShowAddPaintingForRack(assignmentResult.racks[currentRackIndex].name)
                }
              />
            )
          )}
        </main>
      </div>

      {showDatabasePanel && (
        <DatabasePanel
          onClose={() => setShowDatabasePanel(false)}
          onSeedComplete={() => { setLocalAssignment(null); void mutate(); }}
        />
      )}

      {showAddPaintingForRack && (
        <AddPaintingModal
          initialRackName={showAddPaintingForRack}
          isConfirmed={isConfirmed}
          onSave={async (data) => {
            await handleAddPainting(data);
            setShowAddPaintingForRack(null);
          }}
          onCancel={() => setShowAddPaintingForRack(null)}
        />
      )}
    </div>
    </AuthGuard>
  );
}
