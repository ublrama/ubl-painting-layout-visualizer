import type { AssignmentResult } from '../types';
import { Legend } from './Legend';
import { SummaryPanel } from './SummaryPanel';
import { ZoomSlider } from './ZoomSlider';

interface SidebarProps {
  assignmentResult: AssignmentResult | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showZoom: boolean;
  onSwitchToPaintings?: () => void;
}

export function Sidebar({ assignmentResult, zoom, onZoomChange, showZoom, onSwitchToPaintings }: SidebarProps) {
  const unassignedCount = assignmentResult?.unassigned.length ?? 0;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-5 flex flex-col gap-8 overflow-y-auto">
      <Legend />
      <div className="border-t border-gray-200" />
      <SummaryPanel assignmentResult={assignmentResult} />

      {/* Unassigned quick link */}
      {unassignedCount > 0 && onSwitchToPaintings && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-800 mb-2">
            <strong>{unassignedCount}</strong> schilderijen niet toegewezen
          </p>
          <button
            type="button"
            onClick={onSwitchToPaintings}
            className="text-xs font-medium text-orange-700 hover:text-orange-900 underline"
          >
            Bekijk lijst →
          </button>
        </div>
      )}

      {showZoom && (
        <>
          <div className="border-t border-gray-200" />
          <ZoomSlider zoom={zoom} onChange={onZoomChange} visible={showZoom} />
        </>
      )}
    </aside>
  );
}
