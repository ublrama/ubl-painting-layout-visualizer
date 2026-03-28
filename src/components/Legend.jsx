import { COLORS } from '../constants.js';

const LEGEND_ENTRIES = [
  { label: 'BWB', color: COLORS.BWB },
  { label: 'AHM', color: COLORS.AHM },
  { label: 'Bild. Mus. Geerts', color: COLORS['Bild. Mus. Geerts'] },
  { label: 'Icones', color: COLORS.Icones },
  { label: 'Overig', color: COLORS.Unknown },
];

/**
 * Color legend per collection.
 */
export default function Legend() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px 24px',
        marginBottom: 24,
        fontSize: 13,
      }}
    >
      {LEGEND_ENTRIES.map(({ label, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 3,
              backgroundColor: color,
              border: '1px solid rgba(0,0,0,0.2)',
              flexShrink: 0,
            }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
