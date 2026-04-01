import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { RackType, Rack, AssignmentResult } from './types';
import { parsePaintingsCsv } from './utils/parsePaintingsCsv';
import { parseRackTypesCsv } from './utils/parseRackTypesCsv';
import { parseRacksCsv } from './utils/parseRacksCsv';
import { assignPaintingsToRacks } from './utils/assignPaintingsToRacks';
import { useAssignment } from './hooks/useAssignment';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RackDetail } from './components/RackDetail';
import { PaintingsList } from './components/PaintingsList';
import { SCALE } from './constants';

type View =
  | { kind: 'dashboard' }
  | { kind: 'detail'; rackIndex: number };

type Tab = 'racks' | 'paintings';

export default function App() {
  const [localAssignment, setLocalAssignment] = useState<AssignmentResult | null>(null);

  // SWR-backed assignment (from API)
  const { assignment: apiAssignment, isLoading: apiLoading, isConfirmed, confirmAssignment } = useAssignment();

  // Keep a ref to the latest rack types so handlers can access without stale closures
  const rackTypesRef = useRef<RackType[]>([]);

  const [paintingsFileName, setPaintingsFileName] = useState<string | null>(null);
  const [rackTypesFileName, setRackTypesFileName] = useState<string | null>(null);
  const [racksFileName, setRacksFileName] = useState<string | null>(null);

  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [zoom, setZoom] = useState<number>(SCALE);
  const [activeTab, setActiveTab] = useState<Tab>('racks');

  // Effective assignment: prefer API assignment (persistent), fall back to local (CSV-derived)
  const assignmentResult: AssignmentResult | null = apiAssignment ?? localAssignment;

  // Load demo data on mount (only if API has no data yet)
  useEffect(() => {
    if (apiLoading) return;    // wait for API check
    if (apiAssignment) return; // API has data — don't load CSV

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
        setPaintingsFileName('demo-paintings.csv');
        setRackTypesFileName('demo-rack-types.csv');
        setRacksFileName('demo-racks.csv');
      })
      .catch(() => {
        // Demo files not available — show empty state
      });
  }, [apiLoading, apiAssignment]);

  // Re-run assignment when CSV-loaded paintings/racks change — but ONLY if not confirmed
  const handlePaintingsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (isConfirmed) return; // don't re-run if confirmed
    const file = e.target.files?.[0];
    if (!file) return;
    setPaintingsFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      const newPaintings = parsePaintingsCsv(text);
      // Update local assignment using current racks
      setLocalAssignment((prev) => {
        if (!prev) return null;
        // Rebuild from scratch
        const racks: Rack[] = prev.racks.map((r) => ({ ...r, paintings: [] }));
        return assignPaintingsToRacks(newPaintings, racks);
      });
    };
    reader.readAsText(file);
  }, [isConfirmed]);

  const handleRackTypesChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRackTypesFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      const newRackTypes = parseRackTypesCsv(text);
      rackTypesRef.current = newRackTypes;
      setLocalAssignment((prev) => {
        if (!prev) return prev;
        const typeMap = new Map<number, RackType>(newRackTypes.map((rt) => [rt.id, rt]));
        return {
          ...prev,
          racks: prev.racks.map((r) => ({
            ...r,
            rackType: typeMap.get(r.rackType.id) ?? r.rackType,
          })),
        };
      });
    };
    reader.readAsText(file);
  }, []);

  const handleRacksChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (isConfirmed) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setRacksFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      const newRacks = parseRacksCsv(text, rackTypesRef.current);
      setLocalAssignment((prev) => {
        const paintings = prev
          ? [...prev.racks.flatMap((r) => r.paintings), ...prev.unassigned]
          : [];
        return assignPaintingsToRacks(paintings, newRacks);
      });
    };
    reader.readAsText(file);
  }, [isConfirmed]);

  const currentRackIndex = view.kind === 'detail' ? view.rackIndex : 0;

  function goToRack(index: number) {
    setView({ kind: 'detail', rackIndex: index });
  }

  function handleSwitchToPaintingsTab() {
    setActiveTab('paintings');
    setView({ kind: 'dashboard' });
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header
        assignmentResult={assignmentResult}
        paintingsFileName={paintingsFileName}
        rackTypesFileName={rackTypesFileName}
        racksFileName={racksFileName}
        isConfirmed={isConfirmed}
        onPaintingsChange={handlePaintingsChange}
        onRackTypesChange={handleRackTypesChange}
        onRacksChange={handleRacksChange}
        onConfirm={confirmAssignment}
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
            <PaintingsList assignmentResult={assignmentResult} isConfirmed={isConfirmed} />
          ) : view.kind === 'dashboard' ? (
            <Dashboard
              assignmentResult={assignmentResult}
              onSelectRack={goToRack}
              onSwitchToPaintings={handleSwitchToPaintingsTab}
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
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}
