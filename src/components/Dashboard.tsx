import type { Wall } from '../types';
import { WallCard } from './WallCard';

interface DashboardProps {
  walls: Wall[];
  onSelectWall: (index: number) => void;
}

export function Dashboard({ walls, onSelectWall }: DashboardProps) {
  if (walls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24">
        <div className="text-6xl mb-4">🏛️</div>
        <h2 className="text-2xl font-semibold text-white mb-2">Geen schilderijen geladen</h2>
        <p className="text-gray-400 max-w-sm">
          Upload een CSV-bestand via de knop rechtsboven om de murenindeling te visualiseren.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-5">
        Alle muren
        <span className="ml-2 text-sm font-normal text-gray-400">({walls.length} totaal)</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {walls.map((wall) => (
          <WallCard
            key={wall.index}
            wall={wall}
            onSelect={() => onSelectWall(wall.index)}
          />
        ))}
      </div>
    </div>
  );
}
