import { COLLECTION_COLORS } from '../constants';

const LEGEND_ENTRIES = [
  { label: 'BWB', color: COLLECTION_COLORS.BWB },
  { label: 'AHM', color: COLLECTION_COLORS.AHM },
  { label: 'Bild. Mus. Geerts', color: COLLECTION_COLORS['Bild. Mus. Geerts'] },
  { label: 'Icones', color: COLLECTION_COLORS.Icones },
  { label: 'Overig', color: COLLECTION_COLORS.Unknown },
];

export default function Legend() {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Collectie
      </h3>
      <div className="space-y-2">
        {LEGEND_ENTRIES.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0 border border-white/10"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
