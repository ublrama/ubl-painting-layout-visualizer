import { Wall } from '../types';
import Legend from './Legend';
import SummaryPanel from './SummaryPanel';
import ZoomSlider from './ZoomSlider';

interface SidebarProps {
  walls: Wall[];
  scale: number;
  onScaleChange: (s: number) => void;
  showZoom: boolean;
}

export default function Sidebar({ walls, scale, onScaleChange, showZoom }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
      <Legend />
      <SummaryPanel walls={walls} />
      {showZoom && (
        <ZoomSlider scale={scale} onChange={onScaleChange} />
      )}
    </aside>
  );
}
