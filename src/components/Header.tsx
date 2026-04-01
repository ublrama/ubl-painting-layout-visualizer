import type { AssignmentResult } from '../types';
import { useAuthContext } from '../contexts/AuthContext';

interface HeaderProps {
  assignmentResult: AssignmentResult | null;
  isConfirmed?: boolean;
  onConfirm?: () => Promise<void>;
  onDatabaseManage: () => void;
}

export function Header({
  assignmentResult,
  isConfirmed,
  onConfirm,
  onDatabaseManage,
}: HeaderProps) {
  const { user, signOut } = useAuthContext();
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

      {/* Right: Confirmation + Database button */}
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

        {user && (
          <>
            <button
              type="button"
              onClick={onDatabaseManage}
              title="Database beheer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#002580] hover:bg-[#001158] text-white font-semibold text-xs cursor-pointer transition-colors border border-[#003580]"
            >
              🗄️ <span className="hidden sm:inline">Database</span>
            </button>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#002580]">
              <span className="text-xs text-[#8b9db8] hidden sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={() => signOut?.()}
                className="text-xs text-[#8b9db8] hover:text-white px-2 py-1 rounded hover:bg-[#002580] transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
