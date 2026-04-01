import { useState, useMemo } from 'react';
import type { AssignmentResult, Rack, RackType } from '../types';
import { RackCard } from './RackCard';

type UsageFilter = 'all' | 'used' | 'unused';
type SortDir     = 'asc' | 'desc';

/** Parse "Pos. X-Ya" → sortable tuple (position, side 0=a/1=b, prefix) */
function parseRackPos(name: string) {
  const m = name.match(/^Pos\.\s+(\d+)-(\d+)([ab])$/i);
  if (!m) return { pos: Infinity, side: 0, prefix: 0 };
  return {
    pos:    parseInt(m[2], 10),
    side:   m[3].toLowerCase() === 'a' ? 0 : 1,
    prefix: parseInt(m[1], 10),
  };
}

function compareRacks(a: Rack, b: Rack, dir: SortDir): number {
  const ka = parseRackPos(a.name);
  const kb = parseRackPos(b.name);
  const diff = ka.prefix - kb.prefix || ka.pos - kb.pos || ka.side - kb.side;
  return dir === 'asc' ? diff : -diff;
}

interface DashboardProps {
  assignmentResult: AssignmentResult | null;
  onSelectRack: (index: number) => void;
  onSwitchToPaintings?: () => void;
}

export function Dashboard({ assignmentResult, onSelectRack, onSwitchToPaintings }: DashboardProps) {
  // ── All hooks must be called unconditionally before any early return ──
  const [usageFilter,    setUsageFilter]    = useState<UsageFilter>('used');
  const [sortDir,        setSortDir]        = useState<SortDir>('asc');
  const [typeFilter,     setTypeFilter]     = useState<number | null>(null);
  const [paintingSearch, setPaintingSearch] = useState('');

  const racks      = assignmentResult?.racks     ?? [];
  const unassigned = assignmentResult?.unassigned ?? [];

  // Unique RackType objects (with dimensions), sorted by id
  const rackTypes = useMemo<RackType[]>(() => {
    const seen = new Set<number>();
    const result: RackType[] = [];
    for (const r of racks) {
      if (!seen.has(r.rackType.id)) {
        seen.add(r.rackType.id);
        result.push(r.rackType);
      }
    }
    return result.sort((a, b) => a.id - b.id);
  }, [racks]);

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


  const usedCount   = racks.filter((r) => r.paintings.length > 0).length;
  const unusedCount = racks.length - usedCount;

  // 1. Usage filter
  const usageFiltered = racks.filter((rack) => {
    const hasItems = rack.paintings.length > 0;
    if (usageFilter === 'used')   return hasItems;
    if (usageFilter === 'unused') return !hasItems;
    return true;
  });

  // 2. Type filter
  const typeFiltered =
    typeFilter === null
      ? usageFiltered
      : usageFiltered.filter((r) => r.rackType.id === typeFilter);

  // 3. Painting search — keep only racks that contain a matching painting
  const searchQuery = paintingSearch.trim().toLowerCase();
  const searchFiltered = searchQuery
    ? typeFiltered.filter((r) =>
        r.paintings.some(
          (p) =>
            p.signatuur.toLowerCase().includes(searchQuery) ||
            p.collection.toLowerCase().includes(searchQuery),
        ),
      )
    : typeFiltered;

  // 4. Sort
  const displayRacks = [...searchFiltered].sort((a, b) => compareRacks(a, b, sortDir));

  const usageOptions: { key: UsageFilter; label: string; count: number }[] = [
    { key: 'all',    label: 'Alle rekken',      count: racks.length },
    { key: 'used',   label: 'Gebruikte rekken', count: usedCount },
    { key: 'unused', label: 'Lege rekken',       count: unusedCount },
  ];

  return (
    <div>
      {/* Unassigned warning */}
      {unassigned.length > 0 && (
        <div className="mb-5 flex items-start gap-3 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 text-sm text-orange-800">
          <span className="text-lg">⚠️</span>
          <span>
            <strong>{unassigned.length}</strong> schilderijen konden niet worden geplaatst
            (diepte te groot of rekken vol).{' '}
            {onSwitchToPaintings && (
              <button
                type="button"
                onClick={onSwitchToPaintings}
                className="underline font-medium hover:text-orange-900"
              >
                Bekijk ongeplaatste schilderijen →
              </button>
            )}
          </span>
        </div>
      )}

      {/* ── Row 1: title + usage filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Rekken
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({displayRacks.length} van {racks.length})
          </span>
        </h2>

        {/* Usage filter pills */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
          {usageOptions.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setUsageFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                usageFilter === key
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold ${
                  usageFilter === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 2: sort toggle + type filter + painting search ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-gray-100">
        {/* Sort direction toggle */}
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-blue-400 transition-colors select-none"
          title="Sorteervolgorde omdraaien"
        >
          <span>Naam</span>
          <span className="text-base leading-none">{sortDir === 'asc' ? '↑' : '↓'}</span>
          <span className="text-gray-400">{sortDir === 'asc' ? 'A→Z' : 'Z→A'}</span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        {/* Type filter dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="type-filter" className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Type:
          </label>
          <select
            id="type-filter"
            value={typeFilter ?? ''}
            onChange={(e) => setTypeFilter(e.target.value === '' ? null : parseInt(e.target.value, 10))}
            className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="">Alle types</option>
            {rackTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.id} —  {rt.height} x {rt.width} x {rt.maxDepth}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        {/* Painting search */}
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <input
            type="search"
            value={paintingSearch}
            onChange={(e) => setPaintingSearch(e.target.value)}
            placeholder="Zoek op schilderij (signatuur of collectie)…"
            className="w-full text-xs border-2 border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
          />
          {paintingSearch && (
            <button
              type="button"
              onClick={() => setPaintingSearch('')}
              className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0"
              title="Wis zoekopdracht"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      {displayRacks.length === 0 ? (
        <p className="text-sm text-gray-500 py-10 text-center">
          Geen rekken gevonden voor dit filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayRacks.map((rack) => {
            const originalIndex = racks.indexOf(rack);
            const matchedPaintings = searchQuery
              ? rack.paintings.filter(
                  (p) =>
                    p.signatuur.toLowerCase().includes(searchQuery) ||
                    p.collection.toLowerCase().includes(searchQuery),
                )
              : [];
            return (
              <div key={rack.name} className="relative">
                {searchQuery && matchedPaintings.length > 0 && (
                  <div className="absolute -top-2 -right-2 z-10 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    {matchedPaintings.length} match{matchedPaintings.length > 1 ? 'es' : ''}
                  </div>
                )}
                <RackCard
                  rack={rack}
                  onSelect={() => onSelectRack(originalIndex)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* FAB — Add painting */}
      {onSwitchToPaintings && (
        <button
          type="button"
          onClick={onSwitchToPaintings}
          className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg transition-colors z-20"
          title="Schilderijen bekijken"
        >
          🖼️ Schilderijen bekijken
        </button>
      )}
    </div>
  );
}
