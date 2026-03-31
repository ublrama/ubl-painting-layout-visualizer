import type { ChangeEvent } from 'react';
import type { AssignmentResult } from '../types';

interface HeaderProps {
  assignmentResult: AssignmentResult | null;
  paintingsFileName: string | null;
  rackTypesFileName: string | null;
  racksFileName: string | null;
  isConfirmed?: boolean;
  onPaintingsChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRackTypesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRacksChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onConfirm?: () => Promise<unknown>;
}

export function Header({
  assignmentResult,
  paintingsFileName,
  rackTypesFileName,
  racksFileName,
  isConfirmed,
  onPaintingsChange,
  onRackTypesChange,
  onRacksChange,
  onConfirm,
}: HeaderProps) {
  const totalPaintings = assignmentResult
    ? assignmentResult.racks.reduce(
        (sum, r) => sum + r.paintings.length,
        0,
      )
    : 0;
  const totalRacks = assignmentResult?.racks.length ?? 0;
  const unassigned = assignmentResult?.unassigned.length ?? 0;

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#0a2060]/90 backdrop-blur border-b border-[#002580] sticky top-0 z-30 flex-wrap gap-3">
      {/* Left: Title + stats */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏛️</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Schilderijen Planner</h1>
          <p className="text-xs text-[#8b9db8] leading-none">Universiteit Leiden — Museum Layout Visualizer</p>
        </div>
        {assignmentResult && (
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <span className="bg-[#002580] border border-[#002580] text-[#8b9db8] text-xs font-medium px-2.5 py-1 rounded-full">
              {totalRacks} rekken
            </span>
            <span className="bg-[#002580] border border-[#002580] text-[#8b9db8] text-xs font-medium px-2.5 py-1 rounded-full">
              {totalPaintings} schilderijen
            </span>
            {unassigned > 0 && (
              <span className="bg-orange-600 border border-orange-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {unassigned} niet geplaatst
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Confirmation + Upload buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Confirmation status */}
        {assignmentResult && (
          isConfirmed ? (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white font-semibold text-xs">
              ✓ Plaatsing bevestigd
              {assignmentResult.confirmedAt && (
                <span className="opacity-75">
                  — {new Date(assignmentResult.confirmedAt).toLocaleDateString('nl-NL')}
                </span>
              )}
            </span>
          ) : (
            onConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs cursor-pointer transition-colors"
              >
                ✓ Bevestig plaatsing
              </button>
            )
          )
        )}

        <UploadButton
          icon="📂"
          label="Schilderijen"
          fileName={paintingsFileName}
          onChange={onPaintingsChange}
        />
        <UploadButton
          icon="🗂️"
          label="Rektypen"
          fileName={rackTypesFileName}
          onChange={onRackTypesChange}
        />
        <UploadButton
          icon="📋"
          label="Rekken"
          fileName={racksFileName}
          onChange={onRacksChange}
        />
      </div>
    </header>
  );
}

interface UploadButtonProps {
  icon: string;
  label: string;
  fileName: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function UploadButton({ icon, label, fileName, onChange }: UploadButtonProps) {
  return (
    <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#be1908] hover:bg-[#d42010] text-white font-semibold text-xs cursor-pointer transition-colors">
      <span>{icon}</span>
      <span className="hidden sm:inline">{fileName ?? label}</span>
      <span className="sm:hidden">{label.slice(0, 3)}</span>
      <input type="file" accept=".csv" className="hidden" onChange={onChange} />
    </label>
  );
}
