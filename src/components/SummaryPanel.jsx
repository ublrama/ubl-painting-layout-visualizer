/**
 * Summary panel showing overall statistics.
 *
 * Props:
 *   walls: Array of walls (each wall = array of placed paintings)
 */
export default function SummaryPanel({ walls }) {
  if (!walls || walls.length === 0) return null;

  const totalPaintings = walls.reduce((sum, w) => sum + w.length, 0);

  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '12px 20px',
        marginBottom: 24,
        fontSize: 14,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
        Samenvatting
      </h3>
      <p style={{ margin: '2px 0' }}>
        <strong>Muren gebruikt:</strong> {walls.length}
      </p>
      <p style={{ margin: '2px 0' }}>
        <strong>Totaal schilderijen:</strong> {totalPaintings}
      </p>
      <p style={{ margin: '6px 0 2px', fontWeight: 600 }}>Schilderijen per muur:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {walls.map((w, i) => (
          <li key={i}>
            Muur {i + 1}: {w.length} schilderijen
          </li>
        ))}
      </ul>
    </div>
  );
}
