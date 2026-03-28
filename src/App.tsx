import { useState, useEffect } from 'react';
import { parseCsv } from './utils/parseCsv';
import { packPaintings } from './utils/packPaintings';
import { SCALE } from './constants';
import { Wall } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WallDetail from './components/WallDetail';

type View = { type: 'dashboard' } | { type: 'detail'; wallIndex: number };

export default function App() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [scale, setScale] = useState<number>(SCALE);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [filename, setFilename] = useState<string>('demo.csv');

  // Load demo CSV on mount
  useEffect(() => {
    fetch('/demo.csv')
      .then((r) => r.text())
      .then((text) => parseCsv(text))
      .then((paintings) => {
        setWalls(packPaintings(paintings));
        setLoading(false);
      })
      .catch(() => {
        setError('Kon demo.csv niet laden.');
        setLoading(false);
      });
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setLoading(true);
    setFilename(file.name);
    parseCsv(file)
      .then((paintings) => {
        if (paintings.length === 0) {
          setError('Geen geldige schilderijen gevonden in het CSV-bestand.');
          setLoading(false);
          return;
        }
        setWalls(packPaintings(paintings));
        setView({ type: 'dashboard' });
        setLoading(false);
      })
      .catch(() => {
        setError('Fout bij het verwerken van het CSV-bestand.');
        setLoading(false);
      });
  }

  const currentWallIndex = view.type === 'detail' ? view.wallIndex : 0;
  const currentWall = walls[currentWallIndex];

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <Header walls={walls} filename={filename} onFileUpload={handleFileUpload} />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          walls={walls}
          scale={scale}
          onScaleChange={setScale}
          showZoom={view.type === 'detail'}
        />

        <main className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl animate-pulse mb-4">🏛️</div>
                <p className="text-gray-400">Laden…</p>
              </div>
            </div>
          ) : view.type === 'dashboard' ? (
            <Dashboard
              walls={walls}
              onSelectWall={(index) => setView({ type: 'detail', wallIndex: index })}
            />
          ) : currentWall ? (
            <WallDetail
              wall={currentWall}
              walls={walls}
              scale={scale}
              onBack={() => setView({ type: 'dashboard' })}
              onNavigate={(index) => setView({ type: 'detail', wallIndex: index })}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
