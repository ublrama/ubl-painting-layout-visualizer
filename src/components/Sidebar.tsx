import type { Wall } from '../types';
import { Legend } from './Legend';
import { SummaryPanel } from './SummaryPanel';
import { ZoomSlider } from './ZoomSlider';

interface SidebarProps {
  walls: Wall[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showZoom: boolean;
}

export function Sidebar({ walls, zoom, onZoomChange, showZoom }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-[#001158]/80 border-r border-[#002580] p-5 flex flex-col gap-8 overflow-y-auto">
      <Legend />
      <div className="border-t border-[#002580]" />
      <SummaryPanel walls={walls} />
      {showZoom && (
        <>
          <div className="border-t border-[#002580]" />
          <ZoomSlider zoom={zoom} onChange={onZoomChange} visible={showZoom} />
        </>
      )}
    </aside>
  );
}
