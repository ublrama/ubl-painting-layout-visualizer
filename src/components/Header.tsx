import type { ChangeEvent } from 'react';
import type { Wall } from '../types';

interface HeaderProps {
  walls: Wall[];
  fileName: string | null;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Header({ walls, fileName, onFileChange }: HeaderProps) {
  const totalPaintings = walls.reduce((sum, w) => sum + w.paintings.length, 0);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-30">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏛️</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Schilderijen Planner</h1>
          <p className="text-xs text-gray-500 leading-none">Museum Layout Visualizer</p>
        </div>
        {/* Inline stats badges */}
        {walls.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <span className="bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {walls.length} muren
            </span>
            <span className="bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {totalPaintings} schilderijen
            </span>
          </div>
        )}
      </div>

      {/* Right: Upload button */}
      <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold text-sm cursor-pointer transition-colors">
        <span>📂</span>
        <span className="hidden sm:inline">
          {fileName ?? 'Upload CSV'}
        </span>
        <span className="sm:hidden">CSV</span>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileChange}
        />
      </label>
    </header>
  );
}
