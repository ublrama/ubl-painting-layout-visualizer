import { useState, useCallback, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import type { Wall } from './types';
import { parseCsv } from './utils/parseCsv';
import { packPaintings } from './utils/packPaintings';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WallDetail } from './components/WallDetail';
import { SCALE } from './constants';

type View =
  | { kind: 'dashboard' }
  | { kind: 'detail'; wallIndex: number };

export default function App() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [zoom, setZoom] = useState<number>(SCALE);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      const paintings = parseCsv(text);
      const packed = packPaintings(paintings);
      setWalls(packed);
      setView({ kind: 'dashboard' });
    };
    reader.readAsText(file);
  }, []);

  // Load demo CSV on mount
  useEffect(() => {
    fetch('/demo.csv')
      .then((r) => r.text())
      .then((text) => {
        const paintings = parseCsv(text);
        const packed = packPaintings(paintings);
        setWalls(packed);
        setFileName('demo.csv');
      })
      .catch(() => {
        // demo.csv not available – just show empty state
      });
  }, []);

  const currentWallIndex = view.kind === 'detail' ? view.wallIndex : 0;

  function goToWall(index: number) {
    setView({ kind: 'detail', wallIndex: index });
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans flex flex-col">
      <Header walls={walls} fileName={fileName} onFileChange={handleFileChange} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          walls={walls}
          zoom={zoom}
          onZoomChange={setZoom}
          showZoom={view.kind === 'detail'}
        />

        <main className="flex-1 overflow-auto p-6">
          {view.kind === 'dashboard' ? (
            <Dashboard walls={walls} onSelectWall={goToWall} />
          ) : (
            walls.length > 0 && (
              <WallDetail
                wall={walls[currentWallIndex]}
                totalWalls={walls.length}
                zoom={zoom}
                onBack={() => setView({ kind: 'dashboard' })}
                onPrev={() =>
                  goToWall(Math.max(0, currentWallIndex - 1))
                }
                onNext={() =>
                  goToWall(Math.min(walls.length - 1, currentWallIndex + 1))
                }
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}
