import { useState, useEffect } from 'react';
import { parseCsv } from './utils/parseCsv.js';
import { packPaintings } from './utils/packPaintings.js';
import { SCALE } from './constants.js';
import WallView from './components/WallView.jsx';
import WallNavigator from './components/WallNavigator.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import Legend from './components/Legend.jsx';

export default function App() {
  const [walls, setWalls] = useState([]);
  const [currentWall, setCurrentWall] = useState(0);
  const [scale, setScale] = useState(SCALE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setLoading(true);
    parseCsv(file)
      .then((paintings) => {
        if (paintings.length === 0) {
          setError('Geen geldige schilderijen gevonden in het CSV-bestand.');
          setLoading(false);
          return;
        }
        setWalls(packPaintings(paintings));
        setCurrentWall(0);
        setLoading(false);
      })
      .catch(() => {
        setError('Fout bij het verwerken van het CSV-bestand.');
        setLoading(false);
      });
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Schilderijen Layout Visualizer
      </h1>
      <p style={{ color: '#555', marginTop: 0, marginBottom: 24 }}>
        Upload een CSV-bestand met schilderijgegevens om de optimale indeling op muren te zien.
      </p>

      {/* CSV Upload */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, fontSize: 14 }}>
          CSV-bestand uploaden (puntkomma-gescheiden, kolommen: signatuur; afmetingen):
        </label>
        <br />
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ marginTop: 8 }}
        />
      </div>

      {/* Zoom control */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontWeight: 600, fontSize: 14 }}>
          Zoom ({scale} px/cm):
        </label>
        <input
          type="range"
          min={1}
          max={4}
          step={0.5}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          style={{ width: 160 }}
        />
      </div>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontWeight: 500 }}>{error}</div>
      )}

      {loading && <p>Laden…</p>}

      {!loading && walls.length > 0 && (
        <>
          <Legend />
          <SummaryPanel walls={walls} />
          <WallNavigator
            currentIndex={currentWall}
            total={walls.length}
            onPrev={() => setCurrentWall((i) => Math.max(0, i - 1))}
            onNext={() => setCurrentWall((i) => Math.min(walls.length - 1, i + 1))}
          />
          <div style={{ overflowX: 'auto' }}>
            <WallView
              wallIndex={currentWall}
              paintings={walls[currentWall]}
              scale={scale}
            />
          </div>
          <WallNavigator
            currentIndex={currentWall}
            total={walls.length}
            onPrev={() => setCurrentWall((i) => Math.max(0, i - 1))}
            onNext={() => setCurrentWall((i) => Math.min(walls.length - 1, i + 1))}
          />
        </>
      )}
    </div>
  );
}
