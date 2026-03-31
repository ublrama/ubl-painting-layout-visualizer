import { useState } from 'react';
import type { Painting } from '../types';
import { COLLECTION_COLORS } from '../constants';
import { usePaintings } from '../hooks/usePaintings';
import { AddPaintingModal } from './AddPaintingModal';
import { AssignRackModal } from './AssignRackModal';
import { RemovePaintingDialog } from './RemovePaintingDialog';

type AssignedFilter = 'all' | 'assigned' | 'unassigned';
type SortField = 'signatuur' | 'width' | 'height' | 'depth' | 'collection';

interface PaintingsListProps {
  isConfirmed?: boolean;
}

export function PaintingsList({ isConfirmed }: PaintingsListProps) {
  const [search,         setSearch]         = useState('');
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>('all');
  const [collectionFilter, setCollFilter]   = useState('');
  const [sortField,      setSortField]      = useState<SortField>('signatuur');
  const [sortOrder,      setSortOrder]      = useState<'asc' | 'desc'>('asc');

  const [showAdd,        setShowAdd]        = useState(false);
  const [assignTarget,   setAssignTarget]   = useState<Painting | null>(null);
  const [removeTarget,   setRemoveTarget]   = useState<Painting | null>(null);

  const assignedParam =
    assignedFilter === 'assigned'   ? 'true'  :
    assignedFilter === 'unassigned' ? 'false' : 'all';

  const { paintings, isLoading, addPainting, updatePainting, deletePainting } = usePaintings({
    search,
    collection: collectionFilter || undefined,
    assigned:   assignedParam as 'true' | 'false' | 'all',
    sort:       sortField,
    order:      sortOrder,
  });

  const unassignedCount = paintings.filter((p) => p.assignedRackName === null).length;

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

  async function handleAdd(data: Omit<Painting, 'id' | 'manuallyPlaced'>) {
    await addPainting(data);
    setShowAdd(false);
  }

  async function handleAssign(rackName: string) {
    if (!assignTarget) return;
    await updatePainting(assignTarget.id, { assignedRackName: rackName });
    setAssignTarget(null);
  }

  async function handleDelete() {
    if (!removeTarget) return;
    await deletePainting(removeTarget.id);
    setRemoveTarget(null);
  }

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Schilderijen
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({paintings.length} totaal
              {unassignedCount > 0 && `, ${unassignedCount} niet toegewezen`})
            </span>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors self-start sm:self-auto"
        >
          + Schilderij toevoegen
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
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
            {paintings.map((p) => {
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
                    <span
                      className="w-3 h-3 rounded-sm block"
                      style={{ backgroundColor: color }}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">{p.signatuur}</td>
                  <td className="px-3 py-2 text-gray-600">{p.collection}</td>
                  <td className="px-3 py-2 text-gray-600">{p.width}</td>
                  <td className="px-3 py-2 text-gray-600">{p.height}</td>
                  <td className="px-3 py-2 text-gray-600">{p.depth}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {p.assignedRackName ?? (
                      <span className="text-orange-500 text-xs font-medium">Niet toegewezen</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {isUnassigned && (
                        <button
                          type="button"
                          onClick={() => setAssignTarget(p)}
                          className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          Toewijzen
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(p)}
                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddPaintingModal
          isConfirmed={isConfirmed}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}
      {assignTarget && (
        <AssignRackModal
          painting={assignTarget}
          onSave={handleAssign}
          onCancel={() => setAssignTarget(null)}
        />
      )}
      {removeTarget && (
        <RemovePaintingDialog
          painting={removeTarget}
          rackName={removeTarget.assignedRackName}
          onRemove={handleDelete}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
