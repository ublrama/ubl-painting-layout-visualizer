/**
 * Navigation controls to move between walls.
 *
 * Props:
 *   currentIndex: number (0-based)
 *   total: number
 *   onPrev: () => void
 *   onNext: () => void
 */
export default function WallNavigator({ currentIndex, total, onPrev, onNext }) {
  if (total === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        style={btnStyle(currentIndex === 0)}
      >
        ← Vorige
      </button>

      <span style={{ fontSize: 15, fontWeight: 500 }}>
        Muur {currentIndex + 1} / {total}
      </span>

      <button
        onClick={onNext}
        disabled={currentIndex === total - 1}
        style={btnStyle(currentIndex === total - 1)}
      >
        Volgende →
      </button>
    </div>
  );
}

function btnStyle(disabled) {
  return {
    padding: '6px 16px',
    borderRadius: 6,
    border: '1px solid #ccc',
    backgroundColor: disabled ? '#e5e7eb' : '#3b82f6',
    color: disabled ? '#9ca3af' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    fontSize: 14,
  };
}
