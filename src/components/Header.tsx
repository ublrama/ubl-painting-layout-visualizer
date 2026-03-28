import React from 'react';
import { Wall } from '../types';

interface HeaderProps {
  walls: Wall[];
  filename: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Header({ walls, filename, onFileUpload }: HeaderProps) {
  const totalPaintings = walls.reduce((sum, w) => sum + w.paintings.length, 0);

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: App title */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">
              Schilderijen Planner
            </h1>
            <p className="text-xs text-gray-400 leading-none">Museum Indeling Visualizer</p>
          </div>
        </div>

        {/* Center: stat badges */}
        {walls.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-amber-400 border border-gray-700">
              🧱 {walls.length} muren
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-amber-400 border border-gray-700">
              🖼️ {totalPaintings} schilderijen
            </span>
          </div>
        )}

        {/* Right: Upload CSV */}
        <div className="flex items-center gap-3">
          {filename && (
            <span className="text-xs text-gray-400 truncate max-w-[180px]" title={filename}>
              {filename}
            </span>
          )}
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            CSV uploaden
            <input type="file" accept=".csv" onChange={onFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </header>
  );
}
