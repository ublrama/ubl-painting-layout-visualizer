import type { AssignmentResult } from '../types';

interface SummaryPanelProps {
  assignmentResult: AssignmentResult | null;
}

export function SummaryPanel({ assignmentResult }: SummaryPanelProps) {
  const totalRacks = assignmentResult?.racks.length ?? 0;
  const totalPlaced = assignmentResult
    ? assignmentResult.racks.reduce(
        (sum, r) => sum + r.frontPaintings.length + r.backPaintings.length,
        0,
      )
    : 0;
  const unassigned = assignmentResult?.unassigned.length ?? 0;
  const avgPerRack =
    totalRacks > 0 ? (totalPlaced / totalRacks).toFixed(1) : '0';

  const stats = [
    { label: 'Rekken', value: totalRacks, icon: '🗂️', danger: false },
    { label: 'Schilderijen geplaatst', value: totalPlaced, icon: '🖼️', danger: false },
    { label: 'Niet geplaatst', value: unassigned, icon: '⚠️', danger: unassigned > 0 },
    { label: 'Gem. per rek', value: avgPerRack, icon: '📊', danger: false },
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">
        Overzicht
      </h3>
      <div className="flex flex-col gap-2">
        {stats.map(({ label, value, icon, danger }) => (
          <div
            key={label}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <span>{icon}</span>
              {label}
            </span>
            <span className={`text-sm font-semibold ${danger ? 'text-red-600' : 'text-blue-600'}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
