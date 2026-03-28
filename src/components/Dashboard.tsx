import { Wall } from '../types';
import WallCard from './WallCard';

interface DashboardProps {
  walls: Wall[];
  onSelectWall: (index: number) => void;
}

export default function Dashboard({ walls, onSelectWall }: DashboardProps) {
  if (walls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <div className="text-6xl mb-6">🏛️</div>
        <h2 className="text-xl font-semibold text-white mb-2">Geen data geladen</h2>
        <p className="text-gray-400 max-w-sm">
          Upload een CSV-bestand met schilderijgegevens om de optimale indeling op muren te zien.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Overzicht muren</h2>
        <p className="text-sm text-gray-400 mt-1">
          {walls.length} muren met in totaal{' '}
          {walls.reduce((sum, w) => sum + w.paintings.length, 0)} schilderijen
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {walls.map((wall) => (
          <WallCard
            key={wall.index}
            wall={wall}
            onViewDetail={() => onSelectWall(wall.index)}
          />
        ))}
      </div>
    </div>
  );
}
