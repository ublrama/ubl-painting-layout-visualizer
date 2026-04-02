import { useState } from 'react';
import type { AssignmentResult, Painting } from '../types';
import { COLLECTION_COLORS } from '../constants';
import { usePaintings } from '../hooks/usePaintings';
import { AddPaintingModal } from './AddPaintingModal';
import { AssignPaintingModal } from './AssignPaintingModal';
import { getPlacementFailReason, FAIL_REASON_COLORS } from '../utils/getPlacementFailReason';

type AssignedFilter = 'all' | 'assigned' | 'unassigned';
type SortField = 'signatuur' | 'width' | 'height' | 'depth' | 'collection';

interface PaintingsListProps {
  assignmentResult: AssignmentResult | null;
  onSelectRack?: (rackIndex: number) => void;
  onAddPainting?: (data: Omit<Painting, 'id' | 'manuallyPlaced'>) => Promise<void>;
  onUnassignPainting?: (paintingId: string) => Promise<void>;
  onAssignPainting?: (paintingId: string, rackName: string) => Promise<void>;
  onDeletePainting?: (paintingId: string) => Promise<void>;
}

export function PaintingsList({ assignmentResult, onSelectRack, onAddPainting, onUnassignPainting, onAssignPainting, onDeletePainting }: PaintingsListProps) {
  const [search,           setSearch]       = useState('');
  const [assignedFilter,   setAssignedFilter] = useState<AssignedFilter>('all');
  const [collectionFilter, setCollFilter]   = useState('');
  const [sortField,        setSortField]    = useState<SortField>('signatuur');
  const [sortOrder,        setSortOrder]    = useState<'asc' | 'desc'>('asc');
  const [showAdd,          setShowAdd]      = useState(false);
  const [assignTarget,     setAssignTarget] = useState<Painting | null>(null);

  const assignedParam =
    assignedFilter === 'assigned'   ? 'true'  :
    assignedFilter === 'unassigned' ? 'false' : 'all';

  const { paintings, isLoading } = usePaintings({
    assignmentResult,
    search,
    collection: collectionFilter || undefined,
    assigned:   assignedParam as 'true' | 'false' | 'all',
    sort:       sortField,
    order:      sortOrder,
  });

  const unassignedCount = paintings.filter((p: Painting) => p.assignedRackName === null).length;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return <span className="text-gray-300">↕</span>;
    return <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Schilderijen
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({paintings.length} totaal
            {unassignedCount > 0 && `, ${unassignedCount} niet toegewezen`})
          </span>
        </h2>
        {onAddPainting && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors self-start sm:self-auto"
          >
            + Schilderij toevoegen
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoeken op signatuur of collectie…"
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />

        {/* Assigned filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'assigned', 'unassigned'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAssignedFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                assignedFilter === f
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'Alle' : f === 'assigned' ? 'Toegewezen' : 'Niet toegewezen'}
            </button>
          ))}
        </div>

        {/* Collection filter */}
        <select
          value={collectionFilter}
          onChange={(e) => setCollFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Alle collecties</option>
          {Object.keys(COLLECTION_COLORS).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
              <th className="px-3 py-2 text-left w-6"></th>
              <th className="px-3 py-2 text-left">
                <button type="button" onClick={() => toggleSort('signatuur')} className="flex items-center gap-1 hover:text-gray-900">
                  Signatuur {sortIcon('signatuur')}
                </button>
              </th>
              <th className="px-3 py-2 text-left">
                <button type="button" onClick={() => toggleSort('collection')} className="flex items-center gap-1 hover:text-gray-900">
                  Collectie {sortIcon('collection')}
                </button>
              </th>
              <th className="px-3 py-2 text-left">
                <button type="button" onClick={() => toggleSort('width')} className="flex items-center gap-1 hover:text-gray-900">
                  B {sortIcon('width')}
                </button>
              </th>
              <th className="px-3 py-2 text-left">
                <button type="button" onClick={() => toggleSort('height')} className="flex items-center gap-1 hover:text-gray-900">
                  H {sortIcon('height')}
                </button>
              </th>
              <th className="px-3 py-2 text-left">
                <button type="button" onClick={() => toggleSort('depth')} className="flex items-center gap-1 hover:text-gray-900">
                  D {sortIcon('depth')}
                </button>
              </th>
              <th className="px-3 py-2 text-left">Rek</th>
              <th className="px-3 py-2 text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">Laden…</td>
              </tr>
            )}
            {!isLoading && paintings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  Geen schilderijen gevonden.
                </td>
              </tr>
            )}
            {paintings.map((p: Painting) => {
              const color = COLLECTION_COLORS[p.collection] ?? COLLECTION_COLORS['Unknown'];
              const isUnassigned = p.assignedRackName === null;
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    isUnassigned ? 'border-l-2 border-orange-400' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className="w-3 h-3 rounded-sm block" style={{ backgroundColor: color }} />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">{p.signatuur}</td>
                  <td className="px-3 py-2 text-gray-600">{p.collection}</td>
                  <td className="px-3 py-2 text-gray-600">{p.width}</td>
                  <td className="px-3 py-2 text-gray-600">{p.height}</td>
                  <td className="px-3 py-2 text-gray-600">{p.depth}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {p.assignedRackName ? (
                      onSelectRack ? (
                        <button
                          type="button"
                          onClick={() => {
                            const idx = assignmentResult?.racks.findIndex(
                              (r) => r.name === p.assignedRackName,
                            ) ?? -1;
                            if (idx >= 0) onSelectRack(idx);
                          }}
                          className="text-blue-600 hover:underline font-medium text-xs"
                        >
                          {p.assignedRackName} →
                        </button>
                      ) : (
                        <span>{p.assignedRackName}</span>
                      )
                    ) : (() => {
                      const info = assignmentResult
                        ? getPlacementFailReason(p, assignmentResult.racks)
                        : null;
                      const colorClass = info
                        ? FAIL_REASON_COLORS[info.reason]
                        : 'bg-orange-100 text-orange-700 border-orange-200';
                      return (
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium w-fit ${colorClass}`}>
                            ⚠ Niet toegewezen
                          </span>
                          {info && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs w-fit ${colorClass}`}>
                              {info.label}
                            </span>
                          )}
                          {info && (
                            <span className="text-xs text-gray-400 max-w-xs leading-snug">
                              {info.detail}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  {/* Actions column */}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {isUnassigned && onAssignPainting && (
                        <button
                          type="button"
                          onClick={() => setAssignTarget(p)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
                          title="Toewijzen aan rek"
                        >
                          Toewijzen
                        </button>
                      )}
                      {!isUnassigned && onUnassignPainting && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`"${p.signatuur}" verwijderen van rek ${p.assignedRackName}?`))
                              onUnassignPainting(p.id);
                          }}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium px-1.5 py-0.5 rounded hover:bg-orange-50"
                          title="Verwijder van rek"
                        >
                          Loskoppelen
                        </button>
                      )}
                      {onDeletePainting && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Schilderij "${p.signatuur}" definitief verwijderen?`))
                              onDeletePainting(p.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 rounded hover:bg-red-50"
                          title="Schilderij verwijderen"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && onAddPainting && (
        <AddPaintingModal
          onSave={async (data) => {
            await onAddPainting(data);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {assignTarget && onAssignPainting && (
        <AssignPaintingModal
          painting={assignTarget}
          onAssign={async (paintingId, rackName) => {
            await onAssignPainting(paintingId, rackName);
            setAssignTarget(null);
          }}
          onCancel={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}
