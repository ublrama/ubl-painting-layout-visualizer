import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Painting, RackType, Rack, AssignmentResult } from './types';
import { parsePaintingsCsv } from './utils/parsePaintingsCsv';
import { parseRackTypesCsv } from './utils/parseRackTypesCsv';
import { parseRacksCsv } from './utils/parseRacksCsv';
import { assignPaintingsToRacks } from './utils/assignPaintingsToRacks';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RackDetail } from './components/RackDetail';
import { SCALE } from './constants';

type View =
  | { kind: 'dashboard' }
  | { kind: 'detail'; rackIndex: number };

export default function App() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);

  // Keep a ref to the latest rack types so handlers can access without stale closures
  const rackTypesRef = useRef<RackType[]>([]);

  const [paintingsFileName, setPaintingsFileName] = useState<string | null>(null);
  const [rackTypesFileName, setRackTypesFileName] = useState<string | null>(null);
  const [racksFileName, setRacksFileName] = useState<string | null>(null);

  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [zoom, setZoom] = useState<number>(SCALE);

  // Re-run assignment whenever paintings or racks change
  useEffect(() => {
    if (paintings.length > 0 && racks.length > 0) {
      const result = assignPaintingsToRacks(paintings, racks);
      setAssignmentResult(result);
      setView({ kind: 'dashboard' });
    }
  }, [paintings, racks]);

  const handlePaintingsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaintingsFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      setPaintings(parsePaintingsCsv(text));
    };
    reader.readAsText(file);
  }, []);

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
      // Re-join existing racks with new rack type definitions
      setRacks((prevRacks) => {
        if (prevRacks.length === 0) return prevRacks;
        const typeMap = new Map<number, RackType>(newRackTypes.map((rt) => [rt.id, rt]));
        return prevRacks.map((r) => ({
          ...r,
          rackType: typeMap.get(r.rackType.id) ?? r.rackType,
        }));
      });
    };
    reader.readAsText(file);
  }, []);

  const handleRacksChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRacksFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      const newRacks = parseRacksCsv(text, rackTypesRef.current);
      setRacks(newRacks);
    };
    reader.readAsText(file);
  }, []);

  // Load demo data on mount
  useEffect(() => {
    Promise.all([
      fetch('/demo-paintings.csv').then((r) => r.text()),
      fetch('/demo-rack-types.csv').then((r) => r.text()),
      fetch('/demo-racks.csv').then((r) => r.text()),
    ])
      .then(([paintingsText, rackTypesText, racksText]) => {
        const demoPaintings = parsePaintingsCsv(paintingsText);
        const demoRackTypes = parseRackTypesCsv(rackTypesText);
        const demoRacks = parseRacksCsv(racksText, demoRackTypes);
        rackTypesRef.current = demoRackTypes;
        setPaintings(demoPaintings);
        setRacks(demoRacks);
        setPaintingsFileName('demo-paintings.csv');
        setRackTypesFileName('demo-rack-types.csv');
        setRacksFileName('demo-racks.csv');
      })
      .catch(() => {
        // Demo files not available – show empty state
      });
  }, []);

  const currentRackIndex = view.kind === 'detail' ? view.rackIndex : 0;

  function goToRack(index: number) {
    setView({ kind: 'detail', rackIndex: index });
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header
        assignmentResult={assignmentResult}
        paintingsFileName={paintingsFileName}
        rackTypesFileName={rackTypesFileName}
        racksFileName={racksFileName}
        onPaintingsChange={handlePaintingsChange}
        onRackTypesChange={handleRackTypesChange}
        onRacksChange={handleRacksChange}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          assignmentResult={assignmentResult}
          zoom={zoom}
          onZoomChange={setZoom}
          showZoom={view.kind === 'detail'}
        />

        <main className="flex-1 overflow-auto p-6">
          {view.kind === 'dashboard' ? (
            <Dashboard
              assignmentResult={assignmentResult}
              onSelectRack={goToRack}
            />
          ) : (
            assignmentResult && assignmentResult.racks.length > 0 && (
              <RackDetail
                rack={assignmentResult.racks[currentRackIndex]}
                rackIndex={currentRackIndex}
                totalRacks={assignmentResult.racks.length}
                zoom={zoom}
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
