import type { AssignmentResult } from '../types';
import { RackCard } from './RackCard';

interface DashboardProps {
  assignmentResult: AssignmentResult | null;
  onSelectRack: (index: number) => void;
}

export function Dashboard({ assignmentResult, onSelectRack }: DashboardProps) {
  if (!assignmentResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24">
        <div className="text-6xl mb-4">🏛️</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Geen data geladen</h2>
        <p className="text-gray-600 max-w-sm">
          Upload de drie CSV-bestanden via de knoppen rechtsboven om de rekindeling te
          visualiseren:
        </p>
        <ul className="mt-3 text-gray-500 text-sm space-y-1">
          <li>📂 <strong>Schilderijen</strong> — lijst met schilderijen</li>
          <li>🗂️ <strong>Rektypen</strong> — afmetingen en diepte per rektype</li>
          <li>📋 <strong>Rekken</strong> — welk rek heeft welk type</li>
        </ul>
      </div>
    );
  }

  const { racks, unassigned } = assignmentResult;

  return (
    <div>
      {/* Unassigned warning */}
      {unassigned.length > 0 && (
        <div className="mb-5 flex items-start gap-3 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 text-sm text-orange-800">
          <span className="text-lg">⚠️</span>
          <span>
            <strong>{unassigned.length}</strong> schilderijen konden niet worden geplaatst
            (diepte te groot of rekken vol)
          </span>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-5">
        Alle rekken
        <span className="ml-2 text-sm font-normal text-gray-600">({racks.length} totaal)</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {racks.map((rack, index) => (
          <RackCard
            key={rack.name}
            rack={rack}
            onSelect={() => onSelectRack(index)}
          />
        ))}
      </div>
    </div>
  );
}
