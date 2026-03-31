import type { AssignmentResult } from '../types';
import { Legend } from './Legend';
import { SummaryPanel } from './SummaryPanel';
import { ZoomSlider } from './ZoomSlider';

interface SidebarProps {
  assignmentResult: AssignmentResult | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showZoom: boolean;
}

export function Sidebar({ assignmentResult, zoom, onZoomChange, showZoom }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-5 flex flex-col gap-8 overflow-y-auto">
      <Legend />
      <div className="border-t border-gray-200" />
      <SummaryPanel assignmentResult={assignmentResult} />
      {showZoom && (
        <>
          <div className="border-t border-gray-200" />
          <ZoomSlider zoom={zoom} onChange={onZoomChange} visible={showZoom} />
        </>
      )}
    </aside>
  );
}
