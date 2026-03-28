import type { Wall } from '../types';

interface SummaryPanelProps {
  walls: Wall[];
}

export function SummaryPanel({ walls }: SummaryPanelProps) {
  const totalPaintings = walls.reduce((sum, w) => sum + w.paintings.length, 0);
  const avgPerWall =
    walls.length > 0 ? (totalPaintings / walls.length).toFixed(1) : '0';

  const stats = [
    { label: 'Muren', value: walls.length, icon: '🏛️' },
    { label: 'Schilderijen', value: totalPaintings, icon: '🖼️' },
    { label: 'Gem. per muur', value: avgPerWall, icon: '📊' },
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8b9db8] mb-3">
        Overzicht
      </h3>
      <div className="flex flex-col gap-2">
        {stats.map(({ label, value, icon }) => (
          <div
            key={label}
            className="flex items-center justify-between bg-[#002580]/60 rounded-lg px-3 py-2 border border-[#002580]/50"
          >
            <span className="flex items-center gap-2 text-sm text-[#8b9db8]">
              <span>{icon}</span>
              {label}
            </span>
            <span className="text-sm font-semibold text-[#be1908]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
