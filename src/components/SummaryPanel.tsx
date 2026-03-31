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

  // Space calculation: painting footprint vs total rack face area (front + back)
  const totalRackArea = assignmentResult
    ? assignmentResult.racks.reduce(
        (sum, r) => sum + r.rackType.width * r.rackType.height * 2,
        0,
      )
    : 0;
  const usedArea = assignmentResult
    ? assignmentResult.racks.reduce(
        (sum, r) =>
          sum +
          [...r.frontPaintings, ...r.backPaintings].reduce(
            (a, p) => a + p.width * p.height,
            0,
          ),
        0,
      )
    : 0;
  const spaceLeftPct =
    totalRackArea > 0
      ? Math.round(((totalRackArea - usedArea) / totalRackArea) * 100)
      : 100;
  const spaceUsedPct = 100 - spaceLeftPct;

  const stats = [
    { label: 'Rekken',               value: totalRacks,  icon: '🗂️', danger: false },
    { label: 'Schilderijen geplaatst', value: totalPlaced, icon: '🖼️', danger: false },
    { label: 'Niet geplaatst',        value: unassigned,  icon: '⚠️', danger: unassigned > 0 },
    { label: 'Gem. per rek',          value: avgPerRack,  icon: '📊', danger: false },
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

        {/* Space left block */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <span>📏</span>
              Ruimte over
            </span>
            <span
              className={`text-sm font-semibold ${
                spaceLeftPct <= 20 ? 'text-red-600' : spaceLeftPct <= 50 ? 'text-amber-600' : 'text-green-600'
              }`}
            >
              {spaceLeftPct}%
            </span>
          </div>
          {/* Progress bar: filled = used, empty = left */}
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                spaceLeftPct <= 20 ? 'bg-red-500' : spaceLeftPct <= 50 ? 'bg-amber-400' : 'bg-green-500'
              }`}
              style={{ width: `${spaceUsedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">Gebruikt: {spaceUsedPct}%</span>
            <span className="text-[10px] text-gray-400">Vrij: {spaceLeftPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
